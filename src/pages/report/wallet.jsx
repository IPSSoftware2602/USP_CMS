import React, { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Edit, Trash2, Plus, ChevronDown, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import UserService from "../../store/api/userService";
import reportService from "@/store/api/reportService";
import { VITE_API_BASE_URL } from "../../constant/config";
import "react-toastify/dist/ReactToastify.css";

const PointReport = () => {
  const [loading, setLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [pointData, setPointData] = useState([]);

useEffect(() => {
  fetchPointReport();
}, []);


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

  const fetchPointReport = async (filters = {}) => {
  try {
    setLoading(true);
    const response = await reportService.getWalletReport(filters);
    if (response.status === 200 && response.data) {
      const cleanedData = response.data.map((item) => ({
        ...item,
        Phone: item.Phone?.replace(/=\"|\\"/g, "").replace(/^=/, "").replace(/"$/, "")
      }));
      setPointData(cleanedData);
    } else {
      toast.error("No data found.");
      setPointData([]);
    }
  } catch (error) {
    console.error("Error fetching order report:", error);
    toast.error("Failed to fetch order report.");
  } finally {
    setLoading(false);
  }
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
          type: "voucher",
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
        whiteSpace: "normal",
        wordBreak: "break-word",
        maxWidth: "200px",
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

  return (
    <div className="p-6 min-h-screen">
      <h3 className="mb-5 ml-2 text-[20px] text-gray-500">Wallet Report</h3>

      <div className="bg-white rounded-lg shadow-sm">
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
            <div className="text-center py-8">
              <div className="text-gray-500">Loading...</div>
            </div>
          }
          noDataComponent={
            <div className="text-center py-8 text-gray-500">
              No Wallet Report found
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

export default PointReport;
