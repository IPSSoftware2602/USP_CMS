import React, { useEffect, useState, useMemo } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { toast } from 'react-toastify';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import reportService from '@/store/api/reportService';

const UniqueQrDetailReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
    });

    const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (filters.startDate) params.start_date = filters.startDate;
            if (filters.endDate) params.end_date = filters.endDate;

            const response = await reportService.getUniqueQrDetails(id, params);
            if (response) {
                setData(response);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handleApplyFilters = () => {
        fetchDetails();
    };

    const handleResetFilters = () => {
        setFilters({ startDate: '', endDate: '' });
        setTimeout(() => fetchDetails(), 0);
    };

    const exportToCSV = async () => {
        try {
            const params = {};
            if (filters.startDate) params.start_date = filters.startDate;
            if (filters.endDate) params.end_date = filters.endDate;

            const response = await reportService.exportUniqueQrDetails(id, params);
            if (response && response.file_url) {
                window.open(response.file_url, '_blank');
                toast.success("Export successful!");
            } else {
                toast.error("Export failed. No file URL returned.");
            }
        } catch (err) {
            toast.error("Export failed.");
        }
    };

    const columns = useMemo(() => [
        { Header: 'Order SO', accessor: 'order_so' },
        { Header: 'Customer Name', accessor: 'customer_name' },
        { Header: 'Phone', accessor: 'customer_phone' },
        { Header: 'Method', accessor: 'order_type' },
        {
            Header: 'Order Date',
            accessor: 'created_at',
            Cell: ({ value }) => new Date(value).toLocaleDateString() + ' ' + new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        { Header: 'Pickup/Delivery', accessor: 'selected_date', Cell: ({ row }) => `${row.original.selected_date || ''} ${row.original.selected_time || ''}` },
        {
            Header: 'Status',
            accessor: 'status',
            Cell: ({ value }) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${value === 'completed' ? 'bg-green-100 text-green-800' :
                        value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                    }`}>
                    {value}
                </span>
            )
        },
        { Header: 'Payment Status', accessor: 'payment_status' },
        { Header: 'Payment Method', accessor: 'payment_method' },
        { Header: 'Promo/Voucher', accessor: 'promo_voucher' },
        { Header: 'Discount Amount', accessor: 'discount_amount_total', Cell: ({ value }) => `RM ${value}` },
        { Header: 'Subtotal', accessor: 'subtotal_amount', Cell: ({ value }) => `RM ${value}` },
        { Header: 'Total', accessor: 'grand_total', Cell: ({ value }) => <span className="font-bold">RM {value}</span> },
        {
            Header: 'Items',
            id: 'items',
            Cell: ({ row }) => (
                <button
                    className="text-xs text-blue-600 underline"
                    onClick={() => navigate(`/orders/order_lists/order_overview/${row.original.id}`)}
                >
                    View Items
                </button>
            )
        },
    ], []);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        canPreviousPage,
        canNextPage,
        pageOptions,
        state: { pageIndex, pageSize },
        previousPage,
        nextPage,
    } = useTable(
        {
            columns,
            data,
            initialState: { pageIndex: 0, pageSize: 10 },
        },
        useSortBy,
        usePagination
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/report/unique_qr')}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                title="Back to Summary"
                            >
                                <ArrowLeft className="h-6 w-6 text-gray-600" />
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">Unique QR Details: <span className="text-blue-600">{id}</span></h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                value={filters.startDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                value={filters.endDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleApplyFilters}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Apply
                            </button>
                            <button
                                onClick={handleResetFilters}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Reset
                            </button>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={exportToCSV}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export Details
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                            <p className="mt-2 text-gray-500">Loading data...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-600">{error}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    {headerGroups.map(headerGroup => (
                                        <tr {...headerGroup.getHeaderGroupProps()}>
                                            {headerGroup.headers.map(column => (
                                                <th
                                                    {...column.getHeaderProps(column.getSortByToggleProps())}
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                                >
                                                    {column.render('Header')}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
                                    {page.map(row => {
                                        prepareRow(row);
                                        return (
                                            <tr {...row.getRowProps()} className="hover:bg-gray-50">
                                                {row.cells.map(cell => (
                                                    <td {...cell.getCellProps()} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {cell.render('Cell')}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <span className="text-sm text-gray-700">
                                    Page <span className="font-medium">{pageIndex + 1}</span> of <span className="font-medium">{pageOptions.length}</span>
                                </span>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => previousPage()} disabled={!canPreviousPage} className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
                                <button onClick={() => nextPage()} disabled={!canNextPage} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UniqueQrDetailReport;
