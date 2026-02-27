import { VITE_API_BASE_URL } from "../../constant/config";

class PushNotificationService {
    constructor() {
        this.token = sessionStorage.getItem("token");
    }

    // Helper method for authenticated requests
    async makeRequest(url, method = "GET", body = null) {
        this.token = sessionStorage.getItem("token");
        const headers = {
            Authorization: `Bearer ${this.token}`,
        };

        const options = {
            method,
            headers,
        };

        if (body) {
            if (body instanceof FormData) {
                // Don't set Content-Type for FormData, let the browser set it with boundary
                options.body = body;
            } else {
                headers["Content-Type"] = "application/json";
                options.body = JSON.stringify(body);
            }
        }

        try {
            const response = await fetch(url, options);
            const data = await response.json();

            if (!response.ok) {
                // Handle common errors like token expiration
                if (response.status === 401) {
                    sessionStorage.removeItem("token");
                    sessionStorage.removeItem("user");
                    window.location.href = "/";
                }
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    // Get filtered customers
    async getCustomers(filters = {}) {
        // Build query string from filters
        const queryParams = new URLSearchParams();

        if (filters.name) queryParams.append('name', filters.name);
        if (filters.email) queryParams.append('email', filters.email);
        if (filters.phone) queryParams.append('phone', filters.phone);
        if (filters.tier) queryParams.append('tier', filters.tier);
        if (filters.customerType) queryParams.append('customer_type', filters.customerType);
        if (filters.birthday) queryParams.append('birthday', filters.birthday);
        if (filters.page) queryParams.append('page', filters.page);
        if (filters.limit) queryParams.append('limit', filters.limit);

        const queryString = queryParams.toString();
        const url = `${VITE_API_BASE_URL}settings/push-notifications/customers${queryString ? `?${queryString}` : ''}`;

        return this.makeRequest(url, "GET");
    }

    // Send Push Notification
    async sendNotification(formData) {
        const url = `${VITE_API_BASE_URL}settings/push-notifications/send`;
        return this.makeRequest(url, "POST", formData);
    }
}

export const pushNotificationService = new PushNotificationService();
