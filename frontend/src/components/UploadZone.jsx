import React, { useState } from 'react';
import { uploadMediaFiles, uploadJSONFiles } from '../services/api';
import { Camera, FileJson, CheckCircle, XCircle } from 'lucide-react';
import Dropzone from './Dropzone';
import FileProcessor from './FileProcessor';
import {nanoid} from 'nanoid'
const UploadZone = () => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [jsonFiles, setJsonFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };




  //  this part is responsible for  the notification 
  
  // const handleMediaDrop = async (acceptedFiles) => {
  //   if (acceptedFiles.length === 0) return;

  //   // Add files to UI immediately
  //   const newFiles = acceptedFiles.map(file => ({ 
  //     file, 
  //     id: Math.random().toString(36).substr(2, 9),
  //     status: 'uploading'
  //   }));
  //   setMediaFiles(prev => [...prev, ...newFiles]);
  //   setIsUploading(true);

  //   try {
  //     console.log(`📤 Uploading ${acceptedFiles.length} media files...`);
  //     const result = await uploadMediaFiles(acceptedFiles);
      
  //     console.log('✅ Media upload response:', result);
  //     showNotification(
  //       `Successfully uploaded ${result.count} media file(s)! Categorizing and storing...`,
  //       'success'
  //     );

  //     // Update file status to processing
  //     setMediaFiles(prev => 
  //       prev.map(f => 
  //         newFiles.find(nf => nf.id === f.id) 
  //           ? { ...f, status: 'processing' } 
  //           : f
  //       )
  //     );

  //     // Simulate processing completion after 6 seconds
  //     setTimeout(() => {
  //       setMediaFiles(prev => 
  //         prev.map(f => 
  //           newFiles.find(nf => nf.id === f.id)
  //             ? { ...f, status: 'completed' }
  //             : f
  //         )
  //       );
  //     }, 6000);

  //   } catch (error) {
  //     console.error('❌ Media upload failed:', error);
  //     showNotification(
  //       `Upload failed: ${error.message}`,
  //       'error'
  //     );

  //     // Update file status to failed
  //     setMediaFiles(prev => 
  //       prev.map(f => 
  //         newFiles.find(nf => nf.id === f.id)
  //           ? { ...f, status: 'failed' }
  //           : f
  //       )
  //     );
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };


   const handleMediaDrop = async (acceptedFiles) => {
  if (acceptedFiles.length === 0) return;

  const newFiles = acceptedFiles.map(file => ({ 
    file, 
    id: Math.random().toString(36).substr(2, 9),
    status: 'uploading'
  }));

  setMediaFiles(prev => [...prev, ...newFiles]);
  setIsUploading(true);

  try {
    const result = await uploadMediaFiles(acceptedFiles);

    // Remove this notification if you ONLY want completion notification:
    // showNotification(`Successfully uploaded ... processing`, "success");

    // Update status to processing
    setMediaFiles(prev =>
      prev.map(f =>
        newFiles.some(nf => nf.id === f.id)
          ? { ...f, status: "processing" }
          : f
      )
    );

    // Simulate backend finish after 6s 
    setTimeout(() => {
      setMediaFiles(prev =>
        prev.map(f =>
          newFiles.some(nf => nf.id === f.id)
            ? { ...f, status: "completed" }
            : f
        )
      );

      // 🎉 Final notification AFTER processing
      showNotification(
        `Upload complete! ${newFiles.length} file(s) fully processed.`,
        "success"
      );

    }, 6000);

  } catch (error) {

    const message = error.message || "Upload failed";

    showNotification(`Upload failed: ${message}`, "error");

    setMediaFiles(prev =>
      prev.map(f =>
        newFiles.some(nf => nf.id === f.id)
          ? { ...f, status: "failed" }
          : f
      )
    );

  } finally {
    setIsUploading(false);
  }
};

/// this si for the json handle 
const handleJsonDrop = async (acceptedFiles) => {
  if (acceptedFiles.length === 0) return;

  const newFiles = acceptedFiles.map(file => ({
    file,
    id: Math.random().toString(36).substr(2, 9),
    status: "uploading"
  }));

  setJsonFiles(prev => [...prev, ...newFiles]);
  setIsUploading(true);

  try {
    console.log(`📤 Uploading ${acceptedFiles.length} JSON file(s)...`);
    const result = await uploadJSONFiles(acceptedFiles);

    // ❌ Remove this notification
    // showNotification(`Successfully uploaded ... processing`, 'success');

    // Set status → processing
    setJsonFiles(prev =>
      prev.map(f =>
        newFiles.some(nf => nf.id === f.id)
          ? { ...f, status: "processing" }
          : f
      )
    );

    // Simulate backend processing completion
    setTimeout(() => {
      // Mark completed
      setJsonFiles(prev =>
        prev.map(f =>
          newFiles.some(nf => nf.id === f.id)
            ? { ...f, status: "completed" }
            : f
        )
      );

      // 🎉 Notification ONLY after full processing is done
      showNotification(
        `JSON processing complete! ${newFiles.length} file(s) analyzed and stored.`,
        "success"
      );

    }, 4000);

  } catch (error) {
    const message =
      error?.response?.data?.message || error?.message || "Unknown error";

    console.error("❌ JSON upload failed:", message);

    showNotification(`Upload failed: ${message}`, "error");

    setJsonFiles(prev =>
      prev.map(f =>
        newFiles.some(nf => nf.id === f.id)
          ? { ...f, status: "failed" }
          : f
      )
    );

  } finally {
    setIsUploading(false);
  }
};


  // Clear completed files
  const clearCompleted = () => {
    setMediaFiles(prev => prev.filter(f => f.status !== 'completed'));
    setJsonFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  return (
    <div>
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
          notification.type === 'success' 
            ? 'bg-green-500/20 border border-green-500/50 text-green-300' 
            : 'bg-red-500/20 border border-red-500/50 text-red-300'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span className="text-sm">{notification.message}</span>
        </div>
      )}

      {/* Upload Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Dropzone
          onDrop={handleMediaDrop}
          accept={{ 'image/*': [], 'video/*': [] }}
          Icon={Camera}
          title="Media Upload"
          description="Drag & drop images or videos, or click to browse"
          buttonText="Browse Files"
          hoverClassName="border-purple-500 bg-purple-500/10"
        />
        <Dropzone
          onDrop={handleJsonDrop}
          accept={{ 'application/json': [] }}
          Icon={FileJson}
          title="JSON Upload"
          description="Drag & drop JSON files, or click to browse"
          buttonText="Browse Files"
          hoverClassName="border-blue-500 bg-blue-500/10"
        />
      </div>

      {/* Processing Status */}
      {(mediaFiles.length > 0 || jsonFiles.length > 0) && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">
              Processing Files ({mediaFiles.length + jsonFiles.length})
            </h3>
            <button
              onClick={clearCompleted}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear Completed
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mediaFiles.map(item => (
              <FileProcessor 
                key={item.id} 
                file={item.file} 
                initialStatus={item.status}
              />
            ))}
            {jsonFiles.map(item => (
              <FileProcessor 
                key={item.id} 
                file={item.file} 
                initialStatus={item.status}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upload Status Indicator */}
      {isUploading && (
        <div className="mt-4 p-4 bg-purple-500/20 border border-purple-500/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
            <span className="text-purple-300 text-sm">
              Uploading to backend... Files are being processed.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadZone;