import React, { useEffect, useState } from 'react';
import { Plus, Download, Edit, Trash2, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import DeleteConfirmationModal from '../../../components/ui/DeletePopUp';
import topupService from '../../../store/api/topupsettingService';
import UserService from '../../../store/api/userService';
import customStyles from '@/utils/dataTableStyles';
import useWidth from '@/hooks/useWidth';

const TopupSettings = () => {
  const navigate = useNavigate();

  const [topupSettings, setTopupSettings] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUserPermissions = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;

      const userObj = JSON.parse(userStr);
      const userId = userObj?.user.user_id;
      if (!userId) return;

      const userDataRes = await UserService.getUser(userId);
      const userData = userDataRes?.data;
      if (!userData) return;

      // Check if user is admin
      if (userData.role && userData.role.toLowerCase() === 'admin') {
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

          // Check Topup module permissions
          if (permissions.Topup) {
            if (permissions.Topup.create === true) {
              setHasCreatePermission(true);
            }
            if (permissions.Topup.update === true) {
              setHasUpdatePermission(true);
            }
            if (permissions.Topup.delete === true) {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchUserPermissions();
        const data = await topupService.fetchTopupSettings();

        const formattedData = data.map(item => ({
          id: item.id,
          amount: item.topup_amount || item.amount || 0,
          extraCredit: item.credit_amount || item.extraCredit || 0,
          status: (item.status || '').toLowerCase() === 'active' ? 'Active' : 'Inactive',
          createdDate: item.created_at
            ? new Date(item.created_at).toLocaleDateString()
            : '-'
        }));

        setTopupSettings(formattedData);
      } catch (error) {
        console.error("Error loading topup settings:", error);
      }
    };

    fetchData();
  }, []);

  const handleExportCSV = () => {
    if (!topupSettings.length) {
      alert("No data to export");
      return;
    }

    const headers = ["Amount", "Extra Credit", "Status", "Created Date"];

    const rows = topupSettings.map(row => [
      row.amount,
      row.extraCredit,
      row.status,
      row.createdDate
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(v => `"${v ?? ''}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `topup_settings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateClick = (id) => {
    navigate(`/topup/topup_settings/edit_topup/${id}`);
  };

  const handleConfirmDelete = async () => {
    try {
      await topupService.deleteTopupSetting(itemToDelete);
      setTopupSettings(prev => prev.filter(item => item.id !== itemToDelete));
    } catch (error) {
      console.error('Error deleting topup setting:', error);
    }
  };

  const handleCloseModal = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleAddNewTopup = () => {
    navigate('/topup/topup_settings/add_new_topup');
  };

  const columns = [
    {
      name: 'Action',
      cell: row => (
        <div className="flex gap-2">
          {(isAdmin || hasUpdatePermission) && (
            <button className="hover:text-blue-600 p-1"
            onClick={() => handleUpdateClick(row.id)}
            >
              <Edit size={16} />
            </button>
          )}
          {(isAdmin || hasDeletePermission) && (
            <button
              onClick={() => handleDeleteClick(row.id)}
              className="hover:text-red-600 p-1"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
    {
      name: 'Amount',
      selector: row => row.amount,
      // sortable: true,
      cell: row => <span className="font-medium text-gray-900">{row.amount}</span>
    },
    {
      name: 'Extra Credit',
      selector: row => row.extraCredit,
      // sortable: true,
      cell: row => <span className="text-gray-900">{row.extraCredit}</span>
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      cell: row => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${row.status === 'Active'
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
          }`}>
          {row.status}
        </span>
      )
    },
    {
      name: 'Created Date',
      selector: row => row.createdDate,
      sortable: true,
      cell: row => <span className="text-gray-600">{row.createdDate}</span>
    },
  ];

  // const customStyles = {
  //   header: {
  //     style: {
  //       backgroundColor: '#1A237E',
  //       color: 'white',
  //       fontSize: '14px',
  //       fontWeight: '600',
  //       minHeight: '56px',
  //     },
  //   },
  //   headRow: {
  //     style: {
  //       backgroundColor: '#1A237E',
  //       color: 'white',
  //       fontSize: '14px',
  //       fontWeight: '600',
  //       minHeight: '56px',
  //     },
  //   },
  //   headCells: {
  //     style: {
  //       backgroundColor: '#1A237E',
  //       color: 'white',
  //       fontSize: '14px',
  //       fontWeight: '600',
  //       paddingLeft: '24px',
  //       paddingRight: '24px',
  //     },
  //   },
  //   cells: {
  //     style: {
  //       paddingLeft: '24px',
  //       paddingRight: '24px',
  //       paddingTop: '16px',
  //       paddingBottom: '16px',
  //     },
  //   },
  //   rows: {
  //     style: {
  //       '&:nth-of-type(even)': {
  //         backgroundColor: '#F9FAFB',
  //       },
  //       '&:nth-of-type(odd)': {
  //         backgroundColor: '#FFFFFF',
  //       },
  //     },
  //   },
  // };

  return (
    <div>
      <div className='rounded-t-lg'>
        <div className="mx-auto px-2 pb-6 sm:px-3lg:px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-500">Top Up</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto p-6 bg-white rounded-lg">
        <div className="mb-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-800">Topup Settings</h1>
            </div>
            <div className="flex items-center gap-4">
              {(isAdmin || hasCreatePermission) && (
                <button
                  onClick={handleAddNewTopup}
                  className="bg-indigo-900 hover:bg-indigo-800 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                  <Plus size={20} />
                  Add New Topup
                </button>
              )}
              <button onClick={handleExportCSV} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors">
                <Download size={20} />
                Export Report
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
          <DataTable
            columns={columns}
            data={topupSettings}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50]}
            customStyles={customStyles}
            sortIcon={<ChevronDown size={16} />}
            highlightOnHover
            pointerOnHover
            responsive
            striped
          />
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default TopupSettings;