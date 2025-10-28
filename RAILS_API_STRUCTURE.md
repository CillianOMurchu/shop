# Rails API Structure for Generic CRUD System

This document outlines the expected Rails API structure to work with the frontend Redux store.

## Base URL Structure
```
/api/v1/
```

## Generic Entity Endpoints

### List Entities
```
GET /api/v1/{entity_type}
```
Example: `GET /api/v1/products`

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "description": "Product description",
      "price": 29.99,
      "active": true,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

### Get Single Entity
```
GET /api/v1/{entity_type}/{id}
```

### Create Entity
```
POST /api/v1/{entity_type}
Content-Type: application/json

{
  "product": {
    "name": "New Product",
    "description": "Description",
    "price": 19.99,
    "active": true
  }
}
```

### Update Entity
```
PATCH /api/v1/{entity_type}/{id}
Content-Type: application/json

{
  "product": {
    "name": "Updated Product Name",
    "price": 25.99
  }
}
```

### Delete Entity
```
DELETE /api/v1/{entity_type}/{id}
```

## Relationship Management

### Add Relationship
```
POST /api/v1/{entity_type}/{id}/relationships
Content-Type: application/json

{
  "relationship": {
    "type": "category",
    "target_type": "category",
    "target_id": "category-uuid"
  }
}
```

### Remove Relationship
```
DELETE /api/v1/{entity_type}/{id}/relationships/{relationship_type}
Content-Type: application/json

{
  "target_type": "category",
  "target_id": "category-uuid"
}
```

## Schema Management

### Get All Schemas
```
GET /api/v1/schemas
```

Response:
```json
{
  "schemas": {
    "product": {
      "name": "Product",
      "fields": [
        {
          "name": "name",
          "type": "string",
          "required": true,
          "label": "Product Name"
        },
        {
          "name": "price",
          "type": "number",
          "required": true,
          "label": "Price"
        }
      ],
      "relationships": [
        {
          "name": "category",
          "type": "belongsTo",
          "target": "category",
          "label": "Category"
        }
      ]
    }
  }
}
```

### Create Schema
```
POST /api/v1/schemas
Content-Type: application/json

{
  "schema": {
    "name": "Product",
    "fields": [...],
    "relationships": [...]
  }
}
```

### Update Schema
```
PATCH /api/v1/schemas/{schema_name}
```

## Rails Implementation Notes

### Models
Create a generic `Entity` model or use STI (Single Table Inheritance):

```ruby
# app/models/entity.rb
class Entity < ApplicationRecord
  self.inheritance_column = :entity_type
  
  # Generic JSON field for flexible attributes
  serialize :attributes, JSON
  
  # Relationships
  has_many :entity_relationships, foreign_key: :from_entity_id, dependent: :destroy
  has_many :related_entities, through: :entity_relationships, source: :to_entity
end

# app/models/entity_relationship.rb
class EntityRelationship < ApplicationRecord
  belongs_to :from_entity, class_name: 'Entity'
  belongs_to :to_entity, class_name: 'Entity'
  
  validates :relationship_type, presence: true
end

# app/models/schema.rb
class Schema < ApplicationRecord
  validates :name, presence: true, uniqueness: true
  
  serialize :fields, JSON
  serialize :relationships, JSON
end
```

### Controllers
Use a generic controller approach:

```ruby
# app/controllers/api/v1/entities_controller.rb
class Api::V1::EntitiesController < ApplicationController
  before_action :set_entity_type
  before_action :set_entity, only: [:show, :update, :destroy]
  
  def index
    @entities = Entity.where(entity_type: @entity_type)
    render json: { data: @entities }
  end
  
  def show
    render json: { data: @entity }
  end
  
  def create
    @entity = Entity.new(entity_params.merge(entity_type: @entity_type))
    
    if @entity.save
      render json: { data: @entity }, status: :created
    else
      render json: { errors: @entity.errors }, status: :unprocessable_entity
    end
  end
  
  def update
    if @entity.update(entity_params)
      render json: { data: @entity }
    else
      render json: { errors: @entity.errors }, status: :unprocessable_entity
    end
  end
  
  def destroy
    @entity.destroy
    head :no_content
  end
  
  private
  
  def set_entity_type
    @entity_type = params[:entity_type] || controller_name.singularize
  end
  
  def set_entity
    @entity = Entity.find(params[:id])
  end
  
  def entity_params
    # Dynamic parameter filtering based on schema
    permitted_params = get_permitted_params_for_entity_type(@entity_type)
    params.require(@entity_type.singularize.to_sym).permit(permitted_params)
  end
  
  def get_permitted_params_for_entity_type(entity_type)
    schema = Schema.find_by(name: entity_type.downcase)
    return [] unless schema
    
    schema.fields.map { |field| field['name'].to_sym }
  end
end
```

### Routes
```ruby
# config/routes.rb
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :schemas
      
      # Dynamic routes for any entity type
      scope '/:entity_type' do
        get '/', to: 'entities#index'
        post '/', to: 'entities#create'
        get '/:id', to: 'entities#show'
        patch '/:id', to: 'entities#update'
        delete '/:id', to: 'entities#destroy'
        
        # Relationship routes
        scope '/:id/relationships' do
          post '/', to: 'relationships#create'
          delete '/:relationship_type', to: 'relationships#destroy'
        end
      end
    end
  end
end
```

## Database Schema

```ruby
# db/migrate/create_entities.rb
class CreateEntities < ActiveRecord::Migration[7.0]
  def change
    create_table :entities, id: :uuid do |t|
      t.string :entity_type, null: false
      t.string :name
      t.json :attributes, default: {}
      t.timestamps
    end
    
    add_index :entities, :entity_type
    add_index :entities, [:entity_type, :name]
  end
end

# db/migrate/create_entity_relationships.rb
class CreateEntityRelationships < ActiveRecord::Migration[7.0]
  def change
    create_table :entity_relationships, id: :uuid do |t|
      t.references :from_entity, null: false, foreign_key: { to_table: :entities }, type: :uuid
      t.references :to_entity, null: false, foreign_key: { to_table: :entities }, type: :uuid
      t.string :relationship_type, null: false
      t.timestamps
    end
    
    add_index :entity_relationships, [:from_entity_id, :relationship_type]
    add_index :entity_relationships, [:to_entity_id, :relationship_type]
  end
end

# db/migrate/create_schemas.rb
class CreateSchemas < ActiveRecord::Migration[7.0]
  def change
    create_table :schemas, id: :uuid do |t|
      t.string :name, null: false
      t.json :fields, default: []
      t.json :relationships, default: []
      t.timestamps
    end
    
    add_index :schemas, :name, unique: true
  end
end
```

This structure provides:
1. Complete CRUD operations for any entity type
2. Dynamic schema management
3. Flexible relationship handling
4. Rails conventions (singular parameter keys, REST endpoints)
5. UUID support for better frontend integration
6. JSON serialization for flexible attributes
7. **Image upload and management system**

## Image Upload System

### Frontend Image Handling
The frontend stores images as base64 data URLs in Redux for development. In production, images would be uploaded to the Rails backend.

### Rails Image Upload Implementation

#### Additional Routes
```ruby
# config/routes.rb
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # ... existing routes ...
      
      # Image upload routes
      namespace :uploads do
        resources :images, only: [:create, :show, :destroy] do
          collection do
            post :batch  # For multiple image uploads
          end
        end
      end
    end
  end
end
```

#### Upload Model
```ruby
# app/models/upload.rb
class Upload < ApplicationRecord
  has_one_attached :file
  
  validates :name, presence: true
  validates :file, presence: true, blob: { content_type: ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'] }
  
  def url
    Rails.application.routes.url_helpers.rails_blob_url(file, only_path: false)
  end
  
  def thumbnail_url(size = '150x150')
    Rails.application.routes.url_helpers.rails_representation_url(
      file.variant(resize_to_fill: size.split('x').map(&:to_i)), 
      only_path: false
    )
  end
  
  def as_json(options = {})
    {
      id: id,
      name: name,
      size: file.byte_size,
      url: url,
      thumbnail_url: thumbnail_url,
      content_type: file.content_type,
      uploaded_at: created_at
    }
  end
end
```

#### Upload Controller
```ruby
# app/controllers/api/v1/uploads/images_controller.rb
class Api::V1::Uploads::ImagesController < ApplicationController
  before_action :set_upload, only: [:show, :destroy]
  
  def create
    @upload = Upload.new(upload_params)
    @upload.file.attach(params[:image]) if params[:image]
    
    if @upload.save
      render json: @upload.as_json, status: :created
    else
      render json: { errors: @upload.errors }, status: :unprocessable_entity
    end
  end
  
  def batch
    uploads = []
    errors = []
    
    params[:images]&.each_with_index do |image_param, index|
      upload = Upload.new(name: image_param.original_filename)
      upload.file.attach(image_param)
      
      if upload.save
        uploads << upload.as_json
      else
        errors << { index: index, errors: upload.errors }
      end
    end
    
    render json: { uploads: uploads, errors: errors }
  end
  
  def show
    render json: @upload.as_json
  end
  
  def destroy
    @upload.destroy
    head :no_content
  end
  
  private
  
  def set_upload
    @upload = Upload.find(params[:id])
  end
  
  def upload_params
    params.permit(:name)
  end
end
```

#### Database Migration
```ruby
# db/migrate/create_uploads.rb
class CreateUploads < ActiveRecord::Migration[7.0]
  def change
    create_table :uploads, id: :uuid do |t|
      t.string :name, null: false
      t.text :description
      t.timestamps
    end
    
    add_index :uploads, :name
  end
end
```

#### Entity Image References
Update the entity attributes to store image references:

```ruby
# In your entity creation/update
def entity_params_with_images
  params = base_entity_params
  
  # Handle single image fields
  if params[:image_id].present?
    upload = Upload.find_by(id: params[:image_id])
    params[:image] = upload&.as_json
  end
  
  # Handle gallery fields
  if params[:gallery_ids].present?
    uploads = Upload.where(id: params[:gallery_ids])
    params[:gallery] = uploads.map(&:as_json)
  end
  
  params.except(:image_id, :gallery_ids)
end
```

#### Active Storage Configuration
```ruby
# config/storage.yml
local:
  service: Disk
  root: <%= Rails.root.join("storage") %>

# For production
amazon:
  service: S3
  access_key_id: <%= Rails.application.credentials.dig(:aws, :access_key_id) %>
  secret_access_key: <%= Rails.application.credentials.dig(:aws, :secret_access_key) %>
  region: us-east-1
  bucket: your-bucket-name

# config/environments/production.rb
config.active_storage.variant_processor = :mini_magick
config.active_storage.service = :amazon
```

### Frontend API Integration Updates

When ready to integrate with Rails backend, update the `apiService.js`:

```javascript
// In createEntity and updateEntity methods
async createEntity(entityType, data) {
  // Process image uploads first
  const processedData = await this.processImagesForUpload(data);
  
  return this.request(`/${entityType}`, {
    method: 'POST',
    body: JSON.stringify({ [entityType.slice(0, -1)]: processedData }),
  });
}

async processImagesForUpload(data) {
  const processedData = { ...data };
  
  for (const [key, value] of Object.entries(data)) {
    // Handle single image
    if (value && value.file && value.dataUrl) {
      const uploadResult = await this.uploadImage(value);
      processedData[`${key}_id`] = uploadResult.id;
      delete processedData[key];
    }
    
    // Handle image gallery
    if (Array.isArray(value) && value[0]?.file) {
      const uploadResults = await this.uploadMultipleImages(value);
      processedData[`${key}_ids`] = uploadResults.map(r => r.id);
      delete processedData[key];
    }
  }
  
  return processedData;
}
```