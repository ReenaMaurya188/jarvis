import React, { useRef, useState } from 'react';
import './ImageUpload.css';

export default function ImageUpload({ onImageUpload }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    await onImageUpload(file);
    setIsUploading(false);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload-container">
      <input 
        type="file" 
        accept="image/*" 
        style={{ display: 'none' }} 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button 
        type="button"
        className="upload-button" 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        title="Upload Image"
      >
        {isUploading ? '⏳' : '🖼️'}
      </button>
    </div>
  );
}
