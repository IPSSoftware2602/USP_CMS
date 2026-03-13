import { VITE_API_BASE_URL } from "@/constant/config";

const getHeaders = () => {
  const token = sessionStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const parseResponse = async (response, fallbackMessage) => {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || fallbackMessage);
  }

  return payload;
};

class AdminImpersonationService {
  static async impersonateUser(userId) {
    const response = await fetch(`${VITE_API_BASE_URL}impersonate-user/${userId}`, {
      method: "POST",
      headers: getHeaders(),
    });

    return parseResponse(response, "Failed to impersonate user.");
  }

  static async impersonateCustomer(customerId) {
    const response = await fetch(`${VITE_API_BASE_URL}impersonate-customer/${customerId}`, {
      method: "POST",
      headers: getHeaders(),
    });

    return parseResponse(response, "Failed to generate customer login link.");
  }
}

export default AdminImpersonationService;
