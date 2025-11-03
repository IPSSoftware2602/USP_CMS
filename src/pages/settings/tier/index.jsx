import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Loader2, AlertCircle, Palette } from 'lucide-react';
import { ChromePicker } from 'react-color';
import membershipTierService from '../../../store/api/membershipService';
import categoryService from '../../../store/api/categoryService';

// Color Picker Component
const ColorPicker = ({ color, onChange, disabled }) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleColorChange = (colorResult) => {
    onChange(colorResult.hex);
  };

  return (
    <div className="relative">
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          disabled={disabled}
          className="w-10 h-10 rounded-md border-2 border-gray-300 shadow-sm hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: color || '#83AEE6' }}
        >
          <Palette className="w-4 h-4 mx-auto text-white opacity-70" />
        </button>
        <input
          type="text"
          value={color || '#83AEE6'}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
          placeholder="#83AEE6"
          disabled={disabled}
          maxLength={7}
        />
      </div>
      
      {showPicker && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowPicker(false)}
          />
          <div className="absolute top-12 left-0 z-20">
            <ChromePicker
              color={color || '#83AEE6'}
              onChange={handleColorChange}
              disableAlpha={true}
            />
          </div>
        </>
      )}
    </div>
  );
};

const Alert = ({ type, message, onClose }) => {
  const bgColor = type === 'error' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
  const textColor = type === 'error' ? 'text-red-800' : 'text-green-800';
  const iconColor = type === 'error' ? 'text-red-400' : 'text-green-400';

  return (
    <div className={`${bgColor} border rounded-md p-4 mb-4`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="ml-3">
          <p className={`text-sm ${textColor}`}>{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 ${textColor} hover:bg-opacity-20 hover:bg-current`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, itemType, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600">
            Are you sure you want to delete the {itemType} "{itemName}"? This action cannot be undone.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const DataTable = ({ columns, data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading membership tiers...</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-indigo-900 text-white">
          <tr>
            {columns.map((column, index) => (
              <th key={index} className="px-4 py-3 text-left text-sm font-semibold">
                {column.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                No membership tiers found
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} className="hover:bg-gray-50">
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-4 py-3 text-sm text-gray-700">
                    {column.cell ? column.cell(row) : column.selector(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const MembershipTiers = () => {
  const [tiers, setTiers] = useState([]);
  const [categories, setCategories] = useState([]); // Add categories state
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false); // Add loading for categories
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    min_points: '',
    discount_rate: '',
    color: '#83AEE6', // Default color
    category_id: '' // Add category_id
  });

  useEffect(() => {
    loadTiers();
    loadCategories(); // Load categories when component mounts
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const loadTiers = async () => {
    try {
      setLoading(true);
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
      console.error('Failed to load membership tiers:', error);
      showAlert('error', `Failed to load membership tiers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await categoryService.getCategories();
      
      // Handle different response structures
      let categoriesArray;
      if (Array.isArray(response)) {
        categoriesArray = response;
      } else if (response.data && Array.isArray(response.data)) {
        categoriesArray = response.data;
      } else {
        categoriesArray = [];
      }
      
      setCategories(categoriesArray);
    } catch (error) {
      console.error('Failed to load categories:', error);
      showAlert('error', `Failed to load categories: ${error.message}`);
    } finally {
      setLoadingCategories(false);
    }
  };

  const columns = [
    {
      name: 'Actions',
      cell: row => (
        <div className="flex gap-2">
          <button 
            className=" hover:text-blue-800 p-1"
            onClick={() => handleEdit(row)}
          >
            <Edit size={16} />
          </button>
          <button 
            className=" hover:text-red-800 p-1"
            onClick={() => handleDeleteClick(row)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
    {
      name: 'Tier Name',
      selector: row => row.name,
      cell: row => (
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: row.color }}
          ></div>
          <span className="font-medium">{row.name}</span>
        </div>
      )
    },
    {
      name: 'Min Points',
      selector: row => row.min_points,
      cell: row => (row.min_points || 0).toLocaleString()
    },
    {
      name: 'Created At',
      selector: row => row.created_at,
      cell: row => row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'
    },
  ];

  const validateForm = (data) => {
    if (!data.name?.trim()) return 'Tier name is required';
    if (data.min_points === '' || data.min_points < 0) return 'Valid minimum points required';
    // if (!data.discount_rate || data.discount_rate < 0 || data.discount_rate > 100) return 'Valid discount rate (0-100) required';
    if (!data.color || !/^#[0-9A-F]{6}$/i.test(data.color)) return 'Valid hex color code required';
    return null;
  };

  const handleAdd = async () => {
    const validationError = validateForm(formData);
    if (validationError) {
      showAlert('error', validationError);
      return;
    }

    try {
      setSubmitting(true);
      const tierData = {
        name: formData.name.trim(),
        min_points: parseInt(formData.min_points),
        discount_rate: parseFloat(formData.discount_rate),
        color: formData.color,
        category_id: parseInt(formData.category_id)
      };
      
      await membershipTierService.create(tierData);
      showAlert('success', 'Membership tier created successfully!');
      
      // Reload the tiers list
      await loadTiers();
      
      setFormData({ name: '', min_points: '', discount_rate: '', color: '#83AEE6', category_id:'' });
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to create membership tier:', error);
      showAlert('error', error.message || 'Failed to create membership tier. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ 
      name: item.name || '',
      min_points: item.min_points?.toString() || '0',
      discount_rate: item.discount_rate?.toString() || '0',
      color: item.color || '#83AEE6',
      category_id: item.category_id?.toString() || '' // Add category_id
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    const validationError = validateForm(formData);
    if (validationError) {
      showAlert('error', validationError);
      return;
    }

    if (!editingItem) return;

    try {
      setSubmitting(true);
      const updateData = {
        name: formData.name.trim(),
        min_points: parseInt(formData.min_points),
        discount_rate: parseFloat(formData.discount_rate),
        color: formData.color,
        category_id: parseInt(formData.category_id) // Add category_id
      };
      
      await membershipTierService.update(editingItem.id, updateData);
      showAlert('success', 'Membership tier updated successfully!');
      
      await loadTiers();
      
      setFormData({ name: '', min_points: '', discount_rate: '', color: '#83AEE6' , category_id:''});
      setEditingItem(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update membership tier:', error);
      showAlert('error', error.message || 'Failed to update membership tier. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setSubmitting(true);
      await membershipTierService.delete(itemToDelete.id);
      showAlert('success', 'Membership tier deleted successfully!');
      
      await loadTiers();
      
      setItemToDelete(null);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete membership tier:', error);
      showAlert('error', error.message || 'Failed to delete membership tier. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setFormData({ name: '', min_points: '', discount_rate: '', color: '#83AEE6', category_id:'' });
    setEditingItem(null);
    setShowAddModal(false);
    setShowEditModal(false);
  };

  return (
    <div className="p-6 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-gray-900">Membership Tiers</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-900 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Add Tier
          </button>
        </div>
        
        <div className="p-6">
          {alert && (
            <Alert 
              type={alert.type} 
              message={alert.message} 
              onClose={() => setAlert(null)} 
            />
          )}
          
          <DataTable
            columns={columns}
            data={tiers}
            isLoading={loading}
          />
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Membership Tier</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={submitting}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tier Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter tier name"
                  disabled={submitting}
                />
              </div>

               {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                {loadingCategories ? (
                  <div className="flex items-center justify-center py-2 border border-gray-300 rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading categories...
                  </div>
                ) : (
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={submitting}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                )}
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tier Color *
                </label>
                <ColorPicker
                  color={formData.color}
                  onChange={(color) => setFormData({...formData, color})}
                  disabled={submitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Points *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.min_points}
                  onChange={(e) => setFormData({...formData, min_points: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter minimum points required"
                  disabled={submitting}
                />
              </div>
              
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Rate (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount_rate}
                  onChange={(e) => setFormData({...formData, discount_rate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter discount rate"
                  disabled={submitting}
                />
              </div> */}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Tier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Membership Tier</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={submitting}
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tier Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter tier name"
                  disabled={submitting}
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                {loadingCategories ? (
                  <div className="flex items-center justify-center py-2 border border-gray-300 rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading categories...
                  </div>
                ) : (
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={submitting}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                )}
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tier Color *
                </label>
                <ColorPicker
                  color={formData.color}
                  onChange={(color) => setFormData({...formData, color})}
                  disabled={submitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Points *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.min_points}
                  onChange={(e) => setFormData({...formData, min_points: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter minimum points required"
                  disabled={submitting}
                />
              </div>
              
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Rate (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount_rate}
                  onChange={(e) => setFormData({...formData, discount_rate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter discount rate"
                  disabled={submitting}
                />
              </div> */}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Update Tier
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        itemName={itemToDelete ? itemToDelete.name : ''}
        itemType="tier"
        isLoading={submitting}
      />
    </div>
  );
};

export default MembershipTiers;