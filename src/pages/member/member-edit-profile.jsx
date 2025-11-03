import { useRef, useState, useEffect } from 'react';
import { X, Eye } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
// import { apiUrl } from '../../constant/constants';
import { VITE_API_BASE_URL } from '../../constant/config';
import { set } from 'lodash';
import { ToastContainer, toast } from 'react-toastify';

const EditProfileMember = () => {

  // const { state } = useLocation();
  // const { customerId } = state || {};
  const { id } = useParams();
  const authToken = sessionStorage.getItem('token');
  const [showPassword, setShowPassword] = useState(false);
  const [customerData, setCustomerData] = useState({});
  const [preview, setPreview] = useState(null);
  // const [formData, setFormData] = useState({});
  const [formData, setFormData] = useState({
    referenceLink: '',
    referenceCode: '',
    memberCard: '',
    customer_type: '',
    customer_tier: '',
    customer_tier_id: '',
    name: '',
    companyName: '',
    phone: '',
    email: '',
    nric: '',
    gender: '',
    race: '',
    birthday: '',
    status: '',
    // profile_picture: null,
    profile_picture_url: ''
  });

  const handleReset = () => {
    setFormData({
      referenceLink: '',
      referenceCode: '',
      memberCard: '',
      customer_type: '',
      customer_tier: '',
      customer_tier_id: '',
      name: '',
      companyName: '',
      phone: '',
      email: '',
      nric: '',
      gender: '',
      race: '',
      birthday: '',
      status: '',
      profile_picture: null,
      profile_picture_url: ''
    });

    setPreview(null);
    hiddenInput.current.value = null;
  }

  function getTierName(tierIdStr) {
    const normalizedId = String(tierIdStr).trim();

    const tier = tierData.find(
      t => String(t.id).trim() === normalizedId
    );

    // console.log('tier', tier);
    return tier ? tier.name : null;
  }

  const [tierData, setTierData] = useState([]);
  // const authToken = localStorage.getItem('authToken');
  const [customerType, setCustomerType] = useState([]);

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

  const fetchCustomerData = async () => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}customers/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const customerData = await response.json()
      const customerDetails = customerData.data;
      if (customerDetails.profile_picture_url) {
        setPreview(customerDetails.profile_picture_url);
      }
      console.log("Customer data fetched:", customerDetails);
      setCustomerData(customerDetails);
      setFormData(prev => ({
        ...prev,
        ...customerDetails
      }));

    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
  }

  useEffect(() => {
    fetchTierData();
    fetchCustomerType();
    fetchCustomerData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    const formData1 = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formData1.append(key, value);
    });

    try {
      const response = await fetch(VITE_API_BASE_URL + "customers/update/" + id, {
        method: 'POST',
        headers: {
          // 'Content-Type': 'application/json',
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
      console.error("Error creating member:", err);
      toast.error(err.message || "Unexpected error");
    }
  };

  // const handleImageUpload = (e) => {
  //   console.log('Image selected:', e.target.files[0]);
  // };

  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };

  const hiddenInput = useRef(null);


  const handleClick = () => hiddenInput.current.click();

  const handleImageUpload = (e) => {
    // console.log('Image selected:', e.target.files[0]);
    const name = e.target.name;
    const file = e.target.files[0];

    if (!file) return;

    // if (file) {
    //   setPreview(URL.createObjectURL(file));
    // onImageSelect(file);
    // }

    setPreview(URL.createObjectURL(file));

    setFormData((prev) => ({
      ...prev,
      profile_picture: file,
    }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-8 mt-2">
        <h1 className="text-xl font-bold ml-1">Edit Member</h1>
        <button className="text-gray-500 hover:text-gray-700" onClick={handleBack}>
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Referral Information */}
        <div className="mb-6">
          <div className="bg-indigo-900 text-white p-3 mb-4 font-medium">
            REFERRAL INFORMATION
          </div>
          {/* <div>
            <label className="block text-gray-500 mb-2 mt-3">Reference Link</label>
            <input
              type="text"
              name="referenceLink"
              placeholder="Enter here"
              value={formData.referenceLink}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div> */}
          <div>
            <label className="block text-gray-500 mb-2 mt-3">Reference Code</label>
            <input
              type="text"
              name="customer_referral_code"
              placeholder="Enter here"
              value={formData.customer_referral_code}
              onChange={handleChange}
              className="w-full border bg-gray-100 border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly
            />
          </div>
        </div>

        {/* Membership Details */}
        <div className="mb-6">
          <div className="bg-indigo-900 text-white p-3 mb-4 font-medium">
            MEMBERSHIP DETAILS
          </div>
          {/* <div>
            <label className="block text-gray-500 mb-2 mt-3">Member Card</label>
            <input
              type="text"
              name="memberCard"
              placeholder="Enter here"
              value={formData.memberCard}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div> */}

          <div className="md:col-span-1"></div>

          <div>
            <label className="block text-gray-500 mb-2 mt-3">Customer Type</label>
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
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-500 mb-2 mt-3">Tier Level</label>
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
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Personal & Contact Information */}
        <div className="mb-6">
          <div className="bg-indigo-900 text-white p-3 mb-4 font-medium">
            PERSONAL & CONTACT INFORMATION
          </div>
          <div>
            <div className="md:col-span-2">
              <label className="block text-gray-500 mb-2 mt-3">Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter here"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* <div>
              <label className="block text-gray-500 mb-2 mt-3">Company Name</label>
              <input
                type="text"
                name="companyName"
                placeholder="Enter here"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div> */}

            <div>
              <label className="block text-gray-500 mb-2 mt-3">Phone Number</label>
              <input
                type="text"
                name="phone"
                placeholder="Enter here"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-500 mb-2 mt-3">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Enter here"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* <div>
              <label className="block text-gray-500 mb-2 mt-3">NRIC</label>
              <input
                type="text"
                name="nric"
                placeholder="Enter here"
                value={formData.nric}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-500 mb-2 mt-3">Gender</label>
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Choose</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-500 mb-2 mt-3">Race</label>
              <div className="relative">
                <select
                  name="race"
                  value={formData.race}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Choose</option>
                  <option value="asian">Malay</option>
                  <option value="black">Chinese</option>
                  <option value="caucasian">Indian</option>
                  <option value="other">Other</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div> */}

            <div>
              <label className="block text-gray-500 mb-2 mt-3">Birthday</label>
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

        {/* Account Status */}
        <div className="mb-6">
          <div className="bg-indigo-900 text-white p-3 mb-4 font-medium">
            ACCOUNT STATUS
          </div>
          <div className='mb-9'>
            <label className="block text-gray-500 mb-2">Status</label>
            {/* <input
              type="Status"
              name="status"
              placeholder="Enter here"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            /> */}
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
                <option value="banned">Pending</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-gray-500 mb-4">Photo</label>
            {/* <div className="flex">
              <div className="w-48 h-48 border border-gray-300 rounded-lg flex flex-col items-center justify-center">
                <div className="mb-2">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Add Image</p>
                <input
                  type="file"
                  name="profilePhoto"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="profile-photo"
                  accept="image/*"
                />
              </div>
            </div> */}
            <div className="flex">
              <div
                className="w-48 h-48 border border-gray-300 rounded-lg flex items-center justify-center cursor-pointer"
                onClick={handleClick}
              >
                {preview ? (
                  <img src={preview} alt="Profile preview" className="object-cover w-full h-full rounded-lg" />
                ) : (
                  <div className="w-48 h-48 border border-gray-300 rounded-lg flex flex-col items-center justify-center">
                    <div className="mb-2">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">Add Image</p>
                  </div>
                )}
              </div>

              {/* <div className="w-48 h-48 border border-gray-300 rounded-lg flex flex-col items-center justify-center" onClick={handleClick}>
              <div className="mb-2">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Add Image</p> */}
              {/* <input
                type="file"
                name="profilePhoto"
                onChange={handleImageUpload}
                className="hidden"
                id="profile-photo"
                accept="image/*"
              /> */}
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
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="submit"
            className="bg-white text-blue-500 border border-blue-500 rounded-lg px-6 py-2 font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={handleBack}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="bg-white text-blue-500 border border-blue-500 rounded-lg px-6 py-2 font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfileMember;