import React, { useState, useMemo, useEffect } from "react";
import {
  Trash2,
  Plus,
  Download,
  Search,
  ChevronDown,
  X,
  RotateCcw,
  Loader,
  Filter,
} from "lucide-react";
import DataTable from "react-data-table-component";
import DeleteConfirmationModal from "../../../components/ui/DeletePopUp";
import topupLists from "../../../store/api/topuplistsService";
import { VITE_API_BASE_URL } from "../../../constant/config";
import UserService from "../../../store/api/userService";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

const SingleDateInput = ({
  label = "Date",
  value,
  onChange,
  placeholder = "Select date (YYYY-MM-DD)",
}) => {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

const SelectDropdown = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Pick an option",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
        >
          <span className={value ? "text-gray-900" : "text-gray-500"}>
            {value
              ? options.find((opt) => opt.value === value)?.label
              : placeholder}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="py-1">
              {options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SearchInput = ({
  value,
  onChange,
  placeholder = "Search (min 3 chars)",
  minLength = 3,
}) => {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700">
        Search (min {minLength} chars)
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
};

const InlineFilterComponent = ({
  onApplyFilters,
  filterOptions = {},
  buttonText = "Filter",
  initialFilters = {},
  showFilters,
  setShowFilters,
  isLoading = false,
}) => {
  const [filters, setFilters] = useState({
    date: "",
    dateType: "",
    search: "",
    paymentStatus: "",
    status: "",
    orderMethod: "",
    ...initialFilters,
  });

  const defaultOptions = {
    dateTypeOptions: [
      { label: "Order Date", value: "order" },
      { label: "Created Date", value: "created" },
      { label: "Updated Date", value: "update" },
    ],
    paymentStatusOptions: [
      { label: "Paid", value: "paid" },
      { label: "Unpaid", value: "unpaid" },
    ],
    statusOptions: [
      { label: "Pending", value: "pending" },
      { label: "On the Way", value: "on_the_way" },
      { label: "Ready to Pick Up", value: "ready_to_pickup" },
      { label: "Pick Up", value: "picked_up" },
      { label: "Completed", value: "completed" },
    ],
    orderMethodOptions: [
      { label: "Delivery", value: "delivery" },
      { label: "Pickup", value: "pickup" },
      { label: "Dine In", value: "dinein" },
    ],
    ...filterOptions,
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyFilter = () => {
    console.log("Applying filters:", filters);
    if (onApplyFilters) {
      onApplyFilters(filters);
    }
  };

  const handleReset = () => {
    const resetFilters = {
      dateRange: "",
      dateType: "",
      search: "",
      paymentStatus: "",
      status: "",
      orderMethod: "",
    };
    setFilters(resetFilters);
    if (onApplyFilters) {
      onApplyFilters(resetFilters);
    }
  };

  if (!showFilters) {
    return null;
  }

  return (
    <div className="mt-4 p-6 shadow-lg rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filter Options</h3>
        <button
          onClick={() => setShowFilters(false)}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SingleDateInput
            label="Date From"
            value={filters.dateFrom || ""}
            onChange={(value) => handleFilterChange("dateFrom", value)}
          />

          <SingleDateInput
            label="Date To"
            value={filters.dateTo || ""}
            onChange={(value) => handleFilterChange("dateTo", value)}
          />

          <SelectDropdown
            label="Date Type"
            value={filters.dateType || ""}
            onChange={(value) => handleFilterChange("dateType", value)}
            options={defaultOptions.dateTypeOptions}
          />

          <SearchInput
            value={filters.search || ""}
            onChange={(value) => handleFilterChange("search", value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SelectDropdown
            label="Payment Status"
            value={filters.paymentStatus || ""}
            onChange={(value) => handleFilterChange("paymentStatus", value)}
            options={defaultOptions.paymentStatusOptions}
          />

          <SelectDropdown
            label="Payment Method"
            value={filters.paymentMethod || ""}
            onChange={(value) => handleFilterChange("paymentMethod", value)}
            options={[
              // { label: "Wallet", value: "wallet" },
              { label: "RazerPay", value: "fiuu" },
            ]}
          />
          <SelectDropdown
            label="Status"
            value={filters.status || ""}
            onChange={(value) => handleFilterChange("status", value)}
            options={defaultOptions.statusOptions}
          />
          <SelectDropdown
            label="Order Method"
            value={filters.orderMethod || ""}
            onChange={(value) => handleFilterChange("orderMethod", value)}
            options={defaultOptions.orderMethodOptions}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-2 pt-6">
        <button
          onClick={handleReset}
          disabled={isLoading}
          className="px-6 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset</span>
        </button>
        <button
          onClick={handleApplyFilter}
          disabled={isLoading}
          className="px-6 py-2 bg-indigo-900 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            "Apply Filters"
          )}
        </button>
      </div>
    </div>
  );
};

const TopupFilterPanel = ({
  onApplyFilters,
  showFilters,
  setShowFilters,
  isLoading = false,
  initialFilters = {},
}) => {
  const [filters, setFilters] = useState({
    search: "",
    payment_method: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    ...initialFilters,
  });

  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    if (onApplyFilters) onApplyFilters(filters);
  };

  const handleReset = () => {
    const reset = {
      search: "",
      payment_method: "",
      status: "",
      dateFrom: "",
      dateTo: "",
    };
    setFilters(reset);
    if (onApplyFilters) onApplyFilters(reset);
  };

  if (!showFilters) return null;

  return (
    <div className="mt-4 p-6 shadow-lg rounded-xl bg-white">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filter Options</h3>
        <button
          onClick={() => setShowFilters(false)}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SingleDateInput
          label="Date From"
          value={filters.dateFrom}
          onChange={(val) => handleChange("dateFrom", val)}
        />

        <SingleDateInput
          label="Date To"
          value={filters.dateTo}
          onChange={(val) => handleChange("dateTo", val)}
        />

        <SelectDropdown
          label="Payment Method"
          value={filters.payment_method}
          onChange={(val) => handleChange("payment_method", val)}
          options={[
            { label: "All", value: "" },
            // { label: "Wallet", value: "wallet" },
            { label: "RazerPay", value: "fiuu" },
          ]}
        />

        <SelectDropdown
          label="Status"
          value={filters.status}
          onChange={(val) => handleChange("status", val)}
          options={[
            { label: "All", value: "" },
            { label: "Success", value: "success" },
            { label: "Pending", value: "pending" },
            { label: "Failed", value: "failed" },
          ]}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-1 gap-6">
        <SearchInput
          value={filters.search}
          onChange={(val) => handleChange("search", val)}
        />
      </div>

      <div className="flex justify-end space-x-3 mt-6 pt-4">
        <button
          onClick={handleReset}
          disabled={isLoading}
          className="px-6 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition flex items-center space-x-2 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset</span>
        </button>
        <button
          onClick={handleApply}
          disabled={isLoading}
          className="px-6 py-2 bg-indigo-900 text-white font-medium rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {isLoading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            "Apply Filters"
          )}
        </button>
      </div>
    </div>
  );
};

const TopUpPage = () => {
  const [topUpData, setTopUpData] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customersData, setCustomersData] = useState([]);
  const token = sessionStorage.getItem("token");
  const [userPermissions, setUserPermissions] = useState({});
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    payment_method: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
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
          type: "topup",
          start_date: filters.start_date || "",
           end_date: filters.end_date || "",
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

  const fetchCustomersData = async () => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}customers`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      const customersArray = result?.data || [];
      setCustomersData(customersArray);
      return customersArray;
    } catch (error) {
      console.error("Error fetching customers data:", error);
      return [];
    }
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

      if (userData.role && userData.role.toLowerCase() === "admin") {
        setIsAdmin(true);
        setHasDeletePermission(true);
        return;
      }

      let permissions = {};
      if (userData.user_permissions) {
        try {
          permissions = JSON.parse(userData.user_permissions);
          setUserPermissions(permissions);

          // Corrected path for Topup delete permission
          if (
            permissions.Topup &&
            permissions.Topup.subItems &&
            permissions.Topup.subItems.Lists &&
            permissions.Topup.subItems.Lists.delete === true
          ) {
            setHasDeletePermission(true);
          }
        } catch (e) {
          console.error("Error parsing user permissions:", e);
        }
      }
    } catch (err) {
      console.error("Error fetching user permissions:", err);
    }
  };

  const fetchTopups = async (showFullPageLoader = false) => {
    const startTime = Date.now();
    if (showFullPageLoader) setInitialLoading(true);
    else setLoading(true);

    setError(null);

    try {
      const [topupData, customers] = await Promise.all([
        topupLists.fetchTopupLists(filters),
        fetchCustomersData(),
      ]);

      const formattedData = topupData.map((item) => {
        const customer = customers.find(
          (c) => c.id.toString() === item.customer_id?.toString()
        );
        return {
          id: item.id,
          topUpNumber: item.topup_number || "-",
          name: customer?.name || item.name || "-",
          phone: customer?.phone || item.phone || "-",
          customer_wallet: customer
            ? `RM ${parseFloat(customer.customer_wallet || 0).toFixed(2)}`
            : `RM ${parseFloat(item.customer_wallet || 0).toFixed(2)}`,
          totalAmount: `RM ${parseFloat(item.amount || 0).toFixed(2)}`,
          otherAmount: `RM ${parseFloat(item.other_amount || 0).toFixed(2)}`,
          totalCredit: `RM ${parseFloat(item.credit || 0).toFixed(2)}`,
          paymentMethod: item.payment_method || "-",
          status: item.status || "-",
          topUpDate: item.created_at
            ? new Date(item.created_at).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : "-",
        };
      });

      // 🕒 Ensure spinner shows at least 1s
      const elapsed = Date.now() - startTime;
      const minDuration = 1000;
      if (elapsed < minDuration) {
        await new Promise((resolve) =>
          setTimeout(resolve, minDuration - elapsed)
        );
      }

      setTopUpData(formattedData);
    } catch (err) {
      console.error("Error fetching top-ups:", err);
      setError("Failed to fetch top-ups");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const getCustomerNameById = (customerId, customers) => {
    const customer = customers.find(
      (customer) => customer.id === customerId.toString()
    );
    return customer ? customer.name : "-";
  };

  useEffect(() => {
    fetchUserPermissions();
    fetchTopups(true);
  }, []);

  useEffect(() => {
    if (!initialLoading) {
      fetchTopups(false); // table-only loader when filters change
    }
  }, [filters]);

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await topupLists.deleteTopupSetting(itemToDelete);
      setTopUpData((prev) => prev.filter((item) => item.id !== itemToDelete));
    } catch (error) {
      console.error("Error deleting topup setting:", error);
    }
  };

  const handleCloseModal = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const getStatusBadge = (status) => {
    const normalizedStatus = status?.toLowerCase().trim() || "";

    if (
      normalizedStatus === "success" ||
      normalizedStatus === "paid" ||
      normalizedStatus === "completed"
    ) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Success
        </span>
      );
    } else if (normalizedStatus === "pending") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending
        </span>
      );
    } else if (
      normalizedStatus === "failed" ||
      normalizedStatus === "cancelled"
    ) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Failed
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          -
        </span>
      );
    }
  };

  const columns = [
    {
      name: "Action",
      width: "100px",
      cell: (row) =>
        (isAdmin || hasDeletePermission) && (
          <button
            onClick={() => handleDeleteClick(row.id)}
            className="text-gray-600 hover:text-red-600 transition-colors p-1"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        ),
    },
    {
      name: "Top Up Number",
      selector: (row) => row.topUpNumber,
      // sortable: true,
      width: "180px",
    },
    // {
    //   name: 'CusID',
    //   selector: row => row.customerId,
    //   sortable: true,
    //   width: '120px'
    // },
    {
      name: "Customer Name",
      selector: (row) => row.name || "-",
      // sortable: true,
      center: true,
      width: "180px",
    },
    {
      name: "Phone Number",
      selector: (row) => row.phone || "-",
      // sortable: true,
      center: true,
      width: "160px",
    },
    {
      name: "Wallet Balance",
      selector: (row) => row.customer_wallet || "-",
      // sortable: true,
      center: true,
      width: "160px",
    },
    {
      name: "Payment Method",
      selector: (row) => row.paymentMethod,
      width: "180px",
      center: true,
    },
    {
      name: "Total Amount",
      selector: (row) => row.totalAmount,
      // sortable: true,
      width: "160px",
      cell: (row) => <span className="font-medium">{row.totalAmount}</span>,
    },
    {
      name: "Total Credit",
      selector: (row) => row.totalCredit,
      // sortable: true,
      width: "160px",
      cell: (row) => <span className="font-medium">{row.totalCredit}</span>,
    },
    {
      name: "Other Amount",
      selector: (row) => row.totalCredit,
      // sortable: true,
      width: "180px",
      cell: (row) => <span className="font-medium">{row.otherAmount}</span>,
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      width: "120px",
      center: true,
      cell: (row) => getStatusBadge(row.status),
    },
    {
      name: "Top Up Date",
      selector: (row) => row.topUpDate,
      center: true,
      sortable: true,
      width: "260px",
    },
  ];

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

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-gray-500 text-sm font-medium">Loading top-ups...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2">
        <div>
          <div className="mx-auto px-2 pb-6 sm:px-3lg:px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-500">Top Up</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="text-center py-8 text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Filter panel */}
      <div className="w-full bg-white mb-4 rounded-lg">
        <TopupFilterPanel
          onApplyFilters={(newFilters) => {
            setFilters({
              ...filters,
              search: newFilters.search,
              payment_method: newFilters.payment_method,
              status: newFilters.status,
              start_date: newFilters.dateFrom,
              end_date: newFilters.dateTo,
            });
          }}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          isLoading={loading}
        />
      </div>

      {/* Main table section */}
      <div className="w-full bg-white shadow-lg rounded-lg">
        <div className="flex justify-between items-center p-6 bg-white rounded-lg">
          <h1 className="text-2xl font-semibold text-gray-900">Top Up Lists</h1>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>

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
        </div>

        {/* Error message block */}
        {error && (
          <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-3 text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={topUpData}
          pagination
          paginationServer
          paginationTotalRows={pagination.total}
          paginationDefaultPage={pagination.page}
          paginationPerPage={pagination.perPage}
          paginationRowsPerPageOptions={[10, 20, 30, 50, 100]}
          onChangePage={(page) => {
            setPagination((prev) => ({ ...prev, page }));
            fetchTopups(false, page, pagination.perPage); // load new page data
          }}
          onChangeRowsPerPage={(newPerPage, page) => {
            setPagination((prev) => ({ ...prev, perPage: newPerPage, page }));
            fetchTopups(false, page, newPerPage); // load data with new per-page value
          }}
          progressPending={loading}
          progressComponent={
            <div className="flex justify-center items-center py-8">
              <Loader className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          }
          customStyles={customStyles}
          responsive
          striped
          highlightOnHover
          noDataComponent={
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-gray-500 text-lg mb-2">No top-up records found</div>
              <div className="text-gray-400 text-sm">
                Try adjusting your filters or search criteria
              </div>
            </div>
          }
        />
      </div>

      {/* Delete Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default TopUpPage;
