import {VITE_API_BASE_URL} from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};

const promoSettingsService = {
  getAll: async (searchParams = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key]) {
          queryParams.append(key, searchParams[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `${BASE_URL}promo-setting/list${queryString ? `?${queryString}` : ''}`;
      
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      });
      
      if (response.status === 404) {
        throw new Error(`Endpoint not found: ${url}`);
      }
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch promo settings`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching promo settings:', error);
      throw error;
    }
  },

  // Get single promo setting by ID
  getById: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}promo-setting/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to fetch promo setting');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching promo setting:', error);
      throw error;
    }
  },

  // Create new promo setting
  create: async (data) => {
    try {
      const response = await fetch(`${BASE_URL}promo-setting/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data)
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create promo setting');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating promo setting:', error);
      throw error;
    }
  },

  // Update promo setting
  update: async (id, data) => {
    try {
      const response = await fetch(`${BASE_URL}promo-setting/update/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data)
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update promo setting');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating promo setting:', error);
      throw error;
    }
  },

  // Delete promo setting
  delete: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}promo-setting/delete/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to delete promo setting');
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting promo setting:', error);
      throw error;
    }
  }
};
export default promoSettingsService;