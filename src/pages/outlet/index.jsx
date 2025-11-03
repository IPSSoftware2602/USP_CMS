import React, { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import {
  Edit,
  Download,
  Trash2,
  Plus,
  PenLine,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useNavigate, useOutlet } from "react-router-dom";
import DeleteConfirmationModal from "../../components/ui/DeletePopUp";
import OutletApiService from "../../store/api/outletService";
import UserService from "../../store/api/userService";
import { VITE_API_BASE_URL } from "../../constant/config";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

const Outlet = () => {
  const [outlets, setOutlets] = useState([]);
  const [filteredOutlets, setFilteredOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOutletId, setSelectedOutletId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();
  const [userPermissions, setUserPermissions] = useState({});
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [searchTitle, setSearchTitle] = useState("");
  const [searchAddress, setSearchAddress] = useState("");

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

  const fetchUserPermissions = async () => {
    try {
      if (!user_id) return;

      const userDataRes = await UserService.getUser(user_id);
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
            permissions.Outlets &&
            permissions.Outlets.subItems &&
            permissions.Outlets.subItems.Lists
          ) {
            if (permissions.Outlets.subItems.Lists.create === true) {
              setHasCreatePermission(true);
            }
            if (permissions.Outlets.subItems.Lists.update === true) {
              setHasUpdatePermission(true);
            }
            if (permissions.Outlets.subItems.Lists.delete === true) {
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

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredOutlets.slice(start, start + rowsPerPage);
  }, [filteredOutlets, currentPage, rowsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePerRowsChange = (newPerPage, page) => {
    setRowsPerPage(newPerPage);
    setCurrentPage(page);
  };

  useEffect(() => {
    if (user_id) {
      fetchOutlets();
      fetchUserPermissions();
    }
  }, [user_id]);

  // Filter outlets based on user's outlet ID
  useEffect(() => {
    setFilteredOutlets(outlets);
  }, [outlets]);

  const fetchOutlets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await OutletApiService.getOutlets(user_id);

      const outletsArray = Array.isArray(response.result)
        ? response.result
        : [];
      const transformedOutlets = outletsArray.map((outlet) => ({
        id: outlet.id,
        outlet: outlet.title,
        address: `${outlet.address}, ${outlet.state}, ${outlet.country}, ${outlet.postal_code}`,
        service: outlet.serve_method,
        status: outlet.status === "active" ? "Open" : "Closed",
        operationHours: transformOperatingHoursFromSchedule(
          outlet.operating_schedule
        ),
        email: outlet.email,
        phone: outlet.phone,
        deliveryOptions: outlet.delivery_options,
        deliveryCoverage: outlet.outlet_delivery_coverage,
        orderMaxPerHour: outlet.order_max_per_hour,
        itemMaxPerHour: outlet.item_max_per_hour,
        latitude: outlet.latitude,
        longitude: outlet.longitude,
        operatingDays: outlet.outlet_operating_days,
        operatingHoursExceptions: outlet.outlet_operating_hours_exceptions,
        outletTax: outlet.outlet_tax,
        images: outlet.outlet_images,
      }));

      setOutlets(transformedOutlets);
    } catch (err) {
      setError("Failed to fetch outlets. Please try again.");
      console.error("Error fetching outlets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const titleFilter = searchTitle.toLowerCase().trim();
    const addressFilter = searchAddress.toLowerCase().trim();

    const filtered = outlets.filter((outlet) => {
      const matchTitle =
        titleFilter === "" || outlet.outlet.toLowerCase().includes(titleFilter);
      const matchAddress =
        addressFilter === "" ||
        outlet.address.toLowerCase().includes(addressFilter);

      return matchTitle && matchAddress;
    });

    setFilteredOutlets(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!searchTitle && !searchAddress) {
      setFilteredOutlets(outlets);
    }
  }, [searchTitle, searchAddress, outlets]);

  function transformOperatingHoursFromSchedule(schedule) {
    if (!schedule) return {};
    const dayMap = {
      Monday: "Mon",
      Tuesday: "Tue",
      Wednesday: "Wed",
      Thursday: "Thu",
      Friday: "Fri",
      Saturday: "Sat",
      Sunday: "Sun",
    };
    const result = {};
    Object.entries(dayMap).forEach(([full, short]) => {
      const day = schedule[full];
      if (
        day &&
        day.is_operated &&
        Array.isArray(day.operating_hours) &&
        day.operating_hours.length > 0
      ) {
        result[short] = day.operating_hours
          .map(
            (slot) =>
              `${slot.start_time?.substring(
                0,
                5
              )} to ${slot.end_time?.substring(0, 5)}`
          )
          .join(", ");
      } else {
        result[short] = "Closed";
      }
    });
    return result;
  }

  const handleNewOutlet = () => {
    navigate("/outlets/list/add_new_outlet");
  };

  const handleEditOutlet = (id) => {
    navigate(`/outlets/list/edit_outlet/${id}`);
  };

  const handleEditPasswordOutlet = (id) => {
    navigate(`/outlets/list/edit_password/${id}`);
  };

  const deleteItem = async (id) => {
    console.log("Deleting outlet:", id);
    try {
      setDeleting(true);
      await OutletApiService.deleteOutlet(id);
      const updatedOutlets = outlets.filter((outlet) => outlet.id !== id);
      setOutlets(updatedOutlets);
      console.log(`Outlet with ID ${id} has been deleted`);
    } catch (err) {
      setError("Failed to delete outlet. Please try again.");
      console.error("Error deleting outlet:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedOutletId(id);
    setShowDeleteModal(true);
  };

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
          type: "outlet",
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

  const OperationHours = ({ hours }) => (
    <div className="text-xs">
      <table className="w-full">
        <tbody>
          {Object.entries(hours).map(([day, time]) => (
            <tr key={day}>
              <td className="w-[60px] font-medium text-gray-700 text-right pr-2">
                {day}:
              </td>
              <td
                className={`${
                  time === "Closed" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {time}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const ActionButtons = ({ row }) => (
    <div className="flex border divide-x-2">
      {(isAdmin || hasUpdatePermission) && (
        <button
          className="p-2 rounded hover:bg-gray-50"
          title="Edit Outlet Information"
          onClick={() => handleEditOutlet(row.id)}
        >
          <Edit size={16} />
        </button>
      )}
      {(isAdmin || hasUpdatePermission) && (
        <button
          className="p-2 rounded hover:bg-gray-50"
          title="Edit Password"
          onClick={() => handleEditPasswordOutlet(row.id)}
        >
          <PenLine size={16} />
        </button>
      )}
      {(isAdmin || hasDeletePermission) && (
        <button
          className="p-2 text-red-600 hover:bg-red-50 rounded"
          title="Delete"
          onClick={() => handleDeleteClick(row.id)}
          disabled={deleting}
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );

  const columns = [
    {
      name: "Action",
      cell: (row) => <ActionButtons row={row} />,
      ignoreRowClick: true,
      center: true,
    },
    {
      name: "Outlet",
      selector: (row) => row.outlet,
      //filter by outlet name
      sortable: true,
      width: "20%",
      cell: (row) => (
        <div className="py-2 text-sm font-medium text-gray-900">
          {row.outlet}
        </div>
      ),
    },
    {
      name: "Address",
      selector: (row) => row.address,
      sortable: true,
      width: "30%",
      cell: (row) => (
        <div className="py-2 text-sm text-gray-600 max-w-xs">{row.address}</div>
      ),
    },
    {
      name: "Service",
      selector: (row) => row.service,
      sortable: true,
      center: true,
      cell: (row) => {
        const formatServiceText = (serviceText) => {
          if (!serviceText) return "N/A";
          return serviceText
            .replace(/[-_]/g, " ")
            .split(",")
            .map((service) =>
              service
                .trim()
                .split(" ")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(" ")
            )
            .join(", ");
        };

        const getServiceStyle = (serviceType) => {
          const cleanedType = serviceType.toLowerCase().trim();

          if (cleanedType.includes("dine") || cleanedType.includes("dine-in")) {
            return "bg-yellow-100 text-yellow-800";
          }
          if (cleanedType.includes("delivery")) {
            return "bg-green-100 text-green-800";
          }
          if (
            cleanedType.includes("pickup") ||
            cleanedType.includes("pick up")
          ) {
            return "bg-blue-100 text-blue-800";
          }
          return "bg-gray-100 text-gray-800";
        };

        const services = formatServiceText(row.service).split(", ");

        return (
          <div className="flex flex-wrap justify-center gap-1">
            {services.map((service, index) => (
              <span
                key={index}
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getServiceStyle(
                  service
                )} border`}
              >
                {service}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      style: { textAlign: "center" },
      cell: (row) => {
        const getStatusStyle = () => {
          return row.status?.toLowerCase() === "open"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800";
        };

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle()} border`}
          >
            {row.status || "N/A"}
          </span>
        );
      },
    },
    {
      name: "Operation Hours",
      center: "true",
      selector: (row) => row.operationHours,
      width: "20%",
      cell: (row) => <OperationHours hours={row.operationHours} />,
    },
  ];

  const customStyles = {
    header: {
      style: {
        backgroundColor: "#312e81",
        color: "white",
        fontSize: "16px",
        fontWeight: "600",
        minHeight: "56px",
      },
    },
    headRow: {
      style: {
        backgroundColor: "#312e81",
        borderTopStyle: "none",
        borderBottomStyle: "none",
      },
    },
    headCells: {
      style: {
        color: "white",
        fontSize: "14px",
        fontWeight: "600",
        paddingLeft: "16px",
        paddingRight: "16px",
        backgroundColor: "#312e81",
      },
    },
    rows: {
      style: {
        minHeight: "80px",
        backgroundColor: "white",
        borderBottomStyle: "solid",
        borderBottomWidth: "1px",
        borderBottomColor: "#e5e7eb",
        "&:not(:last-of-type)": {
          borderBottomStyle: "solid",
          borderBottomWidth: "1px",
          borderBottomColor: "#e5e7eb",
        },
      },
      highlightOnHoverStyle: {
        backgroundColor: "#f9fafb",
        borderBottomColor: "#e5e7eb",
        borderRadius: "0px",
        outline: "1px solid #e5e7eb",
      },
    },
    cells: {
      style: {
        paddingLeft: "16px",
        paddingRight: "16px",
        paddingTop: "8px",
        paddingBottom: "8px",
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

  return (
    <div className="min-h-screen">
      <div className="rounded-t-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold text-gray-500">Outlet List</h1>
        </div>
        <div className="bg-white rounded-lg shadow-sm w-full">
          <div className="bg-indigo-900 text-white px-6 py-4 rounded-t-lg">
            <h2 className="text-lg text-white font-medium">Search</h2>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outlet Name
                </label>
                <input
                  type="text"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  placeholder="Search Outlet Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outlet Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    placeholder="Search Outlet Address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mb-4">
              <button
                onClick={handleSearch}
                className="bg-indigo-900 text-white px-6 py-2 rounded-md hover:bg-indigo-800 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-auto py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchOutlets}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto py-6">
        <div className="bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between py-3">
              <h2 className="text-2xl font-medium text-gray-900">Outlet</h2>
              <div className="flex space-x-3">
                {(isAdmin || hasCreatePermission) && (
                  <button
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-900 hover:bg-indigo-800 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={handleNewOutlet}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Outlet
                  </button>
                )}
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
          </div>

          <DataTable
            columns={columns}
            data={paginatedData}
            customStyles={customStyles}
            responsive
            highlightOnHover
            pointerOnHover
            pagination
            paginationServer={true}
            paginationTotalRows={filteredOutlets.length}
            paginationDefaultPage={currentPage}
            paginationPerPage={rowsPerPage}
            paginationRowsPerPageOptions={[10, 20, 30, 50, 100]}
            onChangePage={handlePageChange}
            onChangeRowsPerPage={handlePerRowsChange}
            sortIcon={<ChevronDown size={16} />}
            noHeader
            progressPending={loading}
            progressComponent={
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            }
            noDataComponent={
              <div className="py-8 text-center text-gray-500">
                {isAdmin
                  ? "No outlets found. Click 'Add New Outlet' to create your first outlet."
                  : "No outlets assigned to your account."}
              </div>
            }
          />
        </div>

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => {
            deleteItem(selectedOutletId);
            setShowDeleteModal(false);
          }}
        />
      </div>
    </div>
  );
};

export default Outlet;
