import { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { ChevronLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { VITE_API_BASE_URL } from '../../constant/config';

export default function MemberEditVoucher() {
  const { id } = useParams();
  const authToken = sessionStorage.getItem('token');
  const [customerData, setCustomerData] = useState({
    customerName: '',
    code: '',
  });
  const [voucherData, setVoucherData] = useState([]);
  const [loading, setLoading] = useState(true);

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

      const customerData = await response.json();
      const customerDetails = customerData.data;
      
      setCustomerData({
        customerName: customerDetails.name || 'N/A',
        code: customerDetails.customer_referral_code || 'N/A',
      });

      // Transform voucher data to match table structure
      if (customerDetails.vouchers && customerDetails.vouchers.length > 0) {
        const transformedVouchers = customerDetails.vouchers.map(voucher => ({
          id: voucher.id || voucher.voucher_code, // Use a unique identifier
          voucherCode: voucher.voucher_code,
          amount: voucher.amount ? `RM ${parseFloat(voucher.amount).toFixed(2)}` : 'N/A',
          minimumPurchase: voucher.minimum_purchase ? `RM ${parseFloat(voucher.minimum_purchase).toFixed(2)}` : 'N/A',
          dateStart: voucher.start_date || 'N/A',
          dateExpired: voucher.voucher_expiry_date || 'N/A',
          status: voucher.voucher_status || 'N/A',
          remark: voucher.remark || 'N/A'
        }));
        setVoucherData(transformedVouchers);
      } else {
        setVoucherData([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching customer data:", error);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };

  // Define columns for DataTable
  const columns = [
    {
      name: 'Voucher Code',
      selector: row => row.voucherCode,
      sortable: true,
      width: '45%',
    },
    {
      name: 'Date Expired',
      selector: row => row.dateExpired,
      sortable: true,
      width: '45%',
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      width: '12%',
      cell: row => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.status === 'Active' || row.status === 'active' || row.status === 'ACTIVE'
            ? 'bg-green-100 text-green-800' 
            : row.status === 'Expired' || row.status === 'expired' || row.status === 'EXPIRED'
            ? 'bg-red-100 text-red-800'
            : row.status === 'Used' || row.status === 'used' || row.status === 'USED'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
        </span>
      ),
    },
  ];

  // Custom styles for DataTable to match your design
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#2e2c67',
        color: 'white',
        fontWeight: 'bold',
        minHeight: '56px',
      },
    },
    headCells: {
      style: {
        color: 'white',
        fontSize: '14px',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    rows: {
      style: {
        minHeight: '60px',
        fontSize: '14px',
        '&:not(:last-of-type)': {
          borderBottomStyle: 'solid',
          borderBottomWidth: '1px',
          borderBottomColor: '#E5E7EB',
        },
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    pagination: {
      style: {
        minHeight: '56px',
        marginTop: '0',
        borderTop: '1px solid #E5E7EB',
      },
    },
    noData: {
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        fontSize: '16px',
        color: '#6B7280',
      },
    },
  };

  // Custom pagination options text
  const paginationComponentOptions = {
    rowsPerPageText: 'Rows per page:',
    rangeSeparatorText: 'of',
    selectAllRowsItem: false,
    selectAllRowsItemText: 'All',
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6">
      <div className="flex justify-end items-center p-4 mb-3">
        <button 
          className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 text-gray-800 hover:bg-gray-50 transition-colors"
          onClick={handleBack}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Go back
        </button>
      </div>

      {/* Details section */}
      <div className="mb-6">
        <div className="bg-indigo-900 p-4 rounded-t-lg">
          <h2 className="text-[18px] font-semibold text-white">Details</h2>
        </div>
        <div className="p-4 sm:p-6 bg-white rounded-b-lg shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center">
              <span className="font-semibold w-32">Code</span>
              <span className="text-gray-700">: {customerData.code}</span>
            </div>
            <div className="flex items-center">
              <span className="font-semibold w-32">Customer Name</span>
              <span className="text-gray-700">: {customerData.customerName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Listing section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 ml-2">Voucher Listing</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={voucherData}
            customStyles={customStyles}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50]}
            paginationComponentOptions={paginationComponentOptions}
            noDataComponent={
              <div className="p-8 text-center text-gray-500">
                No vouchers found for this customer
              </div>
            }
            highlightOnHover
            pointerOnHover
          />
        )}
      </div>
    </div>
  );
}