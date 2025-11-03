import React, { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Edit, Trash2, Plus, ChevronDown, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmationModal from "../../components/ui/DeletePopUp";
import { ToastContainer, toast } from "react-toastify";
import voucherService from "../../store/api/voucherService";
import UserService from "../../store/api/userService";
import { VITE_API_BASE_URL } from "../../constant/config";
import "react-toastify/dist/ReactToastify.css";

const VoucherLists = () => {
  const [searchType, setSearchType] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [voucherToDeleteId, setVoucherToDeleteId] = useState(null);
  const [voucherData, setVoucherData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [userPermissions, setUserPermissions] = useState({});
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    name: "",
    dateFrom: "",
    dateTo: "",
  });

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

  const handleSearch = () => {
    setFilters({
      type: searchType,
      name: searchName,
      dateFrom,
      dateTo,
    });
  };

  const getFilteredVouchers = () => {
    return voucherData.filter((voucher) => {
      let matchesType =
        !filters.type || voucher.voucher_expiry_type === filters.type;
      let matchesName =
        !filters.name ||
        voucher.voucher_name.toLowerCase().includes(filters.name.toLowerCase());
      let matchesDate = true;

      if (
        filters.dateFrom &&
        filters.dateTo &&
        voucher.voucher_expired_date !== "0000-00-00"
      ) {
        const expiredDate = new Date(voucher.voucher_expired_date);
        matchesDate =
          expiredDate >= new Date(filters.dateFrom) &&
          expiredDate <= new Date(filters.dateTo);
      }

      return matchesType && matchesName && matchesDate;
    });
  };

  const fetchUserPermissions = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;

      const userObj = JSON.parse(userStr);
      const userId = userObj?.user.user_id;
      if (!userId) return;

      const userDataRes = await UserService.getUser(userId);
      const userData = userDataRes?.data;
      if (!userData) return;

      // Check if user is admin
      if (userData.role && userData.role.toLowerCase() === "admin") {
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

          if (
            permissions.Voucher &&
            permissions.Voucher.subItems &&
            permissions.Voucher.subItems.List
          ) {
            if (permissions.Voucher.subItems.List.create === true) {
              setHasCreatePermission(true);
            }
            if (permissions.Voucher.subItems.List.update === true) {
              setHasUpdatePermission(true);
            }
            if (permissions.Voucher.subItems.List.delete === true) {
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

  const getFormattedDateRange = (value) => {
    const today = new Date();

    const getTodayLocal = () => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    const todayLocal = getTodayLocal();

    const format = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    if (value === "today") {
      const formatted = format(todayLocal);
      setDateFrom(formatted);
      setDateTo(formatted);
    } else if (value === "this-week") {
      const day = todayLocal.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(todayLocal);
      monday.setDate(todayLocal.getDate() + diffToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      setDateFrom(format(monday));
      setDateTo(format(sunday));
    } else if (value === "this-month") {
      const startOfMonth = new Date(
        todayLocal.getFullYear(),
        todayLocal.getMonth(),
        1
      );
      const endOfMonth = new Date(
        todayLocal.getFullYear(),
        todayLocal.getMonth() + 1,
        0
      );

      setDateFrom(format(startOfMonth));
      setDateTo(format(endOfMonth));
    } else {
      setDateFrom("");
      setDateTo("");
    }
  };

  const mapValueFromExpiryType = {
    date: "Fixed Date",
    days: "Expiry Days",
  };

  const fetchVoucherData = async (searchParams = {}) => {
    try {
      setLoading(true);

      // const params = {};
      // if (searchParams.searchType) params.voucher_expiry_type = searchParams.searchType;
      // if (searchParams.searchName) params.voucher_name = searchParams.searchName;
      // if (searchParams.dateFrom) params.date_from = searchParams.dateFrom;
      // if (searchParams.dateTo) params.date_to = searchParams.dateTo;

      const response = await voucherService.getAll();

      if (response && response.data) {
        setVoucherData(response.data);
      } else {
        setVoucherData(response || []);
      }
    } catch (error) {
      console.error("Error fetching voucher data:", error);
      toast.error(error.message || "Failed to fetch voucher data");
      setVoucherData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoucherData();
    fetchUserPermissions();
  }, []);

  // useEffect(() => {
  //   console.log("voucherData updated:", voucherData);
  // }, [voucherData]);

  const columns = [
    {
      name: "Action",
      cell: (row) => (
        <div className="flex gap-2">
          {(isAdmin || hasUpdatePermission) && (
            <button
              onClick={() => handleEdit(row.id)}
              className=" hover:text-blue-600 p-1"
              title="Edit"
            >
              <Edit size={16} />
            </button>
          )}
          {(isAdmin || hasDeletePermission) && (
            <button
              onClick={() => handleDeleteClick(row.id)}
              className=" hover:text-red-600 p-1"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      minWidth: "120px",
    },
    ,
    {
      name: "Voucher Name",
      selector: (row) => row.voucher_name,
      minWidth: "180px",
      wrap: true,
    },
    {
      name: "Voucher Type",
      selector: (row) => row.voucher_name,
      minWidth: "160px",
      wrap: true,
    },
    {
      name: "Points to Redeem",
      selector: (row) => row.voucher_point_redeem,
      minWidth: "180px",
      cell: (row) => {
        const points = row.voucher_point_redeem;
        return points ? parseFloat(points).toFixed(2) : "N/A";
      },
    },
    {
      name: "Total Count",
      selector: (row) => row.voucher_total_count,
      minWidth: "130px",
      cell: (row) => {
        return row.voucher_total_count || "0";
      },
    },
    {
      name: "Redeemed Count",
      selector: (row) => row.voucher_redeem_count,
      minWidth: "180px",
      cell: (row) => {
        return row.voucher_redeem_count || "0";
      },
    },
    {
      name: "Customer Count",
      selector: (row) => row.voucher_count_customer,
      minWidth: "160px",
      cell: (row) => {
        return row.voucher_count_customer || "0";
      },
    },
    {
      name: "Expiry Type",
      selector: (row) => row.voucher_expiry_type,
      minWidth: "130px",
      cell: (row) => {
        if (!row.voucher_expiry_type) return "-";
        // Use the mapping object to get the display value
        return (
          mapValueFromExpiryType[row.voucher_expiry_type] ||
          row.voucher_expiry_type.charAt(0).toUpperCase() +
            row.voucher_expiry_type.slice(1)
        );
      },
    },
    {
      name: "Expiry Value",
      selector: (row) => row.voucher_expiry_value,
      minWidth: "130px",
      cell: (row) => {
        if (row.voucher_expiry_type === "days") {
          return row.voucher_expiry_value
            ? `${row.voucher_expiry_value} days`
            : "-";
        }
        return row.voucher_expiry_value || "-";
      },
    },
    {
      name: "Expired Date",
      selector: (row) => row.voucher_expired_date,
      minWidth: "150px",
      cell: (row) => {
        const date = row.voucher_expired_date;
        return date !== "0000-00-00"
          ? new Date(date).toLocaleDateString()
          : "N/A";
      },
    },
  ];

  const navigate = useNavigate();

  const handleEdit = (id) => {
    navigate("/voucher/lists/edit_voucher_lists/" + id);
  };

  const confirmDelete = async (voucherId) => {
    try {
      setLoading(true);

      await voucherService.delete(voucherId);
      await fetchVoucherData({ searchType, searchName, dateFrom, dateTo });

      setShowDeleteModal(false);
      setVoucherToDeleteId(null);
    } catch (error) {
      console.error("Error deleting voucher:", error);
      toast.error(error.message || "Failed to delete voucher");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (voucherId) => {
    setVoucherToDeleteId(voucherId);
    setShowDeleteModal(true);
  };

  const handleAddNew = () => {
    navigate("/voucher/lists/add_voucher_lists");
  };

  const exportToCSV = async () => {
    if (isDisabled) return;
    setIsDisabled(true);

    try {
      const response = await fetch(`${VITE_API_BASE_URL}outlets/export-excel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: new URLSearchParams({
          user_id: user_id,
          type: "voucher",
        }),
      });

      const result = await response.json();
      if (result.status === 200) {
        toast.success(
          "Export file has been processed, this may take a while! You can find it in the Excel Report tab."
        );
      } else {
        toast.error("Failed to export file.");
      }
    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setTimeout(() => setIsDisabled(false), 1000);
    }
  };

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "#312e81",
        color: "white",
        minHeight: "50px",
        fontSize: "16px",
        justifyContent: "center",
      },
    },
    headCells: {
      style: {
        paddingLeft: "16px",
        paddingRight: "16px",
        fontWeight: "500",
        justifyContent: "center",
        textAlign: "center",
        subHeaderWrap: true,
        whiteSpace: "normal",
        wordBreak: "break-word",
        maxWidth: "200px",
      },
    },
    rows: {
      style: {
        minHeight: "60px",
        fontSize: "15px",
        "&:hover": {
          backgroundColor: "#f9fafb",
        },
        justifyContent: "center",
        center: true,
      },
      highlightOnHoverStyle: {
        backgroundColor: "#f9fafb",
      },
    },
    cells: {
      style: {
        paddingLeft: "16px",
        paddingRight: "16px",
        justifyContent: "center",
        textAlign: "center",
        alignItems: "center",
        center: true,
      },
    },
    pagination: {
      style: {
        borderTopStyle: "solid",
        borderTopWidth: "1px",
        borderTopColor: "#e5e7eb",
      },
    },
  };

  return (
    <div className="p-6 min-h-screen">
      <h3 className="mb-5 ml-2 text-[20px] text-gray-500">Lists</h3>

      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="bg-indigo-900 px-6 py-4 rounded-t-lg">
          <h2 className="text-lg text-white font-semibold">Search</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voucher Expiry Type :
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">All Types</option>
                <option value="date">Fixed Date</option>
                <option value="days">Expiry Days</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voucher Name :
              </label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Search Voucher Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expired Date :
              </label>
              <select
                value={searchDate}
                onChange={(e) => {
                  setSearchDate(e.target.value);
                  getFormattedDateRange(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSearch}
              className="bg-indigo-900 text-white px-6 py-2 rounded-md hover:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="text-2xl font-semibold text-gray-800 pt-6 pl-6">
          Listing
        </div>
        <div className="flex items-center justify-end gap-4 p-6 border-b">
          {(isAdmin || hasCreatePermission) && (
            <button
              onClick={handleAddNew}
              className="bg-indigo-900 text-white px-4 py-2 rounded-md hover:bg-indigo-800 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              <Plus size={16} />
              Add New Voucher
            </button>
          )}
          <button
            onClick={exportToCSV}
            disabled={isDisabled}
            className={`bg-white border border-gray-300 px-4 py-2 rounded-md flex items-center gap-2 transition ${
              isDisabled ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"
            }`}
          >
            <Download size={18} />
            Export Report
          </button>
        </div>

        <DataTable
          columns={columns}
          data={getFilteredVouchers()}
          customStyles={customStyles}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 20, 30]}
          highlightOnHover
          pointerOnHover
          responsive
          sortIcon={<ChevronDown size={16} />}
          progressPending={loading}
          progressComponent={
            <div className="text-center py-8">
              <div className="text-gray-500">Loading...</div>
            </div>
          }
          noDataComponent={
            <div className="text-center py-8 text-gray-500">
              No vouchers found
            </div>
          }
        />

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setVoucherToDeleteId(null);
          }}
          onConfirm={() => confirmDelete(voucherToDeleteId)}
        />
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default VoucherLists;
