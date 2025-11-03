import { ChevronLeft } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { VITE_API_BASE_URL } from '../../constant/config';
import { ToastContainer, toast } from 'react-toastify';

const MemberEditAdjustPoint = () => {
  const { id } = useParams();
  const authToken = sessionStorage.getItem('token');
  const navigate = useNavigate();

  const [customerPointData, setCustomerPointData] = useState({
    customerName: '',
    point: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pointHistory, setPointHistory] = useState([]);

  const [formData, setFormData] = useState({
    customer_id: id,
    related_type: "Adjustments",
    related_id: 0,
    action: "",
    pointValue: "",
    in: 0.00,
    out: 0.00,
    remark: "",
  });

  const pointOptions = [
    { value: 'increase', label: 'Add Points' },
    { value: 'decrease', label: 'Deduct Points' }
  ];

  const fetchCustomerData = async () => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}customers/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customer data');
      }

      const customerData = await response.json();
      const customerDetails = customerData.data;

      setCustomerPointData({
        customerName: customerDetails.name || 'N/A',
        point: customerPointData.point, // Keep existing point value
      });

    } catch (error) {
      console.error("Error fetching customer data:", error);
      toast.error('Failed to load customer data');
    }
  }

  const fetchCustomerPointHistory = async (dateFrom = '', dateTo = '') => {
    try {
      setLoading(true);
      const response = await fetch(`${VITE_API_BASE_URL}customer-point/history/${id}?date_from=${dateFrom}&date_to=${dateTo}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch point history');
      }

      const pointHistoryData = await response.json();
      setPointHistory(pointHistoryData.data || []);

      const pointBalance = getLastBalance(pointHistoryData.data) ?? 0;

      setCustomerPointData(prev => ({
        ...prev,
        point: pointBalance,
      }));
    } catch (error) {
      console.error("Error fetching point history:", error);
      toast.error('Failed to load point history');
    } finally {
      setLoading(false);
    }
  }

  const getLastBalance = (arr) => {
    if (!arr?.length) return null;
    const last = arr[0];
    return parseFloat(last.balance) || 0;
  };

  useEffect(() => {
    async function fetchAll() {
      await fetchCustomerData();
      await fetchCustomerPointHistory();
    }
    fetchAll();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.action) {
      toast.error('Please select an action (Add or Deduct Points)');
      return;
    }
    
    if (!formData.pointValue || parseFloat(formData.pointValue) <= 0) {
      toast.error('Please enter a valid point value');
      return;
    }
    
    if (formData.action === 'decrease' && parseFloat(formData.pointValue) > parseFloat(customerPointData.point)) {
      toast.error('Deduction amount cannot exceed current points');
      return;
    }

    setSubmitting(true);
    
    const points = Number(parseFloat(formData.pointValue).toFixed(2));
    const submitData = {
      ...formData,
      in: formData.action === 'increase' ? points : 0.00,
      out: formData.action === 'decrease' ? points : 0.00,
    };

    try {
      const response = await fetch(VITE_API_BASE_URL + "customer/points/create", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to adjust points');
      }

      toast.success(data.message || "Points adjusted successfully", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        onClose: () => {
          // Refresh data after successful submission
          fetchCustomerPointHistory();
          // Reset form
          setFormData({
            customer_id: id,
            related_type: "Adjustments",
            related_id: 0,
            action: "",
            pointValue: "",
            in: 0.00,
            out: 0.00,
            remark: "",
          });
        },
      });

    } catch (err) {
      console.error("Error adjusting points:", err);
      toast.error(err.message || "Failed to adjust points");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6">
      <ToastContainer />
      
      {/* Header with back button */}
      <div className="flex justify-end items-center p-4 mb-3">
        <button 
          className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 text-gray-800 hover:bg-gray-50 transition-colors"
          onClick={handleClose}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Go back
        </button>
      </div>

      {/* Details Section */}
      <div className="mb-6">
        <div className="bg-indigo-900 p-4 rounded-t-lg">
          <h2 className="text-[18px] font-semibold text-white">Details</h2>
        </div>
        <div className="p-4 sm:p-6 bg-white rounded-b-lg shadow-sm">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center mb-4">
                <span className="font-semibold w-40">Customer Name</span>
                <span className="text-gray-700">: {customerPointData.customerName}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-40">Points Balance</span>
                <span className="text-gray-700">: {customerPointData.point}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Adjust Points Form Section */}
      <div className="mb-6">
        <div className="bg-indigo-900 p-4 rounded-t-lg">
          <h2 className="text-[18px] font-semibold text-white">Adjust Points</h2>
        </div>
        <div className="p-4 sm:p-6 bg-white rounded-b-lg shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">Action</label>
                <select
                  name="action"
                  value={formData.action}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={submitting}
                >
                  <option value="" disabled>Choose Action</option>
                  {pointOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">Points Value</label>
                <input
                  type="number"
                  name="pointValue"
                  value={formData.pointValue}
                  onChange={handleChange}
                  placeholder="Enter points"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  step="0.01"
                  required
                  disabled={submitting}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">Remark</label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleChange}
                placeholder="Enter remark for this adjustment"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                disabled={submitting}
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-900 hover:bg-indigo-800 disabled:bg-indigo-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Recent Points History Section */}
      {pointHistory.length > 0 && (
        <div className="mb-6">
          <div className="bg-indigo-900 p-4 rounded-t-lg">
            <h2 className="text-[18px] font-semibold text-white">Recent Points History</h2>
          </div>
          <div className="p-4 sm:p-6 bg-white rounded-b-lg shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pointHistory.slice(0, 5).map((history, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(history.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {history.action_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {history.in > 0 ? `+${history.in}` : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {history.out > 0 ? `-${history.out}` : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {history.balance}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {history.remark || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberEditAdjustPoint;