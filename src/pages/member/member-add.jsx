import { useRef, useState, useEffect } from 'react';
import { X, Eye, ChevronDown, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VITE_API_BASE_URL } from '../../constant/config';
import md5 from 'md5';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddMember = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    customer_type: '',
    customer_tier: '',
    phone: '',
    password_hash: '',
    name: '',
    email: '',
    birthday: '',
    customer_referral_id: '',
    status: '',
    profile_picture: ''
  });
  const [tierData, setTierData] = useState([]);
  // const authToken = localStorage.getItem('authToken');
  const authToken = sessionStorage.getItem('token');
  const [customerType, setCustomerType] = useState([]);
  const [customerData, setCustomerData] = useState([]);

  const fetchCustomers = async () => {
    try {

      const response = await fetch(VITE_API_BASE_URL + "customers", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const customerData = await response.json();
      // console.log('response', customerData.data);

      setCustomerData(customerData.data);

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  const fetchTierData = async () => {
    try {
      const response = await fetch(VITE_API_BASE_URL + "settings/membership-tiers", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const tierData = await response.json();

      setTierData(tierData.data);
    } catch (error) {
      console.error("Error fetching tier data:", error);
    }
  }

  const fetchCustomerType = async () => {
    try {
      const response = await fetch(VITE_API_BASE_URL + "settings/customer-types", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const customerTypeData = await response.json();

      setCustomerType(customerTypeData.data);
    } catch (error) {
      console.error("Error fetching customer type data:", error);
    }
  }


  useEffect(() => {
    fetchTierData();
    fetchCustomerType();
    fetchCustomers();
    // console.log("Tier data fetched:", tierData);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'password_hash') {
      setFormData(prev => ({
        ...prev,
        [name]: md5(value)
      }));
    }
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    const formData1 = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formData1.append(key, value);
    });

    try {
      const response = await fetch(VITE_API_BASE_URL + "customers/create", {
        method: 'POST',
        headers: {
          // 'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${authToken}`,
        },
        // body: JSON.stringify(formData)
        body: formData1
      });

      // console.log('Response status:', response.status);
      let data = response;

      if (!response.ok) {
        console.error("Error creating member:", data);
        throw new Error('Fill in all required fields');
      }

      toast.success(data.message || "Created successfully", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        onClose: () => {
          navigate("/member");
        },
      });

      handleReset();
    } catch (err) {
      console.error("Error creating member:", err);
      toast.error(err.message || "Unexpected error");
    }
  };

  const handleImageUpload = (e) => {
    // console.log('Image selected:', e.target.files[0]);
    const name = e.target.name;
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      // onImageSelect(file);
    }

    setFormData((prev) => ({
      ...prev,
      profile_picture: file,
    }));
  };

  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };

  const handleReset = () => {
    setFormData({
      customer_type: '',
      customer_tier: '',
      phone: '',
      password_hash: '',
      name: '',
      email: '',
      birthday: '',
      customer_referral_id: '',
      status: '',
      profile_picture: ''
    });

    setPreview(null);
    hiddenInput.current.value = null;
  }

  const hiddenInput = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleClick = () => hiddenInput.current.click();


    return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6 mt-2">
        <h1 className="text-xl font-bold">Add New Member</h1>
        <button className="text-gray-500 hover:text-gray-700" onClick={handleBack}>
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Membership & Account Information */}
        <div className="mb-6">
          <div className="bg-indigo-900 text-white p-3 mb-4 font-medium">
            MEMBERSHIP & ACCOUNT INFORMATION
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-gray-500 mb-2">Customer Type</label>
              <div className="relative">
                <select
                  name="customer_type"
                  value={formData.customer_type}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Choose</option>
                  {customerType.map(type => (
                    <option key={type.id} value={type.name}>{type.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-500 mb-2">Tier Level</label>
              <div className="relative">
                <select
                  name="customer_tier"
                  value={formData.customer_tier}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Choose</option>
                  {tierData.map(type => (
                    <option key={type.id} value={type.name}>{type.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-500 mb-2">Phone Number <span className="text-red-500">*</span></label>
              <input
                type="tel"
                name="phone"
                placeholder="Enter here"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-500 mb-2">Password<span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password_hash"
                  placeholder='Enter here'
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personal & Contact Details */}
        <div className="mb-6">
          <div className="bg-indigo-900 text-white p-3 mb-4 font-medium">
            PERSONAL & CONTACT DETAILS
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-gray-500 mb-2">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                placeholder="Enter here"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-500 mb-2">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="email"
                placeholder="Enter here"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-500 mb-2">Birthday <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="birthday"
                placeholder="Enter here"
                value={formData.birthday}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mb-6">
          <div className="bg-indigo-900 text-white p-3 mb-4 font-medium">
            ADDITIONAL INFORMATION
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-gray-500 mb-2">Referral</label>
              <div className="relative">
                <select
                  name="customer_referral_id"
                  value={formData.customer_referral_id}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Choose</option>
                  {customerData.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-500 mb-2">Status<span className="text-red-500">*</span></label>
              <div className="relative">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Choose</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Photo */}
        <div className="mb-6">
          <div className="bg-indigo-900 text-white p-3 mb-4 font-medium">
            PROFILE PHOTO
          </div>

          <div className="flex justify-center">
            <div
              className="w-48 h-48 border border-gray-300 rounded-lg flex items-center justify-center cursor-pointer"
              onClick={handleClick}
            >
              {preview ? (
                <img src={preview} alt="Profile preview" className="object-cover w-full h-full rounded-lg" />
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <div className="mb-2">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">Add Image</p>
                </div>
              )}
            </div>

            <input
              ref={hiddenInput}
              type="file"
              name="profile_picture"
              accept="image/*"
              onChange={handleImageUpload}
              id="profile-photo"
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleReset}
            className="bg-white text-gray-700 border border-gray-300 rounded-lg px-6 py-2 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Member
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMember;