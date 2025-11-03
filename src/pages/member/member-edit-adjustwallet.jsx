import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { VITE_API_BASE_URL } from '../../constant/config';
import { ToastContainer, toast } from 'react-toastify';

const MemberAdjustWallet = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    action: '',
    in: 0.00,
    out: 0.00,
    remark: '',
    value: null,
    customer_id: id,
    related_id: "0",
    related_type: 'Adjustments',
  });
  const authToken = sessionStorage.getItem('token');

  const [walletData, setWalletData] = useState({
    customerName: '',
    wallet: '',
    walletCredit: '',
    totalWallet: '',
  });

  const [transactions, setTransactions] = useState({ all: [], credit: [] });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customerData, setCustomerData] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  const fetchCustomerData = async () => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}customers/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const customerData = await response.json()
      const customerDetails = customerData.data;


      setWalletData({
        customerName: customerDetails.name || 'N/A',
        wallet: `RM ${customerDetails.wallet || 0}`,
      });
``
    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
  }

  const fetchCustomerWalletHistory = async (dateFrom = '', dateTo = '') => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}customer-wallet/history/${id}?date_from=${dateFrom}&date_to=${dateTo}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const walletHistory = await response.json();
      // console.log('Wallet History:', walletHistory);
      const walletData = walletHistory.data;

      const allTransactions = walletData.all || [];
      const creditTransactions = walletData.credit || [];

      const allBalance = getLastBalance(allTransactions) ?? 0;
      const creditBalance = getLastBalance(creditTransactions) ?? 0;
      const totalBalance = allBalance + creditBalance;

      setTransactions({
        all: allTransactions,
        credit: creditTransactions
      });

      setWalletData(prev => ({
        ...prev,
        wallet: `RM ${allBalance}`,
      }));

    } catch (error) {
      console.error("Error fetching wallet history:", error);

    }
  }

  const getLastBalance = (arr) => {
    if (!arr?.length) return null;
    const last = arr[0];
    console.log(parseFloat(last.balance));
    const balance = parseFloat(last.balance);
    return balance;
  };

  useEffect(() => {
    async function fetchAll() {
      await fetchCustomerData();
      await fetchCustomerWalletHistory();
    }
    fetchAll();
  }, []);

  const emptyData = [];

  const data = [];

  const columns = [
    {
      name: 'No',
      cell: (row, rowIndex) => rowIndex + 1,
      width: '70px'
    },
    {
      name: 'Date Created',
      selector: row => row.created_at,
      // sortable: true,
      minWidth: '200px',
    },
    {
      name: 'Type',
      selector: row => row.related_type,
      // sortable: true,
      minWidth: '150px',
    },
    {
      name: 'Action',
      selector: row => row.action.toUpperCase(),
      // sortable: true,
      minWidth: '100px',
    },
    {
      name: 'Current',
      selector: row => row.current,
      // sortable: true,
    },
    {
      name: 'In',
      selector: row => row.in,
      // sortable: true,
    },
    {
      name: 'Out',
      selector: row => row.out,
      // sortable: true,
    },
    {
      name: 'Balance',
      selector: row => row.balance,
      // sortable: true,
    },
    // {
    //   name: 'Reason',
    //   selector: row => row.reason,
    //   sortable: true,
    //   grow: 2,
    // },
    {
      name: 'Remark',
      selector: row => row.remark,
      sortable: true,
      minWidth: '250px',
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#312e81',
        color: 'white',
        minHeight: '50px',
        fontSize: '16px',
        justifyContent: 'center',
      },
    },
    headCells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        fontWeight: '500',
        justifyContent: 'center',
        textAlign: 'center',
        subHeaderWrap: true,
      },
    },
    rows: {
      style: {
        minHeight: '60px',
        fontSize: '15px',
        '&:hover': {
          backgroundColor: '#f9fafb',
        },
        justifyContent: 'center',
        center: true,
      },
      highlightOnHoverStyle: {
        backgroundColor: '#f9fafb',
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        justifyContent: 'center',
        textAlign: 'center',
        alignItems: 'center',
        center: true,
      },
    },
    pagination: {
      style: {
        borderTopStyle: 'solid',
        borderTopWidth: '1px',
        borderTopColor: '#e5e7eb',
      },
    },
  };

  const NoDataComponent = () => (
    <div className="py-6 text-gray-500">No points history found</div>
  );

  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.action || !formData.value || parseFloat(formData.value) <= 0) {
      toast.error("Please select an action and enter a valid amount");
      return;
    }

    const amount = Number(parseFloat(formData.value).toFixed(2));
    const submitData = {
      ...formData,
      in: formData.action === 'in' ? amount : 0,
      out: formData.action === 'out' ? amount : 0,
      value: undefined // Remove the value field as it's not needed in the API
    };

    delete submitData.value; // Remove the value field

    try {
      const response = await fetch(VITE_API_BASE_URL + "customer-wallets/create", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process wallet adjustment');
      }

      // Custom success message based on action
      const successMessage = formData.action === 'in' 
        ? "Top Up Successful" 
        : "Deduct Successful";

      toast.success(successMessage, {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        onClose: () => {
          // Refresh wallet data after successful submission
          fetchCustomerWalletHistory();
          // Reset form
          setFormData({
            action: '',
            in: 0.00,
            out: 0.00,
            remark: '',
            value:'',
            customer_id: id,
            related_id: "0",
            related_type: 'Adjustments',
          });
        },
      });

    } catch (err) {
      console.error("Error creating wallet action:", err);
      toast.error(err.message || "Unexpected error");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="flex justify-end items-center p-4">
        <button className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 text-gray-800" onClick={handleBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Go back
        </button>
      </div>

      {/* Customer Details Section */}
      <div className="mb-6 border rounded-lg overflow-hidden">
        <div className="bg-indigo-900 text-white p-4 font-bold">
          Details
        </div>
        <div className="p-4 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex">
              <div className="w-32 font-medium">Customer Name</div>
              <div className="px-2">:</div>
              <div>{walletData.customerName}</div>
            </div>
            <div className="flex">
              <div className="w-32 font-medium">Wallet</div>
              <div className="px-2">:</div>
              <div>{walletData.wallet}</div>
            </div>
            <div className="flex">
              <div className="w-32 font-medium">Wallet Credit</div>
              <div className="px-2">:</div>
              <div>{walletData.walletCredit}</div>
            </div>
            <div className="flex">
              <div className="w-32 font-medium">Total Wallet</div>
              <div className="px-2">:</div>
              <div>{walletData.totalWallet}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Listing Form Section */}
      <div className="mb-6 border rounded-lg overflow-hidden">
        <div className="bg-indigo-900 text-white p-4 font-bold">
          Listing
        </div>
        <div className="p-4 bg-white">
          <div className="md:grid-cols-2 gap-6">
            <div className="flex flex-col md:flex-row items-start md:items-center mt-2 mb-4">
              <label className="w-32 font-medium mb-2 md:mb-0">Wallet</label>
              <div className="w-full flex">
                <div className="relative w-full md:w-48 mr-2">
                  <select
                    className="w-full border rounded-md p-2 pr-8 appearance-none"
                    name="action"
                    value={formData.action}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Choose</option>
                    <option value="in">Top Up</option>
                    <option value="out">Deduct</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDown size={16} />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Enter amount here"
                  className="w-full border rounded-md p-2"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div></div> {/* Empty div for grid alignment */}

            <div className="flex flex-col mb-4 md:flex-row items-start md:items-center">
              <label className="w-32 font-medium mb-2 md:mb-0">Remark</label>
              <textarea
                className="w-full border rounded-md p-2 h-24 resize-none"
                placeholder="Enter here"
                name="remark"
                value={formData.remark}
                onChange={handleChange}
              />
            </div>

            <div className="flex justify-end md:col-span-2">
              <button
                className="bg-indigo-900 text-white px-6 py-2 rounded-md hover:bg-indigo-800"
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="text-xl font-bold mb-4">Listing (Credit)</div>
        <div className="shadow rounded-lg overflow-hidden">
          <DataTable
            columns={columns}
            data={transactions.all}
            customStyles={customStyles}
            noDataComponent={<NoDataComponent />}
            pagination
            responsive
          />
        </div>
      </div>
    </div>
  );
};

export default MemberAdjustWallet;