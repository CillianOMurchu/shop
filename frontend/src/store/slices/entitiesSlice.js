import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { deleteEntity as deleteEntityAPI } from '../../services/apiService';

// Async thunk for deleting entity via API
export const deleteEntityAsync = createAsyncThunk(
  'entities/deleteEntityAsync',
  async ({ entityType, entityId }, { rejectWithValue }) => {
    try {
      await deleteEntityAPI(entityType, entityId);
      console.log('Entity deleted from backend successfully');
      return { entityType, entityId };
    } catch (error) {
      console.warn('Backend not available for deletion, deleting locally only:', error.message);
      // Still return success payload so the entity is deleted locally
      return { entityType, entityId };
    }
  }
);

const initialState = {
  // Structure: { entityType: { entityId: entityData } }
  data: {},
  // Keep track of relationships between entities
  relationships: {},
};

const entitiesSlice = createSlice({
  name: 'entities',
  initialState,
  reducers: {
    createEntity: {
      reducer: (state, action) => {
        const { entityType, entityData, id } = action.payload;
        
        if (!state.data[entityType]) {
          state.data[entityType] = {};
        }
        
        state.data[entityType][id] = {
          id,
          ...entityData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      },
      prepare: (payload) => {
        const id = uuidv4();
        return {
          payload: {
            ...payload,
            id
          }
        };
      }
    },
    
    updateEntity: (state, action) => {
      const { entityType, entityId, entityData } = action.payload;
      
      if (state.data[entityType] && state.data[entityType][entityId]) {
        state.data[entityType][entityId] = {
          ...state.data[entityType][entityId],
          ...entityData,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    
    deleteEntity: (state, action) => {
      const { entityType, entityId } = action.payload;
      
      if (state.data[entityType] && state.data[entityType][entityId]) {
        delete state.data[entityType][entityId];
        
        // Clean up relationships
        if (state.relationships[entityType] && state.relationships[entityType][entityId]) {
          delete state.relationships[entityType][entityId];
        }
      }
    },
    
    setRelationship: (state, action) => {
      const { fromType, fromId, toType, toId, relationshipType } = action.payload;
      
      if (!state.relationships[fromType]) {
        state.relationships[fromType] = {};
      }
      
      if (!state.relationships[fromType][fromId]) {
        state.relationships[fromType][fromId] = {};
      }
      
      if (!state.relationships[fromType][fromId][relationshipType]) {
        state.relationships[fromType][fromId][relationshipType] = [];
      }
      
      // Add relationship if it doesn't exist
      const relationship = { type: toType, id: toId };
      const exists = state.relationships[fromType][fromId][relationshipType].some(
        rel => rel.type === toType && rel.id === toId
      );
      
      if (!exists) {
        state.relationships[fromType][fromId][relationshipType].push(relationship);
      }
    },
    
    removeRelationship: (state, action) => {
      const { fromType, fromId, toType, toId, relationshipType } = action.payload;
      
      if (state.relationships[fromType] && 
          state.relationships[fromType][fromId] && 
          state.relationships[fromType][fromId][relationshipType]) {
        
        state.relationships[fromType][fromId][relationshipType] = 
          state.relationships[fromType][fromId][relationshipType].filter(
            rel => !(rel.type === toType && rel.id === toId)
          );
      }
    },
    
    loadEntities: (state, action) => {
      // For future API integration
      const { entityType, entities } = action.payload;
      state.data[entityType] = entities;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteEntityAsync.fulfilled, (state, action) => {
        const { entityType, entityId } = action.payload;
        
        if (state.data[entityType] && state.data[entityType][entityId]) {
          delete state.data[entityType][entityId];
          
          // Clean up relationships
          if (state.relationships[entityType] && state.relationships[entityType][entityId]) {
            delete state.relationships[entityType][entityId];
          }
        }
      })
      .addCase(deleteEntityAsync.rejected, (state, action) => {
        console.error('Failed to delete entity:', action.payload);
      });
  },
});

export const {
  createEntity,
  updateEntity,
  deleteEntity,
  setRelationship,
  removeRelationship,
  loadEntities,
} = entitiesSlice.actions;

// Selectors
export const selectAllEntitiesByType = (state, entityType) => 
  state.entities.data[entityType] ? Object.values(state.entities.data[entityType]) : [];

export const selectEntityById = (state, entityType, entityId) => 
  state.entities.data[entityType] ? (state.entities.data[entityType][entityId] || null) : null;

export const selectEntityTypes = (state) => Object.keys(state.entities.data);

export const selectRelationships = (state, entityType, entityId) => 
  state.entities.relationships[entityType] ? (state.entities.relationships[entityType][entityId] || {}) : {};

export default entitiesSlice.reducer;