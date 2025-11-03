import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { Plus, Edit, Trash2, X, Users, Loader2, AlertCircle } from 'lucide-react';
import customerTypeService from '../../../store/api/cusTypeService';

const ErrorAlert = ({ message, onClose }) => (
  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
    <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-red-800">{message}</p>
    </div>
    <button onClick={onClose} className="text-red-600 hover:text-red-800">
      <X size={16} />
    </button>
  </div>
);

const SuccessAlert = ({ message, onClose }) => (
  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
    <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
      <div className="w-2 h-2 bg-white rounded-full"></div>
    </div>
    <div className="flex-1">
      <p className="text-green-800">{message}</p>
    </div>
    <button onClick={onClose} className="text-green-600 hover:text-green-800">
      <X size={16} />
    </button>
  </div>
);

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, itemType, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isDeleting}
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
            disabled={isDeleting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting && <Loader2 size={16} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const CustomerTypes = () => {
  const [customerTypes, setCustomerTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCustomerTypes();
  }, []);

  const loadCustomerTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerTypeService.getAll();

      if (Array.isArray(data)) {
        setCustomerTypes(data);
      } else if (data.result && Array.isArray(data.result)) {
        setCustomerTypes(data.result);
      } else if (data.data && Array.isArray(data.data)) {
        setCustomerTypes(data.data);
      } else {
        console.warn('Unexpected API response structure:', data);
        setCustomerTypes([]);
      }
    } catch (err) {
      setError('Failed to load customer types. Please try again.');
      setCustomerTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      name: 'Actions',
      cell: row => (
        <div className="flex gap-2">
          <button 
            className="hover:text-blue-800 disabled:opacity-50"
            onClick={() => handleEdit(row)}
            disabled={submitting || deleting}
          >
            <Edit size={16} />
          </button>
          <button 
            className="hover:text-red-800 disabled:opacity-50"
            onClick={() => handleDeleteClick(row)}
            disabled={submitting || deleting}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '120px'
    },
    {
      name: 'Customer Type',
      selector: row => row.name,
      sortable: true,
      cell: row => (
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${
            row.name.toLowerCase().includes('vip') ? 'bg-yellow-100 text-yellow-800' :
            row.name.toLowerCase().includes('corporate') ? 'bg-blue-100 text-blue-800' :
            row.name.toLowerCase().includes('student') ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            <Users size={16} />
          </div>
          <span className="font-medium">{row.name}</span>
        </div>
      )
    },
    {
      name: 'Created At',
      selector: row => row.created_at,
      sortable: true,
      width: '150px',
      cell: row => row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'
    },
  ];

  const handleAdd = async () => {
    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      
      await customerTypeService.create({ name: formData.name.trim() });
      
      setSuccess('Customer type created successfully!');
      setFormData({ name: '' });
      setShowAddModal(false);
      
      // Reload the list
      await loadCustomerTypes();
    } catch (err) {
      setError('Failed to create customer type. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!formData.name.trim() || !editingItem) return;

    try {
      setSubmitting(true);
      setError(null);
      
      await customerTypeService.update(editingItem.id, { name: formData.name.trim() });
      
      setSuccess('Customer type updated successfully!');
      setFormData({ name: '' });
      setEditingItem(null);
      setShowEditModal(false);
      
      await loadCustomerTypes();
    } catch (err) {
      setError('Failed to update customer type. Please try again.');
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
      setDeleting(true);
      setError(null);
      
      await customerTypeService.delete(itemToDelete.id);
      
      setSuccess('Customer type deleted successfully!');
      setItemToDelete(null);
      setShowDeleteModal(false);
      
      await loadCustomerTypes();
    } catch (err) {
      setError('Failed to delete customer type. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const closeModal = () => {
    setFormData({ name: '' });
    setEditingItem(null);
    setShowAddModal(false);
    setShowEditModal(false);
  };

  const closeDeleteModal = () => {
    setItemToDelete(null);
    setShowDeleteModal(false);
  };

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
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 size={24} className="animate-spin text-indigo-600" />
          <span className="text-gray-600">Loading customer types...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center p-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Customer Types</h2>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={submitting || deleting}
            className="bg-indigo-900 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Plus size={20} />
            Add Customer Type
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <ErrorAlert 
              message={error} 
              onClose={() => setError(null)} 
            />
          )}
          
          {success && (
            <SuccessAlert 
              message={success} 
              onClose={() => setSuccess(null)} 
            />
          )}
          
          <DataTable
            columns={columns}
            data={customerTypes}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50]}
            highlightOnHover
            pointerOnHover
            customStyles={customStyles}
            className="border border-gray-200 rounded-lg"
            noDataComponent={
              <div className="p-8 text-center text-gray-500">
                <Users size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No customer types found</h3>
                <p>Get started by adding your first customer type.</p>
              </div>
            }
          />
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Customer Type</h3>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Type Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter customer type name"
                  onKeyPress={(e) => e.key === 'Enter' && !submitting && handleAdd()}
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  e.g., Regular Customer, VIP Member, Corporate Client
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!formData.name.trim() || submitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Add Customer Type
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Customer Type</h3>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Type Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter customer type name"
                  onKeyPress={(e) => e.key === 'Enter' && !submitting && handleUpdate()}
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  e.g., Regular Customer, VIP Member, Corporate Client
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={!formData.name.trim() || submitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Update Type
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        itemName={itemToDelete?.name || ''}
        itemType="customer type"
        isDeleting={deleting}
      />
    </div>
  );
};

export default CustomerTypes;