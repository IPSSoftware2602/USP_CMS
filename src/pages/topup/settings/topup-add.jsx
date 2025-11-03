import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import topupService from '../../../store/api/topupsettingService';

export default function AddNewTopup() {
  const [formData, setFormData] = useState({
    amount: '',
    extraCredit: '',
    status: 'Active',
    minAmount: '',
    maxAmount: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const validateData = () => {
    if (!formData.amount.trim()) {
      setError("Amount is required.");
      return false;
    }
    if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
      setError("Amount must be a positive number.");
      return false;
    }

    if (!formData.extraCredit.trim()) {
      setError("Extra Credit is required.");
      return false;
    }
    if (isNaN(formData.extraCredit) || Number(formData.extraCredit) < 0) {
      setError("Extra Credit must be a non-negative number.");
      return false;
    }

    const validStatuses = ["active", "inactive", "Active", "Inactive"];
    if (!validStatuses.includes(formData.status)) {
      setError("Status must be Active or Inactive.");
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
    setError(null);
    try {
      await topupService.createTopupSetting({
        topup_amount: formData.amount.trim(),
        credit_amount: formData.extraCredit.trim(),
        status: formData.status.toLowerCase()
      });
      navigate('/topup/topup_settings');
    } catch (err) {
      console.error('Error saving topup:', err);
      setError('Failed to save topup setting.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleCancel = () => {
    setFormData({
      amount: '',
      extraCredit: '',
      status: 'Active',
      minAmount: '',
      maxAmount: '',
      description: ''
    });

    navigate('/topup/topup_settings');
  };

  return (
    <div className="bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-full">
        <div className="flex justify-between items-center p-6 border-gray-200">
          <h1 className="text-2xl font-bold mt-2 text-gray-900">Add New Topup</h1>
          <button className="text-gray-500 hover:text-gray-700" onClick={handleBack}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
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

          <div className="mb-8">
            <div className="bg-indigo-900 px-6 py-2">
              <h2 className="text-lg text-white font-semibold text-center">TOPUP DETAILS</h2>
            </div>

            <div className="p-6 rounded-b-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="text"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="Enter here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Extra Credit</label>
                  <input
                    type="text"
                    name="extraCredit"
                    value={formData.extraCredit}
                    onChange={handleInputChange}
                    placeholder="Enter here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-gray-200">
            <button
              onClick={handleCancel}
              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800 transition-colors font-medium"
            >
              Save Topup Setting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}