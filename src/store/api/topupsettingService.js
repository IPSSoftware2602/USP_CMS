import {VITE_API_BASE_URL, VITE_API_BASE_URL_CUS} from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;
const token = sessionStorage.getItem('token');

class TopUpService {
  async fetchTopupSettings() {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${BASE_URL}topup/list`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched topup settings data:", data);
      
      let topupSettings = [];
      if (Array.isArray(data)) {
        topupSettings = data;
      } else if (Array.isArray(data.data)) {
        topupSettings = data.data;
      } else if (Array.isArray(data.result)) {
        topupSettings = data.result;
      } else if (Array.isArray(data.topup_settings)) {
        topupSettings = data.topup_settings;
      }
      
      return topupSettings;
    } catch (error) {
      console.error('Error fetching topup settings:', error);
      throw new Error('Failed to load topup settings. Please try again.');
    }
  }

  async createTopupSetting(topupData) {
    try {
      const response = await fetch(`${BASE_URL}topup/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          topup_amount: topupData.topup_amount,
          credit_amount: topupData.credit_amount,
          status: topupData.status || 'active'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating topup setting:', error);
      throw new Error('Failed to create topup setting. Please try again.');
    }
  }

  async updateTopupSetting(id, topupData) {
    try {
      const response = await fetch(`${BASE_URL}topup/update/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          credit_amount: topupData.credit_amount,
          ...(topupData.topup_amount && { topup_amount: topupData.topup_amount }),
          ...(topupData.status && { status: topupData.status })
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating topup setting:', error);
      throw new Error('Failed to update topup setting. Please try again.');
    }
  }

  async deleteTopupSetting(id) {
    try {
      const response = await fetch(`${BASE_URL}topup/delete/${id}`, {
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
      console.error('Error deleting topup setting:', error);
      throw new Error('Failed to delete topup setting. Please try again.');
    }
  }

  async createCustomerTopup(topupData) {
    try {
      const token = sessionStorage.getItem('token');
      
      const response = await fetch(VITE_API_BASE_URL_CUS + `customer/topup/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_id: topupData.customer_id,
          payment_method: topupData.payment_method,
          topup_setting_id: topupData.topup_setting_id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating customer topup:', error);
      throw new Error('Failed to create customer topup. Please try again.');
    }
  }

 async getTopupSettingById(id) {
  try {
    const token = sessionStorage.getItem('token');
    const response = await fetch(`${BASE_URL}topup/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting topup setting by ID:', error);
    const settings = await this.fetchTopupSettings();
    return settings.find(setting => 
      setting.id == id 
    );
  }
}

  async getActiveTopupSettings() {
    try {
      const settings = await this.fetchTopupSettings();
      return settings.filter(setting => setting.status === 'active');
    } catch (error) {
      console.error('Error getting active topup settings:', error);
      throw new Error('Failed to get active topup settings. Please try again.');
    }
  }
}

const topupService = new TopUpService();
export default topupService;