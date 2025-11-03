import React, { useState, useEffect, useRef, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Eye, X, Loader, Link as LinkIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { orderService } from "../../store/api/orderService";
import { apiUrl } from "@/constant/constants";

const OutletDashboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const lastOrderIds = useRef([]);
  const [dateFrom, setDateFrom] = useState("");
  const [summaryData, setSummaryData] = useState({
    totalSales: 0,
    totalOrders: 0,
  });
  const [newOrders, setNewOrders] = useState([]);
  const [showNewOrders, setShowNewOrders] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
  });
  const [activeTab, setActiveTab] = useState("Pending");
  const [tabCounts, setTabCounts] = useState({
    "Pre Order": 0,
    Pending: 0,
    "Ready to Pick Up": 0,
    "On the Way": 0,
    "Picked Up": 0,
    Completed: 0,
  });
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const paginationRef = useRef(pagination);
  const dateRef = useRef("");



  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);


  const getStatusParam = (tab) => {
    const mapped = statusMapping[tab];
    if (Array.isArray(mapped)) {
      return mapped[0]; // temporarily send only one
    }
    return mapped;
  };

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

  const tabs = [
    "Pre Order",
    "Pending",
    "Ready to Pick Up",
    "On the Way",
    "Picked Up",
    "Completed",
  ];
  const navigate = useNavigate();

  const statusMapping = {
    "Pre Order": null,
    Pending: "pending",
    "Ready to Pick Up": "ready_to_pickup",
    "On the Way": "on_the_way",
    "Picked Up": "picked_up",
    Completed: ["completed", "delivered"],
  };

  // Check if date is today
  // const isToday = (dateString) => {
  //   const orderDate = new Date(dateString);
  //   const today = new Date();
  //   return (
  //     orderDate.getDate() === today.getDate() &&
  //     orderDate.getMonth() === today.getMonth() &&
  //     orderDate.getFullYear() === today.getFullYear()
  //   );
  // };

  // Load initial data
  useEffect(() => {
    if (user_id) {
      loadOrders(pagination.page, pagination.perPage);
    }
  }, [user_id, activeTab, pagination.page, pagination.perPage]);

  // ✅ run summary only when tab or date changes (not pagination)
  useEffect(() => {
    if (user_id) {
      loadSummaryData();
    }
  }, [user_id, activeTab, dateFrom]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshDataInBackground();
    }, 3000); // 3000 second auto-refresh

    return () => clearInterval(interval);
  }, [activeTab]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.loop = true; // Ensure looping is enabled
      audioRef.current
        .play()
        .catch((err) => console.error("Sound play error:", err));
      setIsPlaying(true);
    }
  };

  const stopNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset to start
      audioRef.current.loop = false; // Disable looping
      setIsPlaying(false);
    }
  };

  const refreshDataInBackground = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const dateParam = dateRef.current || dateFrom || today;
    const statusParam = getStatusParam(activeTab);

    const filters = {
      start_date: dateParam,
      end_date: dateParam,
      status: statusParam,
    };

    // ✅ keep current page + perPage, but don’t reset pagination state
    const result = await orderService.getCustomerOrderList(
      user_id,
      filters,
      paginationRef.current.page,
      paginationRef.current.perPage
    );

    const orders = Array.isArray(result.data) ? result.data : [];

    const transformed = orders.map((order) => ({
      id: order.id,
      orderSO: order.order_so,
      orderDate: order.created_at,
      orderType: order.order_type,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      status: order.status,
      selected_date: order.selected_date,
      selected_time: order.selected_time,
      paymentStatus: order.payment_status,
      subtotalAmount: `RM${order.subtotal_amount}`,
      discountAmount: `RM${order.discount_amount}`,
      taxAmount: `RM${order.tax_amount}`,
      deliveryFee: `RM${order.delivery_fee}`,
      grandTotal: `RM${order.grand_total}`,
      notes: order.notes || "-",
      trackingLink: order.deliveries?.[0]?.tracking_link || null,
    }));

    // ✅ detect truly new orders
    const previousIds = new Set(lastOrderIds.current);
    const currentIds = transformed.map((o) => o.id);

    const newOnes = transformed.filter((o) => !previousIds.has(o.id));

    // ✅ only trigger notification if new IDs appear *and* user is on page 1
    if (newOnes.length > 0 && paginationRef.current.page === 1) {
      console.log("🚨 New orders detected:", newOnes);
      setNewOrders((prev) => [...newOnes, ...prev]);
      setShowNewOrders(true);
      setNotificationMessage(`🆕 ${newOnes.length} new order(s) received!`);
      playNotificationSound();
      setTimeout(() => stopNotificationSound(), 20000);
    }

    // ✅ Merge new IDs into the global memory
    lastOrderIds.current = Array.from(
      new Set([...lastOrderIds.current, ...currentIds])
    );

    // ✅ update UI quietly (without triggering pagination reset)
    setIsBackgroundRefreshing(true);
    setData(transformed);
    setFilteredData(transformed);
    setTabCounts(calculateTabCounts(transformed));
    setError(null);
    setIsBackgroundRefreshing(false);
  } catch (err) {
    console.error("Auto-refresh failed:", err);
    setIsBackgroundRefreshing(false);
  }
};


  const calculateTabCounts = (orders) => {
    return {
      "Pre Order": orders.filter(
        (o) => new Date(`${o.selected_date} ${o.selected_time}`) > new Date()
      ).length,
      Pending: orders.filter((o) => o.status === "pending").length,
      "Ready to Pick Up": orders.filter((o) => o.status === "ready_to_pickup")
        .length,
      "On the Way": orders.filter((o) => o.status === "on_the_way").length,
      "Picked Up": orders.filter((o) => o.status === "picked_up").length,
      Completed: orders.filter((o) =>
        ["completed", "delivered"].includes(o.status)
      ).length,
    };
  };

  const loadOrders = async (
    page = pagination.page,
    perPage = pagination.perPage
  ) => {
    setError(null);
    try {
      const today = new Date().toISOString().split("T")[0];
      const startDate = dateFrom || today;
      const endDate = dateFrom || today;

      const statusParam = getStatusParam(activeTab);
      const filters = {
        start_date: startDate,
        end_date: endDate,
        status: statusParam,
      };

      // 👇 now dynamic pagination
      const result = await orderService.getCustomerOrderList(
        user_id,
        filters,
        page,
        perPage
      );

      const orders = Array.isArray(result.data) ? result.data : [];
      const paginationInfo = result.pagination || {};

      const transformed = Array.isArray(orders)
        ? orders.map((order) => ({
            id: order.id,
            orderSO: order.order_so,
            orderDate: order.created_at,
            orderType: order.order_type,
            customerName: order.customer_name,
            customerPhone: order.customer_phone,
            customerEmail: order.customer_email,
            status: order.status,
            selected_date: order.selected_date,
            selected_time: order.selected_time,
            paymentStatus: order.payment_status,
            trackingLink: order.deliveries?.[0]?.tracking_link || null,
            subtotalAmount: `RM${order.subtotal_amount}`,
            discountAmount: `RM${order.discount_amount}`,
            taxAmount: `RM${order.tax_amount}`,
            deliveryFee: `RM${order.delivery_fee}`,
            grandTotal: `RM${order.grand_total}`,
            notes: order.notes || "-",
          }))
        : [];

      // ✅ update the table
      setData(transformed);
      setFilteredData(transformed);
      setTabCounts(calculateTabCounts(transformed));

      // ✅ update pagination state
      setPagination({
        page: paginationInfo.current_page || page,
        perPage: paginationInfo.per_page || perPage,
        total: paginationInfo.total || transformed.length,
      });

      // ✅ keep track of IDs for new-order detection
      // lastOrderIds.current = transformed.map((o) => o.id);

      if (result.counts) {
        setTabCounts({
          ...result.counts,
          Pending: (result.counts.Pending || 0) + (result.counts.Today || 0),
        });
      }
      if (page === 1 && lastOrderIds.current.length === 0) {
        // initialize on first load
        lastOrderIds.current = transformed.map((o) => o.id);
      } else {
        // merge IDs across pages, avoiding duplicates
        lastOrderIds.current = Array.from(
          new Set([...lastOrderIds.current, ...transformed.map((o) => o.id)])
        );
      }

      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load orders");
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const loadSummaryData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const startDate = dateFrom || today;
      const endDate = dateFrom || today;

      const filters = {
        start_date: startDate,
        end_date: endDate,
      };

      // ✅ Only get today's orders
      const result = await orderService.getCustomerOrderList(
        user_id,
        filters,
        1,
        1000
      );

      const orders = Array.isArray(result.data) ? result.data : [];

      // ✅ Only include paid orders for the selected day
      const dayOrders = orders.filter((order) => {
        const orderDate = new Date(order.created_at)
          .toISOString()
          .split("T")[0];
        return orderDate === startDate && order.payment_status === "paid";
      });

      const totalSales = dayOrders.reduce((sum, order) => {
        const total = parseFloat(order.grand_total || 0);
        return sum + (isNaN(total) ? 0 : total);
      }, 0);

      const totalOrders = dayOrders.length;

      setSummaryData({
        totalSales,
        totalOrders,
      });
    } catch (err) {
      console.error("Failed to load summary data:", err);
    }
  };

  const columns = [
    {
      name: "Actions",
      center: true,
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            className="p-2 hover:bg-gray-100 rounded"
            onClick={() =>
              navigate(`/orders/order_lists/order_overview/${row.id}`)
            }
            title="View Details"
          >
            <Eye size={16} className="text-gray-600" />
          </button>
        </div>
      ),
      width: "100px",
    },
    {
      name: "Tracking Link",
      cell: (row) => {
        // Convert to lowercase for case-insensitive comparison
        const isDelivery = row.orderType.toLowerCase() === "delivery";

        if (!isDelivery) {
          return ""; // Empty string for non-delivery orders
        }

        // For delivery orders
        return row.trackingLink ? (
          <a
            href={row.trackingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-100 rounded inline-block"
            onClick={(e) => e.stopPropagation()}
          >
            <LinkIcon size={16} className="text-blue-500 hover:text-blue-700" />
          </a>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
      width: "120px",
      ignoreRowClick: true,
      center: true,
    },
    {
      name: "Customer Name",
      selector: (row) => row.customerName,
      sortable: true,
      width: "180px",
    },
    {
      name: "Customer Phone",
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
      name: "Order Type",
      selector: (row) => row.orderType,
      sortable: true,
      width: "140px",
      cell: (row) => {
        const isNewOrder = newOrders.some((newOrder) => newOrder.id === row.id);

        // Clean up orderType: remove - and _, replace with space, capitalize words
        let cleanOrderType = row.orderType
          ? row.orderType.replace(/[-_]/g, " ").trim()
          : "";

        cleanOrderType = cleanOrderType
          .toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase());

        return (
          <div className="relative">
            {cleanOrderType || <span className="text-gray-400">N/A</span>}
            {isNewOrder && (
              <span className="absolute -top-2 -right-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </span>
            )}
          </div>
        );
      },
    },
    {
      name: "Order Date",
      selector: (row) => new Date(row.orderDate).toLocaleString(),
      sortable: true,
      width: "185px",
    },
    {
      name: "Pickup/Delivery Time",
      selector: (row) => `${row.selected_date} ${row.selected_time}`,
      sortable: true,
      width: "200px",
      cell: (row) => {
        // Combine date and time into a single datetime string
        const dateTimeStr = `${row.selected_date} ${row.selected_time}`;

        // Parse the datetime string into a Date object
        const orderDateTime = new Date(dateTimeStr);
        const now = new Date();

        // Check if the order datetime is in the future
        const isFuture = orderDateTime > now;
        if (row.selected_date === null || row.selected_time === null) {
          return <span className="text-center">ASAP</span>;
        }
        return (
          <div className={`${isFuture ? "font-semibold text-blue-600" : ""}`}>
            {row.selected_date} {row.selected_time}
            {isFuture && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                Future
              </span>
            )}
          </div>
        );
      },
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      width: "120px",
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
          <span
            className={`px-2 py-1 rounded-full text-xs ${bgColor} ${textColor}`}
          >
            {formatStatus(row.status)}
          </span>
        );
      },
    },
    {
      name: "Payment Status",
      selector: (row) => row.paymentStatus,
      sortable: true,
      width: "170px",
      center: true,
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
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
      name: "Total",
      selector: (row) => row.grandTotal,
      sortable: true,
      width: "105px",
      cell: (row) => <span className="font-semibold">{row.grandTotal}</span>,
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
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePerRowsChange = (newPerPage, page) => {
    setRowsPerPage(newPerPage);
    setCurrentPage(page);
  };

  const handleSearch = () => {
    dateRef.current = dateFrom; // ✅ remember chosen date
    loadOrders();
  };

  return (
    <div className="p-6">
      <audio
        ref={audioRef}
        src="https://uspizza.ipsgroup.com.my/cms/notification.mp3"
        preload="auto"
        allow="autoplay"
        loop={true}
      />

      {/* Notification Toast */}
      {notificationMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-bounce">
          <div className="bg-green-500 text-white px-4 py-2 rounded shadow-lg flex items-center">
            <span>{notificationMessage}</span>
            <button onClick={() => setNotificationMessage("")} className="ml-2">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Sound Control */}
      {isPlaying && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={stopNotificationSound}
            className="px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600"
          >
            Stop Alert
          </button>
        </div>
      )}

      {/* New Orders Table */}
      {showNewOrders && (
        <div className="mb-6 border border-yellow-300 rounded-lg shadow-lg bg-yellow-50">
          <div className="p-4 bg-yellow-200 flex justify-between items-center">
            <h3 className="font-bold text-yellow-800">
              New Orders Received {newOrders.length}
            </h3>
            <button
              onClick={() => setShowNewOrders(false)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4">
            <DataTable
              columns={columns}
              data={newOrders}
              customStyles={{
                ...customStyles,
                header: {
                  style: { backgroundColor: "#F59E0B", color: "#ffffff" },
                },
                headRow: {
                  style: { backgroundColor: "#F59E0B", color: "#ffffff" },
                },
                headCells: {
                  style: { backgroundColor: "#F59E0B", color: "#ffffff" },
                },
              }}
              noDataComponent={
                <div className="py-4 text-center text-gray-500">
                  No new orders to display
                </div>
              }
            />
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                RM{summaryData.totalSales.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            <span
              className={`${
                summaryData.totalSales > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {summaryData.totalSales > 0 ? "+" : ""}
              {summaryData.totalOrders} orders
            </span>{" "}
            in total
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {summaryData.totalOrders}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">All orders in the system</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 items-center text-sm font-medium mb-4 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-3 py-1.5 rounded-full border-2 transition whitespace-nowrap ${
              activeTab === tab
                ? "bg-yellow-400 text-white border-yellow-400"
                : "border-transparent text-gray-500 hover:bg-gray-100"
            }`}
          >
            {tab} <span className="ml-1">{tabCounts[tab] || 0}</span>
          </button>
        ))}
        <div className="ml-auto">
          <label className="text-md text-gray-500">Search Date</label>
          <input
            type="date"
            // value={}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-blue-500"
          />
        </div>
        {/*submit button */}
        <div className="ml-4 pt-4">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Main Orders Table */}
      <div className="w-full bg-white shadow-lg rounded-lg">
        {/* {error && (
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
        )} */}

        <DataTable
          keyField="id" // ✅ helps React-Data-Table keep row identity
          columns={columns}
          data={data}
          pagination
          paginationServer
          paginationTotalRows={pagination.total}
          paginationDefaultPage={pagination.page}
          paginationPerPage={pagination.perPage}
          paginationRowsPerPageOptions={[10, 20, 30, 50, 100]}
          onChangePage={(page) => loadOrders(page, pagination.perPage)}
          onChangeRowsPerPage={(newPerPage, page) => loadOrders(page, newPerPage)}
          progressPending={isBackgroundRefreshing} // ✅ subtle loading without page reset
          progressComponent={
            <div className="flex justify-center items-center py-6 text-indigo-600 text-sm">
              <Loader className="h-5 w-5 animate-spin mr-2" />
              Updating data...
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
    </div>
  );
};

export default OutletDashboard;
