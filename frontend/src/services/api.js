// src/services/api.js
// Fixed API URL to point to backend on port 5000

const API_BASE_URL = 'http://localhost:5002';

/**
 * Upload media files (images/videos)
 * @param {File[]} files - Array of File objects
 * @returns {Promise<object>}
 */
export const uploadMediaFiles = async (files) => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  try {
    const response = await fetch(`${API_BASE_URL}/upload/media`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Media upload error:', error);
    throw error;
  }
};

/**
 * Upload JSON files
 * @param {File[]} files - Array of File objects
 * @returns {Promise<object>}
 */
export const uploadJSONFiles = async (files) => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  try {
    const response = await fetch(`${API_BASE_URL}/upload/json`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('JSON upload error:', error);
    throw error;
  }
};

/**
 * Get all uploaded files
 * @param {object} options - Query options
 * @returns {Promise<object>}
 */
export const getUploadedFiles = async (options = {}) => {
  const params = new URLSearchParams();
  
  if (options.limit) params.append('limit', options.limit);
  if (options.type) params.append('type', options.type);
  
  const url = `${API_BASE_URL}/files${params.toString() ? '?' + params.toString() : ''}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get files error:', error);
    throw error;
  }
};

/**
 * Get specific file by ID
 * @param {string} id - File ID
 * @returns {Promise<object>}
 */
export const getFileById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/files/${id}`);

    if (!response.ok) {
      throw new Error('File not found');
    }

    return await response.json();
  } catch (error) {
    console.error('Get file error:', error);
    throw error;
  }
};

/**
 * Delete a file by ID
 * @param {string} id - File ID
 * @returns {Promise<object>}
 */
export const deleteFile = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/files/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete file');
    }

    return await response.json();
  } catch (error) {
    console.error('Delete file error:', error);
    throw error;
  }
};

/**
 * Get JSON file data from database
 * @param {string} id - File ID
 * @returns {Promise<object>}
 */
export const getJSONFileData = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/files/${id}/data`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch JSON data');
    }

    return await response.json();
  } catch (error) {
    console.error('Get JSON data error:', error);
    throw error;
  }
};

/**
 * Get all categories
 * @returns {Promise<object>}
 */
export const getCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get categories error:', error);
    throw error;
  }
};

/**
 * Get analytics data
 * @returns {Promise<object>}
 */
export const getAnalytics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get analytics error:', error);
    throw error;
  }
};

/**
 * Get upload history/logs
 * @param {number} limit - Number of logs to retrieve
 * @returns {Promise<object>}
 */
export const getUploadHistory = async (limit = 20) => {
  try {
    const response = await fetch(`${API_BASE_URL}/logs?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch logs');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get logs error:', error);
    throw error;
  }
};

/**
 * Check backend health
 * @returns {Promise<object>}
 */
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error('Backend unhealthy');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
};

export default {
  uploadMediaFiles,
  uploadJSONFiles,
  getUploadedFiles,
  getFileById,
  deleteFile,
  getJSONFileData,
  getCategories,
  getAnalytics,
  getUploadHistory,
  checkHealth
};