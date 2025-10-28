// API configuration for future Rails backend integration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Ensure we use plural resource names for endpoints (Rails expects /products)
  normalizeEntityType(entityType) {
    if (!entityType) return entityType;
    return entityType.endsWith('s') ? entityType : `${entityType}s`;
  }

  // Naive singularization for param keys (products -> product)
  singularFromPlural(plural) {
    if (!plural) return plural;
    return plural.endsWith('s') ? plural.slice(0, -1) : plural;
  }

  // Generic API methods that will work with Rails REST conventions
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add CSRF token for Rails (when available)
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // CRUD operations for any entity type
  // Rails convention: GET /api/v1/products, POST /api/v1/products, etc.
  
  async getEntities(entityType) {
    const plural = this.normalizeEntityType(entityType);
    return this.request(`/${plural}`);
  }

  async getEntity(entityType, id) {
    const plural = this.normalizeEntityType(entityType);
    return this.request(`/${plural}/${id}`);
  }

  async createEntity(entityType, data) {
    const plural = this.normalizeEntityType(entityType);
    const singular = this.singularFromPlural(plural);
    const payload = { [singular]: data };

    console.log('Creating entity:', plural, 'with payload:', payload); // Debug log

    return this.request(`/${plural}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateEntity(entityType, id, data) {
    const plural = this.normalizeEntityType(entityType);
    const singular = this.singularFromPlural(plural);
    return this.request(`/${plural}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ [singular]: data }), // Rails expects singular key
    });
  }

  async deleteEntity(entityType, id) {
    const plural = this.normalizeEntityType(entityType);
    return this.request(`/${plural}/${id}`, {
      method: 'DELETE',
    });
  }

  // Relationship management
  async addRelationship(fromType, fromId, relationshipType, toType, toId) {
    const pluralFrom = this.normalizeEntityType(fromType);
    const pluralTo = this.normalizeEntityType(toType);
    return this.request(`/${pluralFrom}/${fromId}/relationships`, {
      method: 'POST',
      body: JSON.stringify({
        relationship: {
          type: relationshipType,
          target_type: pluralTo,
          target_id: toId,
        }
      }),
    });
  }

  async removeRelationship(fromType, fromId, relationshipType, toType, toId) {
    const pluralFrom = this.normalizeEntityType(fromType);
    const pluralTo = this.normalizeEntityType(toType);
    return this.request(`/${pluralFrom}/${fromId}/relationships/${relationshipType}`, {
      method: 'DELETE',
      body: JSON.stringify({
        target_type: pluralTo,
        target_id: toId,
      }),
    });
  }

  // Schema management (for dynamic entity types)
  async getSchemas() {
    return this.request('/schemas');
  }

  async createSchema(schemaData) {
    return this.request('/schemas', {
      method: 'POST',
      body: JSON.stringify({ schema: schemaData }),
    });
  }

  async updateSchema(schemaName, schemaData) {
    return this.request(`/schemas/${schemaName}`, {
      method: 'PATCH',
      body: JSON.stringify({ schema: schemaData }),
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export individual methods for convenience
export const createEntity = (entityType, data) => apiService.createEntity(entityType, data);
export const getEntity = (entityType, id) => apiService.getEntity(entityType, id);
export const getAllEntities = (entityType) => apiService.getAllEntities(entityType);
export const updateEntity = (entityType, id, data) => apiService.updateEntity(entityType, id, data);
export const deleteEntity = (entityType, id) => apiService.deleteEntity(entityType, id);

// Export for testing or different configurations
export default ApiService;