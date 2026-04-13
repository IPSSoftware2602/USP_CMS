import React, { useState, useEffect, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Plus, Download, Edit, Trash2, Eye, EyeOff, RefreshCw, ChevronDown, LogIn, Search, X } from 'lucide-react';
import DeleteConfirmationModal from '@/components/ui/DeletePopUp';
import { useNavigate } from 'react-router-dom';
import UserService from '../../../store/api/userService';
import OutletApiService from '../../../store/api/outletService';
import useExportPermission from '@/hooks/useExportPermission';
import AdminImpersonationService from '@/store/api/adminImpersonationService';
import { applyImpersonatedCmsSession } from '@/utils/impersonation';

const UserDataTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
    userRoles: '',
    activeStatus: '',
    outlet: ''
  });

  const [userPermissions, setUserPermissions] = useState({});
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const hasExportPermission = useExportPermission();
  const [currentUserId, setCurrentUserId] = useState(null);
  const canImpersonate = currentUserId === 1;

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    role: 'All',
    status: 'All',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Static role/status options (matches backend stored values)
  const roleOptions = ['All', 'Admin', 'Editor', 'Moderator', 'Outlet', 'Account'];
  const statusOptions = ['All', 'Active', 'Inactive'];

  const handleResetFilters = () => {
    const reset = { search: '', role: 'All', status: 'All' };
    setFilters(reset);
    fetchUsers(reset);
  };

  const handleApplyFilters = () => {
    fetchUsers(filters);
  };

  const fetchUserPermissions = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;

      const userObj = JSON.parse(userStr);
      const userId = userObj?.user.user_id;
      if (!userId) return;

      setCurrentUserId(userId);

      const userDataRes = await UserService.getUser(userId);
      const userData = userDataRes?.data || userDataRes;
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

          if (permissions.Settings &&
            permissions.Settings.subItems &&
            permissions.Settings.subItems.User) {
            if (permissions.Settings.subItems.User.create === true) {
              setHasCreatePermission(true);
            }
            if (permissions.Settings.subItems.User.update === true) {
              setHasUpdatePermission(true);
            }
            if (permissions.Settings.subItems.User.delete === true) {
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

  const navigate = useNavigate();

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchUsers();
    }
  }, [currentUserId, isAdmin]);

  const fetchUsers = async (appliedFilters = filters) => {
    try {
      setLoading(true);
      setError(null);

      // Always fetch all users for both admin and non-admin
      const allUsers = await UserService.getAllUsers(currentUserId, appliedFilters);

      // Transform the data to match expected property names
      const transformedUsers = allUsers.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.userRoles || user.role,  // Handle both userRoles and role
        status: user.activeStatus || user.status,  // Handle both activeStatus and status
        created_at: user.createTime || user.created_at  // Handle both createTime and created_at
      }));

      setUsers(transformedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (user) => {
    // Prevent admin from deleting themselves
    if (user.id === currentUserId) {
      alert('You cannot delete your own account!');
      return;
    }

    setItemToDelete({ ...user, name: user.username });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      try {
        setLoading(true);
        await UserService.deleteUser(itemToDelete.id);

        // Refresh the user list after deletion
        await fetchUsers();

        setShowDeleteModal(false);
        setItemToDelete(null);

        alert('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(`Error deleting user: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddUser = () => {
    navigate('/settings/user/add_new_user');
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Username', 'Name', 'User Roles', 'Active Status', 'Create Time'],
      ...users.map(user => [user.username, user.name, user.role, user.status, user.created_at])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isAdmin ? 'all_users.csv' : 'user_profile.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const handleImpersonateUser = async (user) => {
    try {
      const result = await AdminImpersonationService.impersonateUser(user.id);
      applyImpersonatedCmsSession(result);
      window.location.assign('/dashboard');
    } catch (error) {
      alert(error.message || 'Failed to login as selected user.');
    }
  };

  const columns = [
    {
      name: 'Actions',
      width: '190px',
      cell: row => (
        <div className="flex space-x-1">
          {canImpersonate && (
            <button
              onClick={() => handleImpersonateUser(row)}
              className="p-1.5 hover:bg-emerald-50 rounded transition-colors"
              title="Login As User"
              disabled={loading}
            >
              <LogIn size={14} />
            </button>
          )}
          {(isAdmin || hasUpdatePermission) && (
            <button
              onClick={() => navigate(`/settings/user/user-edit/${row.id}`)}
              className="p-1.5 hover:bg-blue-50 rounded transition-colors"
              title="Edit User"
              disabled={loading}
            >
              <Edit size={14} />
            </button>
          )}
          {(isAdmin || hasDeletePermission) && row.id !== currentUserId && (
            <button
              onClick={() => handleDelete(row)}
              className="p-1.5 hover:bg-red-50 rounded transition-colors"
              title="Delete User"
              disabled={loading}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true
    },
    {
      name: 'Username',
      selector: row => row.username,
      sortable: true,
      width: '210px',
    },
    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
      width: '210px',
    },
    {
      name: 'User Roles',
      selector: row => row.role || row.userRoles || '', // Handle both property names
      sortable: true,
      width: '230px',
      cell: row => {
        // Get the role value from either property and convert to lowercase for consistent comparison
        const roleValue = (row.role || row.userRoles || '').toString().toLowerCase();

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleValue === 'admin' ? 'bg-red-100 text-red-800' :
              roleValue === 'editor' ? 'bg-blue-100 text-blue-800' :
                roleValue === 'moderator' ? 'bg-purple-100 text-purple-800' :
                  roleValue === 'outlet' ? 'bg-green-100 text-green-800' :
                    roleValue === 'account' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
            }`}>
            {/* Display the original value, not the lowercase version */}
            {row.role || row.userRoles || 'N/A'}
          </span>
        )
      }
    },
    {
      name: 'Active Status',
      selector: row => row.status || row.activeStatus || '', // Handle both property names
      sortable: true,
      width: '230px',
      cell: row => {
        // Get the status value from either property and convert to lowercase for consistent comparison
        const statusValue = (row.status || row.activeStatus || '').toString().toLowerCase();

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusValue === 'active' ? 'bg-green-100 text-green-800' :
              statusValue === 'inactive' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
            }`}>
            {/* Display the original value, not the lowercase version */}
            {row.status || row.activeStatus || 'N/A'}
          </span>
        )
      }
    },
    {
      name: 'Create Time',
      selector: row => row.created_at || row.createTime,
      sortable: true,
      width: '210px',
      cell: row => (
        <div className="text-gray-700 text-sm">
          <div className="font-medium">{row.created_at?.split(' ')[0] || '-'}</div>
          <div className="text-xs text-gray-500">{row.created_at?.split(' ')[1] || ''}</div>
        </div>
      )
    },
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

  if (loading) {
    return (
      <div className="pt-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">
              {isAdmin ? 'Loading all users...' : 'Loading user profile...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center p-12">
            <div className="text-red-600 mb-4">Error: {error}</div>
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw size={16} className="mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isAdmin ? 'User Management' : 'User Profile'}
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(v => !v)}
              className="flex items-center px-4 py-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              title="Toggle filters"
            >
              <Search size={16} className="mr-2" />
              Filter
            </button>
            {hasExportPermission && (
              <button
                onClick={handleExportCSV}
                className="flex items-center px-4 py-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                title="Export Report"
                disabled={loading || users.length === 0}
              >
                <Download size={16} className="mr-2" />
                Export Report
              </button>
            )}
            {(isAdmin || hasCreatePermission) && (
              <button
                onClick={handleAddUser}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                disabled={loading}
              >
                <Plus size={16} className="mr-2" />
                Add User
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">Search</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by username or name..."
                    value={filters.search}
                    onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') handleApplyFilters(); }}
                    className="w-full h-10 pl-9 pr-9 rounded-md border border-gray-300 bg-white text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  {filters.search && (
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">Role</label>
                <select
                  value={filters.role}
                  onChange={e => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {roleOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {statusOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end space-x-2">
              <button
                onClick={handleResetFilters}
                className="px-3 h-9 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-4 h-9 text-sm border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={users}
          pagination={users.length > 10}
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          striped
          highlightOnHover
          responsive
          customStyles={customStyles}
          noDataComponent={
            <div className="flex flex-col items-center justify-center p-12">
              <div className="text-gray-500 mb-2">No user data found</div>
              <button
                onClick={handleRefresh}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </button>
            </div>
          }
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        itemName={itemToDelete?.name || ''}
        itemType="user"
      />
    </div>
  );
};

export default UserDataTable;
