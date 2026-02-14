import { VITE_API_BASE_URL } from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;

class UniqueQrService {
    getToken() {
        return sessionStorage.getItem("token");
    }

    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`HTTP ${response.status}: ${error}`);
        }
        return await response.json();
    }

    async getList() {
        const token = this.getToken();
        try {
            const response = await fetch(`${BASE_URL}unique-qr/list`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error("Error fetching unique QRs:", error);
            throw error;
        }
    }

    async getOne(id) {
        const token = this.getToken();
        try {
            const response = await fetch(`${BASE_URL}unique-qr/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error("Error fetching unique QR:", error);
            throw error;
        }
    }

    async create(formData) {
        const token = this.getToken();
        try {
            const response = await fetch(`${BASE_URL}unique-qr/create`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error("Error creating unique QR:", error);
            throw error;
        }
    }

    async update(id, formData) {
        const token = this.getToken();
        try {
            const response = await fetch(`${BASE_URL}unique-qr/update/${id}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error("Error updating unique QR:", error);
            throw error;
        }
    }

    async deleteOne(id) {
        const token = this.getToken();
        try {
            const response = await fetch(`${BASE_URL}unique-qr/delete/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error("Error deleting unique QR:", error);
            throw error;
        }
    }

    async getOutlets(userId) {
        const token = this.getToken();
        try {
            const url = userId
                ? `${BASE_URL}outlets/list?user_id=${userId}`
                : `${BASE_URL}outlets/list`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error("Error fetching outlets:", error);
            throw error;
        }
    }

    async getMenuItemsByOutlet(outletId) {
        const token = this.getToken();
        try {
            const response = await fetch(`${BASE_URL}outlets/${outletId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await this.handleResponse(response);
            if (data.status === 200 && data.result) {
                const outletMenu = data.result.outlet_menu || [];
                const menuItemIds = outletMenu.map((m) => m.menu_item_id);
                return { status: 200, result: menuItemIds };
            }
            return { status: 200, result: [] };
        } catch (error) {
            console.error("Error fetching outlet menu items:", error);
            throw error;
        }
    }

    async getMenuItems() {
        const token = this.getToken();
        try {
            const response = await fetch(`${BASE_URL}menu-item/list`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error("Error fetching menu items:", error);
            throw error;
        }
    }
}

export default new UniqueQrService();
