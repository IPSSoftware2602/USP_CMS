import { VITE_API_BASE_URL } from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

const voucherService = {
  getAll: async (searchParams = {}) => {
    try {
      const queryParams = new URLSearchParams();

      if (searchParams.date_from) {
        queryParams.append("date_from", searchParams.date_from);
      }
      if (searchParams.date_to) {
        queryParams.append("date_to", searchParams.date_to);
      }

      const queryString = queryParams.toString();
      const url = `${BASE_URL}voucher-point/list${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (response.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }
      if (!response.ok) throw new Error("Failed to fetch vouchers");

      return await response.json();
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      // Try the voucher-point endpoint first
      let response = await fetch(`${BASE_URL}voucher-point/${id}`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      // If voucher-point fails, try the settings/voucher endpoint
      if (!response.ok) {
        response = await fetch(`${BASE_URL}settings/voucher/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        });
      }

      if (response.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }
      if (!response.ok) throw new Error("Failed to fetch voucher");

      const data = await response.json();

      // Handle different response formats
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        return { success: true, data: data.data[0] };
      } else if (data.data && !Array.isArray(data.data)) {
        return { success: true, data: data.data };
      } else {
        return data;
      }
    } catch (error) {
      console.error("Error fetching voucher:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const formData = new FormData();

      // Add all the form fields
      formData.append("voucher_name", data.voucher_name || "");
      formData.append(
        "voucher_minimum_purchase",
        data.voucher_minimum_purchase || ""
      );
      formData.append(
        "voucher_total_count",
        data.voucher_total_count ? String(data.voucher_total_count) : ""
      );
      formData.append(
        "voucher_redeem_count",
        data.voucher_redeem_count ? String(data.voucher_redeem_count) : ""
      );
      formData.append(
        "voucher_count_customer",
        data.voucher_count_customer ? String(data.voucher_count_customer) : ""
      );
      formData.append("voucher_expiry_type", data.voucher_expiry_type || "");
      formData.append("voucher_expiry_value", data.voucher_expiry_value || "");
      formData.append("voucher_expired_date", data.voucher_expired_date || "");
      formData.append(
        "voucher_point_redeem",
        data.voucher_point_redeem ? String(data.voucher_point_redeem) : ""
      );
      formData.append("voucher_type", data.voucher_type || "");
      formData.append("voucher_setting", data.voucher_setting || "");
      formData.append("voucher_details", data.voucher_details || "");
      formData.append("voucher_tnc", data.voucher_tnc || "");
      formData.append("voucher_status", data.voucher_status || "");
      formData.append(
        "promo_setting_id",
        data.promo_setting_id ? String(data.promo_setting_id) : ""
      );

      if (data.voucher_image && data.voucher_image instanceof File) {
        formData.append("voucher_image", data.voucher_image);
      }

      console.log("Creating voucher with data:", Object.fromEntries(formData));

      const response = await fetch(`${BASE_URL}voucher-point/create`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          // Don't set Content-Type header for FormData, let the browser set it
        },
        body: formData,
      });

      if (response.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create voucher");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating voucher:", error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      // Check if we have a file to upload
      const hasFile = data.voucher_image && data.voucher_image instanceof File;

      let response;

      if (hasFile) {
        // Use FormData for file uploads
        const formData = new FormData();

        // Add all form fields to FormData
        Object.keys(data).forEach((key) => {
          if (data[key] !== null && data[key] !== undefined) {
            if (key === "voucher_image" && data[key] instanceof File) {
              formData.append(key, data[key]);
            } else {
              formData.append(key, String(data[key]));
            }
          }
        });

        console.log(
          "Updating voucher with FormData:",
          Object.fromEntries(formData)
        );

        response = await fetch(`${BASE_URL}settings/voucher/update/${id}`, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
          },
          body: formData,
        });

        if (!response.ok) {
          response = await fetch(`${BASE_URL}voucher-point/update/${id}`, {
            method: "POST",
            headers: {
              ...getAuthHeaders(),
            },
            body: formData,
          });
        }
      } else {
        // Use JSON for updates without file
        const payload = {
          voucher_name: data.voucher_name || "",
          voucher_minimum_purchase: data.voucher_minimum_purchase || 0,
          voucher_total_count: data.voucher_total_count || 0,
          voucher_redeem_count: data.voucher_redeem_count || 0,
          voucher_count_customer: data.voucher_count_customer || 0,
          voucher_expiry_type: data.voucher_expiry_type || "",
          voucher_expiry_value: data.voucher_expiry_value || "",
          voucher_expired_date: data.voucher_expired_date || "",
          voucher_point_redeem: data.voucher_point_redeem || 0,
          voucher_type: data.voucher_type || "",
          voucher_setting: data.voucher_setting || "",
          voucher_details: data.voucher_details || "",
          voucher_tnc: data.voucher_tnc || "",
          voucher_status: data.voucher_status || "",
          promo_setting_id: data.promo_setting_id || 0,
        };

        console.log("Updating voucher with JSON:", payload);

        // Try settings/voucher/update endpoint first (original code path)
        response = await fetch(`${BASE_URL}settings/voucher/update/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(payload),
        });

        // If settings endpoint fails, try voucher-point endpoint
        if (!response.ok) {
          response = await fetch(`${BASE_URL}voucher-point/update/${id}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
            body: JSON.stringify(payload),
          });
        }
      }

      if (response.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update voucher");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating voucher:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}voucher-point/delete/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (response.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete voucher");
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting voucher:", error);
      throw error;
    }
  },

  // Additional utility methods
  getVouchersByStatus: async (status) => {
    try {
      const response = await fetch(
        `${BASE_URL}voucher-point/list?status=${status}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      if (response.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }
      if (!response.ok) throw new Error("Failed to fetch vouchers by status");

      return await response.json();
    } catch (error) {
      console.error("Error fetching vouchers by status:", error);
      throw error;
    }
  },

  validateVoucher: async (voucherId) => {
    try {
      const response = await fetch(
        `${BASE_URL}voucher-point/validate/${voucherId}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      if (response.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }
      if (!response.ok) throw new Error("Failed to validate voucher");

      return await response.json();
    } catch (error) {
      console.error("Error validating voucher:", error);
      throw error;
    }
  },

  redeemVoucher: async (voucherId, customerId) => {
    try {
      const response = await fetch(`${BASE_URL}voucher-point/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          voucher_id: voucherId,
          customer_id: customerId,
        }),
      });

      if (response.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to redeem voucher");
      }

      return await response.json();
    } catch (error) {
      console.error("Error redeeming voucher:", error);
      throw error;
    }
  },

  searchMemberList: async (filters) => {
    const queryString = new URLSearchParams(filters).toString();

    try {
      const response = await fetch(
        `${BASE_URL}get/member-list?${queryString}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      return await response.json();
    } catch (error) {
      console.error("Error searching member list:", error);
      throw error;
    }
  },

  sendVoucher: async (data) => {
    console.log(data);
    try {
      const response = await fetch(`${BASE_URL}send-voucher`, {
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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send voucher");
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending voucher:", error);
      throw error;
    }
  },
};

export default voucherService;
