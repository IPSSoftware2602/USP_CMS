import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Upload, Bold, Italic, Underline, Link, List, AlignLeft, Info, Trash2, ChevronDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import voucherService from '../../store/api/voucherService';
import promoSettingsService from '../../store/api/promoSettingsService';
import '../../assets/scss/style.css'
import { zip } from 'd3-array';

export default function EditVoucherLists() {
  const { voucherId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expiryType, setExpiryType] = useState('date');
  
  const [formData, setFormData] = useState({
    voucher_name: "",
    voucherCategory: "",
    voucher_minimum_purchase: "",
    voucher_total_count: "",
    voucher_redeem_count: "",
    voucher_count_customer: "",
    voucher_expiry_type: "",
    voucher_expiry_value: "",
    voucher_expired_date: "",
    voucherTimesOfUse: "",
    claimableByPoints: "",
    voucher_point_redeem: "",
    voucher_type: "",
    voucher_image_url: "",
    voucher_details: "",
    voucher_tnc: "",
    voucher_status: "",
    promoMinPurchaseType: "",
    promoMinPurchase: "",
    promoTypeSelection: "",
    promoType: "",
    promo2ndItemOffValue: "",
    promo_setting_id: "",
    alaCarteMenuRows: [{ menuType: "", menu: "", sizing: "" }],
    promoDiscountRows: [{ menuType: "", menu: "", sizing: "" }]
  });

  const [imageURL, setImageURL] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const hiddenInput = useRef(null);

  const [promoSettings, setPromoSettings] = useState([]);
  const [loadingPromoSettings, setLoadingPromoSettings] = useState(false);

  useEffect(() => {
    fetchVoucherData();
  }, [voucherId]);

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

  const fetchVoucherData = async () => {
    try {
      setLoading(true);
      const response = await voucherService.getById(voucherId);
      const voucherDetails = response.data;
      
      if (voucherDetails.voucher_image_url) {
        setImageURL(voucherDetails.voucher_image_url);
      }
      
      setFormData(prev => ({
        ...prev,
        voucher_name: voucherDetails.voucher_name || "",
        voucherCategory: voucherDetails.voucher_category || "",
        voucher_minimum_purchase: voucherDetails.voucher_minimum_purchase || "",
        voucher_total_count: voucherDetails.voucher_total_count || "",
        voucher_redeem_count: voucherDetails.voucher_redeem_count || "",
        voucher_count_customer: voucherDetails.voucher_count_customer || "",
        voucher_expiry_type: formData.voucher_expiry_type || 'date',
        voucher_expiry_value: voucherDetails.voucher_expiry_value || "",
        voucher_expired_date: voucherDetails.voucher_expired_date || "",
        claimableByPoints: voucherDetails.claimable_by_points || "",
        voucher_point_redeem: voucherDetails.voucher_point_redeem || "",
        voucher_type: voucherDetails.voucher_type || "",
        voucher_image_url: voucherDetails.voucher_image_url || "",
        voucher_details: voucherDetails.voucher_details || "",
        voucher_tnc: voucherDetails.voucher_tnc || "",
        voucher_status: voucherDetails.voucher_status || "",
        promo_setting_id: voucherDetails.promo_setting_id || "",
      }));

      setExpiryType(voucherDetails.voucher_expiry_type || 'date');

    } catch (error) {
      console.error("Error fetching voucher data:", error);
      toast.error(error.message || "Failed to load voucher data");
      
      if (error.message.includes('Authentication failed')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const [showPromoDiscountTag, setShowPromoDiscountTag] = useState(true);
  const [textFormatting, setTextFormatting] = useState({
    bold: false,
    italic: false,
    underline: false
  });

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

  const handleClick = () => hiddenInput.current.click();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    setImageURL(URL.createObjectURL(file));
    
    setFormData(prev => ({
      ...prev,
      voucher_image: file,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const updateData = {
        voucher_name: formData.voucher_name,
        voucher_minimum_purchase: formData.voucher_minimum_purchase,
        voucher_total_count: parseInt(formData.voucher_total_count) || 0,
        voucher_redeem_count: parseInt(formData.voucher_redeem_count) || 0,
        voucher_count_customer: parseInt(formData.voucher_count_customer) || 0,
        voucher_expiry_type: expiryType,
        voucher_expiry_value: expiryType === 'days' ? formData.voucher_expiry_value : null,
        voucher_expired_date: expiryType === 'date' ? formData.voucher_expired_date : null,
        voucher_point_redeem: parseInt(formData.voucher_point_redeem) || 0,
        voucher_type: formData.voucher_type,
        voucher_details: formData.voucher_details,
        voucher_tnc: formData.voucher_tnc,
        voucher_status: formData.voucher_status || 'active',
        promo_setting_id: formData.promo_setting_id || null,
      };

      if (selectedFile) {
        updateData.voucher_image = selectedFile;
      }

      console.log('Updating voucher with data:', updateData);

      const response = await voucherService.update(voucherId, updateData);
      navigate('/voucher/lists');
      
      toast.success(response.message || "Voucher updated successfully!", {
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
      console.error("Error updating voucher:", error);
      toast.error(error.message || "Failed to update voucher");
      
      if (error.message.includes('Authentication failed')) {
        navigate('/login');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-900"></div>
            <span className="ml-3 text-lg">Loading voucher data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full overflow-y-auto">
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-gray-900">Edit Voucher</h2>
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="bg-indigo-900 text-white px-4 py-3 text-center font-medium mb-6">
              VOUCHER INFORMATION
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Voucher Name
                </label>
                <input
                  type="text"
                  placeholder="Enter here"
                  value={formData.voucher_name}
                  onChange={(e) => handleInputChange('voucher_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Total Voucher Count
                </label>
                <input
                  type="text"
                  placeholder="Enter here"
                  value={formData.voucher_total_count}
                  onChange={(e) => handleInputChange('voucher_total_count', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                  Voucher Times of Use / Customer
                </label>
                <input
                  type="text"
                  placeholder="Enter here"
                  value={formData.voucher_count_customer}
                  onChange={(e) => handleInputChange('voucher_count_customer', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

             <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Voucher Expiry Type
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="expiryType"
                    value="date"
                    checked={expiryType === 'date'}
                    onChange={() => setExpiryType('date')}
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
                    onChange={() => setExpiryType('days')}
                    className="form-radio h-4 w-4 text-indigo-600"
                  />
                  <span className="ml-2">Expiry Days</span>
                </label>
              </div>
            </div>

            {expiryType === 'days' && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Voucher Expiry Days
                </label>
                <input
                  type="number"
                  placeholder="Enter number of days"
                  value={formData.voucher_expiry_value}
                  onChange={(e) => handleInputChange('voucher_expiry_value', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  min="1"
                />
              </div>
            )}

            {expiryType === 'date' && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Voucher Expired Date
                </label>
                <input
                  type="date"
                  value={formData.voucher_expired_date}
                  onChange={(e) => handleInputChange('voucher_expired_date', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
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
                  Points Required
                </label>
                <input
                  type="number"
                  placeholder="Enter here"
                  value={formData.voucher_point_redeem}
                  onChange={(e) => handleInputChange('voucher_point_redeem', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                    alt="Voucher preview"
                    className="mx-auto max-h-64 w-auto object-contain rounded"
                  />
                  <p className="text-sm text-gray-500 mt-2">Click to change image</p>
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
                Voucher Details
              </label>
              <textarea
                placeholder="Enter here"
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
              rows={6}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              onClick={handleBack}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
      
      <ToastContainer />
    </div>
  );
}