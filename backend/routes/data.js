const express = require('express');
const router = express.Router();
const { getUploadHistory, getAnalytics } = require('../services/logger');
const { getStorageStats } = require('../services/cloudinaryManager');
const admin = require('firebase-admin');

// GET /files - List all uploaded files
router.get('/files', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const type = req.query.type; // 'media' or 'json'
    
    const db = admin.database();
    const uploadsRef = db.ref('uploads');
    
    let query = uploadsRef.orderByChild('timestamp').limitToLast(limit);
    
    const snapshot = await query.once('value');
    const uploads = [];
    
    snapshot.forEach(child => {
      const data = child.val();
      if (!type || data.type === type) {
        uploads.push({
          id: child.key,
          ...data
        });
      }
    });
    
    // Sort by timestamp descending (most recent first)
    uploads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({ 
      files: uploads,
      count: uploads.length,
      total: snapshot.numChildren()
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    
    // Return mock data if Firebase not available
    res.json({ 
      files: generateMockFiles(10),
      count: 10,
      mock: true
    });
  }
});

// GET /files/:id - Get specific file metadata
router.get('/files/:id', async (req, res) => {
  try {
    const db = admin.database();
    const fileRef = db.ref(`uploads/${req.params.id}`);
    
    const snapshot = await fileRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json({
      id: req.params.id,
      ...snapshot.val()
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /files/:id - Delete a file
router.delete('/files/:id', async (req, res) => {
  try {
    const db = admin.database();
    const fileRef = db.ref(`uploads/${req.params.id}`);

    const snapshot = await fileRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileData = snapshot.val();

    // Delete from Cloudinary if it's a media file
    if (fileData.type === 'media' && fileData.public_id) {
      const { deleteFromCloudinary } = require('../services/cloudinaryManager');
      const resourceType = fileData.mime_type?.startsWith('video/') ? 'video' : 'image';
      await deleteFromCloudinary(fileData.public_id, resourceType);
      console.log(`🗑️  Deleted from Cloudinary: ${fileData.public_id}`);
    }

    // Delete from database if it's a JSON file
    if (fileData.type === 'json' && fileData.table_name) {
      try {
        const { deleteFromDatabase } = require('../services/databaseManager');
        await deleteFromDatabase(fileData.db_type, fileData.table_name);
        console.log(`🗑️  Deleted from ${fileData.db_type}: ${fileData.table_name}`);
      } catch (dbError) {
        console.warn(`⚠️  Could not delete from database: ${dbError.message}`);
        // Continue with Firebase deletion even if database deletion fails
      }
    }

    // Delete from Firebase database
    await fileRef.remove();
    console.log(`🗑️  Deleted from Firebase: ${req.params.id}`);

    res.json({
      success: true,
      message: 'File deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /categories - List all auto-created categories
router.get('/categories', async (req, res) => {
  try {
    const db = admin.database();
    const uploadsRef = db.ref('uploads');
    
    const snapshot = await uploadsRef.once('value');
    const categoriesSet = new Set();
    const categoryStats = {};
    
    snapshot.forEach(child => {
      const data = child.val();
      if (data.category) {
        categoriesSet.add(data.category);
        categoryStats[data.category] = (categoryStats[data.category] || 0) + 1;
      }
    });
    
    const categories = Array.from(categoriesSet).map(cat => ({
      name: cat,
      count: categoryStats[cat],
      path: cat.split('/')
    }));
    
    res.json({ 
      categories,
      total: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.json({ 
      categories: [
        { name: 'Animals/Dogs', count: 5, path: ['Animals', 'Dogs'] },
        { name: 'Nature/Landscapes', count: 8, path: ['Nature', 'Landscapes'] },
        { name: 'Technology/Devices', count: 3, path: ['Technology', 'Devices'] }
      ],
      total: 3,
      mock: true
    });
  }
});

// GET /analytics - Return dashboard statistics
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await getAnalytics();
    
    // Get Cloudinary storage stats
    const cloudinaryStats = await getStorageStats();
    
    res.json({
      ...analytics,
      cloudinary: cloudinaryStats,
      storageProvider: 'cloudinary'
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    
    // Return mock analytics
    res.json({
      totalUploads: 45,
      mediaFiles: 32,
      jsonFiles: 13,
      categories: 8,
      storageUsed: '2.4 GB',
      topTags: [
        { tag: 'nature', count: 12 },
        { tag: 'animals', count: 8 },
        { tag: 'urban', count: 7 }
      ],
      uploadsByDay: [
        { date: '2025-11-09', count: 5 },
        { date: '2025-11-10', count: 8 },
        { date: '2025-11-11', count: 12 },
        { date: '2025-11-12', count: 15 },
        { date: '2025-11-13', count: 5 }
      ],
      databaseDistribution: {
        postgresql: 8,
        mongodb: 5
      },
      cloudinary: {
        totalResources: 0,
        totalBytes: 0,
        formattedSize: '0 B'
      },
      storageProvider: 'cloudinary',
      mock: true
    });
  }
});

// GET /logs - Return upload history with pagination
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const logs = await getUploadHistory(limit);
    
    res.json({ 
      logs,
      count: logs.length
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.json({ 
      logs: generateMockLogs(10),
      count: 10,
      mock: true
    });
  }
});

// Helper function to generate mock file data
function generateMockFiles(count) {
  const mockFiles = [];
  const categories = ['Animals/Dogs', 'Nature/Landscapes', 'Technology/Devices', 'People/Indoor'];
  const tags = ['nature', 'animals', 'urban', 'people', 'food', 'technology'];
  
  for (let i = 0; i < count; i++) {
    mockFiles.push({
      id: `mock-${i}-${Date.now()}`,
      filename: `image_${i}.jpg`,
      type: 'media',
      category: categories[i % categories.length],
      tags: [tags[i % tags.length], tags[(i + 1) % tags.length]],
      size: Math.floor(Math.random() * 5000000) + 100000,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      url: `https://picsum.photos/400/300?random=${i}`,
      storage_provider: 'cloudinary'
    });
  }
  
  return mockFiles;
}

// Helper function to generate mock log data
function generateMockLogs(count) {
  const mockLogs = [];
  const actions = ['upload', 'process', 'categorize', 'store'];
  
  for (let i = 0; i < count; i++) {
    mockLogs.push({
      id: `log-${i}-${Date.now()}`,
      action: actions[i % actions.length],
      filename: `file_${i}.jpg`,
      status: i % 5 === 0 ? 'error' : 'success',
      message: i % 5 === 0 ? 'Processing failed' : 'Completed successfully',
      timestamp: new Date(Date.now() - i * 1800000).toISOString()
    });
  }
  
  return mockLogs;
}

module.exports = router;