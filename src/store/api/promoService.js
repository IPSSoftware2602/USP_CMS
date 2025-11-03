import {VITE_API_BASE_URL} from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};

const promoService = {
  getAll: async () => {
    try {
      const response = await fetch(`${BASE_URL}promo/list`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to fetch promo codes');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}promo/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to fetch promo code');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching promo code:', error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const payload = {
        // Basic promotion info
        promotionType: data.promotionType || "",
        promotionName: data.promotionName || "",
        promotionDescription: data.promotionDescription || "",
        promotionCode: data.promotionCode || "",
        
        // Usage and limits
        usageLimit: data.usageLimit || "multiple",
        totalRedemptionLimit: data.totalRedemptionLimit ? String(data.totalRedemptionLimit) : "",
        voucherLimitPerCustomer: data.voucherLimitPerCustomer ? String(data.voucherLimitPerCustomer) : "",
        
        // Availability settings
        availableOn: data.availableOn || "all-time",
        storeStartDate: data.storeStartDate || "",
        storeEndDate: data.storeEndDate || "",
        customDayTime: data.customDayTime || {
          mon: { enabled: false, startTime: "", endTime: "" },
          tue: { enabled: false, startTime: "", endTime: "" },
          wed: { enabled: false, startTime: "", endTime: "" },
          thurs: { enabled: false, startTime: "", endTime: "" },
          fri: { enabled: false, startTime: "", endTime: "" },
          sat: { enabled: false, startTime: "", endTime: "" },
          sun: { enabled: false, startTime: "", endTime: "" }
        },
        
        applyToDeliveryPickup: data.applyToDeliveryPickup || "both",
        promoType: data.promoType || "discount",
        
        discountAmount: data.discountAmount ? String(data.discountAmount) : "",
        discountType: data.discountType === "fixed" ? "amount" : data.discountType || "",
        
        getNumber: data.getNumber ? String(data.getNumber) : "",
        
        minimumSpend: data.minimumSpend ? String(data.minimumSpend) : "",
        minimumQuantity: data.minimumQuantity ? String(data.minimumQuantity) : "",
        minimumAmount: data.minimumAmount ? String(data.minimumAmount) : "",
        everyQuantity: data.everyQuantity ? String(data.everyQuantity) : "",
        
        itemCategory1: data.itemCategory1 || "total",
        itemCategory2: data.itemCategory2 || "total",
        itemCategoryID1: Array.isArray(data.itemCategory1ID) ? data.itemCategory1ID.map(Number) : [],
        itemCategoryID2: Array.isArray(data.itemCategory2ID) ? data.itemCategory2ID.map(Number) : [],
        itemVariations1: data.itemVariations1 || [],
        itemVariations2: data.itemVariations2 || [],
        
        isActive: data.isActive !== undefined ? data.isActive : true,
        updatedBy: data.updatedBy || null
      };

      console.log('Payload:', payload);
      const response = await fetch(`${BASE_URL}promo/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create promo code');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating promo code:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const payload = {
        promotionType: data.promotionType || "",
        promotionName: data.promotionName || "",
        promotionDescription: data.promotionDescription || "",
        promotionCode: data.promotionCode || "",
        
        usageLimit: data.usageLimit || "multiple",
        totalRedemptionLimit: data.totalRedemptionLimit ? String(data.totalRedemptionLimit) : "",
        voucherLimitPerCustomer: data.voucherLimitPerCustomer ? String(data.voucherLimitPerCustomer) : "",
        
        availableOn: data.availableOn || "all-time",
        storeStartDate: data.storeStartDate || "",
        storeEndDate: data.storeEndDate || "",
        customDayTime: data.customDayTime || {
          mon: { enabled: false, startTime: "", endTime: "" },
          tue: { enabled: false, startTime: "", endTime: "" },
          wed: { enabled: false, startTime: "", endTime: "" },
          thurs: { enabled: false, startTime: "", endTime: "" },
          fri: { enabled: false, startTime: "", endTime: "" },
          sat: { enabled: false, startTime: "", endTime: "" },
          sun: { enabled: false, startTime: "", endTime: "" }
        },
        
        applyToDeliveryPickup: data.applyToDeliveryPickup || "both",
        promoType: data.promoType || "discount",
        
        discountAmount: data.discountAmount ? String(data.discountAmount) : "",
        discountType: data.discountType === "fixed" ? "amount" : data.discountType || "",
        
        getNumber: data.getNumber ? String(data.getNumber) : "",
        
        minimumSpend: data.minimumSpend ? String(data.minimumSpend) : "",
        minimumQuantity: data.minimumQuantity ? String(data.minimumQuantity) : "",
        minimumAmount: data.minimumAmount ? String(data.minimumAmount) : "",
        everyQuantity: data.everyQuantity ? String(data.everyQuantity) : "",
        
        itemCategory1: data.itemCategory1 || "total",
        itemCategory2: data.itemCategory2 || "total",
        itemCategoryID1: Array.isArray(data.itemCategoryID1) ? data.itemCategoryID1.map(Number) : [],
        itemCategoryID2: Array.isArray(data.itemCategoryID2) ? data.itemCategoryID2.map(Number) : [],
        itemVariations1: data.itemVariations1 || [],
        itemVariations2: data.itemVariations2 || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
        updatedBy: data.updatedBy || null
      };

      console.log('Payload:', payload);

      const response = await fetch(`${BASE_URL}promo/update/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update promo code');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating promo code:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}promo/delete/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to delete promo code');
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      throw error;
    }
  },

  toggleStatus: async (id, isActive) => {
    try {
      const response = await fetch(`${BASE_URL}promo/toggle-status/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ isActive })
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle promo status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error toggling promo status:', error);
      throw error;
    }
  },

  validateCode: async (code, orderData = {}) => {
    try {
      const response = await fetch(`${BASE_URL}promo/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          promotionCode: code,
          orderTotal: orderData.orderTotal || 0,
          customerId: orderData.customerId || null,
          products: orderData.products || []
        })
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to validate promo code');
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating promo code:', error);
      throw error;
    }
  },

  getUsageStats: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}promo/usage-stats/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to fetch promo usage stats');

      return await response.json();
    } catch (error) {
      console.error('Error fetching promo usage stats:', error);
      throw error;
    }
  }
};

export default promoService;