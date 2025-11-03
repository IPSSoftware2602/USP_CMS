import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { ChevronDown, Download } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { VITE_API_BASE_URL } from "../../constant/config";

const CsvExport = () => {
  const authToken = sessionStorage.getItem("token");
  const [reportList, setReportList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [searchName, setSearchName] = useState(""); 
  const [searchType, setSearchType] = useState(""); 
  const [searchDate, setSearchDate] = useState("");
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchExcelReport = async () => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}settings/report-list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch Excel Report list");

      const data = await response.json();

      if (data.status === 200 || data.status === "success") {
        setReportList(data.result || []);
        setFilteredList(data.result || []);
      } else {
        toast.error("Failed to load CSV exports list");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    }
  };

  useEffect(() => {
    fetchExcelReport();
  }, []);

  const handleSearch = () => {
    let filtered = [...reportList];
    if (searchName.trim() !== "") {
      filtered = filtered.filter((r) =>
        r.file_name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchType !== "") {
      filtered = filtered.filter(
        (r) => r.file_type.toLowerCase() === searchType.toLowerCase()
      );
    }
    if (searchDate !== "") {
      const now = new Date();

      filtered = filtered.filter((r) => {
        const reportDate = new Date(r.created_at.replace(" ", "T"));

        if (searchDate === "today") {
          return reportDate.toDateString() === now.toDateString();
        } else if (searchDate === "this-week") {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay() + 1);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return reportDate >= startOfWeek && reportDate <= endOfWeek;
        } else if (searchDate === "this-month") {
          return (
            reportDate.getMonth() === now.getMonth() &&
            reportDate.getFullYear() === now.getFullYear()
          );
        }
        return true;
      });
    }

    setFilteredList(filtered);
    setResetPaginationToggle(!resetPaginationToggle);
  };

  const columns = [
    {
      name: "Action",
      minWidth: "50px",
      center: true,
      cell: (row) => (
        <a
          href={row.file_url}
          download
          className="p-2 rounded hover:bg-gray-100 transition"
        >
          <Download size={22} />
        </a>
      ),
    },
    {
      name: "Title",
      sortable: true,
      minWidth: "200px",
      selector: (row) => row.file_name || "-",
      center: true,
    },
    {
      name: "Type",
      sortable: true,
      selector: (row) => row.file_type || "-",
      minWidth: "200px",
      center: true,
    },
    {
      name: "Exported Date",
      sortable: true,
      minWidth: "180px",
      center: true,
      selector: (row) =>
        row.created_at
          ? new Date(row.created_at.replace(" ", "T")).toLocaleString()
          : "-",
    },
    {
      name: "Status",
      sortable: true,
      minWidth: "120px",
      center: true,
      cell: (row) => {
        let color = "gray";
        if (row.status === "active") color = "green";
        else if (row.status === "inactive") color = "red";

        return (
          <span
            style={{ color, fontWeight: "bold", textTransform: "capitalize" }}
          >
            {row.status}
          </span>
        );
      },
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "#312e81",
        color: "white",
        fontSize: "16px",
      },
    },
    headCells: {
      style: {
        justifyContent: "center",
        textAlign: "center",
      },
    },
    rows: {
      style: {
        minHeight: "60px",
        fontSize: "15px",
        justifyContent: "center",
        textAlign: "center",
      },
      highlightOnHoverStyle: {
        backgroundColor: "#f9fafb",
      },
    },
    cells: {
      style: {
        justifyContent: "center",
        textAlign: "center",
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
    <div>
      <ToastContainer />
      <h1 className="text-xl font-medium text-gray-600 mb-6 ml-3">
        CSV Export List
      </h1>
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="bg-indigo-900 px-6 py-4 rounded-t-lg">
          <h2 className="text-lg text-white font-semibold">Search</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Name :
              </label>
              <input
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Enter file name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type :
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="store-discount">Store Discount</option>
                <option value="outlet">Outlet</option>
                <option value="promocode">Promo Code</option>
                <option value="promo">Promo</option>
                <option value="member">Member</option>
                <option value="voucher">Voucher</option>
                <option value="topup">Topup</option>
                <option value="order">Order</option>
                <option value="sales-report">Sales Report</option>
                <option value="product-report">Product Report</option>
                <option value="promo-report">Promo Report</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Date :
              </label>
              <select
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
              </select>
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
      <div className="bg-white shadow-sm overflow-hidden rounded-lg">
        <DataTable
          columns={columns}
          data={[...filteredList]}
          keyField="id"
          pagination
          paginationResetDefaultPage={resetPaginationToggle}
          persistTableHead
          customStyles={customStyles}
          sortIcon={<ChevronDown size={16} />}
          responsive
        />
      </div>
    </div>
  );
};

export default CsvExport;
