import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../../store/api/orderService';
import { ArrowLeft, CheckCircle, Clock, Truck, XCircle, CookingPot, Package, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

   const allStatusOptions = [
    { 
      value: 'pending', 
      label: 'Pending', 
      icon: <Clock size={16} className="mr-2" />, 
      color: 'bg-yellow-100 text-yellow-800' 
    },
    { 
      value: 'confirmed', 
      label: 'Confirmed', 
      icon: <CheckCircle size={16} className="mr-2" />, 
      color: 'bg-blue-100 text-blue-800' 
    },
    { 
      value: 'preparing', 
      label: 'Preparing', 
      icon: <CookingPot size={16} className="mr-2" />, 
      color: 'bg-orange-100 text-orange-800' 
    },
    { 
      value: 'ready_to_pickup', 
      label: 'Ready to Pick Up', 
      icon: <Package size={16} className="mr-2" />, 
      color: 'bg-teal-100 text-teal-800' 
    },
    { 
      value: 'picked_up', 
      label: 'Picked Up', 
      icon: <CheckCircle2 size={16} className="mr-2" />, 
      color: 'bg-indigo-100 text-indigo-800' 
    },
    { 
      value: 'on_the_way', 
      label: 'Delivering', 
      icon: <Truck size={16} className="mr-2" />, 
      color: 'bg-purple-100 text-purple-800' 
    },
    
    { 
      value: 'completed', 
      label: 'Completed', 
      icon: <CheckCircle size={16} className="mr-2" />, 
      color: 'bg-green-100 text-green-800' 
    },
    { 
      value: 'cancelled', 
      label: 'Cancelled', 
      icon: <XCircle size={16} className="mr-2" />, 
      color: 'bg-red-100 text-red-800' 
    },
  ];

  // Filter status options based on order type
  const getFilteredStatusOptions = () => {
    if (!order) return [];
    
    if (order.order_type === 'delivery') {
      return allStatusOptions.filter(option => 
        ['pending','on_the_way', 'picked_up', 'completed'].includes(option.value)
      );
    } else if (order.order_type === 'pickup') {
      return allStatusOptions.filter(option => 
        ['pending', 'ready_to_pickup', 'completed'].includes(option.value)
      );
    }
    
    return allStatusOptions;
  };

  const [statusOptions, setStatusOptions] = useState([]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orderData = await orderService.getOrderById(id);
        setOrder(orderData);
        setSelectedStatus(orderData.status || '');
        
        // Set filtered status options after order is loaded
        if (orderData.order_type === 'delivery') {
          setStatusOptions(allStatusOptions.filter(option => 
            ['pending','picked_up','on_the_way',  'completed'].includes(option.value)
          ));
        } else if (orderData.order_type === 'pickup') {
          setStatusOptions(allStatusOptions.filter(option => 
            ['pending', 'ready_to_pickup', 'completed'].includes(option.value))
          );
        } else {
          setStatusOptions(allStatusOptions);
        }
      } catch (err) {
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Don't submit if no change or no selection
    if (!selectedStatus || selectedStatus === order.status) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Call the updateOrderStatus API
      await orderService.updateOrderStatus(id, selectedStatus);
      
      // Show success toast
      toast.success('Order status updated successfully!', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Navigate back after a short delay
      setTimeout(() => {
        navigate(`/orders/order_lists/order_overview/${id}`, { state: { statusUpdated: true } });
      }, 1000);

    } catch (err) {
      setError(err.message || 'Failed to update status');
      toast.error(err.message || 'Failed to update status', {
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
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-red-700">{error}</p>
                <button 
                  onClick={handleBack}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  ← Go back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">No order found with ID: {id}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-6 px-6">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-indigo-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Update Order Status</h2>
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
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Order #{order?.order_so}
            </h3>
            <p className="text-sm text-gray-500">
              Order Type: <span className="font-medium capitalize">{order?.order_type}</span>
            </p>
            <p className="text-sm text-gray-500">
              Current status: <span className="font-medium capitalize">{order?.status}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Status
              </label>
              <div className="space-y-2">
                {getFilteredStatusOptions().map((option) => (
                  <div key={option.value} className="flex items-center">
                    <input
                      id={`status-${option.value}`}
                      name="status"
                      type="radio"
                      checked={selectedStatus === option.value}
                      onChange={() => setSelectedStatus(option.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor={`status-${option.value}`}
                      className={`ml-3 flex items-center px-3 py-2 rounded-full text-sm font-medium ${option.color} ${isSubmitting ? 'opacity-70' : ''}`}
                    >
                      {option.icon}
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>


            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
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
                disabled={isSubmitting || !selectedStatus || selectedStatus === order.status}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : 'Update Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditStatus;