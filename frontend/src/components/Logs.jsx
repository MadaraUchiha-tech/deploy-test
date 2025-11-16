import React, { useState, useEffect } from 'react';
import { getUploadHistory } from '../services/api';
import { FileJson, Image as ImageIcon, Video, RefreshCw, Calendar, Database, Cloud } from 'lucide-react';

// Helper function to optimize Cloudinary URLs for thumbnails
const getOptimizedImageUrl = (url, width = 64, height = 64) => {
  if (!url || !url.includes('cloudinary')) {
    return url;
  }

  // Insert transformation parameters into Cloudinary URL
  return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,q_auto/`);
};

const LogEntry = ({ log }) => {
  const isMedia = log.type === 'media';
  const isJSON = log.type === 'json';
  const isImage = isMedia && log.mime_type?.startsWith('image/');
  const isVideo = isMedia && log.mime_type?.startsWith('video/');
  const [imageError, setImageError] = useState(false);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all">
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          {isImage && log.url && !imageError ? (
            <img
              src={getOptimizedImageUrl(log.url, 64, 64)}
              alt={log.filename}
              className="w-16 h-16 rounded-lg object-cover"
              onError={() => setImageError(true)}
            />
          ) : null}

          {(imageError || (isImage && !log.url)) && (
            <div className="w-16 h-16 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-purple-400" />
            </div>
          )}

          {isVideo && (
            <div className="w-16 h-16 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Video className="w-8 h-8 text-purple-400" />
            </div>
          )}

          {isJSON && (
            <div className="w-16 h-16 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <FileJson className="w-8 h-8 text-blue-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate" title={log.filename}>
                {log.filename}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>{formatTimestamp(log.timestamp)}</span>
                {log.size && (
                  <>
                    <span>•</span>
                    <span>{formatSize(log.size)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Type-specific info */}
          <div className="mt-2 flex flex-wrap gap-2">
            {isMedia && (
              <>
                {log.category && (
                  <span className="px-2 py-1 text-xs bg-purple-600/20 text-purple-300 rounded border border-purple-500/30">
                    📁 {log.category}
                  </span>
                )}
                {log.storage_provider === 'cloudinary' && (
                  <span className="px-2 py-1 text-xs bg-green-600/20 text-green-300 rounded border border-green-500/30 flex items-center gap-1">
                    <Cloud className="w-3 h-3" />
                    Cloudinary
                  </span>
                )}
              </>
            )}

            {isJSON && log.db_type && (
              <span className="px-2 py-1 text-xs bg-blue-600/20 text-blue-300 rounded border border-blue-500/30 flex items-center gap-1">
                <Database className="w-3 h-3" />
                {log.db_type}
                {log.record_count && ` • ${log.record_count} records`}
              </span>
            )}
          </div>

          {/* Schema summary for JSON */}
          {isJSON && log.schema_summary && (
            <p className="mt-2 text-xs text-gray-500 italic">
              {log.schema_summary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUploadHistory(50);
      console.log('Logs fetched:', data);
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading logs...</p>
        </div>
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load logs: {error}</p>
          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-400 mb-2">No upload history yet</p>
          <p className="text-gray-500 text-sm">Upload some files to see activity logs!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Upload History</h2>
          <p className="text-sm text-gray-400 mt-1">
            {logs.length} upload{logs.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Refresh logs"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        {logs.map((log, index) => (
          <LogEntry key={log.id || index} log={log} />
        ))}
      </div>
    </div>
  );
};

export default Logs;
