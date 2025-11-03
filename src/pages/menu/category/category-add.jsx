import { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import categoryService from '../../../store/api/categoryService';
import {toast} from 'react-toastify';

const AddCategory = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: '',
    photo: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      // Prepare category data for API
      const categoryData = {
        title: formData.title,
        description: formData.content, // API expects 'description' not 'content'
        status: formData.status || 'active'
      };

      // Use the photo file for image upload
      const imageFile = formData.photo;

      // Call the API service
      const result = await categoryService.createCategory(categoryData, imageFile);
      
      console.log('Category created successfully:', result);
      
      // Call the parent's onSubmit callback if provided
      if (onSubmit) {
        onSubmit(result);
      }
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        status: '',
        viewMode: '',
        photo: null,
        gallery: null,
        background: null,
        icon: null,
        menuPhoto: null,
        backgroundColor: ''
      });

      toast.success(result.message || "Category created successfully", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        onClose: () => {
          // Navigate after toast closes
          navigate("/menu/category"); // Update this path as needed
        },
      });
      
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err.message || 'Failed to create category');
      toast.error(err.message || 'Failed to create category', {
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

  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full mx-4 p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium">Add Category</h2>
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
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Photo</label>
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
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
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategory;