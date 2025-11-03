import { VITE_API_BASE_URL } from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;

class DashboardService {
  setToken(token) {
    sessionStorage.setItem("token", token);
  }

  getHeaders(isFormData = false) {
    const headers = {};

    const token = sessionStorage.getItem("token");

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }

  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    try {
      return await response.json();
    } catch (e) {
      return await response.text();
    }
  }

  async dashboard() {
    try {
      const response = await fetch(`${BASE_URL}dashboard`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.log(error);
    }
  }

  async dashboardSummary() {
    try {
      const response = await fetch(`${BASE_URL}dashboard-summary`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.log(error);
    }
  }

  async liveMonitor(){
    try {
      const response = await fetch(`${BASE_URL}live-monitor`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.log(error);
    }
  }
}

const dashboardService = new DashboardService();

export default dashboardService;
