const { callPythonAIService } = require('./aiClient');
const { uploadToCloudinary, checkFolderExists } = require('./cloudinaryManager'); // CHANGED
const { logUpload, logError } = require('./logger');

/**
 * Processes a single media file.
 * @param {object} file - The file object from Multer.
 * @param {Buffer} buffer - The file buffer.
 * @returns {Promise<object>} - The result of the processing.
 */
async function processMediaFile(file, buffer) {
  const startTime = Date.now();
  
  try {
    console.log(`🎬 Processing media file: ${file.originalname} (${formatBytes(file.size)})`);
    
    // Step 1: Send file to Python AI microservice for tagging
    console.log(`  1️⃣  Calling AI service...`);
    let tags;
    try {
      tags = await callPythonAIService(buffer, file.mimetype);
      console.log(`  ✅ AI tags received:`, tags);
    } catch (error) {
      console.log(`  ⚠️  AI service unavailable, using fallback tags`);
      tags = generateFallbackTags(file.originalname, file.mimetype);
    }
    
    // Step 2: Generate category path from tags
    const category = generateCategoryPath(tags);
    console.log(`  2️⃣  Generated category: ${category}`);
    
    // Step 3: Check if folder exists (optional optimization)
    const folderExists = await checkFolderExists(category);
    if (!folderExists) {
      console.log(`  📁 Creating new category: ${category}`);
    }
    
    // Step 4: Determine resource type for Cloudinary
    const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
    
    // Step 5: Upload file to Cloudinary (CHANGED)
    console.log(`  3️⃣  Uploading to Cloudinary...`);
    const uploadResult = await uploadToCloudinary(
      buffer,
      file.originalname,
      category,
      resourceType
    );
    
    const { publicUrl, storagePath, publicId, format, width, height, bytes } = uploadResult;
    console.log(`  ✅ Uploaded to: ${storagePath}`);
    
    // Step 6: Log to Firebase Realtime DB
    const metadata = {
      filename: file.originalname,
      tags,
      category,
      storage_path: storagePath,
      public_id: publicId, // Cloudinary public_id for deletion
      url: publicUrl,
      thumbnail_url: publicUrl, // Can be transformed on frontend
      timestamp: new Date().toISOString(),
      size: bytes || file.size,
      mime_type: file.mimetype,
      format: format,
      dimensions: width && height ? { width, height } : null,
      processing_time_ms: Date.now() - startTime,
      storage_provider: 'cloudinary' // NEW: Track which provider
    };
    
    console.log(`  4️⃣  Logging to Firebase DB...`);
    await logUpload('media', metadata);
    
    const processingTime = Date.now() - startTime;
    console.log(`  ⏱️  Total processing time: ${processingTime}ms`);
    
    return {
      success: true,
      filename: file.originalname,
      status: 'processed',
      tags,
      category,
      url: publicUrl,
      storagePath,
      publicId,
      processingTimeMs: processingTime
    };
    
  } catch (error) {
    console.error(`  ❌ Error processing ${file.originalname}:`, error.message);
    
    // Log error
    await logError(error, {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      stage: 'media_processing'
    });
    
    return {
      success: false,
      filename: file.originalname,
      status: 'failed',
      error: error.message
    };
  }
}

/**
 * Generate category path from AI tags.
 * For simple categorization: "Images" or "Videos"
 * Examples:
 * - ["images", "media", "image"] -> "Images"
 * - ["videos", "media", "video"] -> "Videos"
 */
function generateCategoryPath(tags) {
  if (!tags || tags.length === 0) {
    return 'Images';
  }

  // Check if it's a video
  if (tags[0] === 'videos' || tags.includes('video')) {
    return 'Videos';
  }

  // Default to Images
  return 'Images';
}

/**
 * Generate fallback tags when AI service is unavailable.
 * Simply categorizes as images or videos based on mime type.
 */
function generateFallbackTags(filename, mimetype) {
  // Categorize based on mime type
  if (mimetype.startsWith('video/')) {
    return ['videos', 'media', 'video'];
  }

  // Default to images
  return ['images', 'media', 'image'];
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Process multiple media files in batch
 * @param {Array} files - Array of file objects with buffers
 * @returns {Promise<Array>} - Array of results
 */
async function processBatchMediaFiles(files) {
  const results = [];
  
  console.log(`📦 Processing batch of ${files.length} media files`);
  
  for (const file of files) {
    const result = await processMediaFile(file, file.buffer);
    results.push(result);
  }
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Batch complete: ${successful} successful, ${failed} failed`);
  
  return results;
}

module.exports = {
  processMediaFile,
  processBatchMediaFiles,
  generateCategoryPath
};