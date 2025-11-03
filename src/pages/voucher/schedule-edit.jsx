import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { VITE_API_BASE_URL } from '../../constant/config';
import voucherScheduleService from '../../store/api/voucherScheduleService';
import promoSettingsService from '../../store/api/promoSettingsService';
import '../../assets/scss/style.css'
import { MultiSelect } from 'primereact/multiselect';
import "primereact/resources/themes/lara-light-cyan/theme.css";

const ScheduleEditForm = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    promo_setting_id: "",
    voucher_schedule_mode: "",
    voucher_date_type: "",
    filter_membership: "",
    filter_customer_type: "",
    schedule_date: "",
    schedule_time: "",
    quantity: "",
    voucher_expiration: "",
    voucher_expiration_days: "",
    memberMode: [],
    customerMode: [],
  });

  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [voucherData, setVoucherData] = useState([]);
  const [tierData, setTierData] = useState([]);
  const [customerType, setCustomerType] = useState([]);

  const mapIdsToObjects = (ids, options) => {
    return ids
      .map(id => parseInt(id))
      .filter(id => !isNaN(id))
      .map(id => options.find(option => option.id === id))
      .filter(Boolean);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.promo_setting_id) {
      errors.promo_setting_id = "Voucher setting is required";
    }

    if (!formData.voucher_schedule_mode) {
      errors.voucher_schedule_mode = "Schedule mode is required";
    }

    if (!formData.quantity || formData.quantity <= 0) {
      errors.quantity = "Quantity must be greater than 0";
    }

    if (!formData.voucher_expiration_days || formData.voucher_expiration_days <= 0) {
      errors.voucher_expiration_days = "Expiration days must be greater than 0";
    }

    if (!formData.schedule_date) {
      errors.schedule_date = "Schedule date is required";
    }

    if (!formData.schedule_time) {
      errors.schedule_time = "Schedule time is required";
    }

    if (formData.customerMode.length === 0) {
      errors.customerMode = "At least one customer type must be selected";
    }

    if (formData.memberMode.length === 0) {
      errors.memberMode = "At least one membership tier must be selected";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const scheduleResponse = await voucherScheduleService.getById(scheduleId);
      const scheduleDetails = scheduleResponse.data;

      console.log('Schedule Details:', scheduleDetails);

      const validDateTypes = ['none', 'birth', 'membership', 'birthday', 'join_date'];
      const dateType = validDateTypes.includes(scheduleDetails.voucher_date_type) 
        ? scheduleDetails.voucher_date_type 
        : 'none';

      let voucherSettings = {};
      if (scheduleDetails.promo_setting_id) {
        try {
          const settingsResponse = await promoSettingsService.getById(scheduleDetails.promo_setting_id);
          voucherSettings = settingsResponse.data || {};
        } catch (error) {
          console.error("Error fetching voucher settings:", error);
        }
      }

      const memberModeArray = scheduleDetails.filter_membership 
        ? scheduleDetails.filter_membership.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        : [];
      const customerModeArray = scheduleDetails.filter_customer_type 
        ? scheduleDetails.filter_customer_type.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        : [];

      console.log('Parsed memberModeArray:', memberModeArray);
      console.log('Parsed customerModeArray:', customerModeArray);

      setFormData({
        ...scheduleDetails,
        voucher_name: voucherSettings.voucher_name || voucherSettings.voucher_title || "",
        voucher_title: voucherSettings.voucher_title || voucherSettings.voucher_name || "",
        voucher_type: voucherSettings.voucher_type || "",
        memberMode: memberModeArray,
        customerMode: customerModeArray,
        promo_setting_id: scheduleDetails.promo_setting_id || "",
        voucher_date_type: dateType,
        voucher_expiration_days: scheduleDetails.voucher_expiration || "",
        quantity: scheduleDetails.quantity || "",
        schedule_date: scheduleDetails.schedule_date || "",
        schedule_time: scheduleDetails.schedule_time ? scheduleDetails.schedule_time.slice(0, 5) : "",
        voucher_schedule_mode: scheduleDetails.voucher_schedule_mode || "",
      });

    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to load schedule data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const authToken = sessionStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      };

      const [promoResponse, tierResponse, customerResponse] = await Promise.all([
        promoSettingsService.getAll(),
        fetch(`${VITE_API_BASE_URL}settings/membership-tiers`, { headers }),
        fetch(`${VITE_API_BASE_URL}settings/customer-types`, { headers })
      ]);

      if (promoResponse && promoResponse.data) {
        setVoucherData(promoResponse.data);
      }

      if (tierResponse.ok) {
        const tierData = await tierResponse.json();
        setTierData(tierData.data || []);
      }

      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        setCustomerType(customerData.data || []);
      }

    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      toast.error("Failed to load dropdown data");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchDropdownData(); 
      await fetchInitialData(); 
    };
    loadData();
  }, [scheduleId]);

  const handleInputChange = (field, value) => {
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }

    if (field === 'promo_setting_id') {
      setFormData(prev => ({ ...prev, [field]: value }));
      
      if (value) {
        promoSettingsService.getById(value)
          .then(response => {
            const settings = response.data || {};
            setFormData(prev => ({
              ...prev,
              voucher_name: settings.voucher_name || settings.voucher_title || "",
              voucher_title: settings.voucher_title || settings.voucher_name || "",
              voucher_type: settings.voucher_type || "",
              amount: settings.amount || "",
              voucher_minimum_purchase: settings.voucher_minimum_purchase || "",
            }));
          })
          .catch(error => {
            console.error("Error fetching voucher settings:", error);
          });
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleDateTypeChange = (type) => {
    setFormData(prev => ({ ...prev, voucher_date_type: type }));
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        promo_setting_id: formData.promo_setting_id,
        voucher_schedule_mode: formData.voucher_schedule_mode,
        voucher_date_type: formData.voucher_date_type,
        filter_membership: formData.memberMode.join(','),
        filter_customer_type: formData.customerMode.join(','),
        schedule_date: formData.schedule_date,
        schedule_time: formData.schedule_time,
        quantity: formData.quantity,
        voucher_expiration: formData.voucher_expiration_days,
      };

      console.log('Submit Data:', submitData);

      await voucherScheduleService.update(scheduleId, submitData);
      navigate('/voucher/schedule');

      toast.success("Schedule updated successfully", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error(error.message || "Failed to update schedule");
    } finally {
      setLoading(false);
    }
  };

  const scheduleModeOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const voucherModeOptions = [
    { value: 'percentage', label: 'Percentage' },
    { value: 'fixed', label: 'Fixed Amount' },
    { value: 'free-delivery', label: 'Free Delivery' }
  ];

  if (loading) {
    return (
      <div className="inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full p-4 overflow-y-auto">
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-gray-900">Edit Schedule</h2>
          <button className="text-gray-400 hover:text-gray-600" onClick={handleBack}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-indigo-900 text-white text-center py-2 font-medium">
          VOUCHER SCHEDULE
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Voucher Settings */}
         <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voucher Settings <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={formData.promo_setting_id}
              onChange={e => handleInputChange('promo_setting_id', e.target.value)}
              className={`w-full px-4 py-3 border ${formErrors.promo_setting_id ? 'border-red-500' : 'border-gray-300'} rounded-lg appearance-none bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="" disabled>Choose</option>
              {voucherData.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          {formErrors.promo_setting_id && <p className="mt-1 text-sm text-red-600">{formErrors.promo_setting_id}</p>}
        </div>

          {/* Schedule Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Mode <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={formData.voucher_schedule_mode}
                onChange={e => handleInputChange('voucher_schedule_mode', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg appearance-none bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.voucher_schedule_mode ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Choose Schedule Mode</option>
                {scheduleModeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {formErrors.voucher_schedule_mode && (
              <p className="mt-1 text-sm text-red-600">{formErrors.voucher_schedule_mode}</p>
            )}
          </div>

          {/* Schedule Date & Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Date & Time <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={formData.schedule_date}
                onChange={(e) => handleInputChange('schedule_date', e.target.value)}
                className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.schedule_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <input
                type="time"
                value={formData.schedule_time}
                onChange={(e) => handleInputChange('schedule_time', e.target.value)}
                className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.schedule_time ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {(formErrors.schedule_date || formErrors.schedule_time) && (
              <p className="mt-1 text-sm text-red-600">
                {formErrors.schedule_date || formErrors.schedule_time}
              </p>
            )}
          </div>

          {/* Date Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Date Type
            </label>
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="dateType"
                  value="none"
                  checked={formData.voucher_date_type === 'none' || formData.voucher_date_type === ''}
                  onChange={() => handleDateTypeChange('none')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">None</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="dateType"
                  value="birth"
                  checked={formData.voucher_date_type === 'birth' || formData.voucher_date_type === 'birthday'}
                  onChange={() => handleDateTypeChange('birth')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Date of Birth</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="dateType"
                  value="membership"
                  checked={formData.voucher_date_type === 'membership' || formData.voucher_date_type === 'join_date'}
                  onChange={() => handleDateTypeChange('membership')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Membership Date</span>
              </label>
            </div>
          </div>

          {/* Customer Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Mode <span className="text-red-500">*</span>
            </label>
            <MultiSelect
              value={formData.customerMode}
              onChange={(e) => handleInputChange('customerMode', e.value)}
              options={customerType}
              optionLabel="name"
              optionValue="id"
              placeholder="Select Customer Types"
              display="chip"
              className={`w-full ${formErrors.customerMode ? 'border-red-500' : ''}`}
              style={{ minHeight: '44px' }}
              showClear
            />
            {formErrors.customerMode && (
              <p className="mt-1 text-sm text-red-600">{formErrors.customerMode}</p>
            )}
          </div>

          {/* Member Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member Mode <span className="text-red-500">*</span>
            </label>
            <MultiSelect
              value={formData.memberMode}
              onChange={(e) => handleInputChange('memberMode', e.value)}
              options={tierData}
              optionLabel="name"
              optionValue="id"
              placeholder="Select Membership Tiers"
              display="chip"
              className={`w-full ${formErrors.memberMode ? 'border-red-500' : ''}`}
              style={{ minHeight: '44px' }}
              showClear
            />
            {formErrors.memberMode && (
              <p className="mt-1 text-sm text-red-600">{formErrors.memberMode}</p>
            )}
          </div>

          {/* Expiration Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiration (Days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.voucher_expiration_days}
              onChange={e => handleInputChange('voucher_expiration_days', e.target.value)}
              placeholder="Enter number of days"
              className={`w-full px-4 py-3 border ${formErrors.voucher_expiration_days ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {formErrors.voucher_expiration_days && <p className="mt-1 text-sm text-red-600">{formErrors.voucher_expiration_days}</p>}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={e => handleInputChange('quantity', e.target.value)}
              placeholder="Enter quantity"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.quantity ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.quantity && (
              <p className="mt-1 text-sm text-red-600">{formErrors.quantity}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Schedule'}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ScheduleEditForm;