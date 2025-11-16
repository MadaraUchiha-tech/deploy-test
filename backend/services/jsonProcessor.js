const { analyzeJSONSchema, storeInPostgreSQL, storeInMongoDB } = require('./databaseManager');
const { logUpload, logError } = require('./logger');

/**
 * Analyzes and stores a JSON file.
 * @param {object} jsonData - The parsed JSON data.
 * @param {string} filename - The original filename.
 * @returns {Promise<object>} - The result of the processing.
 */
async function analyzeAndStoreJSON(jsonData, filename) {
  const startTime = Date.now();
  
  try {
    console.log(`📊 Processing JSON file: ${filename}`);
    
    // Step 1: Analyze JSON schema
    console.log(`  1️⃣  Analyzing schema...`);
    const { useSQL, reason, schema } = analyzeJSONSchema(jsonData);
    const dbType = useSQL ? 'PostgreSQL' : 'MongoDB';
    console.log(`  ✅ Decision: ${dbType} - ${reason}`);
    
    // Step 2: Prepare table/collection name
    const tableName = filename.replace('.json', '').replace(/[^a-zA-Z0-9_]/g, '_');
    
    // Step 3: Store in appropriate database
    console.log(`  2️⃣  Storing in ${dbType}...`);
    
    let recordCount = 0;
    try {
      if (useSQL) {
        recordCount = await storeInPostgreSQL(jsonData, tableName);
      } else {
        recordCount = await storeInMongoDB(jsonData, tableName);
      }
      console.log(`  ✅ Stored ${recordCount} records`);
    } catch (error) {
      console.log(`  ⚠️  Database not available, data analyzed only`);
      recordCount = Array.isArray(jsonData) ? jsonData.length : 1;
    }
    
    // Step 4: Log the result
    const metadata = {
      filename,
      db_type: dbType,
      schema_summary: reason,
      schema_details: schema,
      record_count: recordCount,
      table_name: tableName,
      timestamp: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime
    };
    
    console.log(`  3️⃣  Logging to Firebase DB...`);
    await logUpload('json', metadata);
    
    const processingTime = Date.now() - startTime;
    console.log(`  ⏱️  Total processing time: ${processingTime}ms`);
    
    return {
      success: true,
      filename,
      status: 'processed',
      database: dbType,
      tableName,
      recordCount,
      reason,
      schema,
      processingTimeMs: processingTime
    };
    
  } catch (error) {
    console.error(`  ❌ Error processing ${filename}:`, error.message);
    
    // Log error
    await logError(error, {
      filename,
      stage: 'json_processing',
      dataType: typeof jsonData
    });
    
    return {
      success: false,
      filename,
      status: 'failed',
      error: error.message
    };
  }
}

/**
 * Validate JSON structure
 * @param {*} data - Data to validate
 * @returns {boolean}
 */
function validateJSON(data) {
  if (data === null || data === undefined) {
    return false;
  }
  
  // Must be object or array
  if (typeof data !== 'object') {
    return false;
  }
  
  return true;
}

/**
 * Get JSON statistics
 * @param {*} data - JSON data
 * @returns {object}
 */
function getJSONStats(data) {
  const stats = {
    isArray: Array.isArray(data),
    itemCount: 0,
    depth: 0,
    fieldCount: 0,
    fields: []
  };
  
  if (Array.isArray(data)) {
    stats.itemCount = data.length;
    if (data.length > 0 && typeof data[0] === 'object') {
      stats.fields = Object.keys(data[0]);
      stats.fieldCount = stats.fields.length;
      stats.depth = calculateDepth(data[0]);
    }
  } else if (typeof data === 'object') {
    stats.itemCount = 1;
    stats.fields = Object.keys(data);
    stats.fieldCount = stats.fields.length;
    stats.depth = calculateDepth(data);
  }
  
  return stats;
}

/**
 * Calculate nesting depth of object
 */
function calculateDepth(obj, currentDepth = 1) {
  if (typeof obj !== 'object' || obj === null) {
    return currentDepth;
  }
  
  let maxDepth = currentDepth;
  
  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null) {
      const depth = calculateDepth(value, currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
  }
  
  return maxDepth;
}

/**
 * Process multiple JSON files in batch
 * @param {Array} files - Array of {data, filename} objects
 * @returns {Promise<Array>}
 */
async function processBatchJSONFiles(files) {
  const results = [];
  
  console.log(`📦 Processing batch of ${files.length} JSON files`);
  
  for (const file of files) {
    const result = await analyzeAndStoreJSON(file.data, file.filename);
    results.push(result);
  }
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Batch complete: ${successful} successful, ${failed} failed`);
  
  return results;
}

module.exports = {
  analyzeAndStoreJSON,
  validateJSON,
  getJSONStats,
  processBatchJSONFiles
};