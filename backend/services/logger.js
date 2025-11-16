const admin = require('firebase-admin');

/**
 * Logs an upload event to Firebase Realtime Database.
 * @param {string} type - The type of upload ('media' or 'json').
 * @param {object} metadata - The metadata to log.
 */
async function logUpload(type, metadata) {
  try {
    const db = admin.database();
    const uploadsRef = db.ref('uploads');
    
    const uploadData = {
      type,
      ...metadata,
      timestamp: metadata.timestamp || new Date().toISOString()
    };
    
    // Push new upload log
    const newUploadRef = await uploadsRef.push(uploadData);
    
    console.log(`📝 Logged ${type} upload: ${metadata.filename}`);
    
    return newUploadRef.key;
  } catch (error) {
    console.error('Error logging upload:', error);
    console.log(`⚠️  Logging to console instead:`, { type, ...metadata });
    return null;
  }
}

/**
 * Logs an error to Firebase Realtime Database.
 * @param {Error} error - The error object.
 * @param {object} context - Additional context about the error.
 */
async function logError(error, context) {
  try {
    const db = admin.database();
    const errorsRef = db.ref('errors');
    
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };
    
    await errorsRef.push(errorData);
    
    console.error('📝 Logged error to Firebase:', error.message);
  } catch (err) {
    console.error('Error logging error:', err);
    console.error('Original error:', error, 'Context:', context);
  }
}

/**
 * Retrieves upload history from Firebase.
 * @param {number} limit - The number of records to retrieve.
 * @returns {Promise<object[]>}
 */
async function getUploadHistory(limit = 20) {
  try {
    const db = admin.database();
    const uploadsRef = db.ref('uploads');
    
    // Get last N uploads ordered by timestamp
    const snapshot = await uploadsRef
      .orderByChild('timestamp')
      .limitToLast(limit)
      .once('value');
    
    const history = [];
    snapshot.forEach(child => {
      history.push({
        id: child.key,
        ...child.val()
      });
    });
    
    // Reverse to get most recent first
    return history.reverse();
  } catch (error) {
    console.error('Error getting upload history:', error);
    return [];
  }
}

/**
 * Calculates and returns analytics from Firebase data.
 * @returns {Promise<object>}
 */
async function getAnalytics() {
  try {
    const db = admin.database();
    const uploadsRef = db.ref('uploads');
    
    const snapshot = await uploadsRef.once('value');
    
    const analytics = {
      totalUploads: 0,
      mediaFiles: 0,
      jsonFiles: 0,
      categories: new Set(),
      tags: {},
      storageUsed: 0,
      uploadsByDay: {},
      databaseDistribution: {
        postgresql: 0,
        mongodb: 0
      }
    };
    
    snapshot.forEach(child => {
      const data = child.val();
      analytics.totalUploads++;
      
      // Count by type
      if (data.type === 'media') {
        analytics.mediaFiles++;
      } else if (data.type === 'json') {
        analytics.jsonFiles++;
      }
      
      // Collect categories
      if (data.category) {
        analytics.categories.add(data.category);
      }
      
      // Count tags
      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach(tag => {
          analytics.tags[tag] = (analytics.tags[tag] || 0) + 1;
        });
      }
      
      // Sum storage
      if (data.size) {
        analytics.storageUsed += data.size;
      }
      
      // Count by day
      if (data.timestamp) {
        const day = data.timestamp.split('T')[0];
        analytics.uploadsByDay[day] = (analytics.uploadsByDay[day] || 0) + 1;
      }
      
      // Database distribution
      if (data.db_type) {
        const dbKey = data.db_type.toLowerCase().includes('postgres') ? 'postgresql' : 'mongodb';
        analytics.databaseDistribution[dbKey]++;
      }
    });
    
    // Convert tags object to sorted array
    const topTags = Object.entries(analytics.tags)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Convert uploadsByDay to array
    const uploadsByDay = Object.entries(analytics.uploadsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Format storage size
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };
    
    return {
      totalUploads: analytics.totalUploads,
      mediaFiles: analytics.mediaFiles,
      jsonFiles: analytics.jsonFiles,
      categories: analytics.categories.size,
      storageUsed: formatBytes(analytics.storageUsed),
      topTags,
      uploadsByDay,
      databaseDistribution: analytics.databaseDistribution
    };
  } catch (error) {
    console.error('Error calculating analytics:', error);
    return {
      totalUploads: 0,
      mediaFiles: 0,
      jsonFiles: 0,
      categories: 0,
      storageUsed: '0 Bytes',
      topTags: [],
      uploadsByDay: [],
      databaseDistribution: { postgresql: 0, mongodb: 0 }
    };
  }
}

/**
 * Get logs with filtering
 * @param {object} options - Filter options
 * @returns {Promise<object[]>}
 */
async function getFilteredLogs(options = {}) {
  try {
    const db = admin.database();
    let query = db.ref('uploads');
    
    // Apply filters
    if (options.type) {
      query = query.orderByChild('type').equalTo(options.type);
    } else {
      query = query.orderByChild('timestamp');
    }
    
    if (options.limit) {
      query = query.limitToLast(options.limit);
    }
    
    const snapshot = await query.once('value');
    const logs = [];
    
    snapshot.forEach(child => {
      const data = child.val();
      
      // Additional filtering
      let include = true;
      
      if (options.category && data.category !== options.category) {
        include = false;
      }
      
      if (options.startDate && data.timestamp < options.startDate) {
        include = false;
      }
      
      if (options.endDate && data.timestamp > options.endDate) {
        include = false;
      }
      
      if (include) {
        logs.push({
          id: child.key,
          ...data
        });
      }
    });
    
    return logs.reverse();
  } catch (error) {
    console.error('Error getting filtered logs:', error);
    return [];
  }
}

module.exports = {
  logUpload,
  logError,
  getUploadHistory,
  getAnalytics,
  getFilteredLogs
};