import { useState, useEffect, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { ChevronLeft, Edit, Search, Filter, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { VITE_API_BASE_URL } from '../../constant/config';
import { ToastContainer, toast } from 'react-toastify';

export default function MemberEditOrder() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState(null);

  const { id } = useParams();
  const authToken = sessionStorage.getItem('token');
  const [customerData, setCustomerData] = useState({
    customerName: '',
    code: '',
  });

  const [filters, setFilters] = useState({
    orderNumber: '',
    status: '',
    paymentType: '',
    dateFrom: '',
    dateTo: '',
    outlet: '', // Added outlet filter
  });

  const [filteredOrders, setFilteredOrders] = useState([]);
  const navigate = useNavigate();
  const [outletData, setOutletData] = useState([]);

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
        throw new Error('Network response was not ok');
      }

      const customerData = await response.json();
      const customerDetails = customerData.data;

      setCustomerData({
        customerName: customerDetails.name || 'N/A',
        code: customerDetails.customer_referral_code || 'N/A',
      });
    } catch (error) {
      console.error("Error fetching customer data:", error);
      toast.error('Failed to load customer details');
    }
  };

  const fetchCustomerOrders = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token || authToken;

      const response = await fetch(`${VITE_API_BASE_URL}order/customer-orderlist/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order list');
      }

      const result = await response.json();
      
      // Filter orders by customer_id to get only this customer's orders
      const customerOrders = result.data.filter(order => order.customer_id === id);
      
      // Format the data for display
      const formattedOrders = customerOrders.map(order => ({
        id: order.id,
        orderNumber: order.order_so,
        status: order.status,
        orderType: order.order_type,
        orderDate: new Date(order.created_at),
        formattedDate: formatDate(order.created_at),
        paymentType: getPaymentType(order.payments),
        totalAmount: `RM ${parseFloat(order.grand_total).toFixed(2)}`,
        totalQuantity: calculateTotalQuantity(order.items),
        shippingStatus: getShippingStatus(order.deliveries),
        trackingDetails: getTrackingDetails(order.deliveries),
        rawData: order, // Keep original data for potential future use
        outlet_title: order.outlet_title || 'N/A',
        outlet_id: order.outlet_id || null, // Add outlet_id for filtering
      }));
      
      setOrders(formattedOrders);
      setFilteredOrders(formattedOrders);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.message);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const userData = useMemo(() => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  }, []);

  const user_id = userData?.user?.user_id || null;

  const fetchOutletData = async () => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}outlets/list?user_id=${user_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const outletData = await response.json();
      setOutletData(outletData.result);
    } catch (error) {
      console.error("Error fetching outlet data:", error);
    }
  }

  useEffect(() => {
    fetchCustomerData();
    fetchCustomerOrders();
    fetchOutletData();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = (orderId) => {
    navigate(`/orders/order_lists/order_overview/${orderId}`);
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate total quantity
  const calculateTotalQuantity = (items) => {
    if (!items) return 0;
    return items.reduce((total, item) => total + parseInt(item.quantity || 0), 0);
  };

  // Get payment type
  const getPaymentType = (payments) => {
    if (!payments || payments.length === 0) return '-';
    const method = payments[0].payment_method || '-';
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  // Get shipping status
  const getShippingStatus = (deliveries) => {
    if (!deliveries || deliveries.length === 0) return '-';
    const status = deliveries[0].status || '-';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get tracking details
  const getTrackingDetails = (deliveries) => {
    if (!deliveries || deliveries.length === 0) return '-';
    return deliveries[0].provider_order_id || '-';
  };

  // Apply filters
  useEffect(() => {
    setFilterLoading(true);
    
    let filteredOrders = orders;
    
    if (filters.orderNumber) {
      filteredOrders = filteredOrders.filter(order => 
        order.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase())
      );
    }
    
    if (filters.status && filters.status !== 'Choose') {
      filteredOrders = filteredOrders.filter(order => 
        order.status.toLowerCase() === filters.status.toLowerCase()
      );
    }
    
    if (filters.paymentType && filters.paymentType !== 'Choose') {
      filteredOrders = filteredOrders.filter(order => 
        order.paymentType.toLowerCase() === filters.paymentType.toLowerCase()
      );
    }
    
    if (filters.outlet && filters.outlet !== 'Choose') {
      filteredOrders = filteredOrders.filter(order => 
        order.outlet_id === filters.outlet
      );
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredOrders = filteredOrders.filter(order => 
        order.orderDate >= fromDate
      );
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filteredOrders = filteredOrders.filter(order => 
        order.orderDate <= toDate
      );
    }
    
    setFilteredOrders(filteredOrders);
    
    // Small delay to show loading state for better UX
    setTimeout(() => setFilterLoading(false), 300);
  }, [filters, orders]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      orderNumber: '',
      status: '',
      paymentType: '',
      dateFrom: '',
      dateTo: '',
      outlet: '', // Reset outlet filter too
    });
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== 'Choose');

  // Define columns for DataTable
  const columns = [
    {
      name: 'Action',
      selector: row => row.id,
      cell: row => (
        <button
          className="p-2 border rounded-lg hover:bg-gray-50 transition-colors"
          onClick={() => handleEdit(row.id)}
          title="Edit Order"
        >
          <Edit className="w-4 h-4 text-gray-600" />
        </button>
      ),
      width: '80px',
    },
    {
      name: 'Status',
      selector: row => row.status,
      cell: row => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            row.status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : row.status === "completed"
              ? "bg-green-100 text-green-800"
              : row.status === "cancelled"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      ),
      width: '120px',
    },
    {
      name: 'Order No.',
      selector: row => row.orderNumber,
      cell: row => (
        <span className="font-medium text-indigo-600">
          #{row.orderNumber}
        </span>
      ),
      width: '150px',
    },
    {
      name: 'Outlet',
      selector: row => row.outlet_title,
      cell: row => (
        <span className="font-medium text-indigo-600">
          {row.outlet_title}
        </span>
      ),
      width: '150px',
    },
    {
      name: 'Order Type',
      selector: row => row.orderType,
      cell: row => {
        if (!row.orderType) return "-";
        const type = row.orderType.toLowerCase();
        if (type === "dinein") return "Dine in";
        if (type === "pickup") return "Pick up";
        if (type === "delivery") return "Delivery";
        return type.charAt(0).toUpperCase() + type.slice(1);
      },
      width: '120px',
    },
    {
      name: 'Order Date',
      selector: row => row.formattedDate,
      width: '120px',
    },
    {
      name: 'Payment Type',
      selector: row => row.paymentType,
      width: '130px',
    },
    {
      name: 'Total Amount',
      selector: row => row.totalAmount,
      width: '130px',
      cell: row => (
        <span className="font-medium">
          {row.totalAmount}
        </span>
      ),
    },
    {
      name: 'Total Quantity',
      selector: row => row.totalQuantity,
      width: '130px',
    },
    {
      name: 'Shipping Status',
      selector: row => row.shippingStatus,
      width: '130px',
    },
    {
      name: 'Tracking Details',
      selector: row => row.trackingDetails,
      width: '150px',
      cell: row => (
        <span className="text-sm">
          {row.trackingDetails}
        </span>
      ),
    },
  ];

  // Custom styles for DataTable to match your design
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#2e2c67',
        color: 'white',
        fontWeight: 'bold',
        minHeight: '56px',
      },
    },
    headCells: {
      style: {
        color: 'white',
        fontSize: '14px',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    rows: {
      style: {
        minHeight: '60px',
        fontSize: '14px',
        '&:not(:last-of-type)': {
          borderBottomStyle: 'solid',
          borderBottomWidth: '1px',
          borderBottomColor: '#E5E7EB',
        },
      },
      highlightOnHoverStyle: {
        backgroundColor: '#f3f4f6',
        transition: 'background-color 0.2s ease',
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    pagination: {
      style: {
        minHeight: '56px',
        marginTop: '0',
        borderTop: '1px solid #E5E7EB',
      },
    },
    noData: {
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        fontSize: '16px',
        color: '#6B7280',
      },
    },
    progress: {
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
      },
    },
  };

  // Custom pagination options text
  const paginationComponentOptions = {
    rowsPerPageText: 'Rows per page:',
    rangeSeparatorText: 'of',
    selectAllRowsItem: false,
    selectAllRowsItemText: 'All',
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6">
      <ToastContainer />
      
      {/* Header with back button */}
      <div className="flex justify-end items-center p-4 mb-3">
        <button 
          className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 text-gray-800 hover:bg-gray-50 transition-colors"
          onClick={handleBack}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Go back
        </button>
      </div>

      {/* Details section */}
      <div className="mb-6">
        <div className="bg-indigo-900 p-4 rounded-t-lg">
          <h2 className="text-[18px] font-semibold text-white">Details</h2>
        </div>
        <div className="p-4 sm:p-6 bg-white rounded-b-lg shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center">
              <span className="font-semibold w-32">Code</span>
              <span className="text-gray-700">: {customerData.code}</span>
            </div>
            <div className="flex items-center">
              <span className="font-semibold w-32">Customer Name</span>
              <span className="text-gray-700">: {customerData.customerName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Filter section */}
      <div className="mb-6">
        <div className="bg-indigo-900 p-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-[18px] font-semibold text-white">Search Filter</h2>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="flex items-center text-sm text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4 mr-1" />
              Clear Filters
            </button>
          )}
        </div>
        <div className="p-4 sm:p-6 bg-white rounded-b-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="mb-2 font-medium flex items-center">
                <Search className="w-4 h-4 mr-1" />
                Order Number
              </label>
              <input
                type="text"
                placeholder="Search Order Number"
                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.orderNumber}
                onChange={(e) => handleFilterChange('orderNumber', e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-2 font-medium">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-2 font-medium">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-2 font-medium flex items-center">
                <Filter className="w-4 h-4 mr-1" />
                Status
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-2 font-medium">Payment Type</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.paymentType}
                onChange={(e) => handleFilterChange('paymentType', e.target.value)}
              >
                <option value="">All Payment Types</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="online">Online</option>
              </select>
            </div>
            {/* Added Outlet Filter */}
            <div className="flex flex-col">
              <label className="mb-2 font-medium">Outlet</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.outlet}
                onChange={(e) => handleFilterChange('outlet', e.target.value)}
              >
                <option value="">All Outlets</option>
                {outletData.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Order List section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold ml-2">Order List</h2>
          {filteredOrders.length > 0 && (
            <span className="text-sm text-gray-500">
              Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <DataTable
          columns={columns}
          data={filteredOrders}
          customStyles={customStyles}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50]}
          paginationComponentOptions={paginationComponentOptions}
          progressPending={filterLoading}
          progressComponent={
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          }
          noDataComponent={
            <div className="p-8 text-center text-gray-500">
              {orders.length === 0 
                ? 'No orders found for this customer' 
                : 'No orders match your filters'
              }
            </div>
          }
          highlightOnHover
          pointerOnHover
        />
      </div>
    </div>
  );
}