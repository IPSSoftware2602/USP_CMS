import { VITE_API_BASE_URL } from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};

const buildQueryString = (params) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(val => queryParams.append(`${key}[]`, val));
      } else {
        queryParams.append(key, value);
      }
    }
  });
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

const reportService = {
  getPromoReport: async (searchParams = {}) => {
    try {
      const url = `${BASE_URL}report/promo${buildQueryString(searchParams)}`;

      // console.log('Making request to:', url);

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
        throw new Error(`HTTP ${response.status}: Failed to fetch promo report`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching promo report:', error);
      throw error;
    }
  },

  getSalesReport: async (searchParams = {}) => {
    try {
      const url = `${BASE_URL}report/sales${buildQueryString(searchParams)}`;

      // console.log('Making request to:', url);

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
        throw new Error(`HTTP ${response.status}: Failed to fetch sales report`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching sales report:', error);
      throw error;
    }
  },

  getProductReport: async (searchParams = {}) => {
    try {
      const url = `${BASE_URL}report/product${buildQueryString(searchParams)}`;

      // console.log('Making request to:', url);

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
      const url = `${BASE_URL}report/export${buildQueryString(searchParams)}`;

      // console.log('Making request to:', url);

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
        throw new Error(`HTTP ${response.status}: Failed to fetch export excel`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching export excel:', error);
      throw error;
    }
  },
  exportReport: async (params = {}) => {
    try {
      const response = await fetch(`${BASE_URL}report/financereport`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Export failed: HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error exporting report:", error);
      throw error;
    }
  },


  getOrderReport: async (searchParams = {}) => {
    try {
      const url = `${BASE_URL}report/order${buildQueryString(searchParams)}`;

      // console.log('Making request to:', url);

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
        throw new Error(`HTTP ${response.status}: Failed to fetch order report`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order report:', error);
      throw error;
    }
  },

  getWalletReport: async (searchParams = {}) => {
    try {
      const url = `${BASE_URL}report/wallet${buildQueryString(searchParams)}`;

      // console.log('Making request to:', url);

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
        throw new Error(`HTTP ${response.status}: Failed to fetch wallet report`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching wallet report:', error);
      throw error;
    }
  },

  getPointReport: async (searchParams = {}) => {
    try {
      const url = `${BASE_URL}report/point${buildQueryString(searchParams)}`;

      // console.log('Making request to:', url);

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
        throw new Error(`HTTP ${response.status}: Failed to fetch point report`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching point report:', error);
      throw error;
    }
  },
  getUnutilizedReport: async (searchParams = {}) => {
    try {
      const url = `${BASE_URL}report/unutilizedvoucher${buildQueryString(searchParams)}`;

      // console.log('Making request to:', url);

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
        throw new Error(`HTTP ${response.status}: Failed to fetch unutilized report`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching unutilized report:', error);
      throw error;
    }
  },

  getUniqueQrSummary: async (searchParams = {}) => {
    try {
      const url = `${BASE_URL}unique-qr-report/summary${buildQueryString(searchParams)}`;

      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching Unique QR summary:', error);
      throw error;
    }
  },

  getUniqueQrDetails: async (uniqueCode, searchParams = {}) => {
    try {
      const url = `${BASE_URL}unique-qr-report/details/${uniqueCode}${buildQueryString(searchParams)}`;

      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching Unique QR details:', error);
      throw error;
    }
  },

  exportUniqueQrSummary: async (searchParams = {}) => {
    try {
      const url = `${BASE_URL}unique-qr-report/export-summary${buildQueryString(searchParams)}`;

      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error exporting Unique QR summary:', error);
      throw error;
    }
  },

  exportUniqueQrDetails: async (uniqueCode, searchParams = {}) => {
    try {
      const url = `${BASE_URL}unique-qr-report/export-details/${uniqueCode}${buildQueryString(searchParams)}`;

      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error exporting Unique QR details:', error);
      throw error;
    }
  },
};
export default reportService;