import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '../lib/utils';

const Dropzone = ({ onDrop, accept, Icon, title, description, buttonText, hoverClassName }) => {
  const onDropCallback = useCallback(onDrop, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCallback,
    accept,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer',
        { [hoverClassName]: isDragActive }
      )}
    >
      <input {...getInputProps()} />
      <Icon className="w-16 h-16 text-gray-500 mb-4 transition-transform duration-300 group-hover:scale-110" />
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="text-gray-400 mt-2">{description}</p>
      <button className="mt-4 bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-600 transition-colors">
        {buttonText}
      </button>
    </div>
  );
};

export default Dropzone;
