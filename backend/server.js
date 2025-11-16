// server.js - Add at the top
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'http://localhost:3000',
  process.env.FRONTEND_URL // Production frontend URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Trust proxy for Render
app.set('trust proxy', 1);

// Initialize Firebase Admin SDK (Database Only - No Storage)
let firebaseInitialized = false;
try {
  const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT || './firebase-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // REMOVED: storageBucket - Using Cloudinary instead
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  firebaseInitialized = true;
  console.log('✅ Firebase initialized successfully (Database only)');
  console.log('📦 Using Cloudinary for media storage');
} catch (error) {
  console.warn('⚠️  Firebase not initialized:', error.message);
  console.log('   Running in mock mode - no real storage operations');
}

// Configure Multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for media
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime',
      'application/json'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and JSON allowed.'));
    }
  }
});

// Import routes
const uploadRoutes = require('./routes/upload');
const dataRoutes = require('./routes/data');

// Make upload middleware available to routes
app.use('/upload', upload.array('files', 10), uploadRoutes);
app.use('/', dataRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    firebase: firebaseInitialized,
    cloudinary: require('./services/cloudinaryManager').cloudinaryInitialized,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ 
    error: error.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 IMSS Backend running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});

// Export for testing
module.exports = app;