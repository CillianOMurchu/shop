// Image handling service for future backend integration
class ImageService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
  }

  // Convert file to base64 for local storage (current implementation)
  async processImageForStorage(imageData) {
    // For now, we store images as base64 in Redux
    // In production, this would upload to a file server/cloud storage
    return {
      id: imageData.id,
      name: imageData.name,
      size: imageData.size,
      dataUrl: imageData.dataUrl,
      uploadStatus: 'completed',
      // In production, this would be the server URL
      url: imageData.dataUrl,
      // Add metadata for future use
      metadata: {
        uploadedAt: new Date().toISOString(),
        originalName: imageData.name,
        mimeType: imageData.file?.type,
      }
    };
  }

  // Future implementation for actual file upload
  async uploadImage(imageData) {
    // This would be implemented when backend is ready
    try {
      const formData = new FormData();
      formData.append('image', imageData.file);
      formData.append('name', imageData.name);

      const response = await fetch(`${this.baseURL}/uploads/images`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, let browser set it
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        id: result.id,
        name: result.name,
        size: result.size,
        url: result.url,
        thumbnailUrl: result.thumbnail_url,
        uploadStatus: 'completed',
        metadata: result.metadata
      };
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }

  // Batch upload for galleries
  async uploadMultipleImages(imageArray) {
    const uploadPromises = imageArray.map(imageData => 
      this.uploadImage(imageData).catch(error => ({
        ...imageData,
        uploadStatus: 'failed',
        error: error.message
      }))
    );

    return Promise.all(uploadPromises);
  }

  // Delete image from server
  async deleteImage(imageId) {
    try {
      const response = await fetch(`${this.baseURL}/uploads/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Image deletion failed:', error);
      throw error;
    }
  }

  // Generate thumbnail URL (for future backend implementation)
  getThumbnailUrl(imageUrl, size = 'small') {
    // Current implementation returns original URL
    // Future: return thumbnail URLs from backend
    
    // In production with a proper backend:
    // const sizeMap = {
    //   small: '150x150',
    //   medium: '300x300',
    //   large: '600x600'
    // };
    // return `${imageUrl}?thumb=${sizeMap[size]}`;
    
    return imageUrl;
  }

  // Validate image file
  validateImage(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPG, PNG, GIF, or WebP images.');
    }

    if (file.size > maxSize) {
      throw new Error('File too large. Please upload images smaller than 10MB.');
    }

    return true;
  }

  // Compress image before upload (future enhancement)
  async compressImage(file, maxWidth = 1920, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

// Export singleton instance
export const imageService = new ImageService();

// Rails Backend Integration Notes:
/*
Expected Rails endpoints for image handling:

1. Upload single image:
   POST /api/v1/uploads/images
   Content-Type: multipart/form-data
   Body: FormData with 'image' field

2. Upload multiple images:
   POST /api/v1/uploads/images/batch
   Content-Type: multipart/form-data
   Body: FormData with multiple 'images[]' fields

3. Delete image:
   DELETE /api/v1/uploads/images/:id

4. Get image metadata:
   GET /api/v1/uploads/images/:id

Rails model structure:
```ruby
class Upload < ApplicationRecord
  has_one_attached :file
  
  validates :name, presence: true
  validates :file, presence: true
  
  def url
    Rails.application.routes.url_helpers.rails_blob_url(file, only_path: false)
  end
  
  def thumbnail_url(size = '150x150')
    Rails.application.routes.url_helpers.rails_representation_url(
      file.variant(resize_to_fill: size.split('x').map(&:to_i)), 
      only_path: false
    )
  end
end
```

Rails controller:
```ruby
class Api::V1::Uploads::ImagesController < ApplicationController
  def create
    @upload = Upload.new(upload_params)
    
    if @upload.save
      render json: {
        id: @upload.id,
        name: @upload.name,
        size: @upload.file.byte_size,
        url: @upload.url,
        thumbnail_url: @upload.thumbnail_url,
        metadata: {
          content_type: @upload.file.content_type,
          uploaded_at: @upload.created_at
        }
      }, status: :created
    else
      render json: { errors: @upload.errors }, status: :unprocessable_entity
    end
  end
  
  private
  
  def upload_params
    params.permit(:image, :name)
  end
end
```
*/

export default ImageService;