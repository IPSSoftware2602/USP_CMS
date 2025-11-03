import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import { VITE_API_BASE_URL } from '../../constant/config';

const StudentCardApproval = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const authToken = sessionStorage.getItem('token');

  const [studentCard, setStudentCard] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStudentCard = async () => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}customers/student-card/${id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Failed to fetch student card');
      const data = await response.json();
      if (data.status === 'success') {
        setStudentCard(data.data);
      } else {
        toast.error('Failed to load student card');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while fetching student card data');
    }
  };

  useEffect(() => {
    fetchStudentCard();
  }, [id]);

  const updateStatus = async (status) => {
    if (!window.confirm(`Are you sure you want to ${status} this application?`)) return;

    setLoading(true);
    try {
      const response = await fetch(`${VITE_API_BASE_URL}customers/update-student-card/${id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        toast.success(`Student card ${status} successfully.`);
        // Refresh data to show updated status
        fetchStudentCard();
      } else {
        toast.error(data.message || 'Failed to update status.');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while updating status');
    }
    setLoading(false);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!studentCard) return <p>Loading...</p>;

  return (
    <div className="bg-white p-6 rounded shadow w-full mx-auto">
      <ToastContainer />
      <div className="flex justify-between items-center mb-8 mt-2">
        <h1 className="text-xl font-bold ml-1">Student Card Approval</h1>
        <button className="text-gray-500 hover:text-gray-700" onClick={handleBack}>
          <X size={24} />
        </button>
      </div>

      <div className="bg-indigo-900 text-white p-3 mb-4 font-medium">
        STUDENT CARD INFORMATION
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Student Name:</label>
        <input
          type="text"
          value={studentCard.name}
          readOnly
          className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Student ID:</label>
        <input 
        type="text" 
        value={studentCard.student_id} 
        readOnly 
        className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Institution:</label>
        <input 
        type="text" 
        value={studentCard.institution} 
        readOnly 
        className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Graduate Date:</label>
        <input 
        type="text" 
        value={new Date(studentCard.graduate_date).toLocaleDateString()} 
        readOnly 
        className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Status:</label>
        <input
          type="text"
          value={studentCard.status}
          readOnly
          className={`w-full border rounded px-3 py-2 cursor-not-allowed font-semibold capitalize ${
            studentCard.status === 'approved' ? 'text-green-600 bg-green-100' :
            studentCard.status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
            'text-red-600 bg-red-100'
          }`}
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Student ID Image:</label>
        <img
          src={`${studentCard.student_id_image}`}
          alt="Student ID"
          style={{ width: "300px", height: "auto" }}
        />

      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={() => updateStatus('approved')}
          disabled={loading || studentCard.status !== 'pending'}
          className={`flex-1 py-2 rounded font-semibold text-white ${
            studentCard.status !== 'pending'
              ? 'bg-green-300 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          Approve
        </button>
        <button
          onClick={() => updateStatus('rejected')}
          disabled={loading || studentCard.status !== 'pending'}
          className={`flex-1 py-2 rounded font-semibold text-white ${
            studentCard.status !== 'pending'
              ? 'bg-red-300 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export default StudentCardApproval;
