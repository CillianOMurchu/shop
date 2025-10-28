import React, { useState, useRef } from 'react';
import './ImageUpload.css';

const ImageUpload = ({ 
  value = null, 
  onChange, 
  multiple = false, 
  accept = "image/*",
  label = "Upload Image",
  preview = true 
}) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    if (multiple) {
      // For image gallery - handle multiple files
      const newImages = [];
      
      fileArray.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            newImages.push({
              id: Date.now() + Math.random(),
              file: file,
              name: file.name,
              size: file.size,
              dataUrl: e.target.result,
              uploadStatus: 'pending'
            });
            
            // Call onChange when all files are processed
            if (newImages.length === fileArray.length) {
              onChange(multiple ? [...(value || []), ...newImages] : newImages[0]);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    } else {
      // For single image
      const file = fileArray[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = {
            id: Date.now(),
            file: file,
            name: file.name,
            size: file.size,
            dataUrl: e.target.result,
            uploadStatus: 'pending'
          };
          onChange(imageData);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files);
  };

  const removeImage = (imageId) => {
    if (multiple) {
      const updatedImages = (value || []).filter(img => img.id !== imageId);
      onChange(updatedImages);
    } else {
      onChange(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderImagePreview = (image) => (
    <div key={image.id} className="image-preview">
      <div className="image-container">
        <img src={image.dataUrl} alt={image.name} />
        <div className="image-overlay">
          <button
            type="button"
            className="remove-image"
            onClick={() => removeImage(image.id)}
            title="Remove image"
          >
            ×
          </button>
        </div>
      </div>
      <div className="image-info">
        <span className="image-name">{image.name}</span>
        <span className="image-size">{formatFileSize(image.size)}</span>
      </div>
    </div>
  );

  return (
    <div className="image-upload-container">
      <div
        className={`image-upload-area ${dragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        <div className="upload-content">
          <div className="upload-icon">📷</div>
          <div className="upload-text">
            <p>{label}</p>
            <p className="upload-subtext">
              Drag and drop {multiple ? 'images' : 'an image'} here, or click to select
            </p>
            <p className="upload-formats">
              Supports: JPG, PNG, GIF, WebP
            </p>
          </div>
        </div>
      </div>

      {preview && value && (
        <div className="image-previews">
          {multiple ? (
            <div className="image-gallery">
              {(value || []).map(renderImagePreview)}
            </div>
          ) : (
            <div className="single-image">
              {renderImagePreview(value)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;