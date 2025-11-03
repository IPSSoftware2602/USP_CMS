import {VITE_API_BASE_URL} from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;
const token = sessionStorage.getItem('token');

class TopUpService {
  async fetchTopupLists(filters = {}) {
    try {
      const token = sessionStorage.getItem('token');
      const params = new URLSearchParams({
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.payment_method ? { payment_method: filters.payment_method } : {}),
        ...(filters.start_date ? { start_date: filters.start_date } : {}),
        ...(filters.end_date ? { end_date: filters.end_date } : {}),
      });

      const response = await fetch(`${BASE_URL}customer/topup/list?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching topup settings:', error);
      throw new Error('Failed to load topup settings. Please try again.');
    }
  }


  async deleteTopupSetting(id) {
    try {
      const response = await fetch(`${BASE_URL}customer/topup/delete/${id}`, {
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
}

const topupService = new TopUpService();
export default topupService;