import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import {
  ChevronDown,
  Filter,
  RotateCcw,
  Loader,
  Download
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import reportService from "@/store/api/reportService";
import "react-toastify/dist/ReactToastify.css";

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

const PointReport = () => {
  const [loading, setLoading] = useState(false);
  const [pointData, setPointData] = useState([]);
  const [summary, setSummary] = useState({
    filteredTotal: {
      in: 0,
      out: 0,
      redemptionRate: 0,
      avgEarnPerTxn: 0,
    },
    overallTotal: {
      in: 0,
      out: 0,
    },
    sumOfAllMembers: {
      in: 0,
    },
  });
  const [filters, setFilters] = useState({
    dateFrom: null,
    dateTo: null,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPointReport();
  }, []);

  const fetchPointReport = async () => {
    try {
      setLoading(true);
      const params = {
        start_date: filters.dateFrom,
        end_date: filters.dateTo,
      };
      const response = await reportService.getPointReport(params);
      if (response.status === 200 && response.data) {
        const { customers, summary: apiSummary } = response.data;
        // Clean up phone numbers and set data
        const cleanedData = customers.map((item) => ({
          ...item,
          Phone: item.Phone?.replace(/=\"|\\"|"/g, "").replace(/^=/, ""),
        }));
        setPointData(cleanedData);
        // Parse summary values into numbers for summary table
        setSummary({
          filteredTotal: {
            in: parseFloat(apiSummary["Filtered Total"]["In (Points)"].replace(/,/g, "")),
            out: parseFloat(apiSummary["Filtered Total"]["Out (Points)"].replace(/,/g, "")),
            redemptionRate: parseFloat(apiSummary["Filtered Total"]["Redemption Rate (%)"]),
            avgEarnPerTxn: parseFloat(apiSummary["Filtered Total"]["Avg Earn / Txn"]),
          },
          overallTotal: {
            in: parseFloat(apiSummary["Overall Total"]["In (Points)"].replace(/,/g, "")),
            out: parseFloat(apiSummary["Overall Total"]["Out (Points)"].replace(/,/g, "")),
          },
          sumOfAllMembers: {
            in: parseFloat(apiSummary["Sum of All Members"]["In (Points)"].replace(/,/g, "")),
          },
        });
      } else {
        toast.error("No data found.");
        setPointData([]);
      }
    } catch (error) {
      console.error("Error fetching point report:", error);
      toast.error("Failed to fetch point report.");
    } finally {
      setLoading(false);
    }
  };

 const handleExport = async () => {
  if (isDisabled) return;
  setIsDisabled(true);

  try {  
    const params = {
      type: "point-transaction",
      start_date: filters.dateFrom,
      end_date: filters.dateTo,
    };

    const response = await reportService.exportReport(params);

    if (response.status === 200) {
      toast.success(
        "Export file has been processed, this may take a while! You can find it in the Excel Report tab."
      );
    } else {
      toast.error("Failed to export file.");
    }
  } catch (error) {
    console.error("Export error:", error);
    toast.error("Something went wrong.");
  } finally {
    setTimeout(() => setIsDisabled(false), 1000);
  }
};


  const handleFilterChange = (name, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleFilterSubmit = () => {
    fetchPointReport();
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: null,
      dateTo: null,
    });
    fetchPointReport();
  };

  const columns = [
    {
      name: "Customer Name",
      selector: (row) => row["Customer Name"],
      width: "200px",
      sortable: true,
      wrap: true,
    },
    {
      name: "Phone",
      selector: (row) => row["Phone"],
      sortable: true,
      wrap: true,
    },
    {
      name: "Email",
      selector: (row) => row["Email"],
      width: "250px",
      wrap: true,
    },
    {
      name: "Action",
      selector: (row) => row["Action"],
      wrap: true,
    },
    {
      name: "Total Points",
      selector: (row) => row["Total Points"],
      wrap: true,
    },
    {
      name: "In (Points)",
      selector: (row) => row["In (Points)"],
      wrap: true,
      sortable: true,
    },
    {
      name: "Out (Points)",
      selector: (row) => row["Out (Points)"],
      wrap: true,
    },
    {
      name: "Balance (Points)",
      selector: (row) => row["Balance (Points)"],
    },
    {
      name: "Remark",
      selector: (row) => row["Remark"],
      wrap: true,
    },
    {
      name: "Date",
      selector: (row) => row["Date"],
      wrap: true,
    },
  ];

  // Columns for summary table
  const summaryColumns = [
    {
      name: "Type",
      selector: (row) => row.type,
      wrap: true,
    },
    {
      name: "In (Points)",
      selector: (row) => row.in,
      wrap: true,
    },
    {
      name: "Out (Points)",
      selector: (row) => row.out,
      wrap: true,
    },
    {
      name: "Redemption Rate (%)",
      selector: (row) => row.redemptionRate,
      wrap: true,
    },
    {
      name: "Avg Earn / Txn",
      selector: (row) => row.avgEarnPerTxn,
      wrap: true,
    },
    {
      name: "Sum of All Members (In)",
      selector: (row) => row.sumOfAllMembersIn,
      wrap: true,
    },
  ];

  // Prepare summary data for the summary table
  const summaryTableData = [
    {
      type: "Filtered Total",
      in: summary.filteredTotal.in?.toLocaleString() ?? 0,
      out: summary.filteredTotal.out?.toLocaleString() ?? 0,
      redemptionRate: summary.filteredTotal.redemptionRate?.toFixed(2) ?? "0.00",
      avgEarnPerTxn: summary.filteredTotal.avgEarnPerTxn?.toLocaleString() ?? 0,
      sumOfAllMembersIn: "-",
    },
    {
      type: "Overall Total",
      in: summary.overallTotal.in?.toLocaleString() ?? 0,
      out: summary.overallTotal.out?.toLocaleString() ?? 0,
      redemptionRate: "-",
      avgEarnPerTxn: "-",
      sumOfAllMembersIn: "-",
    },
    {
      type: "Sum of All Members",
      in: summary.sumOfAllMembers.in?.toLocaleString() ?? 0,
      out: "-",
      redemptionRate: "-",
      avgEarnPerTxn: "-",
      sumOfAllMembersIn: summary.sumOfAllMembers.in?.toLocaleString() ?? 0,
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
    rows: {
      style: {
        minHeight: "60px",
        fontSize: "15px",
        "&:hover": {
          backgroundColor: "#f9fafb",
        },
      },
    },
  };

  return (
    <div className="p-6 min-h-screen">
      {/* Filter Section */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-900">Point Report</h3>
        <div className="flex space-x-3">
          <button
             onClick={handleExport}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="p-6 shadow-lg rounded-xl bg-white mb-6">
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
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleFilterSubmit}
              className="px-6 py-2 bg-indigo-900 text-white font-medium rounded-md hover:bg-indigo-700 transition"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="bg-white rounded-lg shadow-sm mb-8">
        <DataTable
          columns={columns}
          data={pointData}
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
            <div className="flex justify-center items-center py-8">
              <Loader className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          }
          noDataComponent={
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-gray-500 text-lg mb-2">
                No point records found
              </div>
              <div className="text-gray-400 text-sm">
                Try adjusting your filters or search criteria
              </div>
            </div>
          }
        />
      </div>

      {/* Summary Data Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <h4 className="text-xl font-semibold text-gray-900 px-4 pt-4">Summary</h4>
        <DataTable
          columns={summaryColumns}
          data={summaryTableData}
          customStyles={customStyles}
          noHeader
          highlightOnHover
          pointerOnHover
          responsive
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

export default PointReport;
