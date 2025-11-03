import {VITE_API_BASE_URL} from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};

const customerTypeService = {
  getAll: async () => {
    try {
      const response = await fetch(`${BASE_URL}settings/customer-types`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...getAuthHeaders(),
        }
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to fetch customer types');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching customer types:', error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);

      const response = await fetch(`${BASE_URL}settings/customer-types/create`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: formData
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to create customer type');
      
      return await response.json();
    } catch (error) {
      console.error('Error creating customer type:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const params = new URLSearchParams();
      params.append('name', data.name);

      const response = await fetch(`${BASE_URL}settings/customer-types/update/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...getAuthHeaders(),
        },
        body: params
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to update customer type');
      
      return await response.json();
    } catch (error) {
      console.error('Error updating customer type:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}settings/customer-types/delete/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to delete customer type');
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting customer type:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}settings/customer-types/${id}`, {
        headers: {
          ...getAuthHeaders(),
        }
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to fetch customer type');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching customer type:', error);
      throw error;
    }
  }
};

export default customerTypeService;