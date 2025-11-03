import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Edit, Trash2, Plus, ChevronDown, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import itemService from "../../../store/api/itemService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import customStyles from "@/utils/dataTableStyles";
import UserService from "@/store/api/userService";

const PWP = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalItems, setModalItems] = useState([]);
  const [modalTitle, setModalTitle] = useState("");
  const navigate = useNavigate();

  const handleViewMore = (items, title) => {
    setModalItems(items);
    setModalTitle(title);
    setShowModal(true);
  };

  const [userPermissions, setUserPermissions] = useState({});
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState("");
  const [searchAmountType, setSearchAmountType] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  const handleSearch = () => {
    setLoading(true);
    let filtered = data;

    if (searchMode) {
      filtered = filtered.filter((item) =>
        item.mode.toLowerCase().includes(searchMode.toLowerCase())
      );
    }

    if (searchAmountType) {
      filtered = filtered.filter((item) =>
        item.amount_type.toLowerCase().includes(searchAmountType.toLowerCase())
      );
    }

    if (searchDate) {
      filtered = filtered.filter((item) =>
        item.date.toLowerCase().includes(searchDate.toLowerCase())
      );
    }

    console.log("Filtered Data:", filtered); // Debugging
    setFilteredData(filtered);
    setLoading(false);
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
            permissions.Promo.subItems.PWP
          ) {
            if (permissions.Promo.subItems.PWP.create === true) {
              setHasCreatePermission(true);
            }
            if (permissions.Promo.subItems.PWP.update === true) {
              setHasUpdatePermission(true);
            }
            if (permissions.Promo.subItems.PWP.delete === true) {
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
    fetchUserPermissions();
  }, []);

  useEffect(() => {
    const fetchPwpList = async () => {
      try {
        const response = await itemService.getPwpList();
        console.log("🚀 Full API Response:", response);

        if (Array.isArray(response)) {
          setData(response);
        } else if (Array.isArray(response?.data)) {
          setData(response.data);
        } else if (Array.isArray(response?.data?.data)) {
          setData(response.data.data);
        } else {
          console.warn("⚠️ No array found in response:", response);
          setData([]);
        }
      } catch (error) {
        console.error("❌ Failed to fetch PWP list:", error);
        toast.error("Failed to fetch PWP list");
      }
    };

    fetchPwpList();
  }, []);

  const handleEdit = (row) => {
    navigate(`/promo/pwp/edit_pwp/${row.id}`); // Pass ID in URL
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      try {
        const response = await itemService.deletePwp(itemToDelete.id);

        // Check if the response itself has a status property
        if (response?.status === 200) {
          setData((prevData) =>
            prevData.filter((item) => item.id !== itemToDelete.id)
          );
          toast.success(response?.message || "PWP item deleted successfully!");
        }
        // If the API wraps the response in a data property
        else if (response?.data?.status === 200) {
          setData((prevData) =>
            prevData.filter((item) => item.id !== itemToDelete.id)
          );
          toast.success(
            response?.data?.message || "PWP item deleted successfully!"
          );
        } else {
          toast.error(
            response?.message ||
              response?.data?.message ||
              "Failed to delete PWP item."
          );
        }
      } catch (error) {
        console.error("Error deleting PWP item:", error);
        toast.error("An error occurred while deleting the PWP item.");
      } finally {
        setShowDeleteModal(false);
        setItemToDelete(null);
      }
    }
  };

  const handleAddNew = () => {
    navigate("/promo/pwp/add_new_pwp");
  };

  const columns = [
    {
      name: "Action",
      cell: (row) => (
        <div className="flex gap-2">
          {(isAdmin || hasUpdatePermission) && (
            <button
              onClick={() => handleEdit(row)}
              className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
              title="Edit"
            >
              <Edit size={16} />
            </button>
          )}
          {(isAdmin || hasDeletePermission) && (
            <button
              onClick={() => {
                setItemToDelete(row);
                setShowDeleteModal(true);
              }}
              className="p-1 text-gray-600 hover:text-red-600 transition-colors"
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
      width: "7%",
    },
    {
      name: "PWP Mode",
      selector: (row) => row?.mode || "–",
      sortable: true,
      cell: (row) => (
        <span>
          {row?.mode === "selected_item"
            ? "Selected Items"
            : row?.mode === "all_item"
            ? "All Items"
            : "Unknown"}
        </span>
      ),
      width: "12%",
    },
    {
      name: "PWP Items",
      selector: (row) => row?.pwp_item_details || [],
      sortable: false,
      cell: (row) => {
        const maxItemsToShow = 2;
        const items = row.pwp_item_details || [];
        const showMore = items.length > maxItemsToShow;

        return (
          <div className="flex flex-wrap gap-2">
            {items.slice(0, maxItemsToShow).map((item, idx) => (
              <span
                key={item?.id || idx}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {item?.title || "Untitled"}
              </span>
            ))}
            {showMore && (
              <button
                className="text-blue-600 hover:underline text-sm"
                onClick={() => handleViewMore(items, "PWP Items")}
              >
                ...and more
              </button>
            )}
            {items.length === 0 && (
              <span className="text-gray-400 text-sm">None</span>
            )}
          </div>
        );
      },
      width: "20%",
    },
    {
      name: "With Purchase Of",
      selector: (row) => row?.selected_item_details || [],
      sortable: false,
      cell: (row) => {
        const maxItemsToShow = 2;
        // Assuming your API returns purchase items in selected_item_details
        const items = row.selected_item_details || [];
        const showMore = items.length > maxItemsToShow;

        return (
          <div className="flex flex-wrap gap-2 items-center my-6">
            {items.slice(0, maxItemsToShow).map((item, idx) => (
              <span
                key={item?.id || idx}
                className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm"
              >
                {item?.title || "Untitled"}
              </span>
            ))}
            {showMore && (
              <button
                className="text-green-600 hover:underline text-sm"
                onClick={() => handleViewMore(items, "With Purchase Of Items")}
              >
                ...and more
              </button>
            )}
            {items.length === 0 && (
              <span className="text-gray-400 text-sm">None</span>
            )}
          </div>
        );
      },
      width: "17%",
    },
    {
      name: "PWP Price",
      selector: (row) => row?.amount || "0.00",
      sortable: true,
      format: (row) =>
        row?.amount_type === "amount"
          ? `MYR ${parseFloat(row?.amount || 0).toFixed(2)}`
          : `${parseFloat(row?.amount || 0)}`,
      width: "10%",
    },
    {
      name: "Required Qty/Amount",
      selector: (row) => row?.amount_type || "–",
      sortable: true,
      cell: (row) => (
        <div className="text-center">
          <div>{row?.amount_type === "amount" ? "Amount" : "Quantity"}</div>
        </div>
      ),
      width: "16%",
    },
    {
      name: "Created Date",
      selector: (row) => row?.created_at || "–",
      sortable: true,
      format: (row) => new Date(row?.created_at).toLocaleDateString(),
      width: "13%",
    },
  ];

  const paginationComponentOptions = {
    rowsPerPageText: "Rows per page:",
    rangeSeparatorText: "of",
    selectAllRowsItem: true,
    selectAllRowsItemText: "All",
  };

  return (
    <div className="w-full rounded-md">
      <div className="px-2 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          PWP Setting
        </h2>
      </div>
      <div className="bg-indigo-900 text-white px-6 py-4 rounded-t-lg">
        <h2 className="text-lg text-white font-medium">Search</h2>
      </div>
      <div className="p-6 bg-white border-b border-gray-200 rounded-b-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Mode:
            </label>
            <select
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select mode</option>
              <option value="all_item">All Items</option>
              <option value="selected_item">Selected Items</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Required Qty/Amount:
            </label>
            <select
              placeholder="Enter status"
              value={searchAmountType}
              onChange={(e) => setSearchAmountType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select status</option>
              <option value="quantity">Quantity</option>
              <option value="amount">Amount</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            className="bg-indigo-900 text-white px-6 py-2 rounded-md hover:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "Searching..." : " "}
            Search
          </button>
        </div>
      </div>

       <div className="text-2xl font-semibold text-gray-800">Listing</div>
      <div className="flex justify-end items-center p-6 border-b border-gray-200 mt-6 bg-white rounded-t-md gap-4">
       
        {(isAdmin || hasCreatePermission) && (
          <button
            onClick={handleAddNew}
            className="bg-indigo-900 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Add New PWP
          </button>
        )}
        <button className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 flex items-center gap-2 transition-colors">
                    <Download size={20} />
                    Export Report
                  </button>
      </div>

      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={filteredData.length > 0 ? filteredData : data}
          customStyles={customStyles}
          responsive
          highlightOnHover
          striped
          noHeader
          sortIcon={<ChevronDown size={16} />}
          className="min-w-full"
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[5, 10, 15, 20, 25]}
          paginationComponentOptions={paginationComponentOptions}
        />
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white shadow-xl rounded-md p-6 w-full max-w-md border border-gray-200">
            <h2 className="text-lg font-medium mb-4 text-center">
              Are you sure you want to delete?
            </h2>
            <p className="mb-6 text-center">
              Deleting this item is permanent and cannot be undone.
            </p>
            <div className="flex justify-center space-x-6 mt-2">
              <button
                className="px-8 py-2 border border-gray-300 rounded-md"
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-8 py-2 bg-indigo-900 text-white rounded-md"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{modalTitle}</h2>
              <button
                className="text-gray-500 hover:text-gray-700 text-2xl"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {modalItems.map((item, idx) => (
                <div
                  key={item?.id || idx}
                  className="flex items-center justify-between p-3 bg-gray-100 rounded border"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {item?.title || "Untitled"}
                    </div>
                    <div className="text-sm text-gray-500">
                      Price: MYR {item?.price || "0.00"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PWP;
