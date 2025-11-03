import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { orderService } from '../../store/api/orderService';; // Adjust the import path as needed

const TrackingLink = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const [trackingData, setTrackingData] = useState({
    actual_fee_amount: '',
    tracking_link: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingDeliveryId, setExistingDeliveryId] = useState(null);

  useEffect(() => {
    const fetchExistingDelivery = async () => {
      try {
        const deliveryInfo = await orderService.getOrderDelivery(orderId);
        if (deliveryInfo) {
          setTrackingData({
            actual_fee_amount: deliveryInfo.actual_fee_amount || '',
            tracking_link: deliveryInfo.tracking_link || '',
          });
          setExistingDeliveryId(deliveryInfo.id);
        }
      } catch (error) {
        toast.error(`Failed to load delivery information: ${error.message}`, {
          position: "top-right",
          autoClose: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingDelivery();
  }, [orderId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTrackingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!trackingData.actual_fee_amount || !trackingData.tracking_link) {
      toast.error('Fee amount and tracking link are required', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = {
        order_id: orderId,
        actual_fee_amount: parseFloat(trackingData.actual_fee_amount),
        tracking_link: trackingData.tracking_link,
      };

      let result;
      if (existingDeliveryId) {
        // Update existing delivery
        result = await orderService.updateOrderDelivery(
          existingDeliveryId,
          payload
        );
      } else {
        // Create new delivery
        result = await orderService.createOrderDelivery(payload);
      }
      
      toast.success('Tracking information saved successfully!', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      navigate(-1); // Go back after successful submission
    } catch (error) {
      toast.error(`Failed to save tracking information: ${error.message}`, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate(-1);


  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-6 px-6">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-indigo-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              {existingDeliveryId ? 'Update Tracking' : 'Add Tracking'} Information
            </h2>
            <button 
              onClick={handleBack}
              className="text-white hover:text-indigo-200"
            >
              <ArrowLeft size={20} />
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              TRACKING DETAILS
            </h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">

              <div>
                <label htmlFor="tracking_link" className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking URL 
                </label>
                <input
                  type="url"
                  id="tracking_link"
                  name="tracking_link"
                  value={trackingData.tracking_link}
                  onChange={handleChange}
                  placeholder="https://example.com/tracking/123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="actual_fee_amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Fee 
                </label>
                <input
                  type="number"
                  id="actual_fee_amount"
                  name="actual_fee_amount"
                  value={trackingData.actual_fee_amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrackingLink;