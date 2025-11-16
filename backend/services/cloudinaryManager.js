const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Initialize Cloudinary
let cloudinaryInitialized = false;

try {
  if (process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET) {
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    cloudinaryInitialized = true;
    console.log('✅ Cloudinary initialized successfully');
  } else {
    console.warn('⚠️  Cloudinary credentials not found - running in mock mode');
  }
} catch (error) {
  console.error('❌ Cloudinary initialization failed:', error.message);
}

/**
 * Upload file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} category - Category path (e.g., "Animals/Dogs")
 * @param {string} resourceType - 'image' or 'video'
 * @returns {Promise<{publicUrl: string, storagePath: string, publicId: string}>}
 */
async function uploadToCloudinary(buffer, filename, category, resourceType = 'auto') {
  if (!cloudinaryInitialized) {
    console.log('⚠️  Cloudinary not available, using mock storage');
    return {
      publicUrl: `https://via.placeholder.com/400x300?text=${encodeURIComponent(filename)}`,
      storagePath: `mock/${category}/${filename}`,
      publicId: `mock_${Date.now()}`
    };
  }

  try {
    // Clean category for folder path
    const cleanCategory = category.replace(/[^a-zA-Z0-9\/\-_]/g, '_');
    const folder = `imss/${cleanCategory}`;
    
    // Generate unique public_id
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);

    // Upload to Cloudinary using stream
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: `${timestamp}_${randomStr}`,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
          // Optimize images
          transformation: resourceType === 'image' ? [
            { quality: 'auto', fetch_format: 'auto' }
          ] : undefined,
          // Add metadata
          context: {
            category: category,
            original_filename: filename,
            uploaded_at: new Date().toISOString()
          }
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Pipe buffer to upload stream
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });

    console.log(`✅ Uploaded to Cloudinary: ${result.public_id}`);

    return {
      publicUrl: result.secure_url,
      storagePath: result.public_id,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      resourceType: result.resource_type
    };

  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @param {string} resourceType - 'image' or 'video'
 * @returns {Promise<boolean>}
 */
async function deleteFromCloudinary(publicId, resourceType = 'image') {
  if (!cloudinaryInitialized) {
    console.log('⚠️  Cloudinary not available, skipping delete');
    return true;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });

    if (result.result === 'ok') {
      console.log(`🗑️  Deleted from Cloudinary: ${publicId}`);
      return true;
    } else {
      console.warn(`⚠️  Delete result: ${result.result}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Check if a folder/category exists in Cloudinary
 * @param {string} category - Category path
 * @returns {Promise<boolean>}
 */
async function checkFolderExists(category) {
  if (!cloudinaryInitialized) {
    return false;
  }

  try {
    const cleanCategory = category.replace(/[^a-zA-Z0-9\/\-_]/g, '_');
    const folder = `imss/${cleanCategory}`;

    // Try to list resources in folder
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: 1
    });

    return result.resources.length > 0;
  } catch (error) {
    // Folder doesn't exist or error
    return false;
  }
}

/**
 * List files in a category
 * @param {string} category - Category path
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Array>}
 */
async function listFilesInCategory(category, maxResults = 50) {
  if (!cloudinaryInitialized) {
    return [];
  }

  try {
    const cleanCategory = category.replace(/[^a-zA-Z0-9\/\-_]/g, '_');
    const folder = `imss/${cleanCategory}`;

    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: maxResults
    });

    return result.resources.map(resource => ({
      publicId: resource.public_id,
      url: resource.secure_url,
      format: resource.format,
      size: resource.bytes,
      width: resource.width,
      height: resource.height,
      createdAt: resource.created_at
    }));
  } catch (error) {
    console.error('❌ Error listing files:', error);
    return [];
  }
}

/**
 * Get optimized image URL with transformations
 * @param {string} publicId - Cloudinary public_id
 * @param {object} options - Transformation options
 * @returns {string}
 */
function getOptimizedUrl(publicId, options = {}) {
  if (!cloudinaryInitialized) {
    return `https://via.placeholder.com/400x300`;
  }

  const {
    width = null,
    height = null,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    fetch_format: format,
    secure: true
  });
}

/**
 * Generate thumbnail URL
 * @param {string} publicId - Cloudinary public_id
 * @returns {string}
 */
function getThumbnailUrl(publicId) {
  return getOptimizedUrl(publicId, {
    width: 200,
    height: 200,
    crop: 'thumb',
    quality: '80'
  });
}

/**
 * Get storage statistics from Cloudinary
 * @returns {Promise<object>}
 */
async function getStorageStats() {
  if (!cloudinaryInitialized) {
    return {
      totalResources: 0,
      totalBytes: 0,
      formattedSize: '0 B'
    };
  }

  try {
    const result = await cloudinary.api.usage();

    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return {
      totalResources: result.resources || 0,
      totalBytes: result.storage?.usage || 0,
      formattedSize: formatBytes(result.storage?.usage || 0),
      bandwidth: result.bandwidth?.usage || 0,
      formattedBandwidth: formatBytes(result.bandwidth?.usage || 0),
      plan: result.plan || 'free',
      credits: result.credits
    };
  } catch (error) {
    console.error('❌ Error fetching storage stats:', error);
    return {
      totalResources: 0,
      totalBytes: 0,
      formattedSize: '0 B'
    };
  }
}

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  checkFolderExists,
  listFilesInCategory,
  getOptimizedUrl,
  getThumbnailUrl,
  getStorageStats,
  cloudinaryInitialized
};