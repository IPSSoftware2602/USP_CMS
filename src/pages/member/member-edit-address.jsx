import { useState, useEffect } from 'react';
import { Pencil, Trash2, ChevronLeft } from 'lucide-react';
import DataTable from 'react-data-table-component';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import DeleteConfirmationModal from '../../components/ui/DeletePopUp';
import { VITE_API_BASE_URL } from '../../constant/config';
import { use } from 'react';
import { ToastContainer, toast } from 'react-toastify';

export default function MemberEditAddress() {
  const { id } = useParams();
  const authToken = sessionStorage.getItem('token');
  const [customerAddressData, setCustomerAddressData] = useState([]);

  const fetchCustomerAddressData = async () => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}customer-addresses/by-customer/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const customerAddressData = await response.json()
      const customerAddressDetails = customerAddressData.data;

      setCustomerAddressData(customerAddressDetails);

    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
  }

  useEffect(() => {
    fetchCustomerAddressData();
  }, []);


  const [addresses, setAddresses] = useState([
    {
      id: 1,
      name: "Nur Mirleana Binti Abdul Hakim",
      phone: "+60122455587",
      address: "15 Apartment, 9A Jalan Van Praagh, Taman Continental, 11600 Jelutong, Penang",
      createdDate: "19 / JUL / 2023 10:41 AM",
      status: "Active"
    },
    {
      id: 2,
      name: "Nur Mirleana Binti Abdul Hakim",
      phone: "+60122455587",
      address: "15 Apartment, 9A Jalan Van Praagh, Taman Continental, 11600 Jelutong, Penang",
      createdDate: "19 / JUL / 2023 10:41 AM",
      status: "Active"
    },
    {
      id: 3,
      name: "Nur Mirleana Binti Abdul Hakim",
      phone: "+60122455587",
      address: "15 Apartment, 9A Jalan Van Praagh, Taman Continental, 11600 Jelutong, Penang",
      createdDate: "19 / JUL / 2023 10:41 AM",
      status: "Active"
    },
    {
      id: 4,
      name: "Nur Mirleana Binti Abdul Hakim",
      phone: "+60122455587",
      address: "15 Apartment, 9A Jalan Van Praagh, Taman Continental, 11600 Jelutong, Penang",
      createdDate: "19 / JUL / 2023 10:41 AM",
      status: "Active"
    },
    {
      id: 5,
      name: "Nur Mirleana Binti Abdul Hakim",
      phone: "+60122455587",
      address: "15 Apartment, 9A Jalan Van Praagh, Taman Continental, 11600 Jelutong, Penang",
      createdDate: "19 / JUL / 2023 10:41 AM",
      status: "Active"
    },
    {
      id: 6,
      name: "Nur Mirleana Binti Abdul Hakim",
      phone: "+60122455587",
      address: "15 Apartment, 9A Jalan Van Praagh, Taman Continental, 11600 Jelutong, Penang",
      createdDate: "19 / JUL / 2023 10:41 AM",
      status: "Active"
    }
  ]);

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };

  const handleAdd = () => {
    navigate(`/member/member_overview/member_address/add_member_address/${id}`);
  };

  const location = useLocation();
  const { row } = location.state || {};
  const handleEdit = (addressId) => {
    navigate(`/member/member_overview/member_address/edit_member_address/${addressId}`);
  };

  const handleDelete = (addressId) => {
    setSelectedAddressId(addressId);
    setShowDeleteModal(true);
  };

  const deleteItem = async (addressId) => {
    try {
      const response = await fetch(VITE_API_BASE_URL + "customer-addresses/delete/" + addressId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        // body: JSON.stringify(formData)
        // body: formData1
      });

      // console.log('Response status:', response.status);
      let data = response;

      if (!response.ok) {
        console.error("Error deleteing addres:", data);
        throw new Error('This address cant be found in the database');
      }

      setTimeout(() => window.location.reload(), 3500);

    } catch (err) {
      console.error("Error deleteing address:", err);
      toast.error(err.message || "Unexpected error");
    }
  };

  const columns = [
    {
      name: 'Name',
      selector: row => row.name,
      // sortable: true,
    },
    {
      name: 'Phone Number',
      selector: row => row.phone,
      // sortable: true,
    },
    {
      name: 'Address',
      selector: row => row.address,
      // sortable: true,
      wrap: true,
      grow: 2,
    },
    {
      name: 'Created Date',
      selector: row => row.created_at,
      sortable: true,
    },
    {
      name: 'Status',
      // selector: row => row.status,
      // sortable: true,
      cell: row => (
        <div className="bg-green-100 text-green-800 px-4 py-1 rounded-full">
          Active
        </div>
      ),
    },
    {
      name: 'Action',
      cell: row => (
        <div className="flex space-x-3">
          <button
            onClick={() => handleEdit(row.id)}
            className="p-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 border border-gray-300 rounded-md text-red-500 hover:bg-gray-100"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
      button: true,
    },
  ];

  // const customStyles = {
  //   headRow: {
  //     style: {
  //       backgroundColor: '#262259',
  //       color: 'white',
  //       borderRadius: '0',
  //       minHeight: '52px',
  //     },
  //   },
  //   headCells: {
  //     style: {
  //       paddingLeft: '16px',
  //       paddingRight: '16px',
  //       fontWeight: '500',
  //     },
  //   },
  //   rows: {
  //     style: {
  //       minHeight: '64px',
  //       '&:hover': {
  //         backgroundColor: '#f9fafb',
  //       },
  //     },
  //   },
  //   cells: {
  //     style: {
  //       paddingLeft: '16px',
  //       paddingRight: '16px',
  //     },
  //   },
  //   pagination: {
  //     style: {
  //       borderTop: 'none',
  //       marginTop: '16px',
  //     },
  //     pageButtonsStyle: {
  //       border: '1px solid #e5e7eb',
  //       borderRadius: '6px',
  //       height: '32px',
  //       width: '32px',
  //       padding: '4px',
  //       margin: '5px',
  //     },
  //   },
  // };

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

  return (
    <div className="bg-gray-100">
      <div className="mx-auto">
        <div className="flex justify-end items-center p-4 border-b">
          <button className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 text-gray-800" onClick={handleBack}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Go back
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-medium">Address List</h1>
            <button className="bg-indigo-900 text-white px-4 py-2 rounded-md flex items-center" onClick={handleAdd}>
              <span className="mr-1">+</span> Add New Address
            </button>
          </div>

          <DataTable
            columns={columns}
            data={customerAddressData}
            customStyles={customStyles}
            pagination
            paginationPerPage={6}
            paginationRowsPerPageOptions={[6, 12, 20]}
            paginationComponentOptions={{
              rowsPerPageText: 'Rows per page:',
              rangeSeparatorText: 'of',
            }}
            noDataComponent="No addresses found"
          />
        </div>
      </div>
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          deleteItem(selectedAddressId);
          setShowDeleteModal(false);
        }}
      />
    </div>
  );
}