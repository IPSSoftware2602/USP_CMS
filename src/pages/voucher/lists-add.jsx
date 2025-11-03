import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Upload, Bold, Italic, Underline, Link, List, AlignLeft, Info, Trash2, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import voucherService from '../../store/api/voucherService';
import promoSettingsService from '../../store/api/promoSettingsService';
import '../../assets/scss/style.css'


export default function AddVoucherLists() {
  const [formData, setFormData] = useState({
    voucher_name: "",
    voucher_minimum_purchase: "",
    voucher_total_count: "",
    voucher_redeem_count: "",
    voucher_count_customer: "1",
    voucher_expiry_type: "",
    voucher_expiry_value: "",
    voucher_expired_date: "",
    voucher_point_redeem: "",
    voucher_type: "",
    voucher_image: null,
    voucher_details: "",
    voucher_tnc: "",
    voucher_status: "active",
    promo_setting_id: "",
    voucherCategory: "",
    voucherTimesOfUse: "",
    claimableByPoints: "",
    promoMinPurchaseType: "",
    promoMinPurchase: "",
    promoTypeSelection: "",
    promoType: "",
    promo2ndItemOffValue: "",
    alaCarteMenuRows: [{ menuType: "", menu: "", sizing: "" }],
    promoDiscountRows: [{ menuType: "", menu: "", sizing: "" }]
  });

  const [expiryType, setExpiryType] = useState(''); // Add expiryType state
  const [isLoading, setIsLoading] = useState(false);
  const [showPromoDiscountTag, setShowPromoDiscountTag] = useState(true);
  const [textFormatting, setTextFormatting] = useState({
    bold: false,
    italic: false,
    underline: false
  });

  // New state for promo settings
  const [promoSettings, setPromoSettings] = useState([]);
  const [loadingPromoSettings, setLoadingPromoSettings] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPromoSettings = async () => {
      setLoadingPromoSettings(true);
      try {
        const response = await promoSettingsService.getAll();
        console.log('Promo settings response:', response);

        const settings = response.data || response.promoSettings || response || [];
        setPromoSettings(Array.isArray(settings) ? settings : []);
      } catch (error) {
        console.error('Error fetching promo settings:', error);
        toast.error('Failed to load promo settings');
        setPromoSettings([]);
      } finally {
        setLoadingPromoSettings(false);
      }
    };

    fetchPromoSettings();
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addAlaCarteRow = () => {
    setFormData(prev => ({
      ...prev,
      alaCarteMenuRows: [...prev.alaCarteMenuRows, { menuType: '', menu: '', sizing: '' }]
    }));
  };

  const removeAlaCarteRow = (index) => {
    setFormData(prev => ({
      ...prev,
      alaCarteMenuRows: prev.alaCarteMenuRows.filter((_, i) => i !== index)
    }));
  };

  const updateAlaCarteRow = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      alaCarteMenuRows: prev.alaCarteMenuRows.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    }));
  };

  const addPromoDiscountRow = () => {
    setFormData(prev => ({
      ...prev,
      promoDiscountRows: [...prev.promoDiscountRows, { menuType: '', menu: '', sizing: '' }]
    }));
  };

  const removePromoDiscountRow = (index) => {
    setFormData(prev => ({
      ...prev,
      promoDiscountRows: prev.promoDiscountRows.filter((_, i) => i !== index)
    }));
  };

  const updatePromoDiscountRow = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      promoDiscountRows: prev.promoDiscountRows.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    }));
  };

  const handleTextFormat = (format) => {
    setTextFormatting(prev => ({ ...prev, [format]: !prev[format] }));
  };

  const [imageURL, setImageURL] = useState('');
  const hiddenInput = useRef(null);

  const handleClick = () => hiddenInput.current.click();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Image uploaded:', file.name);
      setImageURL(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, voucher_image: file }));
    }
  };

  const prepareApiData = () => {
    const data = {
      voucher_name: formData.voucher_name,
      voucher_total_count: parseInt(formData.voucher_total_count) || 1,
      voucher_point_redeem: parseInt(formData.voucher_point_redeem) || 0,
      promo_setting_id: formData.promo_setting_id,
      voucher_details: formData.voucher_details,
    };

    // Add optional fields only if they have values
    if (formData.voucher_minimum_purchase) {
      data.voucher_minimum_purchase = parseFloat(formData.voucher_minimum_purchase);
    }

    if (formData.voucher_redeem_count) {
      data.voucher_redeem_count = parseInt(formData.voucher_redeem_count) || 0;
    }

    if (formData.voucher_count_customer) {
      data.voucher_count_customer = parseInt(formData.voucher_count_customer) || 1;
    }

    if (expiryType === 'days' && formData.voucher_expiry_value) {
      data.voucher_expiry_value = parseInt(formData.voucher_expiry_value);
      data.voucher_expiry_type = expiryType;
    } else if (expiryType === 'date' && formData.voucher_expired_date) {
      data.voucher_expired_date = formData.voucher_expired_date;
      data.voucher_expiry_type = expiryType;
    }

    if (formData.voucher_type) {
      data.voucher_type = formData.voucher_type;
    }

    if (formData.voucher_image) {
      data.voucher_image = formData.voucher_image;
    }

    if (formData.voucher_tnc) {
      data.voucher_tnc = formData.voucher_tnc;
    }

    if (formData.voucher_status) {
      data.voucher_status = formData.voucher_status;
    }

    return data;
  };

  const validateForm = () => {
    const requiredFields = [
      'voucher_name',
      'voucher_total_count',
      'voucher_point_redeem',
      'promo_setting_id',
      'voucher_details',
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error(`Please fill in the ${field.replace(/_/g, ' ')}`);
        return false;
      }
    }

    // Additional validations
    if (parseInt(formData.voucher_total_count) <= 0) {
      toast.error('Total voucher count must be greater than 0');
      return false;
    }

    if (formData.voucher_redeem_count && parseInt(formData.voucher_redeem_count) < 0) {
      toast.error('Voucher redeem count cannot be negative');
      return false;
    }

    if (formData.voucher_count_customer && parseInt(formData.voucher_count_customer) <= 0) {
      toast.error('Voucher count per customer must be greater than 0');
      return false;
    }

    if (expiryType === 'days' && (!formData.voucher_expiry_value || parseInt(formData.voucher_expiry_value) <= 0)) {
      toast.error('Voucher expiry days must be greater than 0');
      return false;
    }

    if (expiryType === 'date' && !formData.voucher_expired_date) {
      toast.error('Please select a voucher expiry date');
      return false;
    }

    if (parseInt(formData.voucher_point_redeem) <= 0) {
      toast.error('Please enter valid points required for redemption');
      return false;
    }

    return true;
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const apiData = prepareApiData();
      console.log('Creating voucher with data:', apiData);

      const response = await voucherService.create(apiData);

      navigate('/voucher/lists');

      toast.success(response.message || "Voucher created successfully!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

    } catch (error) {
      console.error("Error creating voucher:", error);
      toast.error(error.message || "Failed to create voucher. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      voucher_name: "",
      voucher_minimum_purchase: "",
      voucher_total_count: "",
      voucher_redeem_count: "",
      voucher_count_customer: "1",
      voucher_expiry_type: "date",
      voucher_expiry_value: "",
      voucher_expired_date: "",
      voucher_point_redeem: "",
      voucher_type: "",
      voucher_image: null,
      voucher_details: "",
      voucher_tnc: "",
      voucher_status: "active",
      promo_setting_id: "",
      voucherCategory: "",
      voucherTimesOfUse: "",
      claimableByPoints: "",
      promoMinPurchaseType: "",
      promoMinPurchase: "",
      promoTypeSelection: "",
      promoType: "",
      promo2ndItemOffValue: "",
      alaCarteMenuRows: [{ menuType: "", menu: "", sizing: "" }],
      promoDiscountRows: [{ menuType: "", menu: "", sizing: "" }]
    });
    setExpiryType('date'); // Reset expiry type
    setImageURL('');
  };

  return (
    <div className="inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full overflow-y-auto">
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-gray-900">Add New Voucher</h2>
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-6">
          <div>
            <div className="bg-indigo-900 text-white px-4 py-3 text-center font-medium mb-6">
              VOUCHER INFORMATION
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Voucher Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter voucher name"
                  value={formData.voucher_name}
                  onChange={(e) => handleInputChange('voucher_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Total Voucher Count <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter total voucher count"
                  value={formData.voucher_total_count}
                  onChange={(e) => handleInputChange('voucher_total_count', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Voucher Redeem Count <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter voucher redeem count"
                  value={formData.voucher_redeem_count}
                  onChange={(e) => handleInputChange('voucher_redeem_count', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Voucher Times of Use / Customer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter here"
                  value={formData.voucher_count_customer}
                  onChange={(e) => handleInputChange('voucher_count_customer', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Voucher Expiry Type Section - Applied from EditVoucherLists */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Voucher Expiry Type <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="expiryType"
                      value="date"
                      checked={expiryType === 'date'}
                      onChange={() => {
                        setExpiryType('date');
                        // Clear the days value when switching to date
                        if (formData.voucher_expiry_value) {
                          handleInputChange('voucher_expiry_value', '');
                        }
                      }}
                      className="form-radio h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-2">Fixed Date</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="expiryType"
                      value="days"
                      checked={expiryType === 'days'}
                      onChange={() => {
                        setExpiryType('days');
                        // Clear the date value when switching to days
                        if (formData.voucher_expired_date) {
                          handleInputChange('voucher_expired_date', '');
                        }
                      }}
                      className="form-radio h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-2">Expiry Days</span>
                  </label>
                </div>
              </div>

              {expiryType === 'days' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Voucher Expiry Days <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Enter number of days (e.g., 30)"
                    value={formData.voucher_expiry_value}
                    onChange={(e) => {
                      const value = Math.max(1, parseInt(e.target.value) || '');
                      handleInputChange('voucher_expiry_value', value);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    min="1"
                    required={expiryType === 'days'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Number of days after claim that the voucher will expire
                  </p>
                </div>
              )}

              {expiryType === 'date' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Voucher Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.voucher_expired_date}
                    onChange={(e) => handleInputChange('voucher_expired_date', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    min={new Date().toISOString().split('T')[0]} // Prevent past dates
                    required={expiryType === 'date'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Select the date when this voucher will expire
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-indigo-900 text-white px-4 py-3 text-center font-medium mb-6">
              REDEMPTION SETTINGS
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Points Required <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter points required"
                  value={formData.voucher_point_redeem}
                  onChange={(e) => handleInputChange('voucher_point_redeem', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Promo Setting <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.promo_setting_id}
                    onChange={(e) => handleInputChange('promo_setting_id', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white pr-10"
                    required
                    disabled={loadingPromoSettings}
                  >
                    <option value="">
                      {loadingPromoSettings ? 'Loading...' : 'Choose promo setting'}
                    </option>
                    {promoSettings.map((setting) => (
                      <option key={setting.id} value={setting.id}>
                        {setting.promo_name || setting.name || setting.title || `Setting ${setting.id}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
                {loadingPromoSettings && (
                  <p className="text-sm text-gray-500 mt-1">Loading promo settings...</p>
                )}
              </div>

            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Voucher Image
              </label>
              {imageURL ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center hover:border-gray-400 transition-colors cursor-pointer" onClick={handleClick}>
                  <img
                    src={imageURL}
                    alt="Uploaded preview"
                    className="mx-auto max-h-48 w-auto object-contain rounded"
                  />
                  <p className="mt-2 text-sm text-gray-500">Click to change image</p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer" onClick={handleClick}>
                  <Upload className="mx-auto mb-3 text-gray-400" size={48} />
                  <p className="text-gray-500 font-medium">Add Image</p>
                </div>
              )}

              <input
                ref={hiddenInput}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="voucher-image"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Voucher Details <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Enter voucher details"
                value={formData.voucher_details}
                onChange={(e) => handleInputChange('voucher_details', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>

          <div>
            <div className="bg-indigo-900 text-white px-4 py-3 text-center font-medium mb-6">
              TERMS & CONDITIONS
            </div>

            <textarea
              value={formData.voucher_tnc}
              onChange={(e) => handleInputChange('voucher_tnc', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none mb-4"
              placeholder="Enter terms and conditions"
              rows={6}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Voucher'}
            </button>
          </div>
        </form>
      </div>

      <ToastContainer />
    </div>
  );
}