import React, { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import {
  ChevronDown,
  Eye,
  Search,
  Filter,
  X,
  RotateCcw,
  Download,
  Loader,
  Link as LinkIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { orderService } from "../../../store/api/orderService";
import "react-toastify/dist/ReactToastify.css";
import { VITE_API_BASE_URL } from "../../../constant/config";
import { ToastContainer, toast } from "react-toastify";
// import { cu } from "@fullcalendar/core/internal-common";

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
              { label: "Wallet", value: "wallet" },
              { label: "RazerPay", value: "razerpay" },
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

const OrderList = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
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
            type: "order",
            start_date: activeFilters.start_date || "",
            end_date: activeFilters.end_date || "",
          }),
        });

        const result = await response.json();
        if (result.status === 200) {
          toast.success("Export file has been processed, this may take a while! You can find it in the Excel Report tab.");
        } else {
          toast.error("Failed to export file.");
        }
      } catch (err) {
        toast.error("Something went wrong.");
      } finally {
        setTimeout(() => setIsDisabled(false), 1000);
      }
    };
  // Load initial data
  useEffect(() => {
    if (user_id) {
      loadOrders();
    }
  }, [user_id]);

  const loadOrders = async (filters = {}, page = pagination.page, perPage = pagination.perPage) => {
  setLoading(true);
  setError(null);

  const startTime = Date.now();

    try {
      const result = await orderService.getCustomerOrderList(user_id, filters, page, perPage);
      const orders = result.data || [];

      // Transform your order data
      const transformed = orders.map((order) => ({
        id: order.id,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        orderDate: order.created_at,
        orderType: order.order_type,
        orderSO: order.order_so,
        orderOutlet: order.outlet_title,
        pickupDeliveryDate:
          order.selected_date && order.selected_time
            ? `${order.selected_date} ${order.selected_time}`
            : "-",
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payments?.[0]?.payment_method || "-",
        subtotalAmount: `RM${order.subtotal_amount}`,
        discountAmount: `RM${order.discount_amount}`,
        taxAmount: `RM${order.tax_amount}`,
        deliveryFee: `RM${order.delivery_fee}`,
        grandTotal: `RM${order.grand_total}`,
        promoDiscount:
          order.promo_discount_amount !== "0.00"
            ? `-RM${order.promo_discount_amount}`
            : "-",
        voucherDiscount:
          order.voucher_discount_amount !== "0.00"
            ? `-RM${order.voucher_discount_amount}`
            : "-",
        notes: order.notes || "-",
        expectedReadyTime: order.expected_ready_time,
        trackingLink: order.deliveries?.[0]?.tracking_link || null,
      }));

      // Ensure spinner shows at least 1s
      const elapsed = Date.now() - startTime;
      const minDuration = 1000; // 1 second
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
      }

      setFilteredData(transformed);
      setPagination({
        page: result.pagination?.current_page || page,
        perPage: result.pagination?.per_page || perPage,
        total: result.pagination?.total || transformed.length,
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };


  const handleViewDetails = (row) => {
    navigate(`/orders/order_lists/order_overview/${row.id}`);
  };

  const columns = [
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex justify-center w-full">
          <div className="flex space-x-2">
            {/* Always visible eye icon */}
            <button
              className="p-2 hover:bg-gray-100 rounded"
              onClick={() => handleViewDetails(row)}
              title="View Details"
            >
              <Eye size={16} className="text-gray-600" />
            </button>

            {/* Conditional tracking link icon */}
            {row.orderType.toLowerCase() === "delivery" && row.trackingLink && (
              <a
                href={row.trackingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-100 rounded inline-block"
                onClick={(e) => e.stopPropagation()}
                title="Tracking Link"
              >
                <LinkIcon
                  size={16}
                  className="text-blue-500 hover:text-blue-700"
                />
              </a>
            )}
          </div>
        </div>
      ),
      width: "100px",
      center: true,
    },
    {
      name: "Order No",
      selector: (row) => row.orderSO,
      sortable: true,
      width: "180px",
    },
    {
      name: "Zeoniq Order No",
      // selector: (row) => row.orderSO,
      sortable: true,
      width: "180px",
    },
    {
      name: "Order Outlet",
      selector: (row) => row.orderOutlet,
      sortable: true,
      width: "180px",
    },
    {
      name: "Customer Name",
      selector: (row) => row.customerName,
      sortable: true,
      width: "180px",
    },
    {
      name: "Phone Number",
      selector: (row) => row.customerPhone,
      sortable: true,
      width: "180px",
    },
    {
      name: "Customer Email",
      selector: (row) => row.customerEmail,
      sortable: true,
      width: "180px",
    },
    {
      name: "Order Method",
      selector: (row) => row.orderType,
      sortable: true,
      width: "150px",
      cell: (row) => {
        // Remove - and _, replace with space
        let cleanOrderType = row.orderType
          ? row.orderType.replace(/[-_]/g, " ").trim()
          : "";

        // Capitalize each word
        cleanOrderType = cleanOrderType
          .toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase());

        // If empty after cleaning, show placeholder
        if (!cleanOrderType) {
          return <span className="text-gray-400">N/A</span>;
        }

        return cleanOrderType;
      },
    },
    {
      name: "Order Date",
      selector: (row) => new Date(row.orderDate).toLocaleString(),
      sortable: true,
      width: "180px",
    },
    {
      name: "Pickup Delivery Date",
      selector: (row) => row.pickupDeliveryDate,
      sortable: true,
      width: "200px",
      center: true,
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      width: "150px",
      cell: (row) => {
        // Convert status to lowercase for case-insensitive comparison
        const status = row.status.toLowerCase();

        // Determine styling based on status
        let bgColor = "bg-gray-100";
        let textColor = "text-gray-800";

        if (status === "on_the_way") {
          bgColor = "bg-yellow-100";
          textColor = "text-yellow-800";
        } else if (status === "picked_up") {
          bgColor = "bg-purple-100";
          textColor = "text-purple-800";
        } else if (status === "completed" || status === "delivered") {
          bgColor = "bg-green-100";
          textColor = "text-green-800";
        } else if (status === "confirmed") {
          bgColor = "bg-blue-100";
          textColor = "text-blue-800";
        } else if (status === "pending") {
          bgColor = "bg-orange-100";
          textColor = "text-orange-800";
        } else if (status === "ready_to_pickup") {
          bgColor = "bg-teal-100";
          textColor = "text-teal-800";
        } else if (status === "cancelled") {
          bgColor = "bg-red-100";
          textColor = "text-red-800";
        }

        // Format the status text for display (convert underscores to spaces and capitalize)
        const formatStatus = (status) => {
          return status
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
        };

        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/orders/order_overview/editStatus/${row.id}`);
            }}
            title="Edit Status"
            className="cursor-pointer"
          >
            <span
              className={`px-2 py-1 rounded-full text-xs ${bgColor} ${textColor}`}
            >
              {formatStatus(row.status)}
            </span>
          </button>
        );
      },
    },
    {
      name: "Payment Status",
      selector: (row) => row.paymentStatus,
      sortable: true,
      width: "120px",
      cell: (row) => (
        <span
          className={`px-2 py-1 capitalize rounded-full text-xs ${
            row.paymentStatus === "paid"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.paymentStatus}
        </span>
      ),
    },
    {
      name: "Payment Method",
      selector: (row) => row.paymentMethod,
      sortable: true,
      width: "140px",
      cell: (row) => {
        const method = row.paymentMethod?.toLowerCase() || "-";
        let bg = "bg-gray-100";
        let text = "text-gray-800";
        let label = method;

        if (method === "wallet") {
          bg = "bg-purple-100";
          text = "text-purple-800";
          label = "Wallet";
        } else if (method === "razerpay") {
          bg = "bg-green-100";
          text = "text-green-800";
          label = "RazerPay";
        }

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs capitalize ${bg} ${text}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      name: "Subtotal",
      selector: (row) => row.subtotalAmount,
      sortable: true,
      width: "120px",
    },
    {
      name: "Tax",
      selector: (row) => row.taxAmount,
      sortable: true,
      width: "100px",
    },
    {
      name: "Delivery Fee",
      selector: (row) => row.deliveryFee,
      sortable: true,
      width: "160px",
    },
    {
      name: "Total",
      selector: (row) => row.grandTotal,
      sortable: true,
      width: "110px",
      cell: (row) => <span className="font-semibold">{row.grandTotal}</span>,
    },

    {
      name: "Promo/Voucher",
      cell: (row) => (
        <div className="text-xs text-center">
          {row.promoDiscount !== "-" && row.promoDiscount ? (
            <div>Promo: {row.promoDiscount}</div>
          ) : null}
          {row.voucherDiscount !== "-" && row.voucherDiscount ? (
            <div>Voucher: {row.voucherDiscount}</div>
          ) : null}
          {(!row.promoDiscount || row.promoDiscount === "-") &&
            (!row.voucherDiscount || row.voucherDiscount === "-") && (
              <div className="text-gray-400">-</div>
            )}
        </div>
      ),
      width: "160px",
    },
  ];

  const customStyles = {
    header: {
      style: {
        backgroundColor: "#1A237E",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: "600",
        padding: "16px",
        minHeight: "56px",
      },
    },
    headRow: {
      style: {
        backgroundColor: "#1A237E",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: "600",
        borderBottom: "1px solid #e5e7eb",
      },
    },
    headCells: {
      style: {
        color: "#ffffff",
        backgroundColor: "#1A237E",
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
        paddingTop: "12px",
        paddingBottom: "12px",
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

  const handleFiltersApplied = async (filters) => {
    const backendFilters = {
      start_date: filters.dateFrom || "",
      end_date: filters.dateTo || "",
      status: filters.status || "",
      order_type: filters.orderMethod || "",
      payment_status: filters.paymentStatus || "",
      payment_method: filters.paymentMethod || "",
      search: filters.search || "",
    };

    setActiveFilters(backendFilters);
    await loadOrders(backendFilters, 1, pagination.perPage);
  };

  // const [currentPage, setCurrentPage] = useState(1);
  // const [rowsPerPage, setRowsPerPage] = useState(10);

  // // Calculate paginated data
  // const paginatedData = useMemo(() => {
  //   const start = (currentPage - 1) * rowsPerPage;
  //   return filteredData.slice(start, start + rowsPerPage);
  // }, [filteredData, currentPage, rowsPerPage]);

  // const handlePageChange = (page) => {
  //   setCurrentPage(page);
  // };

  // const handlePerRowsChange = (newPerPage, page) => {
  //   setRowsPerPage(newPerPage);
  //   setCurrentPage(page);
  // };

  return (
    <>
      <div className="w-full bg-white mb-4 rounded-lg">
        <InlineFilterComponent
          onApplyFilters={handleFiltersApplied}
          buttonText="Filter"
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          isLoading={loading}
        />
      </div>

      <div className="w-full bg-white shadow-lg rounded-lg">
        <div className="flex justify-between items-center p-6 bg-white rounded-lg">
          <h1 className="text-2xl font-semibold text-gray-900">Order List</h1>
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
                isDisabled ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"
              }`}
            >
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>

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

        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          paginationServer
          paginationTotalRows={pagination.total}
          paginationDefaultPage={pagination.page}
          paginationPerPage={pagination.perPage}
          paginationRowsPerPageOptions={[10, 20, 30, 50, 100]}
          onChangePage={(page) => {
            setPagination((prev) => ({ ...prev, page }));
            loadOrders(activeFilters, page, pagination.perPage);
          }}
          onChangeRowsPerPage={(newPerPage, page) => {
            setPagination((prev) => ({ ...prev, perPage: newPerPage, page }));
            loadOrders(activeFilters, page, newPerPage);
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
              <div className="text-gray-500 text-lg mb-2">No orders found</div>
              <div className="text-gray-400 text-sm">
                Try adjusting your filters or search criteria
              </div>
            </div>
          }
        />
      </div>
    </>
  );
};

export default OrderList;
