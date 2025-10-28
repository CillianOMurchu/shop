import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectSchemaByName } from '../store/slices/schemasSlice';
import { selectAllEntitiesByType } from '../store/slices/entitiesSlice';
import { createEntity, updateEntity, setRelationship } from '../store/slices/entitiesSlice';

const EntityForm = ({ entityType, entity, onClose }) => {
  const dispatch = useDispatch();
  const schema = useSelector(state => selectSchemaByName(state, entityType));
  
  const [formData, setFormData] = useState({});
  const [relationships, setRelationships] = useState({});

  useEffect(() => {
    if (entity) {
      setFormData(entity);
      // Load existing relationships here if needed
    } else {
      // Initialize with default values
      const initialData = {};
      schema?.fields.forEach(field => {
        if (field.default !== undefined) {
          initialData[field.name] = field.default;
        }
      });
      setFormData(initialData);
    }
  }, [entity, schema]);

  const handleFieldChange = (fieldName, value) => {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (entity) {
      // Update existing entity
      dispatch(updateEntity({ 
        entityType, 
        entityId: entity.id, 
        entityData: formData 
      }));
    } else {
      // Create new entity
      dispatch(createEntity({ 
        entityType, 
        entityData: formData 
      }));
    }

    // Handle relationships
    Object.entries(relationships).forEach(([relationshipName, { targetType, selectedIds }]) => {
      const entityId = entity?.id || 'new'; // This would need proper handling for new entities
      
      selectedIds.forEach(targetId => {
        dispatch(setRelationship({
          fromType: entityType,
          fromId: entityId,
          toType: targetType,
          toId: targetId,
          relationshipType: relationshipName
        }));
      });
    });

    onClose();
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
              onChange={(e) => handleRelationshipChange(
                relationship.name, 
                relationship.target, 
                [e.target.value]
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