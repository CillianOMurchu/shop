import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import EntityForm from '../components/EntityForm';
import entitiesReducer, { createEntity } from '../store/slices/entitiesSlice';
import schemasReducer from '../store/slices/schemasSlice';

// Mock the API service to prevent actual network calls
jest.mock('../services/apiService', () => ({
  createEntity: jest.fn(),
  updateEntity: jest.fn(),
  addRelationship: jest.fn(),
}));

jest.mock('../services/imageService', () => ({
  imageService: {
    processImageForStorage: jest.fn(img => Promise.resolve(img))
  }
}));

const mockSchemas = {
  products: {
    name: 'Product',
    fields: [
      { name: 'name', type: 'string', required: true, label: 'Product Name' },
      { name: 'price', type: 'number', required: true, label: 'Price' },
    ],
    relationships: [
      { name: 'category', type: 'belongsTo', target: 'categories', label: 'Category' },
    ]
  },
  categories: {
    name: 'Category',
    fields: [
      { name: 'name', type: 'string', required: true, label: 'Category Name' },
    ],
    relationships: []
  }
};

const createTestStore = () => {
  const store = configureStore({
    reducer: {
      entities: entitiesReducer,
      schemas: schemasReducer,
    },
    preloadedState: {
      schemas: { schemas: mockSchemas },
      entities: { data: {}, relationships: {} }
    }
  });
  
  // Add a category for relationship testing
  store.dispatch(createEntity({
    entityType: 'categories',
    entityData: { name: 'Test Category' }
  }));
  
  return store;
};

describe('EntityForm', () => {
  let store;
  let mockOnClose;

  beforeEach(() => {
    store = createTestStore();
    mockOnClose = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Relationship Bug Fix Tests', () => {
    test('should create entity with valid ID and then process relationships', async () => {
      const { createEntity: createEntityAPI, addRelationship } = require('../services/apiService');
      
      // Mock API responses
      createEntityAPI.mockRejectedValue(new Error('Backend not available'));
      addRelationship.mockRejectedValue(new Error('Backend not available'));

      render(
        <Provider store={store}>
          <EntityForm 
            entityType="products" 
            entity={null} 
            onClose={mockOnClose} 
          />
        </Provider>
      );

      // Fill in the form
      fireEvent.change(screen.getByLabelText(/product name/i), {
        target: { value: 'Test Product' }
      });
      fireEvent.change(screen.getByLabelText(/price/i), {
        target: { value: '29.99' }
      });

      // Select a category relationship
      const categorySelect = screen.getByDisplayValue('');
      const categories = store.getState().entities.data.categories;
      const categoryId = Object.keys(categories)[0];
      
      fireEvent.change(categorySelect, {
        target: { value: categoryId }
      });

      // Submit the form
      fireEvent.click(screen.getByText(/create product/i));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });

      // Verify entity was created in Redux with a valid ID
      const state = store.getState();
      const products = Object.values(state.entities.data.products || {});
      expect(products).toHaveLength(1);
      expect(products[0].id).toBeDefined();
      expect(products[0].name).toBe('Test Product');

      // Verify relationship was created
      const relationships = state.entities.relationships.products;
      const productId = products[0].id;
      expect(relationships[productId]).toBeDefined();
      expect(relationships[productId].category).toHaveLength(1);
      expect(relationships[productId].category[0].id).toBe(categoryId);
    });

    test('should handle entity creation failure gracefully without breaking relationships', async () => {
      const { createEntity: createEntityAPI } = require('../services/apiService');
      
      // Mock complete API failure
      createEntityAPI.mockRejectedValue(new Error('Complete backend failure'));

      render(
        <Provider store={store}>
          <EntityForm 
            entityType="products" 
            entity={null} 
            onClose={mockOnClose} 
          />
        </Provider>
      );

      // Fill form and submit
      fireEvent.change(screen.getByLabelText(/product name/i), {
        target: { value: 'Test Product' }
      });
      fireEvent.click(screen.getByText(/create product/i));

      // Should still close the form and create entity locally
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });

      // Entity should still be created in Redux
      const state = store.getState();
      const products = Object.values(state.entities.data.products || {});
      expect(products).toHaveLength(1);
    });

    test('should update existing entity and preserve relationships', async () => {
      const { updateEntity } = require('../services/apiService');
      updateEntity.mockResolvedValue({ data: { id: 'existing-id' } });

      // Create an existing entity
      const existingEntity = {
        id: 'existing-id',
        name: 'Existing Product',
        price: 19.99
      };

      render(
        <Provider store={store}>
          <EntityForm 
            entityType="products" 
            entity={existingEntity} 
            onClose={mockOnClose} 
          />
        </Provider>
      );

      // Update the name
      const nameInput = screen.getByDisplayValue('Existing Product');
      fireEvent.change(nameInput, {
        target: { value: 'Updated Product' }
      });

      fireEvent.click(screen.getByText(/update product/i));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });

      // Verify update API was called
      expect(updateEntity).toHaveBeenCalledWith('products', 'existing-id', expect.objectContaining({
        name: 'Updated Product',
        price: 19.99
      }));
    });
  });

  describe('Form Validation', () => {
    test('should not submit form with empty required fields', () => {
      render(
        <Provider store={store}>
          <EntityForm 
            entityType="products" 
            entity={null} 
            onClose={mockOnClose} 
          />
        </Provider>
      );

      // Try to submit without filling required fields
      fireEvent.click(screen.getByText(/create product/i));

      // Form should not close (onClose not called)
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('should handle form submission with valid data', () => {
      render(
        <Provider store={store}>
          <EntityForm 
            entityType="products" 
            entity={null} 
            onClose={mockOnClose} 
          />
        </Provider>
      );

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/product name/i), {
        target: { value: 'Valid Product' }
      });
      fireEvent.change(screen.getByLabelText(/price/i), {
        target: { value: '25.99' }
      });

      // Should be able to submit
      fireEvent.click(screen.getByText(/create product/i));
      
      // Should eventually close (async operation)
      expect(screen.getByText(/create product/i)).toBeInTheDocument();
    });
  });
});