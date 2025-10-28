# Generic CRUD Admin Interface with Image Support

A scalable, ultra-simple Redux-based frontend for managing any type of entity with relationships and image uploads. Built with React and Redux Toolkit.

## Features

- **Generic Entity Management**: Create, read, update, and delete any type of entity
- **Dynamic Schema System**: Define custom entity types with fields and relationships
- **Image Upload Support**: Single images and image galleries with drag-and-drop
- **Relationship Management**: Handle belongsTo and hasMany relationships between entities
- **Scalable Architecture**: Built for future expansion and Rails backend integration
- **Admin Interface**: Clean, responsive UI for managing entities and schemas

## Quick Start

```bash
npm install
npm start
```

Visit `http://localhost:3000` to access the admin interface.

## Image Features

### Supported Image Operations
- **Drag & Drop Upload**: Intuitive file upload interface
- **Single Images**: Product photos, category banners, etc.
- **Image Galleries**: Multiple images per entity (product galleries, etc.)
- **Preview System**: Instant preview with image management
- **Format Support**: JPG, PNG, GIF, WebP
- **File Validation**: Size and type checking

### Image Field Types
- `image`: Single image field
- `image_gallery`: Multiple images field

### Using Images in Schemas

```javascript
// Example: Adding image fields to a product schema
{
  name: 'Product',
  fields: [
    { name: 'name', type: 'string', required: true, label: 'Product Name' },
    { name: 'image', type: 'image', required: false, label: 'Main Product Image' },
    { name: 'gallery', type: 'image_gallery', required: false, label: 'Product Gallery' },
    // ... other fields
  ]
}
```

## Architecture Overview

### Redux Store Structure

The application uses Redux Toolkit with two main slices:

1. **Entities Slice** (`src/store/slices/entitiesSlice.js`)
   - Manages all entity data in a normalized structure
   - Handles CRUD operations
   - Manages relationships between entities
   - Stores image data (base64 for development, URLs for production)

2. **Schemas Slice** (`src/store/slices/schemasSlice.js`)
   - Defines entity types and their fields
   - Manages relationship definitions
   - Provides metadata for dynamic form generation
   - Includes image field type definitions

### Components

- **AdminInterface** (`src/components/AdminInterface.js`)
  - Main admin dashboard
  - Entity type selection
  - Navigation between entity management and schema management

- **EntityList** (`src/components/EntityList.js`)
  - Displays entities of a selected type
  - Shows image previews in entity cards
  - Provides edit and delete actions

- **EntityForm** (`src/components/EntityForm.js`)
  - Dynamic form generation based on schema
  - Handles create and update operations
  - Image upload and management interface
  - Relationship management interface

- **ImageUpload** (`src/components/ImageUpload.js`)
  - Drag-and-drop image upload component
  - Preview and management interface
  - Support for single images and galleries
  - File validation and error handling

- **SchemaManager** (`src/components/SchemaManager.js`)
  - Create and manage entity schemas
  - Add fields including image types
  - Define relationships between entity types

### Services

- **apiService** (`src/services/apiService.js`)
  - Prepared for Rails backend integration
  - RESTful API conventions
  - CSRF token handling
  - Generic CRUD operations

- **imageService** (`src/services/imageService.js`)
  - Image processing and validation
  - Base64 encoding for local storage
  - Prepared for backend upload integration
  - Image compression and optimization utilities

## Default Entity Types (Updated with Images)

The system comes with three predefined schemas that now include image support:

1. **Product**
   - Fields: name, description, price, **image**, **gallery**, active
   - Images: Main product image + product gallery
   - Relationships: belongsTo category, hasMany tags

2. **Category**
   - Fields: name, description, **image**, active
   - Images: Category banner/icon
   - Relationships: belongsTo parent category, hasMany products

3. **Tag**
   - Fields: name, color
   - Relationships: hasMany products

## Usage Guide

### Managing Entities with Images

1. Select "Manage Entities" tab
2. Choose an entity type from the dropdown
3. Click "Create New" to add entities
4. **Upload images using the drag-and-drop interface**
5. **Manage image galleries by adding multiple images**
6. Use "Edit" and "Delete" buttons on entity cards

### Adding Image Fields to Schemas

1. Go to Schema Manager
2. Select an existing schema or create new one
3. Add field with type:
   - `image` for single image
   - `image_gallery` for multiple images
4. Set field label and requirements
5. Save and start using in entity forms

### Image Management

- **Upload**: Drag images to upload area or click to browse
- **Preview**: See uploaded images immediately
- **Remove**: Click × on image preview to remove
- **Validation**: System checks file type and size
- **Gallery**: Add multiple images to gallery fields

## Field Types (Updated)

- **string**: Text input
- **text**: Textarea for longer content
- **number**: Numeric input
- **boolean**: Checkbox
- **image**: Single image upload with preview
- **image_gallery**: Multiple image upload with gallery view
- **date**: Date picker (future enhancement)

## Image Storage

### Development (Current)
- Images stored as base64 data URLs in Redux
- Immediate preview without server upload
- Perfect for development and prototyping

### Production (Future Rails Integration)
- Images uploaded to Rails backend with Active Storage
- Stored in cloud storage (S3, etc.)
- Optimized thumbnails and variants
- Efficient delivery via CDN

## Future Rails Integration

See `RAILS_API_STRUCTURE.md` for detailed backend implementation guide including:
- Active Storage configuration
- Image upload endpoints
- Thumbnail generation
- Cloud storage integration

## Development

### Adding New Image Features

1. Update `ImageUpload.js` component for new functionality
2. Extend `imageService.js` for processing logic
3. Update entity display in `EntityList.js`
4. Add validation rules as needed

### Customizing Image Handling

```javascript
// Example: Custom image validation
imageService.validateImage = (file) => {
  const validTypes = ['image/jpeg', 'image/png'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Only JPG and PNG allowed');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
  
  return true;
};
```

## Data Structure (Updated)

### Entity Storage with Images
```javascript
{
  entities: {
    data: {
      products: {
        "uuid-1": { 
          id: "uuid-1", 
          name: "Product 1",
          image: {
            id: "img-1",
            dataUrl: "data:image/jpeg;base64,/9j/4AAQ...",
            name: "product-image.jpg",
            size: 245760,
            uploadStatus: "completed"
          },
          gallery: [
            { id: "img-2", dataUrl: "...", name: "gallery-1.jpg" },
            { id: "img-3", dataUrl: "...", name: "gallery-2.jpg" }
          ]
        }
      }
    }
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Test image upload and display features
5. Submit a pull request

## License

MIT License