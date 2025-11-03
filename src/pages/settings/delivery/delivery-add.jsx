import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VITE_API_BASE_URL } from "../../../constant/config";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DeliveryAdd() {
  const [formData, setFormData] = useState({
    deliveryRangeStart: '',
    deliveryRangeEnd: '',
    pricePerKm: '',
    minimumPurchase: '',
    discountAmount: '',
  });

  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancel = () => {
    setFormData({
      deliveryRangeStart: '',
      deliveryRangeEnd: '',
      pricePerKm: '',
      minimumPurchase: '',
      discountAmount: '',
    });
    navigate('/settings/delivery_settings');
  };

  const handleSave = async () => {
    const token = sessionStorage.getItem("token");
    const payload = {
      start_km: formData.deliveryRangeStart,
      end_km: formData.deliveryRangeEnd,
      price_per_km: formData.pricePerKm,
      min_purchase_discount: formData.minimumPurchase,
      discount_amount: formData.discountAmount,
      status: "active"
    };

    try {
      const response = await fetch(
        VITE_API_BASE_URL + "delivery-settings/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (response.ok) {
        toast.success(result.message || "Delivery setting created!");
        navigate('/settings/delivery_settings');
      } else {
        toast.error(result.message || "Failed to create delivery setting.");
        console.error(result.message || "Failed to create delivery setting.");
      }
    } catch (err) {
      toast.error("Unexpected error: " + err.message);
      console.error("Unexpected error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">

        <div className="px-6 pt-6">
          <h1 className="text-xl font-semibold text-gray-900">New Delivery Fees</h1>
        </div>

        <div className="p-6">
          <div className="space-y-6">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Range *
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Start KM</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.deliveryRangeStart}
                    onChange={(e) => handleInputChange('deliveryRangeStart', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                  />
                </div>
                <span className="pt-5 text-gray-500">-</span>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">End KM</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.deliveryRangeEnd}
                    onChange={(e) => handleInputChange('deliveryRangeEnd', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                  />
                </div>
              </div>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">RM</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.pricePerKm}
                  onChange={(e) => handleInputChange('pricePerKm', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Purchase For Discount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">RM</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.minimumPurchase}
                  onChange={(e) => handleInputChange('minimumPurchase', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">RM</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.discountAmount}
                  onChange={(e) => handleInputChange('discountAmount', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}