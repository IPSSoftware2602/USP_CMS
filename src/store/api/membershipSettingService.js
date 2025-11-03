import {VITE_API_BASE_URL} from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};

const membershipSettingService = {
    get: async (type) => {
      try {
        const response = await fetch(`${BASE_URL}settings/membership-settings/${type}`, {
          headers: {
            ...getAuthHeaders(),
          }
        });
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        if (!response.ok) throw new Error('Failed to fetch membership settings');
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching membership settings:', error);
        throw error;
      }
    },
    update: async (data) => {
      try {
        const response = await fetch(`${BASE_URL}settings/membership-settings/save`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        if (!response.ok) throw new Error('Failed to update membership settings');
        
        return await response.json();
      } catch (error) {
        console.error('Error updating membership settings:', error);
        throw error;
      }
    }
  };
  
  export default membershipSettingService;