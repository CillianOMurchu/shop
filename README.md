# Generic CRUD Admin Interface

A scalable, ultra-simple Redux-based frontend for managing any type of entity with relationships. Built with React and Redux Toolkit.

## Features

- **Generic Entity Management**: Create, read, update, and delete any type of entity
- **Dynamic Schema System**: Define custom entity types with fields and relationships
- **Relationship Management**: Handle belongsTo and hasMany relationships between entities
- **Scalable Architecture**: Built for future expansion and Rails backend integration
- **Admin Interface**: Clean, responsive UI for managing entities and schemas

## Quick Start

```bash
npm install
npm start
```

Visit `http://localhost:3000` to access the admin interface.

## Architecture Overview

### Redux Store Structure

The application uses Redux Toolkit with two main slices:

1. **Entities Slice** (`src/store/slices/entitiesSlice.js`)
   - Manages all entity data in a normalized structure
   - Handles CRUD operations
   - Manages relationships between entities

2. **Schemas Slice** (`src/store/slices/schemasSlice.js`)
   - Defines entity types and their fields
   - Manages relationship definitions
   - Provides metadata for dynamic form generation

### Components

- **AdminInterface** (`src/components/AdminInterface.js`)
  - Main admin dashboard
  - Entity type selection
  - Navigation between entity management and schema management

- **EntityList** (`src/components/EntityList.js`)
  - Displays entities of a selected type
  - Provides edit and delete actions

- **EntityForm** (`src/components/EntityForm.js`)
  - Dynamic form generation based on schema
  - Handles create and update operations
  - Relationship management interface

- **SchemaManager** (`src/components/SchemaManager.js`)
  - Create and manage entity schemas
  - Add fields to existing schemas
  - Define relationships between entity types

### API Service

The `apiService` (`src/services/apiService.js`) is prepared for Rails backend integration with:
- RESTful API conventions
- CSRF token handling
- Generic CRUD operations
- Relationship management endpoints

## Default Entity Types

The system comes with three predefined schemas:

1. **Product**
   - Fields: name, description, price, active
   - Relationships: belongsTo category, hasMany tags

2. **Category**
   - Fields: name, description, active
   - Relationships: belongsTo parent category, hasMany products

3. **Tag**
   - Fields: name, color
   - Relationships: hasMany products

## Usage Guide

### Managing Entities

1. Select "Manage Entities" tab
2. Choose an entity type from the dropdown
3. Click "Create New" to add entities
4. Use "Edit" and "Delete" buttons on entity cards

### Managing Schemas

1. Select "Manage Schemas" tab
2. Create new schemas by entering a name
3. Add fields to existing schemas
4. View field and relationship definitions

### Creating Custom Entity Types

Example: Creating a "Customer" entity type

1. Go to Schema Manager
2. Create new schema named "Customer"
3. Add fields:
   - `email` (string, required)
   - `phone` (string)
   - `active` (boolean, default: true)
4. Add relationships if needed
5. Switch to Entity Management to start creating customers

## Field Types

- **string**: Text input
- **text**: Textarea for longer content
- **number**: Numeric input
- **boolean**: Checkbox
- **date**: Date picker (future enhancement)

## Relationship Types

- **belongsTo**: One-to-one or many-to-one relationship
- **hasMany**: One-to-many relationship

## Future Rails Integration

See `RAILS_API_STRUCTURE.md` for detailed backend implementation guide.

The frontend is designed to work seamlessly with Rails API endpoints:
- RESTful routes (`GET /api/v1/products`, etc.)
- JSON API conventions
- CSRF token support
- Dynamic schema management

## Development

### Adding New Field Types

1. Update the `fieldTypes` array in `SchemaManager.js`
2. Add rendering logic in `EntityForm.js` `renderField()` method
3. Update validation if needed

### Extending Relationships

1. Add new relationship types to schema definitions
2. Update `EntityForm.js` relationship rendering
3. Implement backend relationship handling

### Customizing UI

Styles are in `src/components/AdminInterface.css` with:
- Responsive design
- Clean, modern interface
- Easily customizable variables

## Data Structure

### Entity Storage
```javascript
{
  entities: {
    data: {
      products: {
        "uuid-1": { id: "uuid-1", name: "Product 1", ... },
        "uuid-2": { id: "uuid-2", name: "Product 2", ... }
      },
      categories: { ... }
    },
    relationships: {
      products: {
        "uuid-1": {
          category: [{ type: "category", id: "cat-uuid" }],
          tags: [{ type: "tag", id: "tag-uuid-1" }, ...]
        }
      }
    }
  }
}
```

### Schema Structure
```javascript
{
  schemas: {
    product: {
      name: "Product",
      fields: [
        { name: "name", type: "string", required: true, label: "Name" }
      ],
      relationships: [
        { name: "category", type: "belongsTo", target: "category" }
      ]
    }
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

