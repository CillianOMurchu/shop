import { createSlice } from '@reduxjs/toolkit';

// Schema definitions for different entity types
const initialState = {
  schemas: {
    // Example schema structures - these can be dynamically added
    product: {
      name: 'Product',
      fields: [
        { name: 'name', type: 'string', required: true, label: 'Product Name' },
        { name: 'description', type: 'text', required: false, label: 'Description' },
        { name: 'price', type: 'number', required: true, label: 'Price' },
        { name: 'image', type: 'image', required: false, label: 'Product Image' },
        { name: 'gallery', type: 'image_gallery', required: false, label: 'Image Gallery' },
        { name: 'active', type: 'boolean', required: false, label: 'Active', default: true },
      ],
      relationships: [
        { name: 'category', type: 'belongsTo', target: 'category', label: 'Category' },
        { name: 'tags', type: 'hasMany', target: 'tag', label: 'Tags' },
      ]
    },
    category: {
      name: 'Category',
      fields: [
        { name: 'name', type: 'string', required: true, label: 'Category Name' },
        { name: 'description', type: 'text', required: false, label: 'Description' },
        { name: 'image', type: 'image', required: false, label: 'Category Image' },
        { name: 'active', type: 'boolean', required: false, label: 'Active', default: true },
      ],
      relationships: [
        { name: 'parent', type: 'belongsTo', target: 'category', label: 'Parent Category' },
        { name: 'products', type: 'hasMany', target: 'product', label: 'Products' },
      ]
    },
    tag: {
      name: 'Tag',
      fields: [
        { name: 'name', type: 'string', required: true, label: 'Tag Name' },
        { name: 'color', type: 'string', required: false, label: 'Color' },
      ],
      relationships: [
        { name: 'products', type: 'hasMany', target: 'product', label: 'Products' },
      ]
    }
  }
};

const schemasSlice = createSlice({
  name: 'schemas',
  initialState,
  reducers: {
    addSchema: (state, action) => {
      const { schemaName, schema } = action.payload;
      state.schemas[schemaName] = schema;
    },
    
    updateSchema: (state, action) => {
      const { schemaName, schema } = action.payload;
      if (state.schemas[schemaName]) {
        state.schemas[schemaName] = { ...state.schemas[schemaName], ...schema };
      }
    },
    
    removeSchema: (state, action) => {
      const { schemaName } = action.payload;
      delete state.schemas[schemaName];
    },
    
    addFieldToSchema: (state, action) => {
      const { schemaName, field } = action.payload;
      if (state.schemas[schemaName]) {
        state.schemas[schemaName].fields.push(field);
      }
    },
    
    removeFieldFromSchema: (state, action) => {
      const { schemaName, fieldName } = action.payload;
      if (state.schemas[schemaName]) {
        state.schemas[schemaName].fields = state.schemas[schemaName].fields.filter(
          field => field.name !== fieldName
        );
      }
    },
  },
});

export const {
  addSchema,
  updateSchema,
  removeSchema,
  addFieldToSchema,
  removeFieldFromSchema,
} = schemasSlice.actions;

// Selectors
export const selectAllSchemas = (state) => state.schemas.schemas;
export const selectSchemaByName = (state, schemaName) => state.schemas.schemas[schemaName];
export const selectSchemaNames = (state) => Object.keys(state.schemas.schemas);

export default schemasSlice.reducer;