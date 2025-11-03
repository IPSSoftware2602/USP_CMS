import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { VITE_API_BASE_URL } from '../../constant/config';
import { set } from 'react-hook-form';
import { ToastContainer, toast } from 'react-toastify';

const EditMemberAddress = () => {
  const { addressId } = useParams();

  const authToken = sessionStorage.getItem('token');
  const [addressData, setAddressData] = useState({});

  const fetchAddressData = async () => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}customer-addresses/${addressId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const addressData = await response.json()
      const addressDetails = addressData.data;

      setAddressData(addressDetails);
      setFormData((prev) => ({ ...prev, ...addressDetails }));

    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
  }

  useEffect(() => {
    fetchAddressData();
  }, []);


  const [formData, setFormData] = useState({
    is_default: 0,
    name: '',
    phone: '',
    emailAddress: '',
    address: '',
    postcode: '',
    area: '',
    state: '',
    country: '',
    status: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   console.log('Form submitted:', formData);
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // const formData1 = new FormData();
    // Object.entries(formData).forEach(([key, value]) => {
    //   formData1.append(key, value);
    // });

    try {
      const response = await fetch(VITE_API_BASE_URL + "customer-addresses/update/" + addressId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(formData)
        // body: formData1
      });

      // console.log('Response status:', response.status);
      let data = response;

      if (!response.ok) {
        console.error("Error updating address:", data);
        throw new Error('Fill in all required fields');
      }

      toast.success(data.message || "Save successfully", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        onClose: () => {
          navigate(-1);
        },
      });

      // handleReset();
    } catch (err) {
      console.error("Error updating address:", err);
      toast.error(err.message || "Unexpected error");
    }
  };

  const navigate = useNavigate();
  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full shadow-lg p-4">
        <div className="flex justify-between items-center p-4 mb-3">
          <h2 className="text-xl font-bold">Edit Address</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size='20' />
          </button>
        </div>

        <div className="bg-indigo-900 py-1 px-4 text-center">
          <h3 className="text-lg font-medium text-white">ADDRESS</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="flex items-center">
            <label className="mr-2 text-gray-500">Default Type</label>
            <input
              type="checkbox"
              name="is_default"
              checked={parseInt(formData.is_default) === 1}
              onChange={handleChange}
              className="h-5 w-5 border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-gray-500 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter here"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-500 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter here"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-500 mb-1">Email Address</label>
            <input
              type="email"
              name="emailAddress"
              value={formData.emailAddress}
              onChange={handleChange}
              placeholder="Enter here"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-500 mb-1">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter here"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-500 mb-1">Unit Number<span className="text-red-500">*</span></label>
            <input
              type="text"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              placeholder="Enter here"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-500 mb-1">Postcode</label>
            <input
              type="text"
              name="postcode"
              value={formData.postcode}
              onChange={handleChange}
              placeholder="Enter here"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-500 mb-1">Area</label>
            <select
              name="area"
              value={formData.area}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="" disabled>Choose</option>
              <option value="area1">Area 1</option>
              <option value="area2">Area 2</option>
              <option value="area3">Area 3</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-500 mb-1">State</label>
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="" disabled>Choose</option>
              <option value="state1">State 1</option>
              <option value="state2">State 2</option>
              <option value="state3">State 3</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-500 mb-1">Country</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="" disabled>Choose</option>
              <option value="country1">Country 1</option>
              <option value="country2">Country 2</option>
              <option value="country3">Country 3</option>
            </select>
          </div>


          <div>
            <label className="block text-gray-500 mb-1">Note<span className="text-red-500">*</span></label>
            <input
              type="text"
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Enter here"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>


          <div>
            <label className="block text-gray-500 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="" disabled>Choose</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-8 py-2 bg-white text-blue-500 border border-blue-500 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMemberAddress;