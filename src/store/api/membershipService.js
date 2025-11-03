import {VITE_API_BASE_URL} from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};

const membershipTierService = {
  getAll: async () => {
    try {
      const response = await fetch(`${BASE_URL}settings/membership-tiers`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...getAuthHeaders(),
        }
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to fetch membership tiers');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching membership tiers:', error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('min_points', data.min_points);
      formData.append('discount_rate', data.discount_rate);
      formData.append('color', data.color);
      formData.append('category_id', data.category_id); // Add category_id

      const response = await fetch(`${BASE_URL}settings/membership-tiers/create`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: formData
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to create membership tier');
      
      return await response.json();
    } catch (error) {
      console.error('Error creating membership tier:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const body = new URLSearchParams({
        name: data.name,
        min_points: data.min_points,
        discount_rate: data.discount_rate,
        color: data.color,
        category_id: data.category_id // Add category_id
      });

      const response = await fetch(`${BASE_URL}settings/membership-tiers/update/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...getAuthHeaders(),
        },
        body
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to update membership tier');
      
      return await response.json();
    } catch (error) {
      console.error('Error updating membership tier:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}settings/membership-tiers/delete/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to delete membership tier');
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting membership tier:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}settings/membership-tiers/${id}`, {
        headers: {
          ...getAuthHeaders(),
        }
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to fetch membership tier');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching membership tier:', error);
      throw error;
    }
  }
};

export default membershipTierService;