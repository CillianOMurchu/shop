// API configuration for future Rails backend integration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
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
    return this.request(`/${entityType}`);
  }

  async getEntity(entityType, id) {
    return this.request(`/${entityType}/${id}`);
  }

  async createEntity(entityType, data) {
    return this.request(`/${entityType}`, {
      method: 'POST',
      body: JSON.stringify({ [entityType.slice(0, -1)]: data }), // Rails expects singular key
    });
  }

  async updateEntity(entityType, id, data) {
    return this.request(`/${entityType}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ [entityType.slice(0, -1)]: data }), // Rails expects singular key
    });
  }

  async deleteEntity(entityType, id) {
    return this.request(`/${entityType}/${id}`, {
      method: 'DELETE',
    });
  }

  // Relationship management
  async addRelationship(fromType, fromId, relationshipType, toType, toId) {
    return this.request(`/${fromType}/${fromId}/relationships`, {
      method: 'POST',
      body: JSON.stringify({
        relationship: {
          type: relationshipType,
          target_type: toType,
          target_id: toId,
        }
      }),
    });
  }

  async removeRelationship(fromType, fromId, relationshipType, toType, toId) {
    return this.request(`/${fromType}/${fromId}/relationships/${relationshipType}`, {
      method: 'DELETE',
      body: JSON.stringify({
        target_type: toType,
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

// Export for testing or different configurations
export default ApiService;