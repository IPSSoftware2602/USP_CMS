import { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { ChevronLeft, Search, Filter, X, Download } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { VITE_API_BASE_URL } from '../../constant/config';
import { ToastContainer, toast } from 'react-toastify';

export default function MemberTopup() {
  const authToken = sessionStorage.getItem('token');
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [customerData, setCustomerData] = useState({
    customerName: '',
    code: '',
  });

  const [topupData, setTopupData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    topUpNumber: '',
    dateFrom: '',
    dateTo: '',
    status: '',
  });

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  // Fetch customer data
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
      toast.error('Failed to load customer data');
    }
  };

  // Fetch topup data for this customer
  const fetchTopupData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${VITE_API_BASE_URL}customer/topup/list`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter topup data for this specific customer
      if (data.data && Array.isArray(data.data)) {
        const customerTopups = data.data.filter(
          item => item.customer_id === id
        );
        
        // Format the data for display
        const formattedData = customerTopups.map(item => ({
          id: item.id,
          topUpNumber: item.topup_number,
          amount: `RM ${parseFloat(item.amount).toFixed(2)}`,
          redeem: item.credit ? `RM ${parseFloat(item.credit).toFixed(2)}` : 'N/A',
          paymentType: item.payment_method || 'N/A',
          date: new Date(item.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          status: item.status,
          rawDate: new Date(item.created_at), // For filtering
          rawAmount: parseFloat(item.amount) // For sorting
        }));
        
        setTopupData(formattedData);
        setFilteredData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching topup data:', error);
      toast.error('Failed to load topup history');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters whenever they change
  useEffect(() => {
    setFilterLoading(true);
    
    let result = topupData;
    
    // Filter by topup number
    if (filters.topUpNumber) {
      result = result.filter(item => 
        item.topUpNumber.toLowerCase().includes(filters.topUpNumber.toLowerCase())
      );
    }
    
    // Filter by status
    if (filters.status) {
      result = result.filter(item => 
        item.status.toLowerCase() === filters.status.toLowerCase()
      );
    }
    
    // Filter by date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter(item => item.rawDate >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      // Set to end of day
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(item => item.rawDate <= toDate);
    }
    
    setFilteredData(result);
    
    // Small delay to show loading state for better UX
    setTimeout(() => setFilterLoading(false), 300);
  }, [filters, topupData]);

  // Fetch data on component mount
  useEffect(() => {
    fetchCustomerData();
    fetchTopupData();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      topUpNumber: '',
      dateFrom: '',
      dateTo: '',
      status: '',
    });
  };

  const columns = [
    {
      name: 'Top Up Number',
      selector: row => row.topUpNumber,
      sortable: true,
      width: '20%',
      cell: row => (
        <span className="font-medium text-indigo-600">
          {row.topUpNumber}
        </span>
      ),
    },
    {
      name: 'Amount',
      selector: row => row.amount,
      sortable: true,
      width: '15%',
      sortFunction: (a, b) => a.rawAmount - b.rawAmount,
    },
    {
      name: 'Credit',
      selector: row => row.redeem,
      sortable: true,
      width: '15%',
    },
    {
      name: 'Payment Type',
      selector: row => row.paymentType,
      sortable: true,
      width: '15%',
    },
    {
      name: 'Date',
      selector: row => row.date,
      sortable: true,
      width: '15%',
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      width: '10%',
      cell: row => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.status === 'Success' || row.status === 'success'
            ? 'bg-green-100 text-green-800' 
            : row.status === 'Pending' || row.status === 'pending'
            ? 'bg-yellow-100 text-yellow-800'
            : row.status === 'Failed' || row.status === 'failed'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
        </span>
      ),
    },
  ];

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
                Top Up Number
              </label>
              <input
                type="text"
                placeholder="Search Top Up Number"
                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.topUpNumber}
                onChange={(e) => handleFilterChange('topUpNumber', e.target.value)}
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
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Listing section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold ml-2">Topup History</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredData}
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
                {topupData.length === 0 
                  ? 'No topup records found for this customer' 
                  : 'No records match your filters'
                }
              </div>
            }
            highlightOnHover
            pointerOnHover
          />
        )}
      </div>
    </div>
  );
}