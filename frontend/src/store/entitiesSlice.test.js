import { configureStore } from '@reduxjs/toolkit';
import entitiesReducer, { 
  createEntity, 
  updateEntity, 
  deleteEntity,
  deleteEntityAsync,
  setRelationship,
  removeRelationship,
  selectAllEntitiesByType,
  selectEntityById,
  selectRelationships
} from '../store/slices/entitiesSlice';

// Mock the API service to prevent actual network calls
jest.mock('../services/apiService', () => ({
  deleteEntity: jest.fn()
}));

describe('entitiesSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        entities: entitiesReducer,
      },
    });
  });

  describe('Entity Creation and ID Generation', () => {
    test('createEntity should generate valid UUID and set proper timestamps', () => {
      const entityData = { name: 'Test Product', price: 29.99 };
      const action = store.dispatch(createEntity({ 
        entityType: 'products', 
        entityData 
      }));

      const state = store.getState();
      const entities = selectAllEntitiesByType(state, 'products');
      
      expect(entities).toHaveLength(1);
      expect(entities[0].id).toBeDefined();
      expect(entities[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(entities[0].name).toBe('Test Product');
      expect(entities[0].createdAt).toBeDefined();
      expect(entities[0].updatedAt).toBeDefined();
      
      // Ensure the action payload includes the generated ID (critical for relationship bug fix)
      expect(action.payload.id).toBeDefined();
      expect(action.payload.id).toBe(entities[0].id);
    });

    test('createEntity should handle multiple entity types correctly', () => {
      store.dispatch(createEntity({ 
        entityType: 'products', 
        entityData: { name: 'Product 1' }
      }));
      store.dispatch(createEntity({ 
        entityType: 'categories', 
        entityData: { name: 'Category 1' }
      }));

      const state = store.getState();
      expect(selectAllEntitiesByType(state, 'products')).toHaveLength(1);
      expect(selectAllEntitiesByType(state, 'categories')).toHaveLength(1);
    });
  });

  describe('Relationship Management', () => {
    test('setRelationship should create relationships correctly', () => {
      // Create entities first
      const productAction = store.dispatch(createEntity({ 
        entityType: 'products', 
        entityData: { name: 'Test Product' }
      }));
      const categoryAction = store.dispatch(createEntity({ 
        entityType: 'categories', 
        entityData: { name: 'Test Category' }
      }));

      const productId = productAction.payload.id;
      const categoryId = categoryAction.payload.id;

      // Create relationship
      store.dispatch(setRelationship({
        fromType: 'products',
        fromId: productId,
        toType: 'categories',
        toId: categoryId,
        relationshipType: 'category'
      }));

      const state = store.getState();
      const relationships = selectRelationships(state, 'products', productId);
      
      expect(relationships.category).toBeDefined();
      expect(relationships.category).toHaveLength(1);
      expect(relationships.category[0]).toEqual({
        type: 'categories',
        id: categoryId
      });
    });

    test('setRelationship should prevent duplicate relationships', () => {
      const productAction = store.dispatch(createEntity({ 
        entityType: 'products', 
        entityData: { name: 'Test Product' }
      }));
      const categoryAction = store.dispatch(createEntity({ 
        entityType: 'categories', 
        entityData: { name: 'Test Category' }
      }));

      const productId = productAction.payload.id;
      const categoryId = categoryAction.payload.id;

      // Create same relationship twice
      store.dispatch(setRelationship({
        fromType: 'products',
        fromId: productId,
        toType: 'categories',
        toId: categoryId,
        relationshipType: 'category'
      }));
      store.dispatch(setRelationship({
        fromType: 'products',
        fromId: productId,
        toType: 'categories',
        toId: categoryId,
        relationshipType: 'category'
      }));

      const state = store.getState();
      const relationships = selectRelationships(state, 'products', productId);
      
      // Should only have one relationship, not duplicates
      expect(relationships.category).toHaveLength(1);
    });

    test('removeRelationship should remove specific relationships', () => {
      const productAction = store.dispatch(createEntity({ 
        entityType: 'products', 
        entityData: { name: 'Test Product' }
      }));
      const categoryAction = store.dispatch(createEntity({ 
        entityType: 'categories', 
        entityData: { name: 'Test Category' }
      }));

      const productId = productAction.payload.id;
      const categoryId = categoryAction.payload.id;

      // Create and then remove relationship
      store.dispatch(setRelationship({
        fromType: 'products',
        fromId: productId,
        toType: 'categories',
        toId: categoryId,
        relationshipType: 'category'
      }));

      store.dispatch(removeRelationship({
        fromType: 'products',
        fromId: productId,
        toType: 'categories',
        toId: categoryId,
        relationshipType: 'category'
      }));

      const state = store.getState();
      const relationships = selectRelationships(state, 'products', productId);
      
      expect(relationships.category).toHaveLength(0);
    });
  });

  describe('Delete Functionality', () => {
    test('deleteEntity (sync) should remove entity and relationships immediately', () => {
      // Create entity with relationship
      const productAction = store.dispatch(createEntity({ 
        entityType: 'products', 
        entityData: { name: 'Test Product' }
      }));
      const categoryAction = store.dispatch(createEntity({ 
        entityType: 'categories', 
        entityData: { name: 'Test Category' }
      }));

      const productId = productAction.payload.id;
      const categoryId = categoryAction.payload.id;

      store.dispatch(setRelationship({
        fromType: 'products',
        fromId: productId,
        toType: 'categories',
        toId: categoryId,
        relationshipType: 'category'
      }));

      // Verify entity and relationship exist
      let state = store.getState();
      expect(selectEntityById(state, 'products', productId)).toBeDefined();
      expect(selectRelationships(state, 'products', productId).category).toHaveLength(1);

      // Delete entity
      store.dispatch(deleteEntity({ entityType: 'products', entityId: productId }));

      // Verify entity and relationships are removed
      state = store.getState();
      const deletedEntity = selectEntityById(state, 'products', productId);
      expect(deletedEntity).toBeNull(); // Now should return null instead of undefined
      expect(selectRelationships(state, 'products', productId)).toEqual({});
    });

    test('deleteEntityAsync should work even when backend is unavailable', async () => {
      // Mock API to simulate backend failure
      const { deleteEntity: deleteEntityAPI } = require('../services/apiService');
      deleteEntityAPI.mockRejectedValue(new Error('Backend not available'));

      const productAction = store.dispatch(createEntity({ 
        entityType: 'products', 
        entityData: { name: 'Test Product' }
      }));
      const productId = productAction.payload.id;

      // Verify entity exists
      let state = store.getState();
      expect(selectEntityById(state, 'products', productId)).toBeDefined();

      // Delete entity async (should succeed even with backend failure)
      await store.dispatch(deleteEntityAsync({ entityType: 'products', entityId: productId }));

      // Verify entity is removed from store
      state = store.getState();
      expect(selectEntityById(state, 'products', productId)).toBeNull();
    });

    test('deleteEntityAsync should work when backend is available', async () => {
      // Mock API to simulate successful backend response
      const { deleteEntity: deleteEntityAPI } = require('../services/apiService');
      deleteEntityAPI.mockResolvedValue();

      const productAction = store.dispatch(createEntity({ 
        entityType: 'products', 
        entityData: { name: 'Test Product' }
      }));
      const productId = productAction.payload.id;

      // Delete entity async
      await store.dispatch(deleteEntityAsync({ entityType: 'products', entityId: productId }));

      // Verify entity is removed
      const state = store.getState();
      expect(selectEntityById(state, 'products', productId)).toBeNull();
    });
  });

  describe('Entity Updates', () => {
    test('updateEntity should preserve id and update timestamps', () => {
      const productAction = store.dispatch(createEntity({ 
        entityType: 'products', 
        entityData: { name: 'Original Product', price: 10 }
      }));
      const productId = productAction.payload.id;
      const originalCreatedAt = selectEntityById(store.getState(), 'products', productId).createdAt;
      
      store.dispatch(updateEntity({
        entityType: 'products',
        entityId: productId,
        entityData: { name: 'Updated Product', price: 20 }
      }));

      const state = store.getState();
      const updatedEntity = selectEntityById(state, 'products', productId);
      
      expect(updatedEntity.id).toBe(productId);
      expect(updatedEntity.name).toBe('Updated Product');
      expect(updatedEntity.price).toBe(20);
      expect(updatedEntity.createdAt).toBe(originalCreatedAt); // Should preserve original
      expect(updatedEntity.updatedAt).toBeDefined();
    });
  });

  describe('Selectors', () => {
    test('selectAllEntitiesByType should return empty array for non-existent entity type', () => {
      const state = store.getState();
      expect(selectAllEntitiesByType(state, 'nonexistent')).toEqual([]);
    });

    test('selectEntityById should return null for non-existent entity', () => {
      const state = store.getState();
      expect(selectEntityById(state, 'products', 'fake-id')).toBeNull();
    });

    test('selectRelationships should return empty object for non-existent relationships', () => {
      const state = store.getState();
      expect(selectRelationships(state, 'products', 'fake-id')).toEqual({});
    });
  });
});