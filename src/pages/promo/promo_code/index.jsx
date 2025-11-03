import React, { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Edit, Trash2, Plus, ChevronDown, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmationModal from "../../../components/ui/DeletePopUp";
import { ToastContainer, toast } from "react-toastify";
import promoCodeService from "../../../store/api/promoCodeService";
import UserService from "../../../store/api/userService";
import { VITE_API_BASE_URL } from "../../../constant/config";
import "react-toastify/dist/ReactToastify.css";

const PromoCodeLists = () => {
  const [searchType, setSearchType] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [promoCodeToDeleteId, setPromoCodeToDeleteId] = useState(null);
  const [promoCodeData, setPromoCodeData] = useState([]);
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
          type: "promocode",
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

  const handleSearch = () => {
    setFilters({
      type: searchType,
      name: searchName,
      dateFrom,
      dateTo,
    });
  };

  const getFilteredPromoCodes = () => {
    return promoCodeData.filter((promoCode) => {
      let matchesType =
        !filters.type || promoCode.usage_limit_type === filters.type;
      let matchesName =
        !filters.name ||
        promoCode.code.toLowerCase().includes(filters.name.toLowerCase());
      let matchesDate = true;

      if (filters.dateFrom && filters.dateTo && promoCode.end_date) {
        const endDate = new Date(promoCode.end_date);
        matchesDate =
          endDate >= new Date(filters.dateFrom) &&
          endDate <= new Date(filters.dateTo);
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
            permissions.PromoCode &&
            permissions.PromoCode.subItems &&
            permissions.PromoCode.subItems.List
          ) {
            if (permissions.PromoCode.subItems.List.create === true) {
              setHasCreatePermission(true);
            }
            if (permissions.PromoCode.subItems.List.update === true) {
              setHasUpdatePermission(true);
            }
            if (permissions.PromoCode.subItems.List.delete === true) {
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

  const fetchPromoCodeData = async (searchParams = {}) => {
    try {
      setLoading(true);
      const response = await promoCodeService.getAll();
      console.log(response);
      if (response && response.result) {
        setPromoCodeData(response.result);
      } else {
        setPromoCodeData(response || []);
      }
    } catch (error) {
      console.error("Error fetching promo code data:", error);
      toast.error(error.message || "Failed to fetch promo code data");
      setPromoCodeData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodeData();
    fetchUserPermissions();
  }, []);

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
    {
      name: "Promo Code",
      selector: (row) => row.code,
      minWidth: "150px",
      wrap: true,
    },
    {
      name: "Usage Limit Type",
      selector: (row) => row.usage_limit_type,
      minWidth: "130px",
      cell: (row) => {
        return row.usage_limit_type === "multiple"
          ? "Multiple Times"
          : "One Time";
      },
    },
    {
      name: "Total Redemption",
      selector: (row) => row.total_redemption_limit,
      minWidth: "150px",
      cell: (row) => {
        return row.total_redemption_limit || "Unlimited";
      },
    },
    {
      name: "Start Date",
      selector: (row) => row.start_date,
      minWidth: "130px",
      cell: (row) => {
        const date = row.start_date;
        return date ? new Date(date).toLocaleDateString() : "N/A";
      },
    },
    {
      name: "End Date",
      selector: (row) => row.end_date,
      minWidth: "130px",
      cell: (row) => {
        const date = row.end_date;
        return date ? new Date(date).toLocaleDateString() : "N/A";
      },
    },
  ];

  const navigate = useNavigate();

  const handleEdit = (id) => {
    navigate("/promo/promo_code/edit/" + id);
  };

  const confirmDelete = async (promoCodeId) => {
    try {
      setLoading(true);

      await promoCodeService.delete(promoCodeId);
      await fetchPromoCodeData({ searchType, searchName, dateFrom, dateTo });

      setShowDeleteModal(false);
      setPromoCodeToDeleteId(null);
    } catch (error) {
      console.error("Error deleting promo code:", error);
      toast.error(error.message || "Failed to delete promo code");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (promoCodeId) => {
    setPromoCodeToDeleteId(promoCodeId);
    setShowDeleteModal(true);
  };

  const handleAddNew = () => {
    navigate("/promo/promo_code/new");
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
      <h3 className="mb-5 ml-2 text-[20px] text-gray-500">Promo Code Lists</h3>

      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="bg-indigo-900 px-6 py-4 rounded-t-lg">
          <h2 className="text-lg text-white font-semibold">Search</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usage Limit Type :
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">All Types</option>
                <option value="multiple">Multiple Times</option>
                <option value="one">One Time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promo Code :
              </label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Search Promo Code"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
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
        <div className="text-3xl font-semibold text-gray-800 pt-6 pl-6">
          Listing
        </div>
        <div className="flex justify-end items-center p-6 border-b gap-4">
          {(isAdmin || hasCreatePermission) && (
            <button
              onClick={handleAddNew}
              className="bg-indigo-900 text-white px-4 py-2 rounded-md hover:bg-indigo-800 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              <Plus size={16} />
              Add New Promo Code
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
          data={getFilteredPromoCodes()}
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
              No promo codes found
            </div>
          }
        />

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setPromoCodeToDeleteId(null);
          }}
          onConfirm={() => confirmDelete(promoCodeToDeleteId)}
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

export default PromoCodeLists;
