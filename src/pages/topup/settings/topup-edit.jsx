import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import topupService from '../../../store/api/topupsettingService';
import { toast } from 'react-toastify';

export default function EditTopup() {
  const {id} = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    amount: '',
    extraCredit: '',
    status: 'Active'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    async function fetchTopup() {
      try {
        setLoading(true);
        const data = await topupService.getTopupSettingById(Number(id));
        if (data) {
          setFormData({
            amount: data.topup_amount || '',
            extraCredit: data.credit_amount || '',
            status: data.status || 'Active'
          });
        } else {
          toast.error('Topup setting not found');
          navigate('/topup/topup_settings');
        }
      } catch (error) {
        console.error('Error fetching topup setting:', error);
        toast.error('Failed to load topup setting.');
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    }

    if (initialLoad && id) {
      fetchTopup();
    }
  }, [initialLoad, id, navigate]);

  const validateData = () => {
    if (!formData.amount.trim()) {
      setError("Amount is required");
      return false;
    }
    if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
      setError("Amount must be a positive number");
      return false;
    }

    if (!formData.extraCredit.trim()) {
      setError("Extra Credit is required");
      return false;
    }
    if (isNaN(formData.extraCredit) || Number(formData.extraCredit) < 0) {
      setError("Extra Credit must be a non-negative number");
      return false;
    }

    const validStatuses = ["active", "inactive", "Active", "Inactive"];
    if (!validStatuses.includes(formData.status)) {
      setError("Status must be Active or Inactive");
      return false;
    }

    setError(null);
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!validateData()) return;
    
    setLoading(true);
    try {
      await topupService.updateTopupSetting(id, {
        topup_amount: formData.amount,
        credit_amount: formData.extraCredit,
        status: formData.status
      });
      
      // console.log('Updating topup setting:', formData);
      navigate("/topup/topup_settings");
    } catch (error) {
      console.error('Error saving topup:', error);
      toast.error('Error saving topup setting');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleCancel = () => {
    setInitialLoad(true);
    navigate(-1);
  };
  return (
    <div className="bg-white p-8 max-w-5xl mx-auto">
      <div className="bg-white">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Topup
          </h1>
          <button 
            className="text-gray-400 hover:text-gray-600 transition-colors" 
            onClick={handleBack}
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-red-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M5.22 5.22a9 9 0 1112.73 12.73A9 9 0 015.22 5.22z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div>
          <div className="bg-indigo-900 px-6 py-2">
            <h2 className="text-white text-lg font-semibold text-center">TOPUP DETAILS</h2>
          </div>
          
          <div className="bg-white p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Amount
                </label>
                <input
                  type="text"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter here..."
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Extra Credit
                </label>
                <input
                  type="text"
                  name="extraCredit"
                  value={formData.extraCredit}
                  onChange={handleInputChange}
                  placeholder="Enter here..."
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors text-gray-500"
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors appearance-none bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-3 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              'Save Topup Setting'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}