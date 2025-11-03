import { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
// import { apiUrl } from '../../constant/constants';
import { VITE_API_BASE_URL } from '../../constant/config';
import { min } from 'd3-array';
import { ToastContainer, toast } from 'react-toastify';

export default function MemberEditPoint() {
  const { id } = useParams();
  const authToken = sessionStorage.getItem('token');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customerPointData, setCustomerPointData] = useState({
    customerName: '',
    point: '',
  });

  const [pointData, setPointData] = useState([]);

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
      // if (customerDetails.profile_picture_url) {
      //   setPreview(customerDetails.profile_picture_url);
      // }
      // console.log("Customer data fetched:", customerDetails);

      setCustomerPointData({
        customerName: customerDetails.name || 'N/A',
      });

    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
  }

  const fetchCustomerPointHistory = async (dateFrom = '', dateTo = '') => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}customer-point/history/${id}?date_from=${dateFrom}&date_to=${dateTo}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const pointHistory = await response.json();
      // console.log('Point History:', pointHistory);
      const pointData = pointHistory.data;

      setPointData(pointData);

      const pointBalance = getLastBalance(pointData) ?? 0;

      setCustomerPointData(prev => ({
        ...prev,
        point: pointBalance,
      }));
    } catch (error) {
      console.error("Error fetching point history:", error);
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
      await fetchCustomerPointHistory();
    }
    fetchAll();
  }, []);

  // useEffect(() => {
  //   // Fetch point history whenever dateFrom or dateTo changes
  //   console.log("Fetching point history with dateFrom:", dateFrom, "dateTo:", dateTo);
  //   if (dateFrom || dateTo) {
  //     fetchCustomerPointHistory(dateFrom, dateTo);
  //   }
  // }, [dateFrom, dateTo]);

  const columns = [
    {
      name: 'No',
      // selector: row => row.no,
      // sortable: true,
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
      minWidth: '150px',
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
  };

  const handleAdjustPoint = () => {
    navigate(`/member/member_overview/member_point/adjust_point/${id}`);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      {/* Header with back button */}
      <div className="flex justify-end items-center p-4 border-b">
        <button className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 text-gray-800" onClick={handleBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Go back
        </button>
      </div>

      {/* Details section */}
      <div className="mb-6 rounded-xl bg-white">
        <div className="bg-indigo-900 text-white py-3 px-4 font-bold text-lg rounded-t-xl">
          Details
        </div>
        <div className="border rounded-b-lg p-4">
          <div className="grid grid-cols-12 py-2">
            <div className="col-span-2 font-semibold">Customer Name</div>
            <div className="col-span-1">:</div>
            <div className="col-span-9">{customerPointData.customerName}</div>
          </div>
          <div className="grid grid-cols-12 py-2">
            <div className="col-span-2 font-semibold">Point</div>
            <div className="col-span-1">:</div>
            <div className="col-span-9">{customerPointData.point}</div>
          </div>

          {/* Adjust Point button */}
          <div className="flex justify-end mt-2">
            <button className="bg-indigo-900 text-white px-4 py-2 rounded" onClick={handleAdjustPoint}>
              Adjust Point
            </button>
          </div>
        </div>
      </div>

      {/* Search Filter section */}
      <div className="mb-6 bg-white rounded-xl">
        <div className="bg-indigo-900 text-white py-3 px-4 font-bold text-lg rounded-t-xl">
          Search Filter
        </div>
        <div className="border rounded-b-lg p-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-2 flex items-center">
              <label className="font-semibold">Date From</label>
            </div>
            <div className="col-span-4">
              {/* <div className="relative">
                <select className="block appearance-none w-full bg-gray-100 border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500">
                  <option>Choose</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div> */}
              <input
                type="date"
                name="dateFrom"
                placeholder="Enter here"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2 flex items-center">
              <label className="font-semibold">Date To</label>
            </div>
            <div className="col-span-4">
              {/* <div className="relative">
                <select className="block appearance-none w-full bg-gray-100 border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500">
                  <option>Choose</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div> */}
              <input
                type="date"
                name="dateTo"
                placeholder="Enter here"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Search button */}
          <div className="flex justify-end mt-4">
            <button className="bg-indigo-900 text-white px-6 py-2 rounded" onClick={() => fetchCustomerPointHistory(dateFrom, dateTo)}>
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Listing section */}
      <div className="mb-6">
        <div className="text-xl font-bold mb-4">Listing</div>
        <div className="shadow rounded-lg overflow-hidden">
          <DataTable
            columns={columns}
            data={pointData}
            customStyles={customStyles}
            noDataComponent={<NoDataComponent />}
            pagination
            responsive
          />
        </div>
      </div>
    </div>
  );
}