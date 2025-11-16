import React, { useState, useEffect } from 'react';
import { getUploadedFiles, deleteFile, getJSONFileData } from '../services/api';
import { FileJson, Image as ImageIcon, Video, MoreVertical, Download, Trash2, RefreshCw, Eye } from 'lucide-react';

// Helper function to optimize Cloudinary URLs
const getOptimizedImageUrl = (url, width = 48, height = 48) => {
  if (!url || !url.includes('cloudinary')) {
    return url;
  }

  // Insert transformation parameters into Cloudinary URL
  return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,q_auto/`);
};

const FileCard = ({ file, onDelete, onViewJSON }) => {
  const isMedia = file.type === 'media';
  const isJSON = file.type === 'json';
  const [imageError, setImageError] = useState(false);
  
  // Format file size
  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4 group relative hover:bg-white/10 transition-all">
      <div className="flex items-start gap-4">
        {/* File Icon */}
        <div className="flex-shrink-0">
          {isMedia && file.mime_type?.startsWith('image/') && file.url && !imageError ? (
            <img 
              src={getOptimizedImageUrl(file.url, 48, 48)}
              alt={file.filename}
              className="w-12 h-12 rounded-lg object-cover"
              onError={() => setImageError(true)}
            />
          ) : null}
          
          {(imageError || (isMedia && !file.url)) && file.mime_type?.startsWith('image/') && (
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-purple-400" />
            </div>
          )}
          
          {isMedia && file.mime_type?.startsWith('video/') && (
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Video className="w-6 h-6 text-purple-400" />
            </div>
          )}
          
          {isJSON && (
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <FileJson className="w-6 h-6 text-blue-400" />
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate" title={file.filename}>
            {file.filename}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatSize(file.size)} • {formatDate(file.timestamp)}
          </p>

          {/* Category for media */}
          {isMedia && file.category && (
            <div className="mt-2 text-xs text-gray-400">
              📁 {file.category}
            </div>
          )}

          {/* Database info for JSON */}
          {isJSON && file.db_type && (
            <div className="mt-2 text-xs text-blue-400">
              🗄️ {file.db_type} • {file.record_count || 0} records
            </div>
          )}

          {/* Storage Provider Badge */}
          {file.storage_provider === 'cloudinary' && isMedia && (
            <div className="mt-1 text-xs text-green-400 flex items-center gap-1">
              ☁️ Cloudinary
            </div>
          )}
        </div>
      </div>

      {/* Actions (hover) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
      
      <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* View button for JSON files */}
        {isJSON && (
          <button
            onClick={() => onViewJSON && onViewJSON(file.id)}
            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-white/10 rounded-full"
            title="View JSON data"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}

        {/* Open in new tab for media files */}
        {file.url && isMedia && (
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
            title="Open in new tab"
          >
            <Download className="w-4 h-4" />
          </a>
        )}

        <button
          onClick={() => onDelete && onDelete(file.id)}
          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-full"
          title="Delete file"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const FileGrid = ({ selectedFolder = 'all' }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUploadedFiles({ limit: 100 });
      console.log('Files fetched:', data);
      setFiles(data.files || []);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter files based on selected folder
  const filteredFiles = files.filter(file => {
    if (selectedFolder === 'all') return true;

    if (selectedFolder === 'images') {
      return file.type === 'media' && file.category === 'Images';
    }
    if (selectedFolder === 'videos') {
      return file.type === 'media' && file.category === 'Videos';
    }
    if (selectedFolder === 'sql') {
      return file.type === 'json' && file.db_type === 'PostgreSQL';
    }
    if (selectedFolder === 'nosql') {
      return file.type === 'json' && file.db_type === 'MongoDB';
    }

    return true;
  });

  const handleDelete = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      // Call delete API - this will delete from both Cloudinary and Firebase
      await deleteFile(fileId);

      // Remove from UI after successful deletion
      setFiles(prev => prev.filter(f => f.id !== fileId));

      console.log('File deleted successfully:', fileId);
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file: ' + error.message);
      // Refresh to ensure UI is in sync with backend
      fetchFiles();
    }
  };

  const handleViewJSON = async (fileId) => {
    try {
      console.log('Fetching JSON data for file:', fileId);
      const data = await getJSONFileData(fileId);

      // Create a formatted HTML page to display the JSON
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${data.filename} - JSON Viewer</title>
          <style>
            body {
              font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
              background: #1a1a2e;
              color: #eee;
              padding: 20px;
              margin: 0;
            }
            .header {
              background: #16213e;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
              border: 1px solid #0f3460;
            }
            .header h1 {
              margin: 0 0 10px 0;
              color: #a78bfa;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0;
              color: #94a3b8;
              font-size: 14px;
            }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              background: #3b82f6;
              color: white;
              border-radius: 4px;
              font-size: 12px;
              margin-right: 10px;
            }
            .badge.postgres { background: #3b82f6; }
            .badge.mongodb { background: #10b981; }
            pre {
              background: #16213e;
              border: 1px solid #0f3460;
              border-radius: 8px;
              padding: 20px;
              overflow-x: auto;
              line-height: 1.6;
            }
            .json-key { color: #a78bfa; }
            .json-string { color: #fbbf24; }
            .json-number { color: #60a5fa; }
            .json-boolean { color: #f87171; }
            .json-null { color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📄 ${data.filename}</h1>
            <p>
              <span class="badge ${data.db_type === 'PostgreSQL' ? 'postgres' : 'mongodb'}">
                🗄️ ${data.db_type}
              </span>
              <span class="badge">
                📊 ${data.record_count} records
              </span>
              <span class="badge">
                📁 Table: ${data.table_name}
              </span>
            </p>
          </div>
          <pre>${syntaxHighlight(JSON.stringify(data.data, null, 2))}</pre>
        </body>
        </html>
      `;

      // Open in new tab
      const newWindow = window.open('', '_blank');
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    } catch (error) {
      console.error('Failed to view JSON:', error);
      alert('Failed to load JSON data: ' + error.message);
    }
  };

  // Helper function to syntax highlight JSON
  const syntaxHighlight = (json) => {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  };

  useEffect(() => {
    fetchFiles();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchFiles, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && files.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading files...</p>
        </div>
      </div>
    );
  }

  if (error && files.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load files: {error}</p>
          <button
            onClick={fetchFiles}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (filteredFiles.length === 0 && files.length > 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-400 mb-2">No files in this folder</p>
          <p className="text-gray-500 text-sm">Try selecting a different folder</p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-400 mb-2">No files uploaded yet</p>
          <p className="text-gray-500 text-sm">Upload some files to see them here!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-400">
          {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} in this folder
        </p>
        <button
          onClick={fetchFiles}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFiles.map(file => (
          <FileCard key={file.id} file={file} onDelete={handleDelete} onViewJSON={handleViewJSON} />
        ))}
      </div>
    </div>
  );
};

export default FileGrid;