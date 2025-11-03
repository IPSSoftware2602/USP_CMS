import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import UserService from '../../../store/api/userService';
import OutletApiService from '../../../store/api/outletService';
import { toast } from 'react-toastify';

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingOutlets, setLoadingOutlets] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
    userRoles: '',
    activeStatus: '',
    outlet: ''
  });

  const defaultMenuPermissions = {
    'Outlet Dashboard': { read: false, create: false, update: false, delete: false },
    Orders: {
      read: false,
      subItems: {
        Lists: { read: false, create: false, update: false, delete: false },
        Pending: { read: false, create: false, update: false, delete: false },
        Confirmed: { read: false, create: false, update: false, delete: false }
      }
    },
    Topup: {
      read: false,
      subItems: {
        Lists: { read: false, create: false, update: false, delete: false },
        Settings: { read: false, create: false, update: false, delete: false }
      }
    },
    Outlets: {
      read: false,
      subItems: {
        Lists: { read: false, create: false, update: false, delete: false },
        'Outlets Menu': { read: false, create: false, update: false, delete: false }
      }
    },
    Menu: {
      read: false,
      subItems: {
        Item: { read: false, create: false, update: false, delete: false },
        Category: { read: false, create: false, update: false, delete: false }
      }
    },
    Voucher: {
      read: false,
      subItems: {
        List: { read: false, create: false, update: false, delete: false },
        'Send Voucher': { read: false, create: false, update: false, delete: false },
        Schedule: { read: false, create: false, update: false, delete: false }
      }
    },
    Promo: {
      read: false,
      subItems: {
        'Promo Lists': { read: false, create: false, update: false, delete: false },
        PWP: { read: false, create: false, update: false, delete: false },
        'Discount List': { read: false, create: false, update: false, delete: false }
      }
    },
    Member: { read: false, create: false, update: false, delete: false },
    'Student Card': { read: false, create: false, update: false, delete: false },
    Settings: {
      read: false,
      subItems: {
        User: { read: false, create: false, update: false, delete: false },
        Tax: { read: false, create: false, update: false, delete: false },
        'Membership Tier': { read: false, create: false, update: false, delete: false },
        'Customer Types': { read: false, create: false, update: false, delete: false },
        Delivery: { read: false, create: false, update: false, delete: false },
        'App Settings': { read: false, create: false, update: false, delete: false }
      }
    }
  };

  const [menuPermissions, setMenuPermissions] = useState(defaultMenuPermissions);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        const role = parsedUser.user.role;
        const userId = parsedUser.user.user_id; // Get the current user ID
        
        setCurrentUserRole(role);
        setCurrentUserId(userId); // Set the current user ID
      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);
      }
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const userData = await UserService.getUser(id);
        setUser(userData);
        
        setFormData({
          username: userData.data.username || '',
          name: userData.data.name || '',
          password: '',
          confirmPassword: '',
          userRoles: userData.data.role || '',
          activeStatus: userData.data.status || '',
          outlet: userData.data.outlet_id || ''
        });
        
        if (userData.data.user_permissions) {
          try {
            const parsedPermissions = JSON.parse(userData.data.user_permissions);
            const mergedPermissions = {
              ...defaultMenuPermissions,
              ...parsedPermissions
            };
            console.log('Parsed user permissions:', mergedPermissions);
            setMenuPermissions(mergedPermissions);
          } catch (e) {
            console.error('Error parsing user permissions:', e);
            setMenuPermissions(defaultMenuPermissions);
          }
        } else {
          setMenuPermissions(defaultMenuPermissions);
        }
        
        // Fetch outlets using current user's ID from localStorage
        setLoadingOutlets(true);
        const outletsResponse = await OutletApiService.getOutlets(currentUserId); // Use currentUserId instead of id
        const outletsData = Array.isArray(outletsResponse) 
          ? outletsResponse 
          : Array.isArray(outletsResponse.result) 
            ? outletsResponse.result 
            : Array.isArray(outletsResponse.data) 
              ? outletsResponse.data 
              : [];
        setOutlets(outletsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load user data');
      } finally {
        setLoading(false);
        setLoadingOutlets(false);
      }
    };

    fetchData();
  }, [id, currentUserId]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password: password, confirmPassword: password });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
      return;
    }

    if (!formData.username.trim()) {
       toast.error('Username is required!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error('Name is required!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
      return;
    }
    
    if (!formData.userRoles) {
      toast.error('User role is required!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
      return;
    }
    
    if (!formData.activeStatus) {
      toast.error('Active status is required!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
      return;
    }

    if (formData.userRoles === 'outlet' && !formData.outlet) {
      toast.error('Outlet selection is required for Outlet role', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
      return;
    }
    
    try {
      setLoading(true);

      const updateData = {
        username: formData.username,
        name: formData.name,
        userRoles: formData.userRoles,
        activeStatus: formData.activeStatus,
        outlet: formData.userRoles === 'outlet' ? formData.outlet : null,
        menuPermissions: menuPermissions 
      };
      
      if (formData.password && formData.password.trim()) {
        updateData.password = formData.password;
      }
      
      await UserService.updateUser(id, updateData);
      toast.success("User updated successfully!", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        onClose: () => {
          navigate("/settings/user");
        },
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(`Error updating user: ${error.message}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } finally {
      setLoading(false);
    }
  };

    const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
        ...prev,
        [name]: value
    }));
    
    if (name === 'userRoles' && value !== 'outlet') {
        setFormData(prev => ({ ...prev, outlet: '' }));
    }
    };

  if (!user) {
    return (
      <div className="flex justify-center items-center p-12">
        <span className="text-gray-600">User not found</span>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit User</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
              <select
                name="userRoles"
                value={formData.userRoles}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="moderator">Moderator</option>
                <option value="account">Account</option>
                <option value="outlet">Outlet</option>
              </select>
            </div>
            
            {formData.userRoles === 'outlet' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outlet <span className="text-red-500">*</span>
                </label>
                {loadingOutlets ? (
                  <div className="flex items-center justify-center py-2 border border-gray-300 rounded-md">
                    <span className="animate-spin mr-2">🌀</span>
                    Loading outlets...
                  </div>
                ) : (
                  <select
                    name="outlet"
                    value={formData.outlet}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select outlet</option>
                    {outlets.map(outlet => (
                      <option key={outlet.id} value={outlet.id}>
                        {outlet.title || outlet.name || `Outlet ${outlet.id}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Active Status</label>
              <select
                name="activeStatus"
                value={formData.activeStatus}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">New Password (optional)</label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Generate Random
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                  placeholder="Leave blank to keep current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            {formData.password && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {currentUserRole === 'admin' && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Menu Permissions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead>
                  <tr>
                    <th className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Menu</th>
                    <th className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Read</th>
                    <th className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Create</th>
                    <th className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Update</th>
                    <th className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Delete</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(menuPermissions).map(([parent, value]) => {
                    if (value.subItems) {
                      return (
                        <React.Fragment key={parent}>
                          {/* Parent row with single checkbox for itself only */}
                          <tr>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {parent}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={value.read || false}
                                onChange={() => {
                                  setMenuPermissions(prev => ({
                                    ...prev,
                                    [parent]: {
                                      ...prev[parent],
                                      read: !prev[parent].read,
                                      // Don't modify subItems here
                                    }
                                  }));
                                }}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                            </td>
                          </tr>
                          
                          {Object.entries(value.subItems).map(([subItem, permissions]) => (
                            <tr key={`${parent}-${subItem}`}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 pl-8">
                                - {subItem}
                              </td>
                              {['read', 'create', 'update', 'delete'].map((permission) => (
                                <td key={`${parent}-${subItem}-${permission}`} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                                  <input
                                    type="checkbox"
                                    checked={permissions[permission]}
                                    onChange={() => {
                                      setMenuPermissions(prev => {
                                        const newState = { ...prev };
                                        newState[parent] = {
                                          ...newState[parent],
                                          subItems: {
                                            ...newState[parent].subItems,
                                            [subItem]: {
                                              ...newState[parent].subItems[subItem],
                                              [permission]: !newState[parent].subItems[subItem][permission]
                                            }
                                          }
                                        };
                                        return newState;
                                      });
                                    }}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    } else {
                      // No subItems: show four checkboxes at parent row
                      return (
                        <tr key={parent}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {parent}
                          </td>
                          {['read', 'create', 'update', 'delete'].map((permission) => (
                            <td key={`${parent}-${permission}`} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                              <input
                                type="checkbox"
                                checked={value[permission]}
                                onChange={() => {
                                  setMenuPermissions(prev => ({
                                    ...prev,
                                    [parent]: {
                                      ...prev[parent],
                                      [permission]: !prev[parent][permission]
                                    }
                                  }));
                                }}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => navigate('/settings/user')}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEdit;