import {VITE_API_BASE_URL} from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};

const reportService = {
  getPromoReport: async (searchParams = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key]) {
          queryParams.append(key, searchParams[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `${BASE_URL}report/promo${queryString ? `?${queryString}` : ''}`;
      
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

  getSalesReport: async (searchParams = {}) => {
      try {
      const queryParams = new URLSearchParams();
      
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key]) {
          queryParams.append(key, searchParams[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `${BASE_URL}report/sales${queryString ? `?${queryString}` : ''}`;
      
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

  getProductReport: async (searchParams = {}) => {
    try {
      const queryParams = new URLSearchParams();

      Object.keys(searchParams).forEach(key => {
        if (searchParams[key]) {
          queryParams.append(key, searchParams[key]);
        }
      });

      const queryString = queryParams.toString();
      const url = `${BASE_URL}report/product${queryString ? `?${queryString}` : ''}`;

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
        throw new Error(`HTTP ${response.status}: Failed to fetch product report`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching product report:', error);
      throw error;
    }
  },

  getExportExcel: async (searchParams = {}) => {
    try {
      const queryParams = new URLSearchParams();

      Object.keys(searchParams).forEach(key => {
        if (searchParams[key]) {
          queryParams.append(key, searchParams[key]);
        }
      });

      const queryString = queryParams.toString();
      const url = `${BASE_URL}report/export${queryString ? `?${queryString}` : ''}`;

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
        throw new Error(`HTTP ${response.status}: Failed to fetch product report`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching product report:', error);
      throw error;
    }
  },

  getOrderReport: async (searchParams = {}) => {
    try {
      const queryParams = new URLSearchParams();

      Object.keys(searchParams).forEach(key => {
        if (searchParams[key]) {
          queryParams.append(key, searchParams[key]);
        }
      });

      const queryString = queryParams.toString();
      const url = `${BASE_URL}report/order${queryString ? `?${queryString}` : ''}`;

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
        throw new Error(`HTTP ${response.status}: Failed to fetch order sales report`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order sales report:', error);
      throw error;
    }
  },

  getWalletReport: async (searchParams = {}) => {
    try {
      const queryParams = new URLSearchParams();

      Object.keys(searchParams).forEach(key => {
        if (searchParams[key]) {
          queryParams.append(key, searchParams[key]);
        }
      });

      const queryString = queryParams.toString();
      const url = `${BASE_URL}report/wallet${queryString ? `?${queryString}` : ''}`;

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
        throw new Error(`HTTP ${response.status}: Failed to fetch order sales report`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order sales report:', error);
      throw error;
    }
  },

  getPointReport: async (searchParams = {}) => {
    try {
      const queryParams = new URLSearchParams();

      Object.keys(searchParams).forEach(key => {
        if (searchParams[key]) {
          queryParams.append(key, searchParams[key]);
        }
      });

      const queryString = queryParams.toString();
      const url = `${BASE_URL}report/point${queryString ? `?${queryString}` : ''}`;

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
        throw new Error(`HTTP ${response.status}: Failed to fetch order sales report`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order sales report:', error);
      throw error;
    }
  },
};
export default reportService;