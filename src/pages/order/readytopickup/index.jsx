import React, { useState, useEffect, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { ChevronDown, Eye, Link, Calendar, Search, Filter, X, RotateCcw, Download, Loader,Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { orderService} from '../../../store/api/orderService';

const SingleDateInput = ({ value, onChange, placeholder = "Select date (YYYY-MM-DD)" }) => {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700">Date</label>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

const SelectDropdown = ({ label, value, onChange, options, placeholder = "Pick an option" }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
        >
          <span className={value ? "text-gray-900" : "text-gray-500"}>
            {value ? options.find(opt => opt.value === value)?.label : placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="py-1">
              {options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SearchInput = ({ value, onChange, placeholder = "Search (min 3 chars)", minLength = 3 }) => {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700">Search (min {minLength} chars)</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
};

const InlineFilterComponent = ({ 
  onApplyFilters,
  filterOptions = {},
  buttonText = "Filter",
  initialFilters = {},
  showFilters,
  setShowFilters,
  isLoading = false
}) => {
  const [filters, setFilters] = useState({
    date: '',
    dateType: '',
    search: '',
    paymentStatus: '',
    status: '',
    orderMethod: '',
    menu: '',
    combo: '',
    ...initialFilters
  });

  const defaultOptions = {
    dateTypeOptions: [
      { label: 'Order Date', value: 'order' },
      { label: 'Created Date', value: 'created' },
      { label: 'Updated Date', value: 'update' }
    ],
    paymentStatusOptions: [
    { label: 'Paid', value: 'paid' },
    { label: 'Unpaid', value: 'unpaid' },
  ],
    statusOptions: [
      { label: 'Pending', value: 'pending' },
      { label: 'Completed', value: 'completed' },
    ],
    orderMethodOptions: [
      { label: 'Delivery', value: 'Delivery' },
      { label: 'Pickup', value: 'pickup' },
    ],
    ...filterOptions
  };

  

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilter = () => {
    console.log('Applying filters:', filters);
    if (onApplyFilters) {
      onApplyFilters(filters);
    }
  };

  const handleReset = () => {
    const resetFilters = {
      date: '',
      dateType: '',
      search: '',
      paymentStatus: '',
      status: '',
      orderMethod: '',
    };
    setFilters(resetFilters);
    if (onApplyFilters) {
      onApplyFilters(resetFilters);
    }
  };

  if (!showFilters) {
    return null;
  }

  return (
    <div className="mt-4 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filter Options</h3>
        <button
          onClick={() => setShowFilters(false)}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SingleDateInput
            value={filters.date || ''}
            onChange={(value) => handleFilterChange('date', value)}
          />

          
          <SelectDropdown
            label="Date Type"
            value={filters.dateType || ''}
            onChange={(value) => handleFilterChange('dateType', value)}
            options={defaultOptions.dateTypeOptions}
          />
          
          <SearchInput
            value={filters.search || ''}
            onChange={(value) => handleFilterChange('search', value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <SelectDropdown
            label="Payment Status"
            value={filters.paymentStatus || ''}
            onChange={(value) => handleFilterChange('paymentStatus', value)}
            options={defaultOptions.paymentStatusOptions}
          />
          
          <SelectDropdown
            label="Status"
            value={filters.status || ''}
            onChange={(value) => handleFilterChange('status', value)}
            options={defaultOptions.statusOptions}
          />
          
          <SelectDropdown
            label="Order Method"
            value={filters.orderMethod || ''}
            onChange={(value) => handleFilterChange('orderMethod', value)}
            options={defaultOptions.orderMethodOptions}
          />
          
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-2 pt-6">
        <button
          onClick={handleReset}
          disabled={isLoading}
          className="px-6 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset</span>
        </button>        
        <button
          onClick={handleApplyFilter}
          disabled={isLoading}
          className="px-6 py-2 bg-indigo-900 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            'Apply Filters'
          )}
        </button>
      </div>
    </div>
  );
};

const Readytopickup = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0
  });

  const navigate = useNavigate();

  // Load initial data
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async (filters = {}, page = 1, perPage = 10) => {
  setLoading(true);
  setError(null);

  try {
    const orders = await orderService.getCustomerOrderList();
    
    // Transform your order data
    const transformed = orders
      .filter(order => order.status.toLowerCase() === 'ready_to_pick_up') // Filter for pending orders
      .map((order) => ({
        id: order.id,
        orderDate: order.created_at,
        created_at: order.created_at, // Keep original created date
        updated_at: order.updated_at || order.created_at, // Fallback to created if updated doesn't exist
        orderType: order.order_type,
        pickupDeliveryDate: `${order.selected_date} ${order.selected_time}`,
        status: order.status,
        paymentStatus: order.payment_status,
        subtotalAmount: `RM${order.subtotal_amount}`,
        discountAmount: `RM${order.discount_amount}`,
        taxAmount: `RM${order.tax_amount}`,
        deliveryFee: `RM${order.delivery_fee}`,
        grandTotal: `RM${order.grand_total}`,
        promoDiscount: order.promo_discount_amount !== "0.00" ? `-RM${order.promo_discount_amount}` : '-',
        voucherDiscount: order.voucher_discount_amount !== "0.00" ? `-RM${order.voucher_discount_amount}` : '-',
        notes: order.notes || '-',
        expectedReadyTime: order.expected_ready_time,
        trackingLink: order.deliveries?.[0]?.tracking_link || null, 
      }));

    setData(transformed);
    
    // Apply initial filters if any
    if (Object.keys(filters).length > 0) {
      handleFiltersApplied(filters);
    } else {
      setFilteredData(transformed);
      setPagination({
        page,
        perPage,
        total: transformed.length
      });
    }
  } catch (err) {
    setError(err.message || 'Failed to load orders');
  } finally {
    setLoading(false);
  }
};


  

  const handleViewDetails = (row) => {
    navigate(`/orders/order_pending/order_overview/${row.id}`);
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const blob = await orderService.exportOrders({}, 'csv');
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export orders');
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
  {
    name: 'Order Type',
    selector: row => row.orderType,
    sortable: true,
    width: '150px'
  },
  {
    name: 'Order Date',
    selector: row => new Date(row.orderDate).toLocaleString(),
    sortable: true,
    width: '180px'
  },
  {
    name: 'Pickup Delivery Date',
    selector: row => row.pickupDeliveryDate,
    sortable: true,
    width: '200px'
  },
  {
  name: 'Status',
  selector: row => row.status,
  sortable: true,
  width: '120px',
  cell: row => {
    // Convert status to lowercase for case-insensitive comparison
    const status = row.status.toLowerCase();
    
    // Determine styling based on status
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-800';
    
    if (status === 'on_the_way') {
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
    } else if (status === 'picked_up') {
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
    } else if (status === 'completed' || status === 'delivered') {
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
    } else if (status === 'confirmed') {
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
    } else if (status === 'preparing') {
      bgColor = 'bg-orange-100';
      textColor = 'text-orange-800';
    } else if (status === 'ready_to_pick_up') {
      bgColor = 'bg-teal-100';
      textColor = 'text-teal-800';
    } else if (status === 'cancelled') {
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
    }

    // Format the status text for display (convert underscores to spaces and capitalize)
    const formatStatus = (status) => {
      return status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${bgColor} ${textColor}`}>
        {formatStatus(row.status)}
      </span>
    );
  }
},
  {
    name: 'Payment Status',
    selector: row => row.paymentStatus,
    sortable: true,
    center:true,
    width: '160px',
    cell: row => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        row.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
        'bg-red-100 text-red-800'
      }`}>
        {row.paymentStatus}
      </span>
    )
  },
  {
    name: 'Subtotal',
    selector: row => row.subtotalAmount,
    sortable: true,
    width: '120px'
  },
  {
    name: 'Tax',
    selector: row => row.taxAmount,
    sortable: true,
    width: '100px'
  },
  {
    name: 'Delivery Fee',
    selector: row => row.deliveryFee,
    sortable: true,
    center: true,
    width: '160px'
  },
  {
    name: 'Total',
    selector: row => row.grandTotal,
    sortable: true,
    width: '100px',
    cell: row => <span className="font-semibold">{row.grandTotal}</span>
  },

   {
    name: 'Promo/Voucher',
    center:true,
    cell: row => (
      <div className="text-xs">
        {row.promoDiscount !== '-' && row.promoDiscount ? (
          <div>Promo: {row.promoDiscount}</div>
        ) : null}
        {row.voucherDiscount !== '-' && row.voucherDiscount ? (
          <div>Voucher: {row.voucherDiscount}</div>
        ) : null}
        {(!row.promoDiscount || row.promoDiscount === '-') && 
        (!row.voucherDiscount || row.voucherDiscount === '-') && (
          <div className="text-gray-400">-</div>
        )}
      </div>
    ),
    width: '160px'
  },
  {
    name: 'Tracking Link',
    cell: row => {
      if (!row.trackingLink) return <span className="text-gray-400">-</span>;
      
      return (
        <a 
          href={row.trackingLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 hover:bg-gray-100 rounded inline-block"
          onClick={(e) => e.stopPropagation()}
        >
          <LinkIcon size={16} className="text-blue-500 hover:text-blue-700" />
        </a>
      );
    },
    width: '120px',
    ignoreRowClick: true,
    center: true
  },
  {
    name: 'Actions',
    cell: row => (
      <div className="flex space-x-2">
        <button 
          className="p-2 hover:bg-gray-100 rounded"
          onClick={() => handleViewDetails(row)}
          title="View Details"
        >
          <Eye size={16} className="text-gray-600" />
        </button>
        {row.status === 'pending' && (
          <button 
            className="p-2 hover:bg-gray-100 rounded"
            onClick={() => handleCancelOrder(row.id)}
            title="Cancel Order"
          >
            {/* <X size={16} className="text-red-600" /> */}
          </button>
        )}
      </div>
    ),
    width: '120px'
  }
];

  const customStyles = {
    header: {
      style: {
        backgroundColor: '#1A237E',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        padding: '16px',
        minHeight: '56px'
      }
    },
    headRow: {
      style: {
        backgroundColor: '#1A237E',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        borderBottom: '1px solid #e5e7eb'
      }
    },
    headCells: {
      style: {
        color: '#ffffff',
        backgroundColor: '#1A237E',
        fontSize: '14px',
        fontWeight: '600',
        paddingLeft: '16px',
        paddingRight: '16px'
      }
    },
    rows: {
      style: {
        fontSize: '14px',
        color: '#374151',
        '&:nth-of-type(odd)': {
          backgroundColor: '#f9fafb'
        },
        '&:hover': {
          backgroundColor: '#f3f4f6'
        }
      }
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px'
      }
    },
    pagination: {
      style: {
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        borderRadius: '0 0 8px 8px'
      }
    }
  };

 const handleFiltersApplied = (filters) => {
  setLoading(true);
  
  try {
    let filtered = [...data];

    // Apply each filter if it has a value
    if (filters.search && filters.search.length >= 3) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderType.toLowerCase().includes(searchTerm) ||
        order.status.toLowerCase().includes(searchTerm) ||
        order.paymentStatus.toLowerCase().includes(searchTerm) ||
        order.grandTotal.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.date) {
      const targetDate = new Date(filters.date);
      targetDate.setHours(0, 0, 0, 0);

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === targetDate.getTime();
      });
    }


    if (filters.paymentStatus) {
      filtered = filtered.filter(order => 
        order.paymentStatus.toLowerCase() === filters.paymentStatus.toLowerCase()
      );
    }

    if (filters.status) {
      filtered = filtered.filter(order => 
        order.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.orderMethod) {
      filtered = filtered.filter(order => 
        order.orderType.toLowerCase() === filters.orderMethod.toLowerCase()
      );
    }

    setFilteredData(filtered);
    setPagination(prev => ({
      ...prev,
      page: 1,
      total: filtered.length
    }));
  } catch (err) {
    setError('Failed to apply filters');
    console.error('Filter error:', err);
  } finally {
    setLoading(false);
  }
};

   const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePerRowsChange = (newPerPage, page) => {
    setRowsPerPage(newPerPage);
    setCurrentPage(page);
  };

  return (
    <>
      <div className="w-full bg-white mb-4 rounded-lg">
        <InlineFilterComponent 
          onApplyFilters={handleFiltersApplied}
          buttonText="Filter"
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          isLoading={loading}
        />
      </div>
      
      <div className="w-full bg-white shadow-lg rounded-lg">
        <div className="flex justify-between items-center p-6 bg-white rounded-lg">
          <h1 className="text-2xl font-semibold text-gray-900">Ready to Pick Up List</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Export</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-3 text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

         <DataTable
        columns={columns}
        data={paginatedData}
        pagination
        paginationServer={true}
        paginationTotalRows={filteredData.length}
        paginationDefaultPage={currentPage}
        paginationPerPage={rowsPerPage}
        paginationRowsPerPageOptions={[10, 20, 30, 50, 100]}
        onChangePage={handlePageChange}
        onChangeRowsPerPage={handlePerRowsChange}
        progressPending={loading}
        progressComponent={
          <div className="flex justify-center items-center py-8">
            <Loader className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        }
        customStyles={customStyles}
        responsive
        striped
        highlightOnHover
        noDataComponent={
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-gray-500 text-lg mb-2">No Ready to Pick Up List found</div>
            <div className="text-gray-400 text-sm">Try adjusting your filters or search criteria</div>
          </div>
        }
      />
      </div>
    </>
  );
};

export default Readytopickup;