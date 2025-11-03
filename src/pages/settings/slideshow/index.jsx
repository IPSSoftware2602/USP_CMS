import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Edit, Trash2, Plus, Menu, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { VITE_API_BASE_URL } from "../../../constant/config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SlideshowSettings = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTitle, setSearchTitle] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const authToken = sessionStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSlideshows = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem("token");
        const response = await fetch(VITE_API_BASE_URL + "settings/slideshow", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const resData = await response.json();
        if (response.ok) {
          setData(resData.result || []);
          setFilteredData(resData.result || []); // Initialize filtered data
        } else {
          setData([]);
          setFilteredData([]);
          toast.error(resData.message || "Failed to fetch slideshows.");
        }
      } catch (err) {
        setData([]);
        setFilteredData([]);
        toast.error("Error fetching slideshow data.");
      }
      setLoading(false);
    };

    fetchSlideshows();
  }, []);

  const handleSearch = () => {
    const filtered = data.filter((item) =>
      item.title.toLowerCase().includes(searchTitle.toLowerCase())
    );
    const filteredByStatus = filtered.filter((item) =>
      searchStatus
        ? item.status.toLowerCase() === searchStatus.toLowerCase()
        : true
    );
    const filteredByDate = filteredByStatus.filter((item) =>
      item.updated_at.toLowerCase().includes(searchDate.toLowerCase())
    );
    setFilteredData(filteredByDate);
  };

  const handleEdit = (row) => {
    navigate(`/settings/edit_slideshow/${row.id}`, { state: { data: row } });
  };

  const handleDelete = async (row) => {
    try {
      setLoading(true);
      const response = await fetch(
        VITE_API_BASE_URL + `settings/slideshow/delete/${row.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to delete slideshow");
        setLoading(false);
        return;
      }

      toast.success(result.message || "Slideshow deleted successfully!");
      setData((prev) => prev.filter((item) => item.id !== row.id));
      setFilteredData((prev) => prev.filter((item) => item.id !== row.id)); // Update filtered data
      setLoading(false);
    } catch (err) {
      toast.error("Unexpected error: " + err.message);
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    navigate("/settings/add_new_slideshow");
  };

  const columns = [
    {
      name: "Action",
      width: "300px",
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1 text-red-600 hover:text-red-800 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "120px",
    },
    {
      name: "Title",
      selector: (row) => row.title,
      sortable: true,
      width: "300px",
    },
    {
      name: "URL",
      selector: (row) => row.url,
      sortable: true,
      center: true,
      width: "500px",
      cell: (row) => (
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 underline break-all block max-w-xs truncate"
          title={row.url}
        >
          {row.url}
        </a>
      ),
    },

    {
      name: "Slide Image",
      selector: (row) => row.url,
      center: true,
      width: "300px",
      cell: (row) => (
        <img src={row.url} alt="Slide" className="w-24 h-20 rounded" />
      ),
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      center: true,
      width: "150px",
      cell: (row) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
            row.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      name: "Updated Date",
      selector: (row) => row.updated_at,
      sortable: true,
      center: true,
      width: "300px",
      cell: (row) => (
        <div className="text-gray-500">
          {row.updated_at
            ? new Date(row.updated_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-"}
        </div>
      ),
    },
    {
      name: "Created Date",
      selector: (row) => row.created_at,
      sortable: true,
      center: true,
      width: "300px",
      cell: (row) => (
        <div className="text-gray-500">
          {row.created_at
            ? new Date(row.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-"}
        </div>
      ),
    },
  ];

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

  return (
    <div className="w-full">
      <div className="px-2 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          Slideshow Setting
        </h2>
      </div>
      <div className="bg-white rounded-lg shadow-sm w-full pb-6">
        <div className="bg-indigo-900 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-lg text-white font-medium">Search</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Title:
              </label>
              <input
                type="text"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                placeholder="Enter title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Status:
              </label>
              <select
                value={searchStatus}
                onChange={(e) => setSearchStatus(e.target.value)}
                placeholder="Enter status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Select status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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

      <div className="flex justify-between items-center p-6 bg-white border-t rounded-lg mt-6 border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900"> Listing</h1>
        <button
          onClick={handleAddNew}
          className="flex items-center px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Slideshow
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden overflow-y-hidden hide-scrollbar">
        <DataTable
          columns={columns}
          data={filteredData}
          customStyles={customStyles}
          striped
          responsive
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[5, 10, 15, 20]}
          paginationComponentOptions={{
            rowsPerPageText: "Rows per page:",
            rangeSeparatorText: "of",
            noRowsPerPage: false,
            selectAllRowsItem: false,
            selectAllRowsItemText: "All",
          }}
          noDataComponent={
            <div className="p-8 text-center text-gray-500">
              No slideshow settings found
            </div>
          }
          sortIcon={<ChevronDown size={16} />}
        />
      </div>
    </div>
  );
};

export default SlideshowSettings;
