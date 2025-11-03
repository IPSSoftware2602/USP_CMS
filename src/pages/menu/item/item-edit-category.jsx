import { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ItemEditCategory = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: '',
    photo: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({ ...prev, [name]: files[0] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
    <ToastContainer />
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

        <div>
          {/* TITLE SECTION */}
          <div className="mb-6">
            <div className="bg-indigo-900 text-white py-2 px-4 mb-4 font-medium">
              TITLE
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Title</label>
              <input
                type="text"
                name="title"
                placeholder="Enter here..."
                value={formData.title}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Content</label>
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
              <input
                type="file"
                name="photo"
                onChange={handleFileChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-6 rounded-md"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ItemEditCategory;