import React, { useEffect, useState, useMemo } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { toast } from 'react-toastify';
import { ArrowLeft, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import reportService from '@/store/api/reportService';
import useExportPermission from '@/hooks/useExportPermission';

const UniqueQrDetailReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const hasExportPermission = useExportPermission();
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        payoutStatus: 'all', // CR-006: 'all' | 'pending' | 'paid'
    });
    // CR-006: selected order ids for bulk mark-payout-paid action.
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [marking, setMarking] = useState(false);

    const buildParams = () => {
        const params = {};
        if (filters.startDate) params.start_date = filters.startDate;
        if (filters.endDate) params.end_date = filters.endDate;
        if (filters.payoutStatus && filters.payoutStatus !== 'all') {
            params.payout_status = filters.payoutStatus;
        }
        return params;
    };

    const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await reportService.getUniqueQrDetails(id, buildParams());
            if (response) {
                setData(response);
                // Reset selection on every refetch — IDs in the previous list may
                // no longer be visible after a filter change.
                setSelectedIds(new Set());
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
        setFilters({ startDate: '', endDate: '', payoutStatus: 'all' });
        setTimeout(() => fetchDetails(), 0);
    };

    const exportToCSV = async () => {
        try {
            const response = await reportService.exportUniqueQrDetails(id, buildParams());
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

    // CR-006: bulk mark selected orders as payout paid. Only marks rows that are
    // currently 'pending' (server-side WHERE also enforces this implicitly via
    // the WHERE clauses, but we filter client-side too for honest UX).
    const handleMarkPayoutPaid = async () => {
        const pendingIds = data
            .filter(row => selectedIds.has(row.id) && (row.payout_status || 'pending') === 'pending')
            .map(row => row.id);
        if (pendingIds.length === 0) {
            toast.info('No pending orders selected.');
            return;
        }
        if (!window.confirm(`Mark ${pendingIds.length} order(s) as payout paid? This cannot be undone in the UI.`)) {
            return;
        }
        setMarking(true);
        try {
            const result = await reportService.markUniqueQrOrdersPaid(id, pendingIds);
            const count = result?.updated_count ?? 0;
            if (count > 0) {
                toast.success(`Marked ${count} order(s) as paid.`);
                fetchDetails();
            } else {
                toast.warn(result?.message || 'No orders updated.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to mark payouts.');
        } finally {
            setMarking(false);
        }
    };

    const toggleRowSelection = (orderId) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(orderId)) next.delete(orderId);
            else next.add(orderId);
            return next;
        });
    };

    const selectablePendingIds = useMemo(
        () => data.filter(r => (r.payout_status || 'pending') === 'pending').map(r => r.id),
        [data]
    );
    const allPendingSelected =
        selectablePendingIds.length > 0 &&
        selectablePendingIds.every(rid => selectedIds.has(rid));

    const toggleSelectAllPending = () => {
        if (allPendingSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(selectablePendingIds));
        }
    };

    const columns = useMemo(() => [
        { Header: 'Order No', accessor: 'order_so' },
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
            Header: 'Payout',
            accessor: 'payout_amount',
            Cell: ({ value, row }) => (
                <span className="text-gray-700" title={`Rate: ${Number(row.original.payout_rate || 0).toFixed(2)}%`}>
                    RM {Number(value || 0).toFixed(2)}
                </span>
            )
        },
        {
            Header: 'Payout Status',
            accessor: 'payout_status',
            Cell: ({ value }) => {
                const status = value || 'pending';
                const isPaid = status === 'paid';
                return (
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                        {isPaid ? 'Paid' : 'Pending'}
                    </span>
                );
            }
        },
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
        // CR-006: row selection checkbox (moved to last column per user). Header
        // toggles all PENDING rows on the current dataset; paid rows are not
        // selectable since the action is one-way.
        {
            Header: () => (
                <input
                    type="checkbox"
                    checked={allPendingSelected}
                    onChange={toggleSelectAllPending}
                    disabled={selectablePendingIds.length === 0}
                    aria-label="Select all pending payouts"
                />
            ),
            id: 'select',
            disableSortBy: true,
            Cell: ({ row }) => {
                const isPaid = (row.original.payout_status || 'pending') === 'paid';
                return (
                    <input
                        type="checkbox"
                        checked={selectedIds.has(row.original.id)}
                        onChange={() => toggleRowSelection(row.original.id)}
                        disabled={isPaid}
                        title={isPaid ? 'Already paid' : 'Select to mark payout paid'}
                    />
                );
            },
        },
    ], [selectedIds, allPendingSelected, selectablePendingIds, navigate]);

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
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payout Status</label>
                            <select
                                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                value={filters.payoutStatus}
                                onChange={(e) => setFilters(prev => ({ ...prev, payoutStatus: e.target.value }))}
                            >
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                            </select>
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
                            {
                                hasExportPermission && (
                                    <button
                                        onClick={exportToCSV}
                                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Export Details
                                    </button>
                                )
                            }
                        </div >
                    </div >
                </div >

                {/* CR-006: bulk-action bar — visible only when at least one PENDING row is selected. */}
                {selectedIds.size > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
                        <div className="text-sm text-blue-900">
                            {selectedIds.size} order(s) selected
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                            >
                                Clear selection
                            </button>
                            <button
                                onClick={handleMarkPayoutPaid}
                                disabled={marking}
                                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm"
                            >
                                {marking ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                )}
                                Mark Payout as Done
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                < div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" >
                    {
                        loading ? (
                            <div className="p-8 text-center" >
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
                </div >
            </div >
        </div >
    );
};

export default UniqueQrDetailReport;
