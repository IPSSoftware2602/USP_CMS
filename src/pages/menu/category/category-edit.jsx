import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import categoryService from '../../../store/api/categoryService';
import { toast } from 'react-toastify';

const EditCategory = ({ onClose, onSubmit, categoryId }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: '',
    photo: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [originalData, setOriginalData] = useState(null);

  const navigate = useNavigate();
  const params = useParams();
  const id = categoryId || params.id;

  useEffect(() => {
    const loadCategoryData = async () => {
      if (!id) return;

      setLoadingData(true);
      setError(null);

      try {
        console.log('Loading category with ID:', id);
        const categoryData = await categoryService.getCategory(id);
        console.log('Loaded category data:', categoryData);
        
        setFormData({
          title: categoryData.title || '',
          content: categoryData.description || '',
          status: categoryData.status || '',
          viewMode: categoryData.viewMode || '',
          photo: null,
          gallery: null,
          background: null,
          icon: null,
          menuPhoto: null,
          backgroundColor: categoryData.backgroundColor || ''
        });

        setOriginalData(categoryData);
        
      } catch (err) {
        console.error('Error loading category:', err);
        setError(err.message || 'Failed to load category data');
      } finally {
        setLoadingData(false);
      }
    };

    loadCategoryData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({ ...prev, [name]: files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const categoryData = {
        title: formData.title,
        description: formData.content,
        status: formData.status || 'active'
      };

      const imageFile = formData.photo;

      const result = await categoryService.updateCategory(id, categoryData, imageFile);
      
      console.log('Category updated successfully:', result);
      
      if (onSubmit) {
        onSubmit(result);
      }

      toast.success(result.message || "Category updated successfully", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        onClose: () => {
          navigate("/menu/category");
        },
      }); 
      
      if (onClose) {
        onClose();
      } else {
      }
      
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.message || 'Failed to update category');
      toast.error(err.message || 'Failed to update category', {
        position: "top-right",
        autoClose: 1500,
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

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  // const handleDelete = async () => {
  //   if (!window.confirm('Are you sure you want to delete this category?')) {
  //     return;
  //   }

  //   setLoading(true);
  //   setError(null);

  //   try {
  //     await categoryService.deleteCategory(id);
  //     console.log('Category deleted successfully');
      
  //     toast.success(result.message || "Category deleted successfully", {
  //       position: "top-right",
  //       autoClose: 1500,
  //       hideProgressBar: false,
  //       closeOnClick: true,
  //       pauseOnHover: true,
  //       draggable: true,
  //       progress: undefined,
  //       theme: "light",
  //       onClose: () => {
  //         // Navigate after toast closes
  //         navigate("/menu/category"); // Update this path as needed
  //       },
  //     });
      
  //     if (onClose) {
  //       onClose();
  //     } else {
  //     }
      
  //   } catch (err) {
  //     console.error('Error deleting category:', err);
  //     setError(err.message || 'Failed to delete category');
  //     toast.error(err.message || 'Failed to delete category', {
  //       position: "top-right",
  //       autoClose: 1500,
  //       hideProgressBar: false,
  //       closeOnClick: true,
  //       pauseOnHover: true,
  //       draggable: true,
  //       progress: undefined,
  //       theme: "light",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  if (loadingData) {
    return (
      <div className="inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700 mx-auto mb-4"></div>
            <div>Loading category data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full mx-4 p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium">Edit Category</h2>
          <button 
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* TITLE SECTION */}
          <div className="mb-6">
            <div className="bg-indigo-900 text-white py-2 px-4 mb-4 font-medium">
              TITLE
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                name="title"
                placeholder="Enter here..."
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Description</label>
              <textarea
                name="content"
                placeholder="Enter here..."
                value={formData.content}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 min-h-32 resize-none"
              />
            </div>
          </div>

          {/* DETAILS SECTION */}
          <div className="mb-6">
            <div className="bg-indigo-900 text-white py-2 px-4 mb-4 font-medium">
              DETAILS
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none bg-white"
              >
                <option value="">Choose</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Photo</label>
              {originalData?.image && (
                <div className="mb-2">
                  <img 
                    src={originalData.image} 
                    alt="Current category image" 
                    className="w-20 h-20 object-cover border rounded"
                  />
                  <p className="text-sm text-gray-500 mt-1">Current image</p>
                </div>
              )}
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <p className="text-sm text-gray-500 mt-1">Leave empty to keep current image</p>
            </div>
          </div>

          <div className="flex justify-between">
            {/* <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-6 rounded-md"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button> */}
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleBack}
                className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title}
                className="bg-indigo-700 hover:bg-indigo-800 disabled:bg-indigo-400 text-white font-medium py-2 px-6 rounded-md"
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategory;