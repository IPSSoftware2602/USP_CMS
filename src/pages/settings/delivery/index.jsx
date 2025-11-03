import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { Edit, Trash2, Plus, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VITE_API_BASE_URL } from "../../../constant/config";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeleteConfirmationModal from '../../../components/ui/DeletePopUp';

const DeliverySettings = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const handleEdit = (row) => {
    navigate('/settings/edit_delivery_zone/' + row.id);
  };
``
  const handleDeleteClick = (row) => {
    setSelectedRow(row);
    setShowDeleteModal(true);
  };

  const handleDelete = async (row) => {
    const token = sessionStorage.getItem("token");
    try {
      const response = await fetch(
        `${VITE_API_BASE_URL}delivery-settings/delete/${row.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      if (response.ok) {
        console.log(result.message || "Delivery setting deleted!");
        setData(prev => prev.filter(item => item.id !== row.id));
      } else {
        toast.error(result.message || "Failed to delete delivery setting.");
      }
    } catch (err) {
      toast.error("Unexpected error: " + err.message);
      console.error("Delete error:", err);
    }
    setShowDeleteModal(false);
    setSelectedRow(null);
  };

  const handleAddNew = () => {
    navigate('/settings/add_new_delivery_zone');
  };

  useEffect(() => {
    const fetchDeliverySettings = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem("token");
        const response = await fetch(VITE_API_BASE_URL + "delivery-settings/list", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const resData = await response.json();
        if (response.ok) {
          setData(resData.data || []);
        } else {
          setData([]);
          toast.error(resData.message || "Failed to fetch delivery settings.");
        }
      } catch (err) {
        setData([]);
        toast.error("Error fetching delivery settings data.");
      }
      setLoading(false);
    };

    fetchDeliverySettings();
  }, []);
  console.log("data:", data);

  const columns = [
    {
    name: 'Action',
    cell: row => (
      <div className="flex space-x-2">
        <button
          onClick={() => handleEdit(row)}
          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteClick(row)}
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
    width: '10%'
  },
  {
    name: 'Start KM',
    selector: row => row.start_km,
    sortable: true,
    width: '15%'
  },
  {
    name: 'End KM',
    selector: row => row.end_km,
    sortable: true,
    width: '15%'
  },
  {
    name: 'Price',
    selector: row => row.price_per_km,
    sortable: true,
    width: '10%'
  },
  {
    name: 'Min Purchase Discount',
    selector: row => row.min_purchase_discount,
    sortable: true,
    width: '20%'
  },
  {
    name: 'Discount Amount',
    selector: row => row.discount_amount,
    sortable: true,
    width: '15%'
  },
  {
    name: 'Status',
    selector: row => row.status,
    sortable: true,
    width: '15%'
  }
];

  const customStyles = {
    header: {
      style: {
        backgroundColor: '#1A237E',
        color: 'white',
        fontSize: '18px',
        fontWeight: 'bold',
        minHeight: '60px',
        paddingLeft: '24px',
        paddingRight: '24px'
      }
    },
    headRow: {
      style: {
        backgroundColor: '#1A237E',
        color: 'white',
        fontSize: '14px',
        fontWeight: '600',
        minHeight: '50px',
        borderBottomWidth: '1px',
        borderBottomColor: '#e5e7eb'
      }
    },
    headCells: {
      style: {
        color: 'white',
        fontSize: '14px',
        fontWeight: '600',
        paddingLeft: '16px',
        paddingRight: '16px'
      }
    },
    rows: {
      style: {
        fontSize: '14px',
        color: '#374151',
        '&:hover': {
          backgroundColor: '#f9fafb'
        }
      },
      stripedStyle: {
        backgroundColor: '#f8fafc'
      }
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px'
      }
    },
    pagination: {
      style: {
        fontSize: '14px',
        color: '#6b7280',
        backgroundColor: 'white',
        borderTopColor: '#e5e7eb',
        borderTopWidth: '1px'
      }
    }
  };

  return (
    <div className="w-full bg-white">
      <div className="flex justify-between items-center p-6 bg-white border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Delivery Setting</h1>
        <button
          onClick={handleAddNew}
          className="flex items-center px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Delivery Setting
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          customStyles={customStyles}
          striped
          responsive
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[5, 10, 15, 20]}
          paginationComponentOptions={{
            rowsPerPageText: 'Rows per page:',
            rangeSeparatorText: 'of',
            noRowsPerPage: false,
            selectAllRowsItem: false,
            selectAllRowsItemText: 'All'
          }}
          noDataComponent={
            <div className="p-8 text-center text-gray-500">
              No delivery settings found
            </div>
          }
          sortIcon={<ChevronDown size={16} />}
        />
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => handleDelete(selectedRow)}
        />
      </div>
    </div>
    
  );
};

export default DeliverySettings;