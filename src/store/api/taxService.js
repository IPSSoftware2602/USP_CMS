import {VITE_API_BASE_URL} from "../../constant/config";

const BASE_URL =  VITE_API_BASE_URL;
const token = sessionStorage.getItem('token');

class TaxService {
  async fetchTaxes() {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${BASE_URL}settings/tax`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched tax data:", data);
      
      let taxes = [];
      if (Array.isArray(data)) {
        taxes = data;
      } else if (Array.isArray(data.data)) {
        taxes = data.data;
      } else if (Array.isArray(data.result)) {
        taxes = data.result;
      } else if (Array.isArray(data.taxes)) {
        taxes = data.taxes;
      }
      
      return taxes;
    } catch (error) {
      console.error('Error fetching taxes:', error);
      throw new Error('Failed to load tax settings. Please try again.');
    }
  }

  async createTax(taxData) {
    try {
      const formData = new FormData();
      
      // Handle outlet_id - convert array to comma-separated string if needed
      if (Array.isArray(taxData.outlet_id)) {
        formData.append('outlet_id', taxData.outlet_id.join(','));
      } else {
        formData.append('outlet_id', taxData.outlet_id);
      }
      
      formData.append('tax_type', taxData.tax_type);
      formData.append('tax_rate', taxData.tax_rate);
      formData.append('order_type', taxData.order_type);

      const response = await fetch(`${BASE_URL}settings/tax/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating tax:', error);
      throw new Error('Failed to create tax. Please try again.');
    }
  }

  async updateTax(id, taxData) {
    try {
      const formData = new FormData();
      
      // Only append fields that are provided and not undefined/null
      if (taxData.outlet_id !== undefined && taxData.outlet_id !== null) {
        // Handle outlet_id - convert array to comma-separated string if needed
        if (Array.isArray(taxData.outlet_id)) {
          formData.append('outlet_id', taxData.outlet_id.join(','));
        } else {
          formData.append('outlet_id', taxData.outlet_id);
        }
      }
      
      if (taxData.tax_type !== undefined && taxData.tax_type !== null) {
        formData.append('tax_type', taxData.tax_type);
      }
      
      if (taxData.tax_rate !== undefined && taxData.tax_rate !== null) {
        formData.append('tax_rate', taxData.tax_rate);
      }
      
      if (taxData.order_type !== undefined && taxData.order_type !== null) {
        formData.append('order_type', taxData.order_type);
      }

      const response = await fetch(`${BASE_URL}settings/tax/update/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating tax:', error);
      throw new Error('Failed to update tax. Please try again.');
    }
  }

  async deleteTax(id) {
    try {
      const response = await fetch(`${BASE_URL}settings/tax/delete/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting tax:', error);
      throw new Error('Failed to delete tax. Please try again.');
    }
  }
}

const taxService = new TaxService();
export default taxService;