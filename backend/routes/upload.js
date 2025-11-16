const express = require('express');
const router = express.Router();
const { processMediaFile } = require('../services/mediaProcessor');
const { analyzeAndStoreJSON } = require('../services/jsonProcessor');
const { addToQueue } = require('../services/queueManager');

// POST /upload/media - Handle media file uploads
router.post('/media', async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Filter only media files
    const mediaFiles = req.files.filter(file => 
      file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')
    );

    if (mediaFiles.length === 0) {
      return res.status(400).json({ error: 'No valid media files found' });
    }

    console.log(`📸 Received ${mediaFiles.length} media files`);

    // Generate upload IDs immediately
    const uploadIds = mediaFiles.map(file => ({
      id: `${file.originalname}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename: file.originalname,
      size: file.size,
      type: file.mimetype
    }));

    // Return immediate response
    res.status(202).json({
      message: 'Media files received and queued for processing',
      uploads: uploadIds,
      count: mediaFiles.length
    });

    // Process files asynchronously in background
    processFilesInBackground(mediaFiles);

  } catch (error) {
    console.error('Error in media upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /upload/json - Handle JSON file uploads
router.post('/json', async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Filter only JSON files
    const jsonFiles = req.files.filter(file => 
      file.mimetype === 'application/json'
    );

    if (jsonFiles.length === 0) {
      return res.status(400).json({ error: 'No valid JSON files found' });
    }

    console.log(`📄 Received ${jsonFiles.length} JSON files`);

    // Generate upload IDs
    const uploadIds = jsonFiles.map(file => ({
      id: `${file.originalname}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename: file.originalname,
      size: file.size
    }));

    // Return immediate response
    res.status(202).json({
      message: 'JSON files received and queued for processing',
      uploads: uploadIds,
      count: jsonFiles.length
    });

    // Process JSON files asynchronously
    processJSONFilesInBackground(jsonFiles);

  } catch (error) {
    console.error('Error in JSON upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// Background processing for media files
async function processFilesInBackground(files) {
  for (const file of files) {
    try {
      console.log(`⚙️  Processing: ${file.originalname}`);
      const result = await processMediaFile(file, file.buffer);
      console.log(`✅ Completed: ${file.originalname}`, result);
    } catch (error) {
      console.error(`❌ Failed: ${file.originalname}`, error.message);
    }
  }
}

// Background processing for JSON files
async function processJSONFilesInBackground(files) {
  for (const file of files) {
    try {
      console.log(`⚙️  Processing JSON: ${file.originalname}`);
      
      // Parse JSON content
      const jsonContent = JSON.parse(file.buffer.toString('utf8'));
      
      const result = await analyzeAndStoreJSON(jsonContent, file.originalname);
      console.log(`✅ Completed JSON: ${file.originalname}`, result);
    } catch (error) {
      console.error(`❌ Failed JSON: ${file.originalname}`, error.message);
    }
  }
}

module.exports = router;