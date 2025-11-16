const { Pool } = require('pg');
const { MongoClient } = require('mongodb');

// Initialize PostgreSQL client
let pgPool = null;
if (process.env.NEON_DATABASE_URL) {
  pgPool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log('✅ PostgreSQL client initialized');
} else {
  console.warn('⚠️  NEON_DATABASE_URL not set - PostgreSQL unavailable');
}

// Initialize MongoDB client
let mongoClient = null;
let mongoDb = null;
if (process.env.MONGODB_URI) {
  mongoClient = new MongoClient(process.env.MONGODB_URI);
  mongoClient.connect()
    .then(() => {
      mongoDb = mongoClient.db('imss');
      console.log('✅ MongoDB client connected');
    })
    .catch(err => console.warn('⚠️  MongoDB connection failed:', err.message));
} else {
  console.warn('⚠️  MONGODB_URI not set - MongoDB unavailable');
}

/**
 * Analyzes the schema of JSON data to decide between SQL and NoSQL storage.
 * @param {object|array} data - The JSON data.
 * @returns {{useSQL: boolean, reason: string, schema: object}}
 */
function analyzeJSONSchema(data) {
  // Ensure data is valid
  if (!data || (typeof data !== 'object')) {
    return {
      useSQL: false,
      reason: 'Invalid data structure',
      schema: {}
    };
  }

  // Unwrap if data has a single root array property (e.g., {"orders": [...]})
  let actualData = data;
  if (!Array.isArray(data) && typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 1 && Array.isArray(data[keys[0]])) {
      actualData = data[keys[0]];
      console.log(`  📦 Unwrapped root array property: "${keys[0]}" (${actualData.length} items)`);
    }
  }

  // Get the array to analyze
  const items = Array.isArray(actualData) ? actualData : [actualData];

  if (items.length === 0) {
    return {
      useSQL: true,
      reason: 'Empty dataset - defaulting to SQL',
      schema: {}
    };
  }

  // Analyze first item
  const firstItem = items[0];

  // Calculate nesting depth
  const depth = calculateDepth(firstItem);

  // Check for arrays within objects
  const hasArrays = hasNestedArrays(firstItem);

  // Check schema consistency across items
  const isConsistent = checkSchemaConsistency(items);

  // Get field types
  const schema = inferSchema(firstItem);

  // Debug logging
  console.log(`  🔍 Schema Analysis:`);
  console.log(`     - Depth: ${depth}`);
  console.log(`     - Has nested arrays: ${hasArrays}`);
  console.log(`     - Schema consistent: ${isConsistent}`);
  console.log(`     - Fields: ${Object.keys(schema).join(', ')}`);

  // Decision logic
  let useSQL = true;
  let reason = '';

  if (depth > 3) {
    useSQL = false;
    reason = `Deep nesting detected (depth: ${depth}) - MongoDB better suited for hierarchical data`;
  } else if (hasArrays) {
    useSQL = false;
    reason = 'Nested arrays detected - MongoDB handles dynamic arrays better';
  } else if (!isConsistent) {
    useSQL = false;
    reason = 'Inconsistent schema across items - MongoDB provides flexibility';
  } else if (depth <= 2 && isConsistent) {
    // Check for relational patterns (foreign keys) only for flat structures
    const hasRelations = detectRelations(schema);
    if (hasRelations) {
      useSQL = true;
      reason = 'Relational pattern detected (foreign keys) - PostgreSQL better for joins and relationships';
    } else {
      useSQL = true;
      reason = `Flat structure (depth: ${depth}) with consistent schema - PostgreSQL optimal for relational queries`;
    }
  } else {
    useSQL = false;
    reason = 'Complex structure - MongoDB provides better flexibility';
  }
  
  return {
    useSQL,
    reason,
    schema
  };
}

/**
 * Calculate nesting depth
 */
function calculateDepth(obj, current = 1) {
  if (typeof obj !== 'object' || obj === null) {
    return current;
  }
  
  let maxDepth = current;
  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null) {
      const depth = calculateDepth(value, current + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
  }
  
  return maxDepth;
}

/**
 * Check if object has nested arrays
 */
