import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAllSchemas, addSchema, removeSchema, addFieldToSchema } from '../store/slices/schemasSlice';

const SchemaManager = () => {
  const dispatch = useDispatch();
  const schemas = useSelector(selectAllSchemas);
  
  const [newSchemaName, setNewSchemaName] = useState('');
  const [selectedSchema, setSelectedSchema] = useState('');
  const [newField, setNewField] = useState({
    name: '',
    type: 'string',
    label: '',
    required: false
  });

  const fieldTypes = ['string', 'text', 'number', 'boolean', 'date'];

  const handleCreateSchema = () => {
    if (!newSchemaName.trim()) return;

    const schema = {
      name: newSchemaName,
      fields: [
        { name: 'name', type: 'string', required: true, label: 'Name' }
      ],
      relationships: []
    };

    dispatch(addSchema({ 
      schemaName: newSchemaName.toLowerCase(), 
      schema 
    }));
    
    setNewSchemaName('');
  };

  const handleAddField = () => {
    if (!newField.name.trim() || !selectedSchema) return;

    dispatch(addFieldToSchema({
      schemaName: selectedSchema,
      field: { ...newField }
    }));

    setNewField({
      name: '',
      type: 'string',
      label: '',
      required: false
    });
  };

  const handleDeleteSchema = (schemaName) => {
    if (window.confirm(`Are you sure you want to delete the ${schemaName} schema?`)) {
      dispatch(removeSchema({ schemaName }));
    }
  };

  return (
    <div className="schema-manager">
      <div className="schema-creation">
        <h2>Create New Schema</h2>
        <div className="form-group">
          <label>Schema Name:</label>
          <input
            type="text"
            value={newSchemaName}
            onChange={(e) => setNewSchemaName(e.target.value)}
            placeholder="e.g., Product, Category, User"
          />
          <button 
            className="btn-primary"
            onClick={handleCreateSchema}
            disabled={!newSchemaName.trim()}
          >
            Create Schema
          </button>
        </div>
      </div>

      <div className="existing-schemas">
        <h2>Existing Schemas</h2>
        <div className="schema-grid">
          {Object.entries(schemas).map(([schemaName, schema]) => (
            <div key={schemaName} className="schema-card">
              <div className="schema-header">
                <h3>{schema.name}</h3>
                <button 
                  className="btn-danger small"
                  onClick={() => handleDeleteSchema(schemaName)}
                >
                  Delete
                </button>
              </div>
              
              <div className="schema-fields">
                <h4>Fields:</h4>
                <ul>
                  {schema.fields.map(field => (
                    <li key={field.name}>
                      <strong>{field.label || field.name}</strong> 
                      ({field.type})
                      {field.required && <span className="required"> *</span>}
                    </li>
                  ))}
                </ul>
              </div>

              {schema.relationships && schema.relationships.length > 0 && (
                <div className="schema-relationships">
                  <h4>Relationships:</h4>
                  <ul>
                    {schema.relationships.map(rel => (
                      <li key={rel.name}>
                        <strong>{rel.label || rel.name}</strong> 
                        ({rel.type} → {rel.target})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="field-management">
        <h2>Add Field to Schema</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Select Schema:</label>
            <select
              value={selectedSchema}
              onChange={(e) => setSelectedSchema(e.target.value)}
            >
              <option value="">Choose schema...</option>
              {Object.keys(schemas).map(schemaName => (
                <option key={schemaName} value={schemaName}>
                  {schemas[schemaName].name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Field Name:</label>
            <input
              type="text"
              value={newField.name}
              onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
              placeholder="field_name"
            />
          </div>

          <div className="form-group">
            <label>Field Label:</label>
            <input
              type="text"
              value={newField.label}
              onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Display Label"
            />
          </div>

          <div className="form-group">
            <label>Field Type:</label>
            <select
              value={newField.type}
              onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value }))}
            >
              {fieldTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={newField.required}
                onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
              />
              Required
            </label>
          </div>

          <button 
            className="btn-primary"
            onClick={handleAddField}
            disabled={!newField.name.trim() || !selectedSchema}
          >
            Add Field
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchemaManager;