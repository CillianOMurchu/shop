import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAllEntitiesByType } from '../store/slices/entitiesSlice';
import { deleteEntity } from '../store/slices/entitiesSlice';

const EntityList = ({ entityType, onEntitySelect }) => {
  const dispatch = useDispatch();
  const entities = useSelector(state => selectAllEntitiesByType(state, entityType));

  const handleDelete = (entityId) => {
    if (window.confirm('Are you sure you want to delete this entity?')) {
      dispatch(deleteEntity({ entityType, entityId }));
    }
  };

  if (!entities.length) {
    return (
      <div className="entity-list empty">
        <p>No {entityType} entities found. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="entity-list">
      <h3>{entityType} List</h3>
      <div className="entity-grid">
        {entities.map(entity => {
          // Helper function to render entity images
          const renderEntityImage = () => {
            if (entity.image && entity.image.dataUrl) {
              return (
                <img 
                  src={entity.image.dataUrl} 
                  alt={entity.name || 'Entity'} 
                  className="entity-image"
                />
              );
            }
            return null;
          };

          const renderEntityGallery = () => {
            if (entity.gallery && Array.isArray(entity.gallery) && entity.gallery.length > 0) {
              return (
                <div className="entity-gallery">
                  {entity.gallery.slice(0, 3).map((img, index) => (
                    <img 
                      key={index}
                      src={img.dataUrl} 
                      alt={`Gallery item ${index + 1}`}
                    />
                  ))}
                  {entity.gallery.length > 3 && (
                    <div className="gallery-count">
                      +{entity.gallery.length - 3}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          };

          return (
            <div key={entity.id} className="entity-card">
              <div className="entity-info">
                {renderEntityImage()}
                {renderEntityGallery()}
                <h4>{entity.name || entity.title || `${entityType} #${entity.id.slice(0, 8)}`}</h4>
                <p className="entity-meta">
                  Created: {new Date(entity.createdAt).toLocaleDateString()}
                </p>
                <p className="entity-meta">
                  Updated: {new Date(entity.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="entity-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => onEntitySelect(entity)}
                >
                  Edit
                </button>
                <button 
                  className="btn-danger"
                  onClick={() => handleDelete(entity.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EntityList;