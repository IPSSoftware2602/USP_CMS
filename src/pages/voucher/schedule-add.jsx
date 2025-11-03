import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import voucherScheduleService from '../../store/api/voucherScheduleService';
import membershipTierService from '../../store/api/membershipService';
import customerTypeService from '../../store/api/cusTypeService';
import promoSettingsService from '../../store/api/promoSettingsService';
import '../../assets/scss/style.css'
import { MultiSelect } from 'primereact/multiselect';
import "primereact/resources/themes/lara-light-cyan/theme.css";

const ScheduleAddForm = () => {
  const [formData, setFormData] = useState({
    promo_setting_id: "",
    voucher_setting_id: "",
    voucher_schedule_mode: "",
    voucher_date_type: "none",
    filter_membership: "",
    filter_customer_type: "",
    schedule_date: "",
    schedule_time: "",
    quantity: "",
    voucher_expiration_days: "",
    memberMode: [],
    customerMode: []
  });


  const [selectedVoucherDetails, setSelectedVoucherDetails] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tierData, setTierData] = useState([]);
  const [customerType, setCustomerType] = useState([]);
  const [voucherData, setVoucherData] = useState([]);
  const [voucherOptions, setVoucherOptions] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    if (field === 'voucher_setting_id') {
      const selectedVoucher = voucherData.find(v => v.id == value);
      setSelectedVoucherDetails(selectedVoucher);

      setFormData(prev => ({
        ...prev,
        [field]: value,
        voucher_date_type: selectedVoucher?.dateType || '',
        voucher_minimum_purchase: selectedVoucher?.minimum_purchase || '',
        voucher_type: selectedVoucher?.voucher_type || ''
      }));
    } else if (field === 'voucher_expiration_days') {
      const days = Number(value);
      setFormData(prev => ({
        ...prev,
        voucher_expiration_days: value
      }));
      if (days <= 0) {
        setErrors(prev => ({
          ...prev,
          voucher_expiration_days: 'Expiration days must be greater than 0'
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleDateTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      voucher_date_type: type
    }));
  };

  const handleBack = () => {
    navigate(-1);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.voucher_setting_id) {
      newErrors.voucher_setting_id = 'Voucher setting is required';
    }

    if (!formData.voucher_schedule_mode) {
      newErrors.voucher_schedule_mode = 'Schedule mode is required';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!formData.voucher_expiration_days || Number(formData.voucher_expiration_days) <= 0) {
      newErrors.voucher_expiration_days = 'Expiration days must be greater than 0';
    }

    if (!formData.schedule_date) {
      newErrors.schedule_date = 'Schedule date is required';
    }

    if (!formData.schedule_time) {
      newErrors.schedule_time = 'Schedule time is required';
    }

    if (formData.customerMode.length === 0) {
      newErrors.customerMode = 'At least one customer type must be selected';
    }

    if (formData.memberMode.length === 0) {
      newErrors.memberMode = 'At least one membership tier must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const customerType = formData.customerMode.join(',');
      const membershipType = formData.memberMode.join(',');

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const time = now.toTimeString().split(' ')[0];

      const submitData = {
        promo_setting_id: formData.voucher_setting_id,
        voucher_schedule_mode: formData.voucher_schedule_mode,
        voucher_date_type: formData.voucher_date_type,
        filter_membership: formData.memberMode.join(','),
        filter_customer_type: formData.customerMode.join(','),
        schedule_date: formData.schedule_date,
        schedule_time: formData.schedule_time,
        quantity: formData.quantity,
        voucher_expiration: formData.voucher_expiration_days,
      };

      console.log('Submitting data:', submitData);

      const response = await voucherScheduleService.create(submitData);

      toast.success("Voucher schedule created successfully", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        onClose: () => {
          navigate(-1);
        },
      });

      navigate('/voucher/schedule');

    } catch (error) {
      console.error("Error creating voucher schedule:", error);
      toast.error(error.message || "Failed to create voucher schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scheduleModeOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const fetchTierData = async () => {
    try {
      const response = await membershipTierService.getAll();
      setTierData(response.data || []);
    } catch (error) {
      console.error("Error fetching tier data:", error);
      toast.error("Failed to load membership tiers");
    }
  };

  const fetchCustomerType = async () => {
    try {
      const response = await customerTypeService.getAll();
      setCustomerType(response.data || []);
    } catch (error) {
      console.error("Error fetching customer type data:", error);
      toast.error("Failed to load customer types");
    }
  };

  const fetchVoucherData = async () => {
    try {
      const response = await promoSettingsService.getAll();
      console.log('API Response:', response);
      console.log('Response data:', response.data);

      if (response.data && Array.isArray(response.data)) {
        setVoucherOptions(response.data);
      } else {
        console.warn('Unexpected data structure:', response);
      }
    } catch (error) {
      console.error('Error fetching voucher data:', error);
    }
  };

  useEffect(() => {
    fetchTierData();
    fetchCustomerType();
    fetchVoucherData();
  }, []);

  return (
    <div className="inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full p-4 overflow-y-auto">
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-gray-900">Add New Schedule</h2>
          <button className="text-gray-400 hover:text-gray-600" onClick={handleBack}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-indigo-900 text-white text-center py-2 font-medium">
          VOUCHER SCHEDULE
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voucher Settings <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={formData.voucher_setting_id}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selected = voucherOptions.find(option => option.id === selectedId);

                  setSelectedVoucher(selected);

                  handleInputChange('voucher_setting_id', selectedId);

                  setFormData(prev => ({
                    ...prev,
                    voucher_setting_id: selectedId,
                    voucher_date_type: selected?.voucher_type || '',
                    voucher_minimum_purchase: selected?.minimum_purchase || '',
                    voucher_type: selected?.voucher_type || ''
                  }));

                  setSelectedVoucherDetails({
                    ...selected,
                    voucher_type: selected?.voucher_type || '',
                    minimum_purchase: selected?.minimum_purchase || ''
                  });
                }}
                className={`w-full px-4 py-3 border ${errors.voucher_setting_id ? 'border-red-500' : 'border-gray-300'} rounded-lg appearance-none bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="">Choose</option>
                {voucherOptions.map((voucher) => (
                  <option key={voucher.id} value={voucher.id}>
                    {voucher.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {errors.voucher_setting_id && <p className="mt-1 text-sm text-red-600">{errors.voucher_setting_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Mode <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={formData.voucher_schedule_mode}
                onChange={e => handleInputChange('voucher_schedule_mode', e.target.value)}
                className={`w-full px-4 py-3 border ${errors.voucher_schedule_mode ? 'border-red-500' : 'border-gray-300'} rounded-lg appearance-none bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="" disabled>Choose</option>
                {scheduleModeOptions.map((option, index) => (
                  <option key={index} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {errors.voucher_schedule_mode && <p className="mt-1 text-sm text-red-600">{errors.voucher_schedule_mode}</p>}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.schedule_date}
                onChange={e => handleInputChange('schedule_date', e.target.value)}
                className={`w-full px-4 py-3 border ${errors.schedule_date ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              {errors.schedule_date && <p className="mt-1 text-sm text-red-600">{errors.schedule_date}</p>}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.schedule_time}
                onChange={e => handleInputChange('schedule_time', e.target.value)}
                className={`w-full px-4 py-3 border ${errors.schedule_time ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              {errors.schedule_time && <p className="mt-1 text-sm text-red-600">{errors.schedule_time}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Date Type
            </label>
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="dateType"
                  checked={formData.voucher_date_type === 'none'}
                  onChange={() => handleDateTypeChange('none')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">None</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="dateType"
                  checked={formData.voucher_date_type === 'birth'}
                  onChange={() => handleDateTypeChange('birth')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Date of Birth</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="dateType"
                  checked={formData.voucher_date_type === 'membership'}
                  onChange={() => handleDateTypeChange('membership')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Membership Date</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Mode <span className="text-red-500">*</span>
            </label>
            <MultiSelect
              value={formData.customerMode}
              onChange={(e) => handleInputChange('customerMode', e.target.value)}
              options={customerType}
              optionLabel="name"
              optionValue="id"
              placeholder="Select Customer Types"
              display="chip"
              className={`w-full ${errors.customerMode ? 'p-invalid' : ''} border ${errors.voucher_expiration_days ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {errors.customerMode && <p className="mt-1 text-sm text-red-600">{errors.customerMode}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member Mode <span className="text-red-500">*</span>
            </label>
            <MultiSelect
              value={formData.memberMode}
              onChange={(e) => handleInputChange('memberMode', e.target.value)}
              options={tierData}
              optionLabel="name"
              optionValue="id"
              placeholder="Select Membership Tiers"
              display="chip"
              className={`w-full ${errors.memberMode ? 'p-invalid' : ''} border ${errors.voucher_expiration_days ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {errors.memberMode && <p className="mt-1 text-sm text-red-600">{errors.memberMode}</p>}
          </div>

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
              className={`w-full px-4 py-3 border ${errors.voucher_expiration_days ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {errors.voucher_expiration_days && <p className="mt-1 text-sm text-red-600">{errors.voucher_expiration_days}</p>}
          </div>

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
              className={`w-full px-4 py-3 border ${errors.quantity ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ScheduleAddForm;