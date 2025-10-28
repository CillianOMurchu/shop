import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectSchemaNames } from '../store/slices/schemasSlice';
import EntityList from './EntityList';
import EntityForm from './EntityForm';
import SchemaManager from './SchemaManager';
import './AdminInterface.css';

const AdminInterface = () => {
  const schemaNames = useSelector(selectSchemaNames);
  
  const [activeTab, setActiveTab] = useState('entities');
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showForm, setShowForm] = useState(false);

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
                  >
                    Create New {selectedEntityType}
                  </button>
                </div>

                <EntityList 
                  entityType={selectedEntityType}
                  onEntitySelect={handleEntitySelect}
                />

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