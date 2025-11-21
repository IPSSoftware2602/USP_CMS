import React, { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import { ChevronDown, Filter, RotateCcw, Loader } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import reportService from "@/store/api/reportService";
import { VITE_API_BASE_URL } from "../../constant/config";
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

const WalletReport = () => {
  const [loading, setLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [walletData, setWalletData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [filters, setFilters] = useState({
    dateFrom: null,
    dateTo: null,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchWalletReport();
  }, []);

  const fetchWalletReport = async () => {
    try {
      setLoading(true);

      const params = {
        start_date: filters.dateFrom,
        end_date: filters.dateTo,
      };

      const response = await reportService.getWalletReport(params);
      if (response.status === 200 && response.data) {
        // If response.data.transactions exists, use it; else fallback to response.data
        const transactions = response.data.transactions || response.data;
        const cleanedData = transactions.map((item) => ({
          ...item,
          Phone: item.Phone?.replace(/=\"|\\"/g, "")
            .replace(/^=/, "")
            .replace(/"$/, ""),
        }));
        setWalletData(cleanedData);

        // Handle summary
        if (response.data.summary) {
          // Convert summary object to array of { key, value }
          const summaryArr = Object.entries(response.data.summary).map(
            ([key, value]) => ({
              Metric: key,
              Value: value,
            })
          );
          setSummaryData(summaryArr);
        } else {
          setSummaryData([]);
        }
      } else {
        toast.error("No data found.");
        setWalletData([]);
        setSummaryData([]);
      }
    } catch (error) {
      console.error("Error fetching wallet report:", error);
      toast.error("Failed to fetch wallet report.");
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  };

const handleExport = async () => {
  if (isDisabled) return;
  setIsDisabled(true);

  try {
    const params = {
      type: "wallet-transaction",
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
    fetchWalletReport();
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: null,
      dateTo: null,
    });
    fetchWalletReport();
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
      wrap: true,
    },
    {
      name: "Action",
      selector: (row) => row["Action"],
      wrap: true,
    },
    {
      name: "Type",
      selector: (row) => row["Type"],
      wrap: true,
    },
    {
      name: "In (RM)",
      selector: (row) => row["In (RM)"],
      wrap: true,
    },
    {
      name: "Out (RM)",
      selector: (row) => row["Out (RM)"],
      wrap: true,
    },
    {
      name: "Balance (RM)",
      selector: (row) => row["Balance (RM)"],
    },
    {
      name: "Remark",
      selector: (row) => row["Remark"],
      right: true,
    },
    {
      name: "Date",
      selector: (row) => row["Date"],
      right: true,
    },
  ];

  const summaryColumns = [
    {
      name: "Title",
      selector: (row) => row.Metric,
      wrap: true,
      sortable: true,
    },
    {
      name: "Value (RM/%)",
      selector: (row) => row.Value,
      wrap: true,
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
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-900">Wallet Report</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition flex items-center space-x-2"
          >
            Export CSV
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

      <div className="bg-white rounded-lg shadow-sm">
        <DataTable
          columns={columns}
          data={walletData}
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
                No wallet records found
              </div>
              <div className="text-gray-400 text-sm">
                Try adjusting your filters or search criteria
              </div>
            </div>
          }
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm mt-10">
        <h3 className="text-xl font-semibold text-gray-900 p-4">
          Summary Report
        </h3>

        <DataTable
          columns={summaryColumns}
          data={summaryData}
          customStyles={customStyles}
          highlightOnHover
          pointerOnHover
          responsive
          noHeader
          pagination={false}
          noDataComponent={
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-gray-500 text-lg mb-2">
                No summary data found
              </div>
            </div>
          }
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

export default WalletReport;
