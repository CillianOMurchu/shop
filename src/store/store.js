import { configureStore } from '@reduxjs/toolkit';
import entitiesReducer from './slices/entitiesSlice';
import schemasReducer from './slices/schemasSlice';

export const store = configureStore({
  reducer: {
    entities: entitiesReducer,
    schemas: schemasReducer,
  },
});

export default store;