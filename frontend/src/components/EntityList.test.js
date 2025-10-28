import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import EntityList from '../components/EntityList';
import entitiesReducer, { createEntity } from '../store/slices/entitiesSlice';

// Mock the API service
jest.mock('../services/apiService', () => ({
  deleteEntity: jest.fn()
}));

// Mock window.confirm to avoid blocking tests
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', { value: mockConfirm });

const createTestStore = () => {
  return configureStore({
    reducer: {
      entities: entitiesReducer,
    },
  });
};

describe('EntityList', () => {
  let store;
  let mockOnEntitySelect;

  beforeEach(() => {
    store = createTestStore();
    mockOnEntitySelect = jest.fn();
    mockConfirm.mockClear();
    jest.clearAllMocks();
  });

  describe('Delete Functionality', () => {
    test('should instantly remove entity from list when delete is confirmed', async () => {
      const { deleteEntity } = require('../services/apiService');
      deleteEntity.mockRejectedValue(new Error('Backend not available')); // Simulate no backend
      mockConfirm.mockReturnValue(true); // User confirms deletion

      // Create test entities
      store.dispatch(createEntity({
        entityType: 'products',
        entityData: { name: 'Product 1', price: 10 }
      }));
      store.dispatch(createEntity({
        entityType: 'products',
        entityData: { name: 'Product 2', price: 20 }
      }));

      const { rerender } = render(
        <Provider store={store}>
          <EntityList 
            entityType="products"
            onEntitySelect={mockOnEntitySelect}
          />
        </Provider>
      );

      // Verify both entities are displayed
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();

      // Find and click delete button for first product
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      // Verify confirmation was asked
      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this entity?');

      // Re-render to reflect store changes
      rerender(
        <Provider store={store}>
          <EntityList 
            entityType="products"
            onEntitySelect={mockOnEntitySelect}
          />
        </Provider>
      );

      // Wait for the entity to be removed from the list
      await waitFor(() => {
        expect(screen.queryByText('Product 1')).not.toBeInTheDocument();
      });

      // Verify the other entity is still there
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });

    test('should not remove entity when deletion is cancelled', () => {
      mockConfirm.mockReturnValue(false); // User cancels deletion

      // Create test entity
      store.dispatch(createEntity({
        entityType: 'products',
        entityData: { name: 'Product 1', price: 10 }
      }));

      render(
        <Provider store={store}>
          <EntityList 
            entityType="products"
            onEntitySelect={mockOnEntitySelect}
          />
        </Provider>
      );

      // Try to delete
      fireEvent.click(screen.getByText('Delete'));

      // Verify confirmation was asked
      expect(mockConfirm).toHaveBeenCalled();

      // Entity should still be there
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    test('should show empty state when no entities exist', () => {
      render(
        <Provider store={store}>
          <EntityList 
            entityType="products"
            onEntitySelect={mockOnEntitySelect}
          />
        </Provider>
      );

      expect(screen.getByText(/no products entities found/i)).toBeInTheDocument();
      expect(screen.getByText(/create one to get started/i)).toBeInTheDocument();
    });
  });

  describe('Entity Display', () => {
    test('should display entity information correctly', () => {
      store.dispatch(createEntity({
        entityType: 'products',
        entityData: { 
          name: 'Test Product',
          description: 'A test product',
          price: 29.99 
        }
      }));

      render(
        <Provider store={store}>
          <EntityList 
            entityType="products"
            onEntitySelect={mockOnEntitySelect}
          />
        </Provider>
      );

      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText(/created:/i)).toBeInTheDocument();
      expect(screen.getByText(/updated:/i)).toBeInTheDocument();
    });

    test('should call onEntitySelect when edit button is clicked', () => {
      const entityAction = store.dispatch(createEntity({
        entityType: 'products',
        entityData: { name: 'Test Product' }
      }));

      render(
        <Provider store={store}>
          <EntityList 
            entityType="products"
            onEntitySelect={mockOnEntitySelect}
          />
        </Provider>
      );

      fireEvent.click(screen.getByText('Edit'));

      expect(mockOnEntitySelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: entityAction.payload.id,
          name: 'Test Product'
        })
      );
    });
  });
});