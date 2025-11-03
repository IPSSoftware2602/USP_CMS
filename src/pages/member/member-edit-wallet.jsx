import { ChevronLeft, Search, Filter, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { useNavigate, useParams } from 'react-router-dom';
import { VITE_API_BASE_URL } from '../../constant/config';
import { ToastContainer, toast } from 'react-toastify';

export default function MemberEditWallet() {
  const authToken = sessionStorage.getItem('token');
  const { id } = useParams();
  const [walletData, setWalletData] = useState({
    customerName: '',
    wallet: '',
    walletCredit: '',
    totalWallet: '',
    code: '',
  });

  const [transactions, setTransactions] = useState({ all: [], credit: [] });
  const [topupData, setTopupData] = useState([]);
  const [filteredTopupData, setFilteredTopupData] = useState([]);
  const [filteredWalletData, setFilteredWalletData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    searchTerm: '',
    dateFrom: '',
    dateTo: '',
    status: '',
    type: 'all', // 'all', 'wallet', 'topup'
  });

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== 'all');

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

      const customerData = await response.json()
      const customerDetails = customerData.data;

      setWalletData(prev => ({
        ...prev,
        customerName: customerDetails.name || 'N/A',
        code: customerDetails.customer_referral_code || 'N/A',
      }));

    } catch (error) {
      console.error("Error fetching customer data:", error);
      toast.error('Failed to load customer data');
    }
  }

  const fetchCustomerWalletHistory = async (dateFrom = '', dateTo = '') => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}customer-wallet/history/${id}?date_from=${dateFrom}&date_to=${dateTo}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const walletHistory = await response.json();
      const walletData = walletHistory.data;

      const allTransactions = walletData.all || [];
      const creditTransactions = walletData.credit || [];

      const allBalance = getLastBalance(allTransactions) ?? 0;
      const creditBalance = getLastBalance(creditTransactions) ?? 0;
      const totalBalance = allBalance + creditBalance;

      setTransactions({
        all: allTransactions,
        credit: creditTransactions
      });

      setFilteredWalletData(allTransactions);

      setWalletData(prev => ({
        ...prev,
        wallet: `RM ${allBalance.toFixed(2)}`,
        walletCredit: `RM ${creditBalance.toFixed(2)}`,
        totalWallet: `RM ${totalBalance.toFixed(2)}`,
      }));

    } catch (error) {
      console.error("Error fetching wallet history:", error);
      toast.error('Failed to load wallet history');
    }
  }

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
          item => item.customer_id.toString() === id.toString()
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
          rawDate: new Date(item.created_at),
          status: item.status,
          type: 'topup',
          rawAmount: parseFloat(item.amount)
        }));
        
        setTopupData(formattedData);
        setFilteredTopupData(formattedData);
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
    
    // Filter topup data
    let topupResult = topupData;
    
    // Filter by search term
    if (filters.searchTerm) {
      topupResult = topupResult.filter(item => 
        item.topUpNumber.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        item.paymentType.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }
    
    // Filter by status
    if (filters.status) {
      topupResult = topupResult.filter(item => 
        item.status.toLowerCase() === filters.status.toLowerCase()
      );
    }
    
    // Filter by date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      topupResult = topupResult.filter(item => item.rawDate >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      topupResult = topupResult.filter(item => item.rawDate <= toDate);
    }
    
    setFilteredTopupData(topupResult);
    
    // Filter wallet data
    let walletResult = transactions.all;
    
    // Filter by search term
    if (filters.searchTerm) {
      walletResult = walletResult.filter(item => 
        (item.related_type && item.related_type.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        (item.action && item.action.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        (item.remark && item.remark.toLowerCase().includes(filters.searchTerm.toLowerCase()))
      );
    }
    
    // Filter by date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      walletResult = walletResult.filter(item => new Date(item.created_at) >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      walletResult = walletResult.filter(item => new Date(item.created_at) <= toDate);
    }
    
    setFilteredWalletData(walletResult);
    
    // Small delay to show loading state for better UX
    setTimeout(() => setFilterLoading(false), 300);
  }, [filters, topupData, transactions.all]);

  const getLastBalance = (arr) => {
    if (!arr?.length) return null;
    const last = arr[0];
    const balance = parseFloat(last.balance);
    return isNaN(balance) ? 0 : balance;
  };

  useEffect(() => {
    async function fetchAll() {
      await fetchCustomerData();
      await fetchCustomerWalletHistory();
      await fetchTopupData();
    }
    fetchAll();
  }, [id]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      dateFrom: '',
      dateTo: '',
      status: '',
      type: 'all',
    });
  };

  const topupColumns = [
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

  const walletColumns = [
    {
      name: 'No',
      cell: (row, rowIndex) => rowIndex + 1,
      width: '70px'
    },
    {
      name: 'Date Created',
      selector: row => new Date(row.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      minWidth: '150px',
      sortable: true,
    },
    {
      name: 'Type',
      selector: row => row.related_type,
      minWidth: '150px',
      sortable: true,
    },
    {
      name: 'Action',
      selector: row => row.action?.toUpperCase() || '',
      minWidth: '100px',
      sortable: true,
    },
    {
      name: 'Current',
      selector: row => `RM ${parseFloat(row.current || 0).toFixed(2)}`,
      sortable: true,
    },
    {
      name: 'In',
      selector: row => `RM ${parseFloat(row.in || 0).toFixed(2)}`,
      sortable: true,
    },
    {
      name: 'Out',
      selector: row => `RM ${parseFloat(row.out || 0).toFixed(2)}`,
      sortable: true,
    },
    {
      name: 'Balance',
      selector: row => `RM ${parseFloat(row.balance || 0).toFixed(2)}`,
      sortable: true,
    },
    {
      name: 'Remark',
      selector: row => row.remark,
      minWidth: '250px',
      sortable: true,
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#312e81',
        color: 'white',
        minHeight: '50px',
        fontSize: '16px',
      },
    },
    headCells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        fontWeight: '500',
      },
    },
    rows: {
      style: {
        minHeight: '60px',
        fontSize: '15px',
        '&:hover': {
          backgroundColor: '#f9fafb',
        },
      },
      highlightOnHoverStyle: {
        backgroundColor: '#f9fafb',
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
        borderTopStyle: 'solid',
        borderTopWidth: '1px',
        borderTopColor: '#e5e7eb',
      },
    },
  };

  const NoDataComponent = () => (
    <div className="py-6 text-center text-gray-500">No data found</div>
  );

  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };

  const handleAdjustWallet = () => {
    navigate(`/member/member_overview/member_wallet/adjust_wallet/${id}`);
  }

  return (
    <div className="flex flex-col max-w-6xl min-h-screen mx-auto px-4">
      <ToastContainer />
      
      <div className="flex justify-end items-center p-4">
        <button className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 text-gray-800" onClick={handleBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Go back
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-grow p-4">
        {/* Details Card */}
        <div className="mb-4 bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-indigo-900 text-white px-4 py-3 font-semibold">
            Details
          </div>
          <div className="p-4">
            <div className="grid grid-cols-12 py-2">
              <div className="col-span-3 font-semibold">Code</div>
              <div className="col-span-1 text-center">:</div>
              <div className="col-span-8">{walletData.code}</div>
            </div>
            <div className="grid grid-cols-12 py-2">
              <div className="col-span-3 font-semibold">Customer Name</div>
              <div className="col-span-1 text-center">:</div>
              <div className="col-span-8">{walletData.customerName}</div>
            </div>
            <div className="grid grid-cols-12 py-2">
              <div className="col-span-3 font-semibold">Wallet</div>
              <div className="col-span-1 text-center">:</div>
              <div className="col-span-8">{walletData.wallet}</div>
            </div>
            <div className="flex justify-end mt-2">
              <button className="bg-indigo-900 text-white px-4 py-2 rounded" onClick={handleAdjustWallet}>
                Adjust Wallet
              </button>
            </div>
          </div>
        </div>

        {/* Unified Search Filter Card */}
        <div className="mb-4 bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-indigo-900 text-white px-4 py-3 font-semibold flex justify-between items-center">
            <span>Search Filter</span>
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
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <label className="mb-2 font-medium flex items-center">
                  <Search className="w-4 h-4 mr-1" />
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by reference, type, or remark"
                  className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
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

        {/* Topup History Listing */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 ml-2">Topup History</h2>
          <div className="shadow rounded-lg overflow-hidden">
            <DataTable
              columns={topupColumns}
              data={filteredTopupData}
              customStyles={customStyles}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50]}
              progressPending={loading || filterLoading}
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
          </div>
        </div>

        {/* Wallet History Listing */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 ml-2">Wallet History</h2>
          <div className="shadow rounded-lg overflow-hidden">
            <DataTable
              columns={walletColumns}
              data={filteredWalletData}
              customStyles={customStyles}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50]}
              progressPending={loading || filterLoading}
              progressComponent={
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              }
              noDataComponent={
                <div className="p-8 text-center text-gray-500">
                  {transactions.all.length === 0 
                    ? 'No wallet records found for this customer' 
                    : 'No records match your filters'
                  }
                </div>
              }
              highlightOnHover
              pointerOnHover
            />
          </div>
        </div>
      </div>
    </div>
  );
}