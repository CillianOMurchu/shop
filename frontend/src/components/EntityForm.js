import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectSchemaByName } from '../store/slices/schemasSlice';
import { selectAllEntitiesByType } from '../store/slices/entitiesSlice';
import { createEntity, updateEntity, setRelationship } from '../store/slices/entitiesSlice';
import ImageUpload from './ImageUpload';
import { imageService } from '../services/imageService';
import { apiService } from '../services/apiService';

const EntityForm = ({ entityType, entity, onClose }) => {
  const dispatch = useDispatch();
  const schema = useSelector(state => selectSchemaByName(state, entityType));
  
  const [formData, setFormData] = useState({});
  const [relationships, setRelationships] = useState({});

  useEffect(() => {
    console.log('EntityForm useEffect triggered', { entity, schema }); // Debug log
    if (entity) {
      console.log('Setting form data from entity:', entity); // Debug log
      setFormData(entity);
      // TODO: Load existing relationships - temporarily disabled to fix input issue
    } else {
      // Initialize with default values
      const initialData = {};
      schema?.fields.forEach(field => {
        if (field.default !== undefined) {
          initialData[field.name] = field.default;
        }
      });
      console.log('Setting initial form data:', initialData); // Debug log
      setFormData(initialData);
    }
    setRelationships({}); // Reset relationships for now
  }, [entity, schema]);

  const handleFieldChange = (fieldName, value) => {
    console.log('Field change:', fieldName, value); // Debug log
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleRelationshipChange = (relationshipName, targetType, selectedIds) => {
    setRelationships(prev => ({
      ...prev,
      [relationshipName]: { targetType, selectedIds }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Process images before saving
    const processedFormData = { ...formData };
    
    // Process single images
    for (const [fieldName, value] of Object.entries(formData)) {
      if (value && typeof value === 'object' && value.dataUrl) {
        try {
          processedFormData[fieldName] = await imageService.processImageForStorage(value);
        } catch (error) {
          console.error('Failed to process image:', error);
        }
      }
      
      // Process image galleries
      if (Array.isArray(value) && value.length > 0 && value[0].dataUrl) {
        try {
          const processedImages = await Promise.all(
            value.map(img => imageService.processImageForStorage(img))
          );
          processedFormData[fieldName] = processedImages;
        } catch (error) {
          console.error('Failed to process gallery images:', error);
        }
      }
    }
    
    try {
      let apiResponse;
      let entityId;
      let entityResult;
      
      if (entity) {
        // Update existing entity
        entityId = entity.id;
        try {
          apiResponse = await apiService.updateEntity(entityType, entity.id, processedFormData);
        } catch (error) {
          console.warn('Backend not available, updating locally:', error.message);
        }
        
        // Update Redux state
        dispatch(updateEntity({ 
          entityType, 
          entityId: entity.id, 
          entityData: processedFormData 
        }));
      } else {
        // Create new entity - first create in Redux to get the ID
        entityResult = dispatch(createEntity({ 
          entityType, 
          entityData: processedFormData 
        }));
        entityId = entityResult.payload.id;
        
        // Try to sync with backend if available
        try {
          apiResponse = await apiService.createEntity(entityType, processedFormData);
          console.log('Entity synced with backend:', apiResponse);
        } catch (error) {
          console.warn('Backend not available, entity created locally only:', error.message);
        }
      }

      // Handle relationships with the correct entity ID (only if we have relationships to process)
      if (Object.keys(relationships).length > 0 && entityId) {
        console.log('Processing relationships:', relationships, 'for entity:', entityId);
        for (const [relationshipName, { targetType, selectedIds }] of Object.entries(relationships)) {
          for (const targetId of selectedIds) {
            try {
              // Try to save relationship to backend
              console.log(`Attempting to create relationship: ${entityType}[${entityId}] -> ${relationshipName} -> ${targetType}[${targetId}]`);
              await apiService.addRelationship(entityType, entityId, relationshipName, targetType, targetId);
              console.log('Relationship synced with backend');
            } catch (error) {
              console.warn('Backend not available for relationships, saving locally only:', error.message);
            }
            
            // Always update Redux state regardless of backend availability
            dispatch(setRelationship({
              fromType: entityType,
              fromId: entityId,
              toType: targetType,
              toId: targetId,
              relationshipType: relationshipName
            }));
            console.log('Relationship saved to Redux store');
          }
        }
      } else if (Object.keys(relationships).length > 0) {
        console.error('Cannot create relationships: entityId is missing', { entityId, relationships });
      }

      onClose();
    } catch (error) {
      console.error('Failed to save entity:', error);
      alert('Failed to save entity. Please try again.');
    }
  };

  const renderField = (field) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'string':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
          />
        );
      
      case 'text':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            rows={4}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value))}
            required={field.required}
          />
        );
      
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
          />
        );
      
      case 'image':
        return (
          <ImageUpload
            value={value}
            onChange={(imageData) => handleFieldChange(field.name, imageData)}
            multiple={false}
            label={`Upload ${field.label}`}
          />
        );
      
      case 'image_gallery':
        return (
          <ImageUpload
            value={value || []}
            onChange={(imageArray) => handleFieldChange(field.name, imageArray)}
            multiple={true}
            label={`Upload ${field.label}`}
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
          />
        );
    }
  };

  const renderRelationshipField = (relationship) => {
    const RelationshipSelector = ({ relationship }) => {
      const availableEntities = useSelector(state => 
        selectAllEntitiesByType(state, relationship.target)
      );

      return (
        <div className="relationship-field">
          <label>{relationship.label}</label>
          {relationship.type === 'belongsTo' ? (
            <select
              value={relationships[relationship.name]?.selectedIds?.[0] || ''}
              onChange={(e) => handleRelationshipChange(
                relationship.name, 
                relationship.target, 
                e.target.value ? [e.target.value] : []
              )}
            >
              <option value="">Select {relationship.label}</option>
              {availableEntities.map(entity => (
                <option key={entity.id} value={entity.id}>
                  {entity.name || entity.title || `${relationship.target} #${entity.id.slice(0, 8)}`}
                </option>
              ))}
            </select>
          ) : (
            <div className="multi-select">
              {availableEntities.map(entity => (
                <label key={entity.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={relationships[relationship.name]?.selectedIds?.includes(entity.id) || false}
                    onChange={(e) => {
                      const currentIds = relationships[relationship.name]?.selectedIds || [];
                      const newIds = e.target.checked 
                        ? [...currentIds, entity.id]
                        : currentIds.filter(id => id !== entity.id);
                      
                      handleRelationshipChange(relationship.name, relationship.target, newIds);
                    }}
                  />
                  {entity.name || entity.title || `${relationship.target} #${entity.id.slice(0, 8)}`}
                </label>
              ))}
            </div>
          )}
        </div>
      );
    };

    return <RelationshipSelector relationship={relationship} />;
  };

  if (!schema) {
    return <div>Schema not found for {entityType}</div>;
  }

  return (
    <div className="entity-form">
      <div className="form-header">
        <h2>{entity ? 'Edit' : 'Create'} {schema.name}</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-fields">
          {schema.fields.map(field => (
            <div key={field.name} className="form-group">
              <label htmlFor={field.name}>
                {field.label} {field.required && <span className="required">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>

        {schema.relationships && schema.relationships.length > 0 && (
          <div className="form-relationships">
            <h3>Relationships</h3>
            {schema.relationships.map(relationship => (
              <div key={relationship.name}>
                {renderRelationshipField(relationship)}
              </div>
            ))}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {entity ? 'Update' : 'Create'} {schema.name}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EntityForm;