import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle, Upload } from 'lucide-react';

const FileProcessor = ({ file, initialStatus = 'uploading' }) => {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    // Update status based on prop changes
    setStatus(initialStatus);
  }, [initialStatus]);

  const isImage = file.type.startsWith('image/');
  const isJSON = file.type === 'application/json' || file.name.endsWith('.json');
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, [file, isImage]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'uploading':
        return (
          <div className="flex items-center gap-2 text-blue-400">
            <Upload className="w-4 h-4" />
            <span>Uploading to server...</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-2 text-purple-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing{isJSON ? ' and analyzing schema' : ' and categorizing'}...</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span>Processing complete!</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>Upload failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Progress bar calculation
  const getProgress = () => {
    switch (status) {
      case 'uploading': return 30;
      case 'processing': return 70;
      case 'completed': return 100;
      case 'failed': return 0;
      default: return 0;
    }
  };

  const progress = getProgress();

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/10 p-4 rounded-lg">
      <div className="flex items-start gap-4">
        {/* File Preview */}
        {isImage && imagePreview ? (
          <img 
            src={imagePreview} 
            alt={file.name} 
            className="w-16 h-16 rounded-md object-cover flex-shrink-0" 
          />
        ) : (
          <div className="w-16 h-16 rounded-md bg-gray-700 flex items-center justify-center flex-shrink-0">
            <p className="text-xs text-gray-400 font-mono">
              .{file.name.split('.').pop()}
            </p>
          </div>
        )}

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{file.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {(file.size / 1024).toFixed(1)} KB
          </p>

          {/* Progress Bar */}
          <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                status === 'failed' ? 'bg-red-500' :
                status === 'completed' ? 'bg-green-500' :
                'bg-gradient-to-r from-purple-500 to-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Status Display */}
          <div className="mt-3 text-xs">
            {getStatusDisplay()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileProcessor;