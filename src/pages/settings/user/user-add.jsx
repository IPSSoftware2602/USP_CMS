import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, RefreshCw, Save, X, User, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserService from '../../../store/api/userService';
import OutletApiService from '../../../store/api/outletService';
import { toast } from 'react-toastify';

const AddNewUser = () => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    userRoles: '',
    activeStatus: 'Active',
    password: '',
    confirmPassword: '',
    outlet: '' // New field for outlet selection
  });

  const [outlets, setOutlets] = useState([]); // State for outlets
  const [loadingOutlets, setLoadingOutlets] = useState(true); // Loading state for outlets
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();

  const [menuPermissions, setMenuPermissions] = useState({
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
});

useEffect(() => {
    // Get user ID from localStorage on component mount
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        const userId = userObj?.user?.user_id;
        if (userId) {
          setCurrentUserId(userId);
        }
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
      }
    }
  }, []);

  // Fetch outlets on component mount
  useEffect(() => {
    const fetchOutlets = async () => {
      if (!currentUserId) return; // Don't fetch if no user ID
      
      try {
        setLoadingOutlets(true);
        // Pass the user ID to your outlet service
        const outletsResponse = await OutletApiService.getOutlets(currentUserId);
        
        // Handle different response structures
        const outletsData = Array.isArray(outletsResponse) 
          ? outletsResponse 
          : Array.isArray(outletsResponse.result) 
            ? outletsResponse.result 
            : Array.isArray(outletsResponse.data) 
              ? outletsResponse.data 
              : [];
              
        setOutlets(outletsData);
      } catch (err) {
        console.error('Error fetching outlets:', err);
        toast.error('Failed to load outlets');
      } finally {
        setLoadingOutlets(false);
      }
    };

    fetchOutlets();
  }, [currentUserId]); 

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.userRoles) newErrors.userRoles = 'User role is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';

    // Add validation for outlet if role is Outlet
    if (formData.userRoles === 'Outlet' && !formData.outlet) {
      newErrors.outlet = 'Outlet selection is required';
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.username && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password: password, confirmPassword: password });
    setErrors({ ...errors, password: '', confirmPassword: '' });
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
    
    // Clear outlet selection if role changes from Outlet to something else
    if (field === 'userRoles' && value !== 'Outlet') {
      setFormData(prev => ({ ...prev, outlet: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare user data
      const userData = {
        ...formData,
        // Only include outlet if role is Outlet
        outlet: formData.userRoles === 'Outlet' ? formData.outlet : undefined,
        menuPermissions
      };
      
      // Call the API to create user
      const response = await UserService.createUser(userData);
      
      console.log('User created successfully:', response);
      
      // Show success message
      toast.success('User created successfully!');
      
      // Navigate back to user list
      navigate('/settings/user');
      
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(`Error creating user: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      navigate(-1);
    }
  };

  const handleBack = () => {
    navigate(-1);
  }

  return (
    <div className='rounded-lg shadow-lg bg-white max-w-3xl mx-auto mt-10'>
      <div className="mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="p-3 pb-2 pt-5 flex justify-between items-center">
            <h2 className="text-xl font-medium text-gray-800">Add new user</h2>
            <button className="text-gray-400 hover:text-gray-600" onClick={handleBack}> 
            <X size={24} />
            </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-sm pt-5">
            <div className="bg-indigo-900 text-white text-center py-2 text-sm font-medium mb-4">
                Account Information
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter username"
                />
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Role <span className="text-red-500">*</span>
                </label>
                <select
                    value={formData.userRoles}
                    onChange={(e) => handleInputChange('userRoles', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.userRoles ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                    <option value="">Select user role</option>
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Moderator">Moderator</option>
                    <option value="Viewer">Viewer</option>
                    <option value="Account">Account</option>
                    <option value="Outlet">Outlet</option>
                </select>
                {errors.userRoles && <p className="mt-1 text-sm text-red-600">{errors.userRoles}</p>}
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Active Status
                </label>
                <select
                    value={formData.activeStatus}
                    onChange={(e) => handleInputChange('activeStatus', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                </select>
                </div>

                {/* Conditional outlet dropdown */}
                {formData.userRoles === 'Outlet' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Outlet <span className="text-red-500">*</span>
                    </label>
                    {loadingOutlets ? (
                      <div className="flex items-center justify-center py-3 border border-gray-300 rounded-lg">
                        <span className="animate-spin mr-2">🌀</span>
                        Loading outlets...
                      </div>
                    ) : (
                      <select
                        value={formData.outlet}
                        onChange={(e) => handleInputChange('outlet', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                          errors.outlet ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={loadingOutlets}
                      >
                        <option value="">Select outlet</option>
                        {outlets.map(outlet => (
                          <option key={outlet.id} value={outlet.id}>
                            {outlet.title || outlet.name || `Outlet ${outlet.id}`}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.outlet && <p className="mt-1 text-sm text-red-600">{errors.outlet}</p>}
                  </div>
                )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm pt-8">
              <div className="bg-white rounded-lg shadow-sm ">
                  <div className="bg-indigo-900 text-white text-center py-2 text-sm font-medium mb-4">
                  Password Setup
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                      <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full px-4 py-3 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter password"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                      <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                          title={showPassword ? "Hide password" : "Show password"}
                      >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                          type="button"
                          onClick={generateRandomPassword}
                          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Generate random password"
                      >
                          <RefreshCw size={16} />
                      </button>
                      </div>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                  <p className="mt-1 text-sm text-gray-500">Password must be at least 8 characters long</p>
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                      <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                          errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Confirm password"
                      />
                      <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                  </div>
              </div>
          </div>
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
                          
                          {/* Child rows with their own checkboxes */}
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

          {/* Action Buttons */}
          <div className="flex bg-white p-6 justify-end space-x-4 pt-6">
          <button
              type="button"
              onClick={handleCancel}
              className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
              <X size={20} className="mr-2" />
              Cancel
          </button>
          <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
              <Save size={20} className="mr-2" />
              {isSubmitting ? 'Creating User...' : 'Create User'}
          </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewUser;