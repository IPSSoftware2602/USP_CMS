import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../../store/api/orderService';
import { ArrowLeft, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const EditTime = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minTime, setMinTime] = useState('');
  const [minDate, setMinDate] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orderData = await orderService.getOrderById(id);
        
        // Check if order is completed
        if (orderData.status === 'complete') {
          setError('Cannot modify schedule for completed orders');
          return;
        }
        
        setOrder(orderData);
        setSelectedTime(orderData.selected_time?.split(' ')[1] || '');
        setSelectedDate(orderData.selected_date || '');

        // Calculate minimum time (60 minutes after created_at)
        if (orderData.created_at) {
          const createdDate = new Date(orderData.created_at);
          const minPickupDate = new Date(createdDate.getTime() + 60 * 60000); // Add 60 minutes
          
          // Format as YYYY-MM-DD for date input
          const minDateStr = minPickupDate.toISOString().split('T')[0];
          setMinDate(minDateStr);
          
          // Format as HH:MM for time input
          const hours = minPickupDate.getHours().toString().padStart(2, '0');
          const minutes = minPickupDate.getMinutes().toString().padStart(2, '0');
          const minTimeStr = `${hours}:${minutes}`;
          setMinTime(minTimeStr);

          // If selected date is today, ensure time is after minTime
          if (orderData.selected_date === minDateStr) {
            const [selectedHours, selectedMinutes] = (orderData.selected_time?.split(' ')[1] || '').split(':');
            const selectedTimeValue = parseInt(selectedHours) * 60 + parseInt(selectedMinutes || 0);
            const minTimeValue = minPickupDate.getHours() * 60 + minPickupDate.getMinutes();
            
            if (selectedTimeValue < minTimeValue) {
              setSelectedTime(minTimeStr);
            }
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    if (!selectedDate || !order?.created_at) {
      setSelectedTime(newTime);
      return;
    }

    // Check if selected date is today
    const today = new Date().toISOString().split('T')[0];
    const createdDate = new Date(order.created_at);
    const minPickupDate = new Date(createdDate.getTime() + 60 * 60000);
    const minDateStr = minPickupDate.toISOString().split('T')[0];

    if (selectedDate === minDateStr) {
      // Compare times if it's the same day
      const [newHours, newMinutes] = newTime.split(':');
      const newTimeValue = parseInt(newHours) * 60 + parseInt(newMinutes || 0);
      const minTimeValue = minPickupDate.getHours() * 60 + minPickupDate.getMinutes();

      if (newTimeValue >= minTimeValue) {
        setSelectedTime(newTime);
      } else {
        toast.warning(`Pickup time must be at least 60 minutes after order creation (${minTime})`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } else {
      setSelectedTime(newTime);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);

    // If changing to today, adjust time if needed
    if (order?.created_at && minDate) {
      const createdDate = new Date(order.created_at);
      const minPickupDate = new Date(createdDate.getTime() + 60 * 60000);
      const minDateStr = minPickupDate.toISOString().split('T')[0];

      if (newDate === minDateStr) {
        // Check if current selected time is before minimum time
        const [hours, minutes] = selectedTime.split(':');
        const selectedTimeValue = parseInt(hours || 0) * 60 + parseInt(minutes || 0);
        const minTimeValue = minPickupDate.getHours() * 60 + minPickupDate.getMinutes();

        if (selectedTimeValue < minTimeValue) {
          const hours = minPickupDate.getHours().toString().padStart(2, '0');
          const minutes = minPickupDate.getMinutes().toString().padStart(2, '0');
          setSelectedTime(`${hours}:${minutes}`);
          toast.info(`Time adjusted to minimum allowed time (${hours}:${minutes})`, {
            position: "top-right",
            autoClose: 3000,
          });
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    // Final validation before submission
    if (order?.created_at && selectedDate && selectedTime) {
      const createdDate = new Date(order.created_at);
      const selectedDateTime = new Date(`${selectedDate}T${selectedTime.includes(':') ? selectedTime : `${selectedTime}:00`}`);
      const minPickupDateTime = new Date(createdDate.getTime() + 60 * 60000);

      if (selectedDateTime < minPickupDateTime) {
        setError('Pickup time must be at least 60 minutes after order creation');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await orderService.updateOrderSchedule(
        id, 
        selectedDate, 
        selectedTime.includes(':') ? selectedTime : `${selectedTime}:00`
      );

      toast.success('Order Scheduled time updated successfully!', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      navigate(`/orders/order_lists/order_overview/${id}`, { 
        state: { 
          success: true,
          message: 'Schedule updated successfully' 
        } 
      });
    } catch (err) {
      setError(err.message || 'Failed to update schedule');
      toast.error(err.message || 'Failed to update scheduled time', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate(-1);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-indigo-900 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Edit Delivery / Pickup Time</h2>
              <button 
                onClick={handleBack}
                className="text-white hover:text-indigo-200"
              >
                <ArrowLeft size={20} />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">No order found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-6 px-6">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-indigo-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Edit Delivery / Pickup Time</h2>
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
              {order.order_type === 'Delivery' ? 'DELIVERY TIME' : 'PICK-UP TIME'}
            </h3>
            <p className="text-sm text-gray-500">
              Current {order.order_type.toLowerCase()} time: {order.selected_date} at {order.selected_time}
            </p>
            {minTime && (
              <p className="text-sm text-gray-500 mt-1">
                Earliest allowed time: {minDate} at {minTime} (60 minutes after order creation)
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selected {order.order_type === 'Delivery' ? 'Delivery' : 'Pick-Up'} Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                min={minDate || new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {order.order_type === 'Delivery' ? 'Delivery' : 'Pick-Up'} Time
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={handleTimeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                min={selectedDate === minDate ? minTime : undefined}
              />
              {selectedDate === minDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Must be {minTime} or later for this date
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
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
                {isSubmitting ? 'Updating...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTime;