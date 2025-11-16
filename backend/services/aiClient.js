const axios = require('axios');
const FormData = require('form-data');

const PYTHON_AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:5001';

/**
 * Calls the Python AI service to get tags for a media file.
 * @param {Buffer} fileBuffer - The file buffer.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {Promise<string[]>} - An array of AI-generated tags.
 */
async function callPythonAIService(fileBuffer, mimeType) {
  let attempts = 0;
  const maxAttempts = 3;
  const initialDelay = 1000; // 1 second

  while (attempts < maxAttempts) {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        contentType: mimeType,
        filename: 'upload.' + getExtensionFromMimeType(mimeType)
      });

      console.log(`  🤖 Calling AI service (attempt ${attempts + 1}/${maxAttempts})...`);
      
      const response = await axios.post(
        `${PYTHON_AI_SERVICE_URL}/classify`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000, // 30 seconds
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      if (response.data && response.data.tags) {
        console.log(`  ✅ AI service returned tags:`, response.data.tags);
        return response.data.tags;
      }

      throw new Error('Invalid response from AI service');

    } catch (error) {
      attempts++;
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`  ⚠️  AI service not running on ${PYTHON_AI_SERVICE_URL}`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`  ⚠️  AI service timeout`);
      } else {
        console.log(`  ⚠️  AI service error: ${error.message}`);
      }
      
      if (attempts >= maxAttempts) {
        throw new Error(`AI service unavailable after ${maxAttempts} attempts`);
      }
      
      // Exponential backoff
      const delay = initialDelay * Math.pow(2, attempts - 1);
      console.log(`  ⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Check if AI service is healthy
 * @returns {Promise<boolean>}
 */
async function checkAIServiceHealth() {
  try {
    const response = await axios.get(`${PYTHON_AI_SERVICE_URL}/health`, {
      timeout: 5000
    });
    
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Get extension from MIME type
 */
function getExtensionFromMimeType(mimeType) {
  const mimeToExt = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi'
  };
  return mimeToExt[mimeType] || 'bin';
}

module.exports = {
  callPythonAIService,
  checkAIServiceHealth
};