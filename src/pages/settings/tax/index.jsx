import React, { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import Select from "react-select";
import { Plus, Edit, Trash2, X, AlertCircle } from "lucide-react";
import taxService from "../../../store/api/taxService";
import OutletApiService from "../../../store/api/outletService"; // Import outlet service
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Confirm Delete
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">
            Are you sure you want to delete the {itemType} "{itemName}"? This
            action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const ErrorAlert = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
      <AlertCircle className="text-red-500" size={20} />
      <span className="text-red-700 flex-1">{message}</span>
      <button onClick={onClose} className="text-red-500 hover:text-red-700">
        <X size={18} />
      </button>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

const TaxSettings = () => {
  const [taxes, setTaxes] = useState([]);
  const [outlets, setOutlets] = useState([]); // State for outlets
  const [loading, setLoading] = useState(true);
  const [loadingOutlets, setLoadingOutlets] = useState(true); // Loading state for outlets
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    outlet_id: [],
    tax_type: "",
    tax_rate: "",
    order_type: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [viewMoreModal, setViewMoreModal] = useState({
    isOpen: false,
    title: "",
    items: [],
  });

  const handleViewMore = (items, title) => {
    setViewMoreModal({
      isOpen: true,
      title,
      items,
    });
  };

  const closeViewMoreModal = () => {
    setViewMoreModal({
      isOpen: false,
      title: "",
      items: [],
    });
  };

  const orderTypeOptions = [
    { value: "dinein", label: "Dine In" },
    { value: "pickup", label: "Pick Up" },
    { value: "delivery", label: "Delivery" },
  ];

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

  useEffect(() => {
    loadTaxes();
    loadOutlets(); // Load outlets when component mounts
  }, []);

  const loadTaxes = async () => {
    try {
      setLoading(true);
      const taxesData = await taxService.fetchTaxes();
      setTaxes(taxesData);
      setError("");
    } catch (err) {
      console.error("Error loading taxes:", err);
      setError(err.message);
      setTaxes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOutlets = async () => {
    try {
      setLoadingOutlets(true);
      const outletsResponse = await OutletApiService.getOutlets(user_id);

      // Handle different response structures
      const outletsData = Array.isArray(outletsResponse)
        ? outletsResponse
        : Array.isArray(outletsResponse.result)
        ? outletsResponse.result
        : Array.isArray(outletsResponse.data)
        ? outletsResponse.data
        : [];

      setOutlets(outletsData);
    } catch (err) {
      console.error("Error fetching outlets:", err);
      setError("Failed to load outlets");
    } finally {
      setLoadingOutlets(false);
    }
  };

  const outletOptions = useMemo(() => {
    const options = outlets.map((outlet) => ({
      value: outlet.id,
      label: outlet.title || outlet.name || `Outlet ${outlet.id}`,
    }));

    // Add "Select All" option
    return [{ value: "all", label: "Select All Outlets" }, ...options];
  }, [outlets]);

  const handleOutletChange = (selectedOptions) => {
    // If "Select All" is chosen
    if (selectedOptions.some((option) => option.value === "all")) {
      // Select all outlets except the "Select All" option
      const allOutlets = outletOptions.filter(
        (option) => option.value !== "all"
      );
      setFormData((prev) => ({
        ...prev,
        outlet_id: allOutlets,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        outlet_id: selectedOptions,
      }));
    }
  };

  const handleOrderTypeChange = (selectedOptions) => {
    setFormData((prev) => ({
      ...prev,
      order_type: selectedOptions,
    }));
  };

  const columns = [
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          <button
            className=" hover:text-blue-800 disabled:opacity-50"
            onClick={() => handleEdit(row)}
            disabled={submitting}
          >
            <Edit size={16} />
          </button>
          <button
            className=" hover:text-red-800 disabled:opacity-50"
            onClick={() => handleDeleteClick(row)}
            disabled={submitting}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
    {
      name: "Outlet",
      selector: (row) => row.outlet_id,
      sortable: true,
      cell: (row) => {
        const maxItemsToShow = 3; // Limit the number of outlets to display
        const outletIds = Array.isArray(row.outlet_id)
          ? row.outlet_id
          : typeof row.outlet_id === "string"
          ? row.outlet_id.split(",").map((id) => id.trim())
          : [row.outlet_id];

        const outletTitles = outletIds.map((id) => {
          const outlet = outlets.find((o) => o.id == id); // Use == for loose comparison
          return outlet
            ? outlet.title || outlet.name || `Outlet ${id}`
            : `Outlet ${id}`;
        });

        return (
          <div className="flex flex-wrap gap-2">
            {outletTitles.slice(0, maxItemsToShow).map((title, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {title}
              </span>
            ))}
            {outletTitles.length > maxItemsToShow && (
              <button
                className="text-blue-600 hover:underline text-sm"
                onClick={() => handleViewMore(outletTitles, "Outlets")}
              >
                ...and more
              </button>
            )}
            {outletTitles.length === 0 && (
              <span className="text-gray-400 text-sm">None</span>
            )}
          </div>
        );
      },
      width: "400px",
    },
    {
      name: "Tax Type",
      selector: (row) => row.tax_type,
      sortable: true,
      width: "250px",
    },
    {
      name: "Tax Rate (%)",
      selector: (row) => row.tax_rate,
      sortable: true,
      format: (row) => `${row.tax_rate}%`,
      width: "200px",
    },
    {
      name: "Order Types",
      selector: (row) => row.order_type,
      sortable: true,
      format: (row) => {
        if (!row.order_type) return "N/A";
        const orderTypes = Array.isArray(row.order_type)
          ? row.order_type
          : typeof row.order_type === "string"
          ? row.order_type.split(",")
          : [];

        return orderTypes
          .map((type) => {
            const option = orderTypeOptions.find((opt) => opt.value === type);
            return option ? option.label : type;
          })
          .join(", ");
      },
      width: "200px",
    },
    {
      name: "Created At",
      selector: (row) => row.created_at,
      sortable: true,
      format: (row) =>
        row.created_at ? new Date(row.created_at).toLocaleDateString() : "",
    },
  ];

  const handleAdd = async () => {
    if (
      formData.outlet_id.length > 0 &&
      formData.tax_type &&
      formData.tax_rate
    ) {
      try {
        setSubmitting(true);

        // Convert selected outlets to comma-separated string or array of IDs
        const outletIds = formData.outlet_id.map((outlet) => outlet.value);

        // Convert selected order types to array of values
        const orderTypes = formData.order_type.map((type) => type.value);

        await taxService.createTax({
          outlet_id: outletIds, // This will be handled by our API conversion
          tax_type: formData.tax_type,
          tax_rate: formData.tax_rate,
          order_type: orderTypes,
        });

        await loadTaxes();
        setFormData({
          outlet_id: [],
          tax_type: "",
          tax_rate: "",
          order_type: [],
        });
        setShowAddModal(false);
        toast.success("Tax Setting added successfully!");
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);

    // Parse existing outlet IDs
    const existingOutletIds = Array.isArray(item.outlet_id)
      ? item.outlet_id
      : typeof item.outlet_id === "string"
      ? item.outlet_id.split(",").map((id) => id.trim())
      : [item.outlet_id];

    // Convert to react-select format
    const selectedOutlets = outletOptions.filter((option) =>
      existingOutletIds.includes(option.value.toString())
    );

    // Parse existing order types
    const existingOrderTypes = Array.isArray(item.order_type)
      ? item.order_type
      : typeof item.order_type === "string"
      ? item.order_type.split(",").map((type) => type.trim())
      : [];

    const selectedOrderTypes = orderTypeOptions.filter((option) =>
      existingOrderTypes.includes(option.value)
    );

    setFormData({
      outlet_id: selectedOutlets,
      tax_type: item.tax_type || "",
      tax_rate: item.tax_rate?.toString() || "",
      order_type: selectedOrderTypes,
    });
    setShowEditModal(true);
    setError("");
  };

  const handleUpdate = async () => {
    if (
      formData.outlet_id.length > 0 &&
      formData.tax_type &&
      formData.tax_rate &&
      editingItem
    ) {
      try {
        setSubmitting(true);

        // Convert selected outlets to array of IDs
        const outletIds = formData.outlet_id.map((outlet) => outlet.value);

        // Convert selected order types to array of values
        const orderTypes = formData.order_type.map((type) => type.value);

        await taxService.updateTax(editingItem.id, {
          outlet_id: outletIds,
          tax_type: formData.tax_type,
          tax_rate: formData.tax_rate,
          order_type: orderTypes,
        });

        await loadTaxes();
        setFormData({
          outlet_id: [],
          tax_type: "",
          tax_rate: "",
          order_type: [],
        });
        setEditingItem(null);
        setShowEditModal(false);
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
    setError("");
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      try {
        setSubmitting(true);
        await taxService.deleteTax(itemToDelete.id);

        await loadTaxes();
        toast.success(`Tax Setting "${itemToDelete.tax_type}" deleted successfully!`);
        setItemToDelete(null);
        setShowDeleteModal(false);
        setError("");
      } catch (err) {
        console.error("Error deleting tax:", err);
        toast.error("Failed to delete tax. Please try again.");
        setShowDeleteModal(false);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const closeModal = () => {
    setFormData({ outlet_id: "", tax_type: "", tax_rate: "" });
    setEditingItem(null);
    setShowAddModal(false);
    setShowEditModal(false);
    setError("");
  };

  const customStyles = {
    header: {
      style: {
        backgroundColor: "#1A237E",
        color: "white",
        fontSize: "18px",
        fontWeight: "bold",
        minHeight: "60px",
        paddingLeft: "24px",
        paddingRight: "24px",
      },
    },
    headRow: {
      style: {
        backgroundColor: "#1A237E",
        color: "white",
        fontSize: "14px",
        fontWeight: "600",
        minHeight: "50px",
        borderBottomWidth: "1px",
        borderBottomColor: "#e5e7eb",
      },
    },
    headCells: {
      style: {
        color: "white",
        fontSize: "14px",
        fontWeight: "600",
        paddingLeft: "16px",
        paddingRight: "16px",
      },
    },
    rows: {
      style: {
        fontSize: "14px",
        color: "#374151",
        "&:hover": {
          backgroundColor: "#f9fafb",
        },
      },
      stripedStyle: {
        backgroundColor: "#f8fafc",
      },
    },
    cells: {
      style: {
        paddingLeft: "16px",
        paddingRight: "16px",
        paddingTop: "12px",
        paddingBottom: "12px",
      },
    },
    pagination: {
      style: {
        fontSize: "14px",
        color: "#6b7280",
        backgroundColor: "white",
        borderTopColor: "#e5e7eb",
        borderTopWidth: "1px",
      },
    },
  };

  const customSelectStyles = {
    multiValue: (styles) => ({
      ...styles,
      backgroundColor: "#2563eb", // Tailwind blue-600
      color: "white",
      borderRadius: "6px",
      padding: "2px 6px",
    }),
    multiValueLabel: (styles) => ({
      ...styles,
      color: "white",
      fontWeight: "500",
    }),
    multiValueRemove: (styles) => ({
      ...styles,
      color: "white",
      ":hover": {
        backgroundColor: "#1d4ed8", // Tailwind blue-700
        color: "white",
      },
    }),
    option: (styles, { isFocused, isSelected }) => ({
      ...styles,
      backgroundColor: isSelected
        ? "#2563eb"
        : isFocused
        ? "#dbeafe" // light blue for hover
        : null,
      color: isSelected ? "white" : "#111827", // text-white if selected
      cursor: "pointer",
    }),
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-gray-900">Tax Settings</h2>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={loading || submitting || loadingOutlets}
            className="bg-indigo-900 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            Add Tax
          </button>
        </div>

        <div className="p-6">
          <ErrorAlert message={error} onClose={() => setError("")} />

          {loading ? (
            <LoadingSpinner />
          ) : (
            <DataTable
              columns={columns}
              data={taxes}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50]}
              highlightOnHover
              pointerOnHover
              customStyles={customStyles}
              className="border border-gray-200 rounded-lg"
              noDataComponent={
                <div className="py-8 text-center text-gray-500">
                  No tax settings found. Click "Add Tax" to create your first
                  tax setting.
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New Tax
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={submitting}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outlets (Select Multiple)
                </label>
                {loadingOutlets ? (
                  <div className="flex items-center justify-center py-2 border border-gray-300 rounded-md">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                    Loading outlets...
                  </div>
                ) : (
                  <Select
                    isMulti
                    options={outletOptions}
                    value={formData.outlet_id}
                    onChange={handleOutletChange}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Select outlets..."
                    isSearchable
                    isDisabled={submitting}
                    styles={customSelectStyles}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Types (Select Multiple)
                </label>
                <Select
                  isMulti
                  options={orderTypeOptions}
                  value={formData.order_type}
                  onChange={handleOrderTypeChange}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Select order types..."
                  isDisabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Type
                </label>
                <input
                  type="text"
                  value={formData.tax_type}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tax type (e.g., GST, Service Tax)"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_rate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tax rate"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={
                  formData.outlet_id.length === 0 ||
                  !formData.tax_type ||
                  !formData.tax_rate ||
                  submitting
                }
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {submitting ? "Adding..." : "Add Tax"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Tax</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={submitting}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outlets (Select Multiple)
                </label>
                {loadingOutlets ? (
                  <div className="flex items-center justify-center py-2 border border-gray-300 rounded-md">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                    Loading outlets...
                  </div>
                ) : (
                  <Select
                    isMulti
                    options={outletOptions}
                    value={formData.outlet_id}
                    onChange={handleOutletChange}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Select outlets..."
                    isSearchable
                    isDisabled={submitting}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Types (Select Multiple)
                </label>
                <Select
                  isMulti
                  options={orderTypeOptions}
                  value={formData.order_type}
                  onChange={handleOrderTypeChange}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Select order types..."
                  isDisabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Type
                </label>
                <input
                  type="text"
                  value={formData.tax_type}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tax type"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_rate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tax rate"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={
                  formData.outlet_id.length === 0 ||
                  !formData.tax_type ||
                  !formData.tax_rate ||
                  submitting
                }
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {submitting ? "Updating..." : "Update Tax"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewMoreModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {viewMoreModal.title}
              </h3>
              <button
                onClick={closeViewMoreModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-2">
              {viewMoreModal.items.map((item, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 bg-gray-100 rounded-md text-gray-800 text-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        itemName={itemToDelete?.tax_type || ""}
        itemType="tax"
      />
    </div>
  );
};

export default TaxSettings;
