import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, Edit, Trash2, Download } from "lucide-react";
import DataTable from "react-data-table-component";
import { useNavigate } from "react-router-dom";
import DeleteConfirmationModal from "@/components/ui/DeletePopUp";
import promoService from "../../../store/api/promoService";
import UserService from "../../../store/api/userService";
import { toast } from "react-toastify";
import { VITE_API_BASE_URL } from "../../../constant/config";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

const PromoList = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDisabled, setIsDisabled] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchTitle, setSearchTitle] = useState("");
  const [searchExpired, setSearchExpired] = useState("");
  const [allPromos, setAllPromos] = useState([]);
  const [userPermissions, setUserPermissions] = useState({});
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

  const handleSearch = () => {
    let filtered = [...allPromos];

    if (searchTitle.trim()) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTitle.toLowerCase())
      );
    }
    if (dateFrom && dateTo) {
      filtered = filtered.filter((p) => {
        if (!p.expiredDate) return false;
        return p.expiredDate >= dateFrom && p.expiredDate <= dateTo;
      });
    }

    setPromos(filtered);
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

      // Parse and set permissions for non-admin users
      let permissions = {};
      if (userData.user_permissions) {
        try {
          permissions = JSON.parse(userData.user_permissions);
          setUserPermissions(permissions);

          if (
            permissions.Promo &&
            permissions.Promo.subItems &&
            permissions.Promo.subItems["Promo Lists"]
          ) {
            if (permissions.Promo.subItems["Promo Lists"].create === true) {
              setHasCreatePermission(true);
            }
            if (permissions.Promo.subItems["Promo Lists"].update === true) {
              setHasUpdatePermission(true);
            }
            if (permissions.Promo.subItems["Promo Lists"].delete === true) {
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

  useEffect(() => {
    fetchPromos();
    fetchUserPermissions();
  }, []);

  // console.log(promos);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await promoService.getAll();

      const transformedPromos =
        response.result?.map((promo) => ({
          id: promo.id,
          name: promo.title,
          code: promo.promotionCode,
          expiredDate: promo.end_date,
          codeTotal: promo.total_redemption_limit,
          codeLeft: promo.left_redemption,
          status: promo.status,
        })) || [];

      setPromos(transformedPromos);
      setAllPromos(transformedPromos);
    } catch (err) {
      console.error("Error fetching promos:", err);
      setError("Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = (promoId) => {
    toast.success(`Promo notification sent for promo ID: ${promoId}`, {
      position: "top-right",
      autoClose: 1500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      try {
        await promoService.delete(itemToDelete.id);
        setPromos(promos.filter((promo) => promo.id !== itemToDelete.id));
        setShowDeleteModal(false);
        setItemToDelete(null);

        toast.success("Promo Code delete successfully", {
          position: "top-right",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      } catch (err) {
        console.error("Error deleting promo:", err);
        toast.error(err.message || "Failed to delete Promo Code", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }
    }
  };

  const addPromotion = () => {
    navigate("/promo/promo_lists/add_new_promo_code");
  };

  const editPromo = (promoId) => {
    navigate(`/promo/promo_lists/edit_promo/${promoId}`);
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
          type: "promo",
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

  const columns = [
    {
      name: "Action",
      width: "120px",
      cell: (row) => (
        <div className="flex gap-3 justify-center">
          {(isAdmin || hasUpdatePermission) && (
            <button
              onClick={() => editPromo(row.id)}
              className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
              title="Edit"
            >
              <Edit size={18} />
            </button>
          )}
          {(isAdmin || hasDeletePermission) && (
            <button
              onClick={() => {
                setItemToDelete(row);
                setShowDeleteModal(true);
              }}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      ),
    },
    {
      name: "Promo Name",
      selector: (row) => row.name,
      sortable: true,
      width: "250px",
    },
    {
      name: "Promo Code",
      selector: (row) => row.code,
      sortable: true,
      width: "140px",
    },
    {
      name: "Promo Expired Date",
      selector: (row) => row.expiredDate,
      sortable: true,
      center: true,
      width: "20%",
      cell: (row) => (
        <span>
          {row.expiredDate
            ? new Date(row.expiredDate).toLocaleDateString()
            : "N/A"}
        </span>
      ),
    },
    {
      name: "Promo Code Total",
      selector: (row) => row.codeTotal,
      sortable: true,
      width: "200px",
      center: true,
    },
    {
      name: "Promo Status",
      selector: (row) => row.status,
      sortable: true,
      width: "160px",
      cell: (row) => {
        const isActive = row.status === "active";
        const isExpired =
          row.expiredDate && new Date(row.expiredDate) < new Date();

        let statusClass = "bg-green-100 text-green-800";
        let statusText =
          row.status.charAt(0).toUpperCase() + row.status.slice(1); // capitalize first letter

        if (isExpired) {
          statusClass = "bg-red-100 text-red-800";
          statusText = "Expired";
        } else if (!isActive) {
          statusClass = "bg-gray-100 text-gray-800";
        }

        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
          >
            {statusText}
          </span>
        );
      },
    },
    {
      name: "Push Notification",
      width: "230px",
      cell: (row) => (
        <button
          onClick={() => sendNotification(row.id)}
          className="px-4 py-2 bg-indigo-900 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors"
        >
          Send Promo Notification
        </button>
      ),
    },
  ];

  const customStyles = {
    table: {
      style: {
        width: "100%",
      },
    },
    header: {
      style: {
        backgroundColor: "#1A237E",
        color: "white",
        fontSize: "18px",
        fontWeight: "600",
        padding: "16px",
        borderTopLeftRadius: "8px",
        borderTopRightRadius: "8px",
      },
    },
    headRow: {
      style: {
        backgroundColor: "#1A237E",
        color: "white",
        fontSize: "14px",
        fontWeight: "500",
        minHeight: "52px",
      },
    },
    headCells: {
      style: {
        color: "white",
        fontSize: "14px",
        fontWeight: "500",
        paddingLeft: "16px",
        paddingRight: "16px",
      },
    },
    rows: {
      style: {
        fontSize: "14px",
        color: "#374151",
        minHeight: "60px",
        "&:nth-of-type(odd)": {
          backgroundColor: "#f9fafb",
        },
        "&:hover": {
          backgroundColor: "#f3f4f6",
        },
      },
    },
    cells: {
      style: {
        paddingLeft: "16px",
        paddingRight: "16px",
        paddingTop: "14px",
        paddingBottom: "14px",
      },
    },
    pagination: {
      style: {
        backgroundColor: "white",
        borderTop: "1px solid #e5e7eb",
        padding: "16px",
        borderRadius: "0 0 8px 8px",
      },
    },
  };

  const paginationComponentOptions = {
    rowsPerPageText: "Rows per page:",
    rangeSeparatorText: "of",
    selectAllRowsItem: true,
    selectAllRowsItemText: "All",
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex justify-center items-center p-8">
            <div className="text-gray-500">Loading promo codes...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex flex-col justify-center items-center p-8">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={fetchPromos}
              className="px-4 py-2 bg-indigo-900 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="rounded-lg shadow-sm">
        {/* Title */}
        <div className="px-2 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Promo List ({promos.length})
          </h2>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm w-full">
          <div className="bg-indigo-900 text-white px-6 py-4 rounded-t-lg">
            <h2 className="text-lg text-white font-medium">Search</h2>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  placeholder="Search Promo Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 
                           focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expired Date
                </label>
                <div className="relative">
                  <select
                    value={searchExpired}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchExpired(value);
                      getFormattedDateRange(value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md 
                              focus:outline-none focus:ring-2 focus:ring-indigo-500 
                              focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">All Dates</option>
                    <option value="today">Today</option>
                    <option value="this-week">This Week</option>
                    <option value="this-month">This Month</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex justify-end mb-4">
              <button
                onClick={handleSearch}
                className="bg-indigo-900 text-white px-6 py-2 rounded-md 
                         hover:bg-indigo-800 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-sm">
          <div className="text-2xl font-semibold text-gray-800 pt-6 pl-6">
            Listing
          </div>
          <div className="flex justify-end items-center p-6 border-b gap-4">
            {(isAdmin || hasCreatePermission) && (
              <button
                onClick={addPromotion}
                className="px-6 py-2.5 bg-indigo-900 text-white text-sm font-medium 
                   rounded-md hover:bg-indigo-700 transition-colors"
              >
                + Add Promotion
              </button>
            )}
            <button
              onClick={exportToCSV}
              disabled={isDisabled}
              className={`bg-white border border-gray-300 px-4 py-2 rounded-md flex items-center gap-2 transition ${
                isDisabled
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-gray-50"
              }`}
            >
              <Download size={18} />
              Export Report
            </button>
          </div>

          {/* Table body */}
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={promos}
              pagination
              paginationComponentOptions={paginationComponentOptions}
              customStyles={customStyles}
              striped
              highlightOnHover
              responsive
              noHeader
              paginationPerPage={5}
              paginationRowsPerPageOptions={[5, 10, 15, 20]}
              sortIcon={<ChevronDown size={16} />}
              dense={false}
              noDataComponent={
                <div className="p-8 text-center text-gray-500">
                  No promo codes found. Click "Add Promotion" to create one.
                </div>
              }
            />
          </div>

          {/* Delete Modal */}
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setItemToDelete(null);
            }}
            onConfirm={handleConfirmDelete}
            itemName={itemToDelete?.name || ""}
          />
        </div>
      </div>
    </div>
  );
};

export default PromoList;
