import { VITE_API_BASE_URL } from "../../constant/config";
import promoSettingsService from "./promoSettingsService";

const BASE_URL = VITE_API_BASE_URL;

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};

const voucherScheduleService = {
  getAll: async (searchParams = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (searchParams.voucher_title) {
        queryParams.append('voucher_title', searchParams.voucher_title);
      }
      if (searchParams.voucher_owner) {
        queryParams.append('voucher_owner', searchParams.voucher_owner);
      }
      
      const queryString = queryParams.toString();
      const url = `${BASE_URL}voucher-schedule${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to fetch voucher schedules');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching voucher schedules:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}voucher-schedule/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to fetch voucher schedule');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching voucher schedule:', error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const payload = {
        promo_setting_id: data.promo_setting_id ? String(data.promo_setting_id) : "",
        voucher_schedule_mode: data.voucher_schedule_mode || "",
        voucher_date_type: data.voucher_date_type || "",
        filter_membership: data.filter_membership ? String(data.filter_membership) : "",
        filter_customer_type: data.filter_customer_type ? String(data.filter_customer_type) : "",
        schedule_date: data.schedule_date || "",
        schedule_time: data.schedule_time || "",
        quantity: data.quantity ? String(data.quantity) : "",
        voucher_expiration: data.voucher_expiration ? String(data.voucher_expiration) : "",
      };

      console.log('Payload:', payload);
      const response = await fetch(`${BASE_URL}voucher-schedule/create`, {
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
        throw new Error(errorData.message || 'Failed to create voucher schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating voucher schedule:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const payload = {
        promo_setting_id: data.promo_setting_id ? String(data.promo_setting_id) : "",
        voucher_schedule_mode: data.voucher_schedule_mode || "",
        voucher_date_type: data.voucher_date_type || "",
        filter_membership: data.filter_membership ? String(data.filter_membership) : "",
        filter_customer_type: data.filter_customer_type ? String(data.filter_customer_type) : "",
        schedule_date: data.schedule_date || "",
        schedule_time: data.schedule_time || "",
        quantity: data.quantity ? String(data.quantity) : "",
        voucher_expiration: data.voucher_expiration ? String(data.voucher_expiration) : "",
      };

      console.log('Payload:', payload);

      const response = await fetch(`${BASE_URL}voucher-schedule/update/${id}`, {
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
        throw new Error(errorData.message || 'Failed to update voucher schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating voucher schedule:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}voucher-schedule/delete/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to delete voucher schedule');
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting voucher schedule:', error);
      throw error;
    }
  },

  getVoucherSettings: async (voucher_setting_id) => {
    try {
      const response = await fetch(`${BASE_URL}settings/voucher/${voucher_setting_id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      if (!response.ok) throw new Error('Failed to fetch voucher settings');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching voucher settings:', error);
      throw error;
    }
  },

  // Updated method to get voucher schedule with promo settings data merged
  getAllWithSettings: async (searchParams = {}) => {
    try {
      // First, get all voucher schedules
      const scheduleResponse = await voucherScheduleService.getAll(searchParams);
      
      if (!scheduleResponse.data || scheduleResponse.data.length === 0) {
        return scheduleResponse;
      }

      // Then, fetch promo settings for each schedule using promoSettingsService
      const mergedData = await Promise.all(
        scheduleResponse.data.map(async (schedule) => {
          try {
            // Use promoSettingsService to get the promo setting details
            const promoSettingResponse = await promoSettingsService.getById(schedule.promo_setting_id);
            const promoSettingDetails = promoSettingResponse.data;

            return {
              ...schedule,
              // Add promo setting details to the schedule
              voucher_title: promoSettingDetails.voucher_title || '-',
              voucher_type: promoSettingDetails.voucher_type || '-',
              amount: promoSettingDetails.amount || '-',
              voucher_minimum_purchase: promoSettingDetails.voucher_minimum_purchase || '-',
              scheduleId: schedule.id,
              promoSettingId: promoSettingDetails.id,
              id: `schedule-${schedule.id}-promo-${promoSettingDetails.id}`,
            };
          } catch (error) {
            console.error(`Error fetching promo setting for schedule ${schedule.id}:`, error);
            return {
              ...schedule,
              voucher_title: '-',
              voucher_type: '-',
              amount: '-',
              voucher_minimum_purchase: '-',
              scheduleId: schedule.id,
              id: `schedule-${schedule.id}`,
            };
          }
        })
      );

      return {
        ...scheduleResponse,
        data: mergedData
      };
    } catch (error) {
      console.error('Error fetching voucher schedules with promo settings:', error);
      throw error;
    }
  }
};

export default voucherScheduleService;