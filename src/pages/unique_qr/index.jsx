import React, { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Edit, Trash2, Plus, ChevronDown, Loader2, QrCode, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmationModal from "../../components/ui/DeletePopUp";
import UniqueQrService from "../../store/api/uniqueQrService";
import { BASE_URL } from "../../constant/config";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

const UniqueQrList = () => {
    const [qrList, setQrList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchName, setSearchName] = useState("");
    const navigate = useNavigate();

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredList.slice(start, start + rowsPerPage);
    }, [filteredList, currentPage, rowsPerPage]);

    useEffect(() => {
        fetchList();
    }, []);

    useEffect(() => {
        if (!searchName) {
            setFilteredList(qrList);
        }
    }, [searchName, qrList]);

    const fetchList = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await UniqueQrService.getList();
            const items = Array.isArray(response.result) ? response.result : [];
            setQrList(items);
        } catch (err) {
            setError("Failed to fetch Unique QRs. Please try again.");
            console.error("Error fetching unique QRs:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        const nameFilter = searchName.toLowerCase().trim();
        const filtered = qrList.filter((item) => {
            return nameFilter === "" || item.name.toLowerCase().includes(nameFilter);
        });
        setFilteredList(filtered);
        setCurrentPage(1);
    };

    const handleDeleteClick = (id) => {
        setSelectedId(id);
        setShowDeleteModal(true);
    };

    const deleteItem = async (id) => {
        try {
            setDeleting(true);
            await UniqueQrService.deleteOne(id);
            setQrList((prev) => prev.filter((item) => item.id !== id));
            toast.success("Unique QR deleted successfully.");
        } catch (err) {
            toast.error("Failed to delete. Please try again.");
            console.error("Error deleting:", err);
        } finally {
            setDeleting(false);
        }
    };

    const ActionButtons = ({ row }) => (
        <div className="flex border divide-x-2">
            <button
                className="p-2 rounded hover:bg-gray-50"
                title="Edit"
                onClick={() => navigate(`/unique-qr/edit/${row.id}`)}
            >
                <Edit size={16} />
            </button>
            <button
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="Delete"
                onClick={() => handleDeleteClick(row.id)}
                disabled={deleting}
            >
                <Trash2 size={16} />
            </button>
        </div>
    );

    const columns = [
        {
            name: "Action",
            cell: (row) => <ActionButtons row={row} />,
            ignoreRowClick: true,
            center: true,
            width: "100px",
        },
        {
            name: "Name",
            selector: (row) => row.name,
            sortable: true,
            width: "20%",
            cell: (row) => (
                <div className="py-2 text-sm font-medium text-gray-900">
                    {row.name}
                </div>
            ),
        },
        {
            name: "Outlet",
            selector: (row) => row.outlet_name,
            sortable: true,
            width: "20%",
            cell: (row) => (
                <div className="py-2 text-sm text-gray-600">
                    {row.outlet_name || "N/A"}
                </div>
            ),
        },
        {
            name: "Address",
            selector: (row) => row.address,
            sortable: false,
            width: "25%",
            cell: (row) => (
                <div className="py-2 text-sm text-gray-600 max-w-xs truncate">
                    {row.address || "N/A"}
                </div>
            ),
        },
        {
            name: "Status",
            selector: (row) => row.status,
            sortable: true,
            center: true,
            cell: (row) => (
                <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${row.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                        }`}
                >
                    {row.status === "active" ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            name: "QR Code",
            center: true,
            width: "120px",
            cell: (row) =>
                row.qr_image ? (
                    <div className="flex items-center gap-2">
                        <img
                            src={`${BASE_URL}backend/uploads/unique_qr/${row.qr_image}`}
                            alt="QR"
                            className="w-12 h-12 object-contain"
                        />
                        <a
                            href={`${BASE_URL}backend/uploads/unique_qr/${row.qr_image}`}
                            download={`qr-${row.unique_code || row.id}.png`}
                            className="text-green-600 hover:text-green-800"
                            title="Download QR"
                        >
                            <Download size={16} />
                        </a>
                    </div>
                ) : (
                    <QrCode size={24} className="text-gray-300" />
                ),
        },
    ];

    const customStyles = {
        header: {
            style: {
                backgroundColor: "#312e81",
                color: "white",
                fontSize: "16px",
                fontWeight: "600",
                minHeight: "56px",
            },
        },
        headRow: {
            style: {
                backgroundColor: "#312e81",
                borderTopStyle: "none",
                borderBottomStyle: "none",
            },
        },
        headCells: {
            style: {
                color: "white",
                fontSize: "14px",
                fontWeight: "600",
                paddingLeft: "16px",
                paddingRight: "16px",
                backgroundColor: "#312e81",
            },
        },
        rows: {
            style: {
                minHeight: "60px",
                backgroundColor: "white",
                borderBottomStyle: "solid",
                borderBottomWidth: "1px",
                borderBottomColor: "#e5e7eb",
            },
            highlightOnHoverStyle: {
                backgroundColor: "#f9fafb",
                borderBottomColor: "#e5e7eb",
            },
        },
        cells: {
            style: {
                paddingLeft: "16px",
                paddingRight: "16px",
                paddingTop: "8px",
                paddingBottom: "8px",
            },
        },
        pagination: {
            style: {
                backgroundColor: "#ffffff",
                borderTop: "1px solid #e5e7eb",
                borderRadius: "0 0 8px 8px",
            },
        },
    };

    return (
        <div className="min-h-screen">
            <ToastContainer />
            <div className="rounded-t-lg">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-semibold text-gray-500">Unique QR</h1>
                </div>
                <div className="bg-white rounded-lg shadow-sm w-full">
                    <div className="bg-indigo-900 text-white px-6 py-4 rounded-t-lg">
                        <h2 className="text-lg text-white font-medium">Search</h2>
                    </div>
                    <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    QR Name
                                </label>
                                <input
                                    type="text"
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                    placeholder="Search by name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={handleSearch}
                                className="bg-indigo-900 text-white px-6 py-2 rounded-md hover:bg-indigo-800 transition-colors disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? "Searching..." : "Search"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mx-auto py-4">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-red-800">{error}</p>
                        <button
                            onClick={fetchList}
                            className="mt-2 text-red-600 hover:text-red-800 underline"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            )}

            <div className="mx-auto py-6">
                <div className="bg-white shadow">
                    <div className="bg-indigo-900 px-6 py-4 rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium text-white">
                                Unique QR List
                            </h2>
                            <button
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-900 bg-white hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                onClick={() => navigate("/unique-qr/add")}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add New QR
                            </button>
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={paginatedData}
                        customStyles={customStyles}
                        responsive
                        highlightOnHover
                        pointerOnHover
                        pagination
                        paginationServer={true}
                        paginationTotalRows={filteredList.length}
                        paginationDefaultPage={currentPage}
                        paginationPerPage={rowsPerPage}
                        paginationRowsPerPageOptions={[10, 20, 30, 50, 100]}
                        onChangePage={(page) => setCurrentPage(page)}
                        onChangeRowsPerPage={(newPerPage, page) => {
                            setRowsPerPage(newPerPage);
                            setCurrentPage(page);
                        }}
                        sortIcon={<ChevronDown size={16} />}
                        noHeader
                        progressPending={loading}
                        progressComponent={
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            </div>
                        }
                        noDataComponent={
                            <div className="py-8 text-center text-gray-500">
                                No Unique QRs found. Click 'Add New QR' to create one.
                            </div>
                        }
                    />
                </div>

                <DeleteConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={() => {
                        deleteItem(selectedId);
                        setShowDeleteModal(false);
                    }}
                />
            </div>
        </div>
    );
};

export default UniqueQrList;
