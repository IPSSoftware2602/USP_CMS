import reportService from '@/store/api/reportService';
import outletService from '@/store/api/outletService';
import { BarChart3, ChevronDown, ChevronUp, Download, Loader2, Package, Store, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import UserService from '@/store/api/userService';
import { toast } from 'react-toastify';

ChartJS.register(ArcElement, Title, Tooltip, Legend);

const ProductReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [filters, setFilters] = useState({ 
    startDate: '', 
    endDate: '', 
    outlet: 'All', 
    orderMethod: 'All',
    reportMode: 'total',
    year: new Date().getFullYear().toString() // Default to current year
  });
  const [outletOptions, setOutletOptions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [userPermissions, setUserPermissions] = useState({});
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [legendPage, setLegendPage] = useState(0);
  const itemsPerPage = 10;

  const userData = useMemo(() => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }, []);

  const user_id = userData?.user?.user_id || null;

  const fetchUserPermissions = async () => {
    try {
      if (!user_id) return;
      
      const userDataRes = await UserService.getUser(user_id);
      const userData = userDataRes?.data;
      if (!userData) return;

      if (userData.role && userData.role.toLowerCase() === 'admin') {
        setIsAdmin(true);
        setHasCreatePermission(true);
        setHasUpdatePermission(true);
        setHasDeletePermission(true);
        return;
      }

      let permissions = {};
      if (userData.user_permissions) {
        try {
          permissions = JSON.parse(userData.user_permissions);
          setUserPermissions(permissions);

          if (permissions.Outlets && permissions.Outlets.subItems && permissions.Outlets.subItems.Lists) {
            if (permissions.Outlets.subItems.Lists.create === true) {
              setHasCreatePermission(true);
            }
            if (permissions.Outlets.subItems.Lists.update === true) {
              setHasUpdatePermission(true);
            }
            if (permissions.Outlets.subItems.Lists.delete === true) {
              setHasDeletePermission(true);
            }
          }
        } catch (e) {
          console.error("Error parsing user permissions:", e);
        }
      }
    } catch (err) {
      console.error("Error fetching user permissions:", err);
    }
  };

  const fetchOutlets = async () => {
    try {
      if (!user_id) return;
      const res = await outletService.getOutlets(user_id);
      if (res.status === 200) {
        const list = res.result;
        setOutletOptions(list);
      } 
    } catch (e) {
      console.error('Failed to fetch outlets', e);
    }
  };

  const buildSearchParams = (f) => {
    const params = {};
    
    // Handle date parameters based on report mode
    if (f.reportMode === 'daily') {
      if (f.startDate) params.start_date = f.startDate;
      if (f.endDate) params.end_date = f.endDate;
    } else if (f.reportMode === 'monthly') {
      // For monthly, use year to set start_date (YYYY-01-01)
      if (f.year) {
        params.start_date = `${f.year}-01-01`;
      }
    }
    // For yearly and total modes, no date parameters needed
    
    if (f.outlet && f.outlet !== 'All') params.outlet_id = f.outlet;
    if (f.orderMethod && f.orderMethod !== 'All') params.order_type = f.orderMethod;
    if (f.reportMode) params.report_mode = f.reportMode;
    if (user_id) params.user_id = user_id;
    return params;
  };

  const fetchReport = async (applied = filters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getProductReport(buildSearchParams(applied));
      if(response.status == 200){
        const products = response.data;
        console.log(products)
        setTopProducts(products);
      }
    } catch (e) {
      setError('Failed to fetch product report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
    fetchReport();
    fetchUserPermissions(); 
  }, []);

  // Generate year options (last 10 years + next 1 year)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 1; i++) {
      years.push(i.toString());
    }
    return years.reverse(); // Show most recent years first
  }, []);

  // Month number to name mapping
  const monthNames = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
    '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
  };

  // Generate dynamic columns based on report mode
  const columns = useMemo(() => {
    const baseColumns = [
      {
        Header: 'Product',
        accessor: 'item_title',
        Cell: ({ value }) => (
          <div className="py-2">
            <div className="flex items-center space-x-3">
              <div className="text-sm font-medium text-gray-900">{value}</div>
            </div>
          </div>
        ),
      }
    ];

    // For Total mode - single column
    if (filters.reportMode === 'total') {
      baseColumns.push({
        Header: 'Total Qty Sold',
        accessor: 'quantity',
        Cell: ({ value }) => (
          <div className="py-2 text-sm font-medium text-gray-900 text-center">
            {value}
          </div>
        ),
      });
    }
    // For comparative modes (daily, monthly, yearly)
    else if (topProducts.length > 0 && topProducts[0].comparative_data) {
      const periods = Object.keys(topProducts[0].comparative_data).sort();
      
      // Add period columns
      periods.forEach(period => {
        let headerName = period;
        
        // Format monthly headers (01 -> Jan, 02 -> Feb, etc.)
        if (filters.reportMode === 'monthly' && monthNames[period]) {
          headerName = monthNames[period];
        }
        
        baseColumns.push({
          Header: headerName,
          accessor: `comparative_data.${period}`,
          Cell: ({ value }) => (
            <div className="py-2 text-sm font-medium text-gray-900 text-center">
              {value || 0}
            </div>
          ),
        });
      });
    } else {
      // Fallback to single column if no comparative data
      baseColumns.push({
        Header: 'Qty Sold',
        accessor: 'quantity',
        Cell: ({ value }) => (
          <div className="py-2 text-sm font-medium text-gray-900 text-center">
            {value}
          </div>
        ),
      });
    }

    return baseColumns;
  }, [topProducts]);

  const data = useMemo(() => topProducts, [topProducts]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useSortBy,
    usePagination
  );

  const orderMethodOptions = [
    { value: 'All', title: 'All' },
    { value: 'delivery', title: 'Delivery' },
    { value: 'pickup', title: 'Pickup' },
    { value: 'dinein', title: 'Dine-in' },
  ];

  const reportModeOptions = [
    { value: 'daily', title: 'Daily' },
    { value: 'monthly', title: 'Monthly' },
    { value: 'yearly', title: 'Yearly' },
    { value: 'total', title: 'Total' },
  ];

  const chartData = useMemo(() => {
    if (!topProducts || topProducts.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Qty Sold',
          data: [],
          backgroundColor: [],
          hoverBackgroundColor: [],
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverBorderWidth: 4,
          hoverBorderColor: '#ffffff'
        }]
      };
    }

    const getRandomColor = () => {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    };

    const darkenColor = (hex, percent) => {
      const num = parseInt(hex.slice(1), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) - amt;
      const G = ((num >> 8) & 0x00FF) - amt;
      const B = (num & 0x0000FF) - amt;

      return '#' + (
        0x1000000 +
        (Math.max(0, R) << 16) +
        (Math.max(0, G) << 8) +
        Math.max(0, B)
      ).toString(16).slice(1);
    };

    const backgroundColor = [];
    const hoverBackgroundColor = [];

    for (let i = 0; i < topProducts.length; i++) {
      const color = getRandomColor();
      backgroundColor.push(color);
      hoverBackgroundColor.push(darkenColor(color, 15));
    }

    // For chart, use quantities based on report mode
    const chartQuantities = topProducts.map(product => {
      if (filters.reportMode === 'total') {
        return product.quantity;
      } else if (product.comparative_data) {
        // For comparative modes, sum all periods
        return Object.values(product.comparative_data)
          .reduce((sum, qty) => sum + parseInt(qty || 0), 0);
      }
      return product.quantity;
    });

    return {
      labels: topProducts.map(p => p.item_title),
      datasets: [
        {
          label: 'Qty Sold',
          data: chartQuantities,
          backgroundColor,
          hoverBackgroundColor,
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverBorderWidth: 4,
          hoverBorderColor: '#ffffff'
        }
      ]
    };
  }, [topProducts, filters.reportMode]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { 
        display: true, 
        text: `Top Sales Products - ${filters.reportMode.charAt(0).toUpperCase() + filters.reportMode.slice(1)}${filters.reportMode === 'monthly' ? ` ${filters.year}` : ''}`,
        font: {
          size: 18,
          weight: 'bold'
        },
        color: '#374151',
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context) => {
            return context[0].label;
          },
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => parseInt(a) + parseInt(b), 0);
            const val = context.parsed;
            const pct = total ? ((val / total) * 100).toFixed(1) : 0;
            return `Qty: ${val} units (${pct}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 3,
        borderColor: '#ffffff'
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }), [filters.reportMode, filters.year]);

  const CustomLegend = memo(({ labels, colors, data }) => {
    const total = useMemo(() => data.reduce((sum, value) => sum + parseInt(value), 0), [data]);
    
    const totalPages = Math.ceil(labels.length / itemsPerPage);
    const startIndex = legendPage * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, labels.length);
    const currentItems = labels.slice(startIndex, endIndex);
    
    const handlePrevious = useCallback(() => {
      setLegendPage(prev => Math.max(0, prev - 1));
    }, []);
    
    const handleNext = useCallback(() => {
      setLegendPage(prev => Math.min(totalPages - 1, prev + 1));
    }, [totalPages]);
    
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Product Breakdown</h3>
          </div>
          
          <div className="p-3 space-y-2 min-h-[250px]">
            {currentItems.map((label, i) => {
              const originalIndex = startIndex + i;
              const value = data[originalIndex];
              const percentage = total ? ((parseInt(value) / total) * 100).toFixed(1) : 0;
              
              return (
                <div 
                  key={`${label}-${originalIndex}`} 
                  className="group flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm border border-white"
                      style={{ backgroundColor: colors[originalIndex] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate" title={label}>
                        {label}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-gray-900">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1">
                <button
                  onClick={handlePrevious}
                  disabled={legendPage === 0}
                  className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronUp className="h-3 w-3 text-gray-600" />
                </button>
                <span className="text-xs text-gray-600 px-1">
                  {startIndex + 1}-{endIndex} of {labels.length}
                </span>
                <button
                  onClick={handleNext}
                  disabled={legendPage >= totalPages - 1}
                  className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronDown className="h-3 w-3 text-gray-600" />
                </button>
              </div>
              <div className="text-xs text-gray-500">
                {legendPage + 1}/{totalPages}
              </div>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-gray-700">Total:</span>
              <span className="font-bold text-gray-900">{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  });

  const exportToCSV = async() => {
    let searchParams = buildSearchParams(filters);
    searchParams = {
      ...searchParams,
      type: 'product-report'
    };

    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getExportExcel(searchParams);
      if(response.status == 200){
        toast.success(response.message);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to export product data. Please try again.');
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    gotoPage(0);
    fetchReport(filters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      startDate: '',
      endDate: '',
      outlet: 'All',
      orderMethod: 'All',
      reportMode: 'total',
      year: new Date().getFullYear().toString()
    };
    setFilters(resetFilters);
    gotoPage(0);
    fetchReport(resetFilters);
  };

  // Handle report mode change
  const handleReportModeChange = (mode) => {
    setFilters(prev => ({ ...prev, reportMode: mode }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg"><BarChart3 className="h-6 w-6 text-blue-600" /></div>
            <h1 className="text-2xl font-bold text-gray-900">Product Report</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg"><Store className="h-5 w-5 text-green-600" /></div>
              <h2 className="text-xl font-semibold text-gray-900">Top Products</h2>
            </div>
            <div className="flex space-x-3">
              <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setShowFilters(v => !v)}
              >Filter</button>
              <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={exportToCSV}
                disabled={topProducts.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Report Mode</label>
                  <select 
                    className="block w-full h-10 rounded-md border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3"
                    value={filters.reportMode} 
                    onChange={e => handleReportModeChange(e.target.value)}
                  >
                    {reportModeOptions.map((mode, i) => (
                      <option key={i} value={mode.value}>{mode.title}</option>
                    ))}
                  </select>
                </div>
                
                {/* Show year selector for monthly mode */}
                {filters.reportMode === 'monthly' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Year</label>
                    <select 
                      className="block w-full h-10 rounded-md border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3"
                      value={filters.year} 
                      onChange={e => setFilters(prev => ({ ...prev, year: e.target.value }))}
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Show date range only for daily mode */}
                {filters.reportMode === 'daily' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Start Date</label>
                      <input 
                        type="date" 
                        className="block w-full h-10 rounded-md border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3"
                        value={filters.startDate} 
                        onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">End Date</label>
                      <input 
                        type="date" 
                        className="block w-full h-10 rounded-md border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3"
                        value={filters.endDate} 
                        onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))} 
                      />
                    </div>
                  </>
                )}
                
                {/* Show empty space when inputs are hidden to maintain layout */}
                {filters.reportMode !== 'daily' && filters.reportMode !== 'monthly' && (
                  <>
                    <div className="space-y-1.5 opacity-50">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Start Date</label>
                      <input 
                        type="date" 
                        className="block w-full h-10 rounded-md border border-gray-300 bg-gray-100 shadow-sm text-sm px-3"
                        disabled
                        placeholder="Not applicable"
                      />
                    </div>
                    <div className="space-y-1.5 opacity-50">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">End Date</label>
                      <input 
                        type="date" 
                        className="block w-full h-10 rounded-md border border-gray-300 bg-gray-100 shadow-sm text-sm px-3"
                        disabled
                        placeholder="Not applicable"
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Outlet</label>
                  <select className="block w-full h-10 rounded-md border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3"
                    value={filters.outlet} onChange={e => setFilters(prev => ({ ...prev, outlet: e.target.value }))}>
                    <option value={'All'}>All</option>
                    {outletOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Order Method</label>
                  <select className="block w-full h-10 rounded-md border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3"
                    value={filters.orderMethod} onChange={e => setFilters(prev => ({ ...prev, orderMethod: e.target.value }))}>
                    {orderMethodOptions.map((m, i) => (<option key={i} value={m.value}>{m.title}</option>))}
                  </select>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button className="inline-flex items-center px-4 h-10 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                  onClick={handleResetFilters}>Reset</button>
                <button className="inline-flex items-center px-5 h-10 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                  onClick={handleApplyFilters}>Apply</button>
              </div>
            </div>
          )}

          <div className="p-6">
            <div className="min-h-[500px]">
              {loading ? (
                <div className="flex justify-center items-center h-96">
                  <div className="flex flex-col items-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-500">Loading product data...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <div className="h-96 w-full">
                        <Pie data={chartData} options={chartOptions} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-1">
                    <CustomLegend 
                      labels={chartData.labels} 
                      colors={chartData.datasets[0].backgroundColor}
                      data={chartData.datasets[0].data}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              {filters.reportMode === 'total' 
                ? 'Top Products - Total Sales' 
                : filters.reportMode === 'monthly'
                ? `Top Products Table - Monthly ${filters.year}`
                : `Top Products Table - ${filters.reportMode.charAt(0).toUpperCase() + filters.reportMode.slice(1)}`
              }
            </h3>
          </div>

          {/* React Table v7 */}
          <div className="overflow-x-auto">
            <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
              <thead className="bg-indigo-900">
                {headerGroups.map(headerGroup => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map(column => (
                      <th
                        {...column.getHeaderProps(column.getSortByToggleProps())}
                        className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer select-none"
                      >
                        <div className="flex items-center space-x-1">
                          {column.render('Header')}
                          <span>
                            {column.isSorted ? (
                              column.isSortedDesc ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronUp className="h-4 w-4" />
                              )
                            ) : (
                              ''
                            )}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12">
                      <div className="flex justify-center items-center">
                        <div className="flex flex-col items-center space-y-3">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                          <p className="text-sm text-gray-500">Loading table...</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : page.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                      No product data found.
                    </td>
                  </tr>
                ) : (
                  page.map(row => {
                    prepareRow(row);
                    return (
                      <tr {...row.getRowProps()} className="hover:bg-gray-50">
                        {row.cells.map(cell => (
                          <td {...cell.getCellProps()} className="px-6 py-4 whitespace-nowrap">
                            {cell.render('Cell')}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Page {pageIndex + 1} of {pageOptions.length}
              </span>
              <span className="text-sm text-gray-500">
                ({topProducts.length} total items)
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                }}
                className="border border-gray-300 rounded-md text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[10, 20, 30, 50, 100].map(size => (
                  <option key={size} value={size}>
                    Show {size}
                  </option>
                ))}
              </select>

              <div className="flex space-x-1">
                <button
                  onClick={() => gotoPage(0)}
                  disabled={!canPreviousPage}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => previousPage()}
                  disabled={!canPreviousPage}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => gotoPage(pageCount - 1)}
                  disabled={!canNextPage}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductReport;