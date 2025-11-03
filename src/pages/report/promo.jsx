import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { Edit, Download, Trash2, Plus, PenLine, ChevronDown, ChevronUp, Loader2, TrendingUp, Users, Percent, BarChart3, TicketSlash, TicketCheck, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../../components/ui/DeletePopUp';
import OutletApiService from '../../store/api/outletService';
import UserService from '../../store/api/userService';
import reportService from '@/store/api/reportService';
import { set } from 'react-hook-form';
import { toast } from 'react-toastify';
import outletService from '../../store/api/outletService';

const PromoReport = () => {
  const [outlets, setOutlets] = useState([]);
  const [filteredOutlets, setFilteredOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOutletId, setSelectedOutletId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const [userPermissions, setUserPermissions] = useState({});
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filteredReportData, setFilteredReportData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [filters, setFilters] = useState({ 
    startDate: '', 
    endDate: '', 
    outlet: 'All',
    reportMode: 'total',
    year: new Date().getFullYear().toString()
  });
  const [outletOptions, setOutletOptions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

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

  // Generate year options (last 10 years + next 1 year)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 1; i++) {
      years.push(i.toString());
    }
    return years.reverse();
  }, []);

  // Month number to name mapping
  const monthNames = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
    '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
  };

  const reportModeOptions = [
    { value: 'daily', title: 'Daily' },
    { value: 'monthly', title: 'Monthly' },
    { value: 'yearly', title: 'Yearly' },
    { value: 'total', title: 'Total' },
  ];

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
  
  useEffect(() => {
    if (user_id) {
      fetchOutlets();
      fetchReport();
      fetchUserPermissions();
    }
  }, [user_id]);

  // Filter outlets based on user's outlet ID
  useEffect(() => {
    setFilteredReportData(reportData);
  }, [reportData]);

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
    if (f.reportMode) params.report_mode = f.reportMode;
    if (user_id) params.user_id = user_id;
    return params;
  };

  const fetchReport = async (applied = filters) => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportService.getPromoReport(buildSearchParams(applied));
      if(response.status == 200){
        console.log(response.data)
        const report_data = response.data.promos;
        const summary_data = response.data.summary;
        console.log(summary_data)
        console.log(report_data);
        setReportData(report_data);
        setSummaryData(summary_data);
      }
    } catch (err) {
      setError('Failed to fetch promo report. Please try again.');
      console.error('Error fetching promo report:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async() => {
    let searchParams = buildSearchParams(filters);
    searchParams = {
      ...searchParams,
      type: 'promo-report'
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
      setError('Failed to export promo data. Please try again.');
      setLoading(false);
    }
  };

  // Generate dynamic columns based on report mode
  const columns = useMemo(() => {
    // Base columns
    const baseColumns = [
      {
        Header: 'Promo Name',
        accessor: 'promo_name',
        Cell: ({ value }) => (
          <div className="py-2 text-sm font-medium text-gray-900">
            {value}
          </div>
        ),
      },
      {
        Header: 'Code',
        accessor: 'code',
        Cell: ({ value }) => (
          <div className="py-2 text-sm font-medium text-gray-900">
            {value}
          </div>
        ),
      }
    ];

    // For Total mode - simple column
    if (filters.reportMode === 'total') {
      return [
        ...baseColumns,
        {
          Header: 'Promo Used',
          accessor: 'promo_used',
          Cell: ({ value }) => (
            <div className="py-2 text-sm text-gray-600 max-w-xs">
              {value}
            </div>
          ),
        }
      ];
    }

    // For comparative modes (daily, monthly, yearly)
    if (reportData.length > 0 && reportData[0].comparative_data) {
      const periods = Object.keys(reportData[0].comparative_data).sort();
      
      // Create grouped columns for each period
      periods.forEach(period => {
        let headerName = period;
        
        // Format monthly headers (01 -> Jan, 02 -> Feb, etc.)
        if (filters.reportMode === 'monthly' && monthNames[period]) {
          headerName = monthNames[period];
        }
        
        // Create a group column for this period
        baseColumns.push({
          Header: headerName,
          accessor: `comparative_data.${period}.promo_used`,
          Cell: ({ value }) => (
            <div className="py-2 text-sm font-medium text-gray-900 text-center">
              {value || 0}
            </div>
          ),
        });
      });
    } else {
      // Fallback to simple column if no comparative data
      return [
        ...baseColumns,
        {
          Header: 'Promo Used',
          accessor: 'promo_used',
          Cell: ({ value }) => (
            <div className="py-2 text-sm text-gray-600 max-w-xs">
              {value}
            </div>
          ),
        }
      ];
    }

    return baseColumns;
  }, [reportData]);

  const data = useMemo(() => reportData, [reportData]);

  // React Table v7 configuration
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

  const handleApplyFilters = () => {
    gotoPage(0);
    fetchReport(filters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      startDate: '',
      endDate: '',
      outlet: 'All',
      reportMode: 'total',
      year: new Date().getFullYear().toString()
    };
    setFilters(resetFilters);
    gotoPage(0);
    fetchReport(resetFilters);
  };

  const handleReportModeChange = (mode) => {
    setFilters(prev => ({ ...prev, reportMode: mode }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Promo Report</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Promos</p>
                <p className="text-2xl font-bold text-gray-900">{summaryData.total_promo}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TicketCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Promos</p>
                <p className="text-2xl font-bold text-gray-900">{summaryData.active_promo}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <TicketSlash className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expired Promos</p>
                <p className="text-2xl font-bold text-gray-900">{summaryData.expired_promo}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Promos Used</p>
                <p className="text-2xl font-bold text-gray-900">{summaryData.promo_used}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-800">{error}</p>
                <button 
                  onClick={fetchReport}
                  className="mt-2 text-red-600 hover:text-red-800 underline font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Promo Usage Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {filters.reportMode === 'total' 
                      ? 'Promo Usage - Total' 
                      : filters.reportMode === 'monthly'
                      ? `Promo Usage - Monthly ${filters.year}`
                      : `Promo Usage - ${filters.reportMode.charAt(0).toUpperCase() + filters.reportMode.slice(1)}`
                    }
                  </h2>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setShowFilters(v => !v)}
                >Filter</button>
                <button 
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  onClick={exportToCSV}
                  disabled={reportData.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </button>
              </div>
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
                      <input type="date" className="block w-full h-10 rounded-md border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3"
                        value={filters.startDate} onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">End Date</label>
                      <input type="date" className="block w-full h-10 rounded-md border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3"
                        value={filters.endDate} onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))} />
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
              </div>
              <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button className="inline-flex items-center px-4 h-10 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                  onClick={handleResetFilters}>Reset</button>
                <button className="inline-flex items-center px-5 h-10 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                  onClick={handleApplyFilters}>Apply</button>
              </div>
            </div>
          )}

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
                          <p className="text-sm text-gray-500">Loading promo data...</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : page.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="p-3 bg-gray-100 rounded-full">
                          <Users className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No promo data found</p>
                        <p className="text-sm text-gray-400">Try refreshing the page or check your connection</p>
                      </div>
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
                ({reportData.length} total items)
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

export default PromoReport;