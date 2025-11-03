import { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { Edit, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../../../components/ui/DeletePopUp';
import categoryService from '../../../store/api/categoryService';
import defaultPizza from '@/assets/images/icon/default_pizza.jpeg';
import UserService from '../../../store/api/userService';

const CategoryTable = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [deletePopupOpen, setDeletePopupOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [userPermissions, setUserPermissions] = useState({});
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [filterText, setFilterText] = useState('');

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

        // Corrected path for Menu Category permissions
        if (permissions.Menu && 
            permissions.Menu.subItems && 
            permissions.Menu.subItems.Category) {
          if (permissions.Menu.subItems.Category.create === true) {
            setHasCreatePermission(true);
          }
          if (permissions.Menu.subItems.Category.update === true) {
            setHasUpdatePermission(true);
          }
          if (permissions.Menu.subItems.Category.delete === true) {
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
    fetchCategories();
    fetchUserPermissions();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await categoryService.getCategories();
      
      const transformedData = response.data ? response.data.map(category => ({
        id: category.id,
        title: category.title,
        parent: category.parent_category?.title || 'No Parent',
        status: category.status === 'active' ? 'Active' : 'Inactive',
        createdDate: formatDate(category.createdAt || category.created_at),
        image: category.image || category.image_url
      })) : [];
      
      setData(transformedData);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const year = date.getFullYear();
      const time = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });
      
      return `${day} / ${month} / ${year} ${time}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const handleNewCategory = () => {
    navigate('/menu/category/add_category');
  };

  const handleEditCategory = (id) => {
    navigate(`/menu/category/edit_category/${id}`);
  };

  const openDeleteConfirmation = (category) => {
    setCategoryToDelete(category);
    setDeletePopupOpen(true);
  };

  const closeDeleteConfirmation = () => {
    setDeletePopupOpen(false);
    setCategoryToDelete(null);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      setDeleting(true);
      await categoryService.deleteCategory(categoryToDelete.id);
      
      setData(data.filter(category => category.id !== categoryToDelete.id));
      
      console.log('Category deleted successfully');
      
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category. Please try again.');
    } finally {
      setDeleting(false);
      closeDeleteConfirmation();
    }
  };

  const filteredItems = data.filter(
    item => {
      return (
        item.title.toLowerCase().includes(filterText.toLowerCase()) ||
        item.parent.toLowerCase().includes(filterText.toLowerCase()) ||
        item.status.toLowerCase().includes(filterText.toLowerCase())
      );
    }
  );

  const columns = [
    {
      name: 'Action',
      cell: row => (
        <div className="flex justify-center space-x-2">
          {(isAdmin || hasUpdatePermission) && (
          <button 
            className="p-1 text-gray-500 hover:text-indigo-600" 
            onClick={() => handleEditCategory(row.id)}
          >
            <Edit size={20} />
          </button>
          )}
          {(isAdmin || hasDeletePermission) && (
          <button 
            className="p-1 text-gray-500 hover:text-red-600"
            onClick={() => openDeleteConfirmation(row)}
          >
            <Trash2 size={20} />
          </button>
          )}
        </div>
      ),
      button: true,
      width: '120px'
    },
    {
      name: 'Title',
      selector: row => row.title,
      sortable: true,
      cell: row => (
        <div className="flex items-center py-2">
          <img 
            src={row.image || defaultPizza} 
            alt={row.title} 
            className="w-12 h-12 mr-3 object-cover rounded"
            onError={(e) => {
              // e.target.src = "/api/placeholder/60/60";
            }}
          />
          <span>{row.title}</span>
        </div>
      )
    },
    {
      name: 'Parent',
      selector: row => row.parent,
      sortable: true
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      cell: row => (
        <span className={`px-4 py-1 rounded-full text-sm ${
          row.status === 'Active' 
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
      width: '300px'
    },
  ];

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: '#312e81',
        color: 'white',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
        fontWeight: '500'
      },
    },
    rows: {
      style: {
        minHeight: '72px',
        '&:not(:last-of-type)': {
          borderBottomStyle: 'solid',
          borderBottomWidth: '1px',
          borderBottomColor: '#e5e7eb',
        },
      },
    },
    pagination: {
      style: {
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        borderRadius: '0 0 8px 8px'
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="px-6 py-7 bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="ml-2 text-gray-600">Loading categories...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="px-6 py-7 bg-white rounded-lg shadow-xl">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchCategories}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 py-7 bg-white rounded-lg shadow-xl">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-medium text-gray-800">Category</h1>
          {(isAdmin || hasCreatePermission) && (
          <button 
            className="px-4 py-2 bg-indigo-900 text-white rounded-md flex items-center hover:bg-indigo-800" 
            onClick={handleNewCategory}
          >
            <span className="mr-2">+</span>
            Add New Category
          </button>
          )}
        </div>

        <DeleteConfirmationModal
          isOpen={deletePopupOpen}
          onClose={closeDeleteConfirmation}
          onConfirm={confirmDelete}
          itemName={categoryToDelete ? categoryToDelete.title : ''}
          isLoading={deleting}
        />
      </div>

      <div className=''>
        <DataTable
          columns={columns}
          data={filteredItems}
          pagination
          paginationPerPage={8}
          paginationRowsPerPageOptions={[8, 15, 30, 50]}
          customStyles={customStyles}
          highlightOnHover
          pointerOnHover
          sortIcon={<ChevronDown size={16} />}
          noDataComponent={
            <div className="py-8 text-center text-gray-500">
              No categories found
            </div>
          }
        />
      </div>
    </>
  );
};

export default CategoryTable;