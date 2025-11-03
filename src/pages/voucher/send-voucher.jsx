import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  Search,
  Calendar,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import DataTable from "react-data-table-component";
import PromoList from "../promo/lists";
import customerTypeService from "../../store/api/cusTypeService";
import membershipTierService from "../../store/api/membershipService";
import voucherService from "@/store/api/voucherService";
import promoService from "@/store/api/promoService";
import { toast } from "react-toastify";
import { set } from "react-hook-form";

const SendVoucherLists = () => {
  const [loadingCusTypes, setLoadingCusTypes] = useState(true);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [loadingPromoSettings, setLoadingPromoSettings] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tiers, setTiers] = useState([]);
  const [customerTypes, setCustomerTypes] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [filters, setFilters] = useState({
    customer_phone: "",
    customer_type: "",
    customer_tier_id: "",
    birthday_month: "",
  });

  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [promoList, setPromoList] = useState([]); // For the list of available promos
  const [promoSettings, setPromoSettings] = useState({
    selectedPromo: "", // ID of selected promo
    expiredDate: "", // Expiration date
    quantity: 0, // Quantity per customer
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // const promoOptions = [
  //   { id: 1, name: "Free Delivery", type: "Percentage", amount: 5.0 },
  //   { id: 2, name: "10% Discount", type: "Percentage", amount: 10.0 },
  //   { id: 3, name: "RM50 Off", type: "Fixed Amount", amount: 50.0 },
  // ];

  // const customerTypes = ['All', 'Premium', 'Regular', 'VIP'];
  const months = [
    { value: "all", label: "All" },
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  useEffect(() => {
    loadTiers();
    loadCustomerTypes();
    fetchPromos();
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true);

      const response = await voucherService.searchMemberList(filters);

      if (response.status == 200) {
        if (response.data.length == 0) {
          toast.info("No record found", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } else {
          setCustomerList(response.data);
        }
      } else if (response.status == 400) {
        toast.error("Search Error", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (err) {
      toast.error("Search Error", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPromos = async () => {
    try {
      setLoadingPromoSettings(true);
      const response = await promoService.getAll();

      const transformedPromos =
        response.result?.map((promo) => ({
          id: promo.id,
          title: promo.title,
        })) || [];

      setPromoList(transformedPromos);
    } catch (err) {
      console.error("Error fetching promos:", err);
    } finally {
      setLoadingPromoSettings(false);
    }
  };
  const loadCustomerTypes = async () => {
    try {
      setLoadingCusTypes(true);
      const data = await customerTypeService.getAll();

      if (Array.isArray(data)) {
        setCustomerTypes(data);
      } else if (data.result && Array.isArray(data.result)) {
        setCustomerTypes(data.result);
      } else if (data.data && Array.isArray(data.data)) {
        setCustomerTypes(data.data);
      } else {
        console.warn("Unexpected API response structure:", data);
        setCustomerTypes([]);
      }
    } catch (err) {
      setCustomerTypes([]);
    } finally {
      setLoadingCusTypes(false);
    }
  };

  const loadTiers = async () => {
    try {
      setLoadingTiers(true);
      const response = await membershipTierService.getAll();
      let tierData = [];
      if (Array.isArray(response)) {
        tierData = response;
      } else if (Array.isArray(response.data)) {
        tierData = response.data;
      } else if (Array.isArray(response.result)) {
        tierData = response.result;
      }
      setTiers(tierData);
    } catch (error) {
      console.error("Failed to load membership tiers:", error);
      showAlert("error", `Failed to load membership tiers: ${error.message}`);
    } finally {
      setLoadingTiers(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSendVoucher = async () => {
    if (!promoSettings.selectedPromo) {
      alert("Please select a promo");
      return;
    }
    if (!promoSettings.expiredDate) {
      alert("Please set expiration date");
      return;
    }

    if (promoSettings.quantity <= 0) {
      alert("Please set quantity");
      return;
    }

    try {
      setLoading(true);

      const sendVoucherData = {
        promo_id: promoSettings.selectedPromo,
        expired_date: promoSettings.expiredDate,
        quantity: promoSettings.quantity,
        customer_ids: customerList.map((customer) => customer.id),
      };

      const response = await voucherService.sendVoucher(sendVoucherData);

      if (response.status == 200) {
        toast.success(response.message, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          onClose: () => window.location.reload(), // reload after toast closes
        });
      } else if (response.status == 400) {
        toast.error("Send Voucher Error", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }

      console.log(response);
    } catch (err) {
      toast.error("Send Voucher Error", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      name: "Phone",
      selector: (row) => row.phone,
      sortable: true,
      width: "250px",
    },
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
      width: "200px",
    },
    {
      name: "Customer Type",
      selector: (row) => row.customer_type,
      sortable: true,
      width: "200px",
    },
    {
      name: "Tier",
      selector: (row) => row.customer_tier_id,
      sortable: true,
      width: "180px",
      format: (row) => {
        const tier = tiers.find((t) => t.id == row.customer_tier_id);
        return tier ? tier.name : "-"; // show "-" if not found
      },
    },
    {
      name: "Birthday",
      selector: (row) => row.birthday,
      sortable: true,
      format: (row) => new Date(row.birthday).toLocaleDateString(),
      width: "150px",
    },
  ];

  const CustomPagination = ({
    rowsPerPage,
    rowCount,
    onChangePage,
    onChangeRowsPerPage,
    currentPage,
  }) => {
    const totalPages = Math.ceil(rowCount / rowsPerPage);
    const startRow = (currentPage - 1) * rowsPerPage + 1;
    const endRow = Math.min(currentPage * rowsPerPage, rowCount);

    return (
      <div className="flex items-center justify-between mt-4 px-6 py-3 bg-white border-t">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) =>
              onChangeRowsPerPage(Number(e.target.value), currentPage)
            }
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">
            {startRow}-{endRow} of {rowCount}
          </span>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onChangePage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => onChangePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const customStyles = {
    header: {
      style: {
        backgroundColor: "#312e81",
        color: "white",
        fontSize: "14px",
        fontWeight: "600",
        padding: "12px 24px",
      },
    },
    headRow: {
      style: {
        backgroundColor: "#312e81",
        minHeight: "56px",
      },
    },
    headCells: {
      style: {
        color: "white",
        fontSize: "12px",
        fontWeight: "500",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        paddingLeft: "24px",
        paddingRight: "24px",
      },
    },
    rows: {
      style: {
        fontSize: "14px",
        "&:hover": {
          backgroundColor: "#f9fafb",
        },
      },
    },
    cells: {
      style: {
        paddingLeft: "24px",
        paddingRight: "24px",
        paddingTop: "16px",
        paddingBottom: "16px",
      },
    },
  };

  return (
    <div className="min-h-screen p-6 pt-0">
      <h3 className="mb-5 ml-2 text-[20px] text-gray-500">Send Voucher</h3>

      <div className="mx-auto bg-white rounded-lg shadow-sm">
        <div className="bg-indigo-900 px-6 py-3 rounded-t-lg">
          <h1 className="text-lg text-white font-semibold">Search</h1>
        </div>

        <div className="p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by phone"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={filters.customer_phone}
                  onChange={(e) =>
                    handleFilterChange("customer_phone", e.target.value)
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Type
              </label>
              <div className="relative">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                  value={filters.customer_type}
                  onChange={(e) =>
                    handleFilterChange("customer_type", e.target.value)
                  }
                >
                  <option value="">Choose</option>
                  {customerTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tier
              </label>
              <div className="relative">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                  value={filters.customer_tier_id}
                  onChange={(e) =>
                    handleFilterChange("customer_tier_id", e.target.value)
                  }
                >
                  <option value="">Choose</option>
                  {tiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Birthday Month
              </label>
              <div className="relative">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                  value={filters.birthday_month}
                  onChange={(e) =>
                    handleFilterChange("birthday_month", e.target.value)
                  }
                >
                  <option value="">Choose</option>
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
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

      {customerList && customerList.length > 0 && (
        <>
          <div className="pt-6">
            <div className="pt-6 px-0 border-b rounded-xl bg-white">
              <h2 className="p-2 px-6 text-lg font-semibold text-gray-900 mb-4">
                Member Lists
              </h2>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <DataTable
                  columns={columns}
                  data={customerList}
                  customStyles={customStyles}
                  pagination
                  paginationComponent={(props) => (
                    <CustomPagination {...props} />
                  )}
                  paginationPerPage={rowsPerPage}
                  paginationRowsPerPageOptions={[10, 25, 50]}
                  paginationServer={false}
                  fixedHeader
                  fixedHeaderScrollHeight="320px"
                />
              </div>
            </div>
          </div>

          <div className="py-6">
            <div className=" bg-white">
              <div className="bg-indigo-900 px-6 py-3 rounded-t-lg">
                <h2 className="text-lg font-semibold text-white">
                  Selected Promo Settings
                </h2>
              </div>

              <div className="space-y-4 p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Promotion
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                        value={promoSettings.selectedPromo}
                        onChange={(e) =>
                          setPromoSettings((prev) => ({
                            ...prev,
                            selectedPromo: e.target.value,
                          }))
                        }
                      >
                        <option value="">Choose</option>
                        {promoList.map((promo) => (
                          <option key={promo.id} value={promo.id}>
                            {promo.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voucher Expiration Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={promoSettings.expiredDate}
                      onChange={(e) =>
                        setPromoSettings((prev) => ({
                          ...prev,
                          expiredDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity per Customer
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={promoSettings.quantity}
                    onChange={(e) =>
                      setPromoSettings((prev) => ({
                        ...prev,
                        quantity: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end w-[20%] ml-auto mt-4">
            <button
              onClick={handleSendVoucher}
              className="w-full bg-indigo-900 text-white py-3 px-6 rounded-md hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Send Voucher</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SendVoucherLists;
