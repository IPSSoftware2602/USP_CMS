import {VITE_API_BASE_URL} from "../../constant/config";

const BASE_URL =  VITE_API_BASE_URL;

class CsvService {
  getToken() {
    return sessionStorage.getItem('token');
  }

  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    return await response.json();
  }

  async fetchCsvReport() {
    const token = this.getToken();
        try {
            const response = await fetch(`${BASE_URL}outlets/export-excel`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch Excel Report');
            }

            return await response.blob();
        } catch (error) {
            console.error('Error fetching Excel Report:', error);
            throw error;
        }
}

}


export default new CsvService();