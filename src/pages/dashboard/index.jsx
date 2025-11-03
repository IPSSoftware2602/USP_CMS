import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  Info,
  Clock,
  CreditCard,
  ShoppingCart,
  Users,
  Store,
  XCircle,
  AlertTriangle,
  Star,
  Wallet,
} from "lucide-react";
import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import dashboardService from "@/store/api/dashboardService";

const Dashboard = () => {
  const [dashboard, setDashboard] = useState({});
  const [dashboardSummary, setDashboardSummary] = useState({});
  const [timePeriod, setTimePeriod] = useState("Today");
  const [chartData, setChartData] = useState([]);
  const [liveMonitor, setLiveMonitor] = useState({});

  const isBarChart = timePeriod === "Today" || timePeriod === "Yesterday";
  const xAxisKey = isBarChart ? "hour" : "date";
  const chartTitle = isBarChart
    ? "Orders and Revenue by Hour"
    : "Orders and Revenue by Day";

  const loadDashboard = async () => {
    try {
      const response = await dashboardService.dashboard();
      setDashboard(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const loadDashboardSummary = async () => {
    try {
      const response = await dashboardService.dashboardSummary();
      console.log(response.data);
      setDashboardSummary(response.data);
      processChartData(response.data, "Today");
    } catch (error) {
      console.log(error);
    }
  };

  const loadLiveMonitor = async () => {
    try {
      const response = await dashboardService.liveMonitor();
      console.log(response.data);
      setLiveMonitor(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // Load all data function
  const loadAllData = async () => {
    await Promise.all([
      loadDashboard(),
      loadDashboardSummary(),
      loadLiveMonitor(),
    ]);
  };

  const processChartData = (data, period) => {
    let processedData = [];

    switch (period) {
      case "Today":
      case "Yesterday":
        const hourlyData = period === "Today" ? data.today : data.yesterday;
        processedData = hourlyData.map((item) => ({
          hour: `${item.hour}h`,
          revenue: parseFloat(item.total_revenue) || 0,
          orders: item.total_orders || 0,
        }));
        break;

      case "7 Days":
        processedData = data.last7days.map((item) => ({
          date: item.order_date,
          revenue: parseFloat(item.total_revenue) || 0,
          orders: item.total_orders || 0,
        }));
        break;

      case "30 Days":
        processedData = data.last30days.map((item) => ({
          date: item.order_date,
          revenue: parseFloat(item.total_revenue) || 0,
          orders: item.total_orders || 0,
        }));
        break;

      default:
        processedData = [];
    }

    setChartData(processedData);
  };

  useEffect(() => {
    // Load data initially
    loadAllData();

    // Set up interval to refresh data every 30 seconds
    const intervalId = setInterval(() => {
      loadAllData();
    }, 30000); // 30 seconds

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleTimePeriodChange = (period) => {
    setTimePeriod(period);
    if (dashboardSummary) {
      processChartData(dashboardSummary, period);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: "MYR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const statsCards = [
    {
      title: "Net Sales Today",
      value: formatCurrency(dashboard.today_net_sales || 0),
      icon: "chart",
      color: "bg-pink-500",
    },
    {
      title: "Today Transaction",
      value: dashboard.today_total_transaction || 0,
      icon: "chart",
      color: "bg-orange-500",
    },
    {
      title: "Today Wallet Top-up",
      value: formatCurrency(dashboard.today_topup || 0),
      icon: "chart",
      color: "bg-green-500",
    },
    {
      title: "Today Voucher Redeemed / Discount",
      value: formatCurrency(dashboard.today_total_discount_amount || 0),
      icon: "chart",
      color: "bg-blue-500",
    },
    {
      title: "Net Sales Month to Day",
      value: formatCurrency(dashboard.net_sales_month_to_date || 0),
      icon: "chart",
      color: "bg-yellow-500",
    },
    {
      title: "Net Sales Year to Day",
      value: formatCurrency(dashboard.net_sales_year_to_date || 0),
      icon: "chart",
      color: "bg-teal-500",
    },
    {
      title: "Wallet Balance to date",
      value: formatCurrency(dashboard.total_wallet_balance || 0),
      icon: "chart",
      color: "bg-purple-500",
    },
  ];

  const liveMonitorLeft = [
    {
      title: "Offline Outlets",
      value: liveMonitor.offline_outlets,
      icon: <Store className="text-orange-400" />,
      subtitle: "Current",
    },
    {
      title: "Cancelled Orders",
      value: liveMonitor.cancelled_orders || 0,
      icon: <XCircle className="text-green-400" />,
      subtitle: "Today",
    },
    {
      title: "Delayed Orders",
      value: "0",
      icon: <Clock className="text-blue-400" />,
      subtitle: "Today",
    },
  ];

  const liveMonitorRight = [
    {
      title: "Gross Sales",
      value: formatCurrency(liveMonitor.gross_sales?.current || 0),
      icon: <ShoppingCart className="text-yellow-400" />,
      change: `${liveMonitor.gross_sales?.percentage >= 0 ? "+" : ""}${(
        liveMonitor.gross_sales?.percentage || 0
      ).toFixed(2)}% from previous 7 days`,
      positive: (liveMonitor.gross_sales?.percentage || 0) >= 0,
    },
    {
      title: "Total Customer",
      value: liveMonitor.total_customer?.current || 0,
      icon: <Users className="text-blue-400" />,
      change: `${liveMonitor.total_customer?.percentage >= 0 ? "+" : ""}${(
        liveMonitor.total_customer?.percentage || 0
      ).toFixed(2)}% from previous 7 days`,
      positive: (liveMonitor.total_customer?.percentage || 0) >= 0,
    },
    {
      title: "Net Sales from Offers",
      value: formatCurrency(liveMonitor.net_sales_from_offers?.current || 0),
      icon: <ShoppingCart className="text-teal-400" />,
      change: `${
        liveMonitor.net_sales_from_offers?.percentage >= 0 ? "+" : ""
      }${(liveMonitor.net_sales_from_offers?.percentage || 0).toFixed(
        2
      )}% from previous 7 days`,
      positive: (liveMonitor.net_sales_from_offers?.percentage || 0) >= 0,
    },
    {
      title: "Average Transaction Amount",
      value: formatCurrency(liveMonitor.avg_transaction?.current || 0),
      icon: <CreditCard className="text-purple-300" />,
      change: `${liveMonitor.avg_transaction?.percentage >= 0 ? "+" : ""}${(
        liveMonitor.avg_transaction?.percentage || 0
      ).toFixed(2)}% from previous 7 days`,
      positive: (liveMonitor.avg_transaction?.percentage || 0) >= 0,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-medium text-gray-500">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="bg-white p-6 pb-1 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsCards.map((card, index) => (
            <div key={index} className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {card.value}
                  </h3>
                  <p className="text-sm text-gray-600">{card.title}</p>
                </div>
                <div className={`rounded-full p-2 ${card.color}`}>
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Monitor */}
      <h2 className="text-xl font-medium text-gray-700 mb-4 ml-2">
        Live Monitor
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left side */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          {liveMonitorLeft.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-4 border-b last:border-b-0"
            >
              <div className="flex items-center">
                <div className="rounded-full bg-gray-100 p-3 mr-4">
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="mr-2 text-lg font-medium">{item.value}</span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        {/* Right side */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          {liveMonitorRight.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-4 border-b last:border-b-0"
            >
              <div className="flex items-center">
                <div className="rounded-full bg-gray-100 p-3 mr-4">
                  {item.icon}
                </div>
                <div>
                  <div className="flex items-center">
                    <p className="font-normal mr-2">{item.title}</p>
                    <Info className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-lg font-bold text-gray-800">
                    {item.value}
                  </p>
                </div>
              </div>
              <div>
                <span
                  className={`text-sm ${
                    item.positive ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {item.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <h2 className="text-xl font-medium text-gray-700 mb-4 ml-2">Summary</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="bg-white p-6 rounded-lg">
          {/* Time filter buttons */}
          <div className="flex space-x-3 mb-6 text-[12px]">
            {["Today", "Yesterday", "7 Days", "30 Days"].map((period) => (
              <button
                key={period}
                className={`px-6 py-2 rounded-full border ${
                  timePeriod === period
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "border-gray-300 text-gray-700"
                }`}
                onClick={() => handleTimePeriodChange(period)}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        {/* Chart */}
        <div className="h-96">
          <h3 className="text-lg font-medium text-center mb-4">{chartTitle}</h3>
          <ResponsiveContainer width="100%" height="90%">
            {isBarChart ? (
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxisKey} />
                <YAxis
                  label={{
                    value: "Revenue (RM)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip />
                <Bar dataKey="revenue" fill="#FF4081" />
              </BarChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxisKey} />
                <YAxis
                  label={{
                    value: "Revenue (RM)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FF4081"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
