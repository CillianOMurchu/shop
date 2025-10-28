import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectSchemaNames } from '../store/slices/schemasSlice';
import { loadEntities } from '../store/slices/entitiesSlice';
import EntityList from './EntityList';
import EntityForm from './EntityForm';
import SchemaManager from './SchemaManager';
import { apiService } from '../services/apiService';
import './AdminInterface.css';

const AdminInterface = () => {
  const dispatch = useDispatch();
  const schemaNames = useSelector(selectSchemaNames);
  
  const [activeTab, setActiveTab] = useState('entities');
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load entities from backend when entity type is selected
  useEffect(() => {
    const loadEntitiesFromBackend = async () => {
      if (!selectedEntityType) return;
      
      setLoading(true);
      try {
        const response = await apiService.getEntities(selectedEntityType);
        const entities = response.data || [];
        
        // Convert array to object format for Redux
        const entitiesObj = {};
        entities.forEach(entity => {
          entitiesObj[entity.id] = entity;
        });
        
        dispatch(loadEntities({ 
          entityType: selectedEntityType, 
          entities: entitiesObj 
        }));
        console.log(`Loaded ${entities.length} entities from backend`);
      } catch (error) {
        console.warn('Backend not available, using local entities only:', error.message);
        // Don't dispatch loadEntities here - let the component show existing local entities
      } finally {
        setLoading(false);
      }
    };

    if (selectedEntityType) {
      loadEntitiesFromBackend();
    }
  }, [selectedEntityType, dispatch]);

  const handleEntitySelect = (entity) => {
    setSelectedEntity(entity);
    setShowForm(true);
  };

  const handleNewEntity = () => {
    setSelectedEntity(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedEntity(null);
  };

  return (
    <div className="admin-interface">
      <header className="admin-header">
        <h1>Generic Admin Interface</h1>
        <nav className="admin-nav">
          <button 
            className={activeTab === 'entities' ? 'active' : ''}
            onClick={() => setActiveTab('entities')}
          >
            Manage Entities
          </button>
          <button 
            className={activeTab === 'schemas' ? 'active' : ''}
            onClick={() => setActiveTab('schemas')}
          >
            Manage Schemas
          </button>
        </nav>
      </header>

      <main className="admin-content">
        {activeTab === 'entities' && (
          <div className="entities-section">
            <div className="entity-type-selector">
              <label htmlFor="entityType">Select Entity Type:</label>
              <select 
                id="entityType"
                value={selectedEntityType} 
                onChange={(e) => setSelectedEntityType(e.target.value)}
              >
                <option value="">Choose an entity type...</option>
                {schemaNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {selectedEntityType && (
              <div className="entity-management">
                <div className="entity-actions">
                  <button 
                    className="btn-primary"
                    onClick={handleNewEntity}
                    disabled={loading}
                  >
                    Create New {selectedEntityType}
                  </button>
                </div>

                {loading ? (
                  <div className="loading">Loading {selectedEntityType} entities...</div>
                ) : (
                  <EntityList 
                    entityType={selectedEntityType}
                    onEntitySelect={handleEntitySelect}
                  />
                )}

                {showForm && (
                  <div className="modal-overlay">
                    <div className="modal">
                      <EntityForm 
                        entityType={selectedEntityType}
                        entity={selectedEntity}
                        onClose={handleFormClose}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'schemas' && (
          <SchemaManager />
        )}
      </main>
    </div>
  );
};

export default AdminInterface;