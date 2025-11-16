const MAX_MEDIA_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_JSON_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'video/mp4'];
const ALLOWED_JSON_TYPES = ['application/json'];

function validateFile(req, res, next) {
  // This is a placeholder for a more robust validation logic
  // that would be integrated with Multer's fileFilter option.
  console.log('Validating files...');
  next();
}

function sanitizeFilenames(req, res, next) {
  if (req.files) {
    req.files.forEach(file => {
      // Sanitize filename to prevent security issues
      file.originalname = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '');
    });
  }
  next();
}

module.exports = {
  validateFile,
  sanitizeFilenames,
};