function hasNestedArrays(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      return true;
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (hasNestedArrays(value)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check schema consistency
 */
function checkSchemaConsistency(items) {
  if (items.length <= 1) return true;
  
  const firstKeys = Object.keys(items[0]).sort();
  
  for (let i = 1; i < Math.min(items.length, 10); i++) {
    const currentKeys = Object.keys(items[i]).sort();
    if (JSON.stringify(firstKeys) !== JSON.stringify(currentKeys)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Infer schema from object
 */
function inferSchema(obj) {
  const schema = {};
  
  for (const [key, value] of Object.entries(obj)) {
    schema[key] = {
      type: getType(value),
      nullable: value === null
    };
  }
  
  return schema;
}

/**
 * Get type of value
 */
function getType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  return typeof value;
}

/**
 * Detect relational patterns (foreign keys)
 */
function detectRelations(schema) {
  const keys = Object.keys(schema);
  
  // Look for common foreign key patterns
  const fkPatterns = ['_id', 'Id', '_ref', 'Ref'];
  
  for (const key of keys) {
    for (const pattern of fkPatterns) {
      if (key.endsWith(pattern) && schema[key].type === 'number') {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Stores data in PostgreSQL.
 * @param {object[]|object} data - The data to store.
 * @param {string} tableName - The name of the table.
 * @returns {Promise<number>} - Number of records inserted
 */
async function storeInPostgreSQL(data, tableName) {
  if (!pgPool) {
    throw new Error('PostgreSQL not configured');
  }

  // Unwrap if data has a single root array property
  let actualData = data;
  if (!Array.isArray(data) && typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 1 && Array.isArray(data[keys[0]])) {
      actualData = data[keys[0]];
    }
  }

  const items = Array.isArray(actualData) ? actualData : [actualData];
  
  if (items.length === 0) {
    return 0;
  }
  
  try {
    // Infer schema from first item
    const schema = inferSchema(items[0]);
    const columns = Object.keys(schema);
    
    // Generate CREATE TABLE statement
    const columnDefs = columns.map(col => {
      const type = schema[col].type;
      let pgType = 'TEXT';
      
      if (type === 'number') {
        pgType = 'NUMERIC';
      } else if (type === 'boolean') {
        pgType = 'BOOLEAN';
      } else if (type === 'date') {
        pgType = 'TIMESTAMP';
      } else if (type === 'object' || type === 'array') {
        pgType = 'JSONB';
      }
      
      return `${col} ${pgType}`;
    }).join(', ');
    
    // Create table
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        ${columnDefs},
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log(`  📊 Created/verified table: ${tableName}`);
    
    // Insert data
    let insertedCount = 0;
    
    for (const item of items) {
      const values = columns.map(col => {
        const val = item[col];
        if (typeof val === 'object' && val !== null) {
          return JSON.stringify(val);
        }
        return val;
      });
      
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      
      await pgPool.query(
        `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      );
      
      insertedCount++;
    }
    
    console.log(`  ✅ Inserted ${insertedCount} records into PostgreSQL`);
    return insertedCount;
    
  } catch (error) {
    console.error('PostgreSQL error:', error);
    throw error;
  }
}

/**
 * Stores data in MongoDB.
 * @param {object[]|object} data - The data to store.
 * @param {string} collectionName - The name of the collection.
 * @returns {Promise<number>} - Number of records inserted
 */
async function storeInMongoDB(data, collectionName) {
  if (!mongoDb) {
    throw new Error('MongoDB not configured');
  }

  // Unwrap if data has a single root array property
  let actualData = data;
  if (!Array.isArray(data) && typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 1 && Array.isArray(data[keys[0]])) {
      actualData = data[keys[0]];
    }
  }

  const items = Array.isArray(actualData) ? actualData : [actualData];
  
  if (items.length === 0) {
    return 0;
  }
  
  try {
    const collection = mongoDb.collection(collectionName);
    
    // Add timestamp to each item
    const itemsWithTimestamp = items.map(item => ({
      ...item,
      created_at: new Date()
    }));
    
    const result = await collection.insertMany(itemsWithTimestamp);
    
    console.log(`  ✅ Inserted ${result.insertedCount} records into MongoDB`);
    return result.insertedCount;
    
  } catch (error) {
    console.error('MongoDB error:', error);
    throw error;
  }
}

/**
 * Query data from PostgreSQL
 */
async function queryPostgreSQL(tableName, limit = 100) {
  if (!pgPool) {
    throw new Error('PostgreSQL not configured');
  }
  
  const result = await pgPool.query(
    `SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  
  return result.rows;
}

/**
 * Query data from MongoDB
 */
async function queryMongoDB(collectionName, limit = 100) {
  if (!mongoDb) {
    throw new Error('MongoDB not configured');
  }
  
  const collection = mongoDb.collection(collectionName);
  const docs = await collection
    .find({})
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();
  
  return docs;
}

/**
 * Delete table from PostgreSQL
 */
async function deleteFromPostgreSQL(tableName) {
  if (!pgPool) {
    throw new Error('PostgreSQL not configured');
  }

  try {
    await pgPool.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
    console.log(`  ✅ Dropped table from PostgreSQL: ${tableName}`);
    return true;
  } catch (error) {
    console.error('PostgreSQL delete error:', error);
    throw error;
  }
}

/**
 * Delete collection from MongoDB
 */
async function deleteFromMongoDB(collectionName) {
  if (!mongoDb) {
    throw new Error('MongoDB not configured');
  }

  try {
    const collection = mongoDb.collection(collectionName);
    await collection.drop();
    console.log(`  ✅ Dropped collection from MongoDB: ${collectionName}`);
    return true;
  } catch (error) {
    // If collection doesn't exist, don't throw error
    if (error.message.includes('ns not found')) {
      console.log(`  ⚠️  Collection not found (already deleted): ${collectionName}`);
      return true;
    }
    console.error('MongoDB delete error:', error);
    throw error;
  }
}

/**
 * Delete data from appropriate database
 * @param {string} dbType - 'PostgreSQL' or 'MongoDB'
 * @param {string} tableName - Name of table/collection
 */
async function deleteFromDatabase(dbType, tableName) {
  if (dbType === 'PostgreSQL') {
    return await deleteFromPostgreSQL(tableName);
  } else if (dbType === 'MongoDB') {
    return await deleteFromMongoDB(tableName);
  } else {
    throw new Error(`Unknown database type: ${dbType}`);
  }
}

// Cleanup on exit
process.on('SIGINT', async () => {
  if (pgPool) {
    await pgPool.end();
  }
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit();
});

module.exports = {
  analyzeJSONSchema,
  storeInPostgreSQL,
  storeInMongoDB,
  queryPostgreSQL,
  queryMongoDB,
  deleteFromDatabase,
  deleteFromPostgreSQL,
  deleteFromMongoDB
};