import { VITE_API_BASE_URL } from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

class PromoCodeService {
  getToken() {
    return sessionStorage.getItem("token");
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }
    return response.json();
  }

  async makeFormDataRequest(url, method, formData) {
    try {
      const token = this.getToken();
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async makeJsonRequest(url, method, data = null) {
    try {
      const token = this.getToken();
      const config = {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      if (data) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(url, config);
      return this.handleResponse(response);
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async getAll() {
    try {
      const response = await fetch(`${BASE_URL}promo-code/list`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      if (response.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }
      if (!response.ok) throw new Error("Failed to fetch promo codes");
      return await response.json();
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      throw error;
    }
  }

  async getById(id) {
    try {
      const response = await fetch(`${BASE_URL}promo-code/${id}`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      if (response.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }
      if (!response.ok) throw new Error("Failed to fetch promo codes");
      return await response.json();
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      throw error;
    }
  }

  async create(data){
    try {
      const response = await fetch(`${BASE_URL}promo-code/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (response.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }
      if (!response.ok) throw new Error("Failed to create promo code");
      return await response.json();
    } catch (error) {
      console.error("Error creating promo code:", error);
      throw error;
    }
  }

  async update(id, data) {
    try {
      const response = await fetch(`${BASE_URL}promo-code/update/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (response.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }
      if (!response.ok) throw new Error("Failed to update promo code");
      return await response.json();
    } catch (error) {
      console.error("Error updating promo code:", error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const response = await fetch(`${BASE_URL}promo-code/delete/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      if (response.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }
      if (!response.ok) throw new Error("Failed to delete promo code");
      return await response.json();
    } catch (error) {
      console.error("Error deleting promo code:", error);
      throw error;
    }
  }
}

const promoCodeService = new PromoCodeService();
export default promoCodeService;
