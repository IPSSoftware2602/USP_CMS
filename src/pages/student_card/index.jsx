import { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import { ChevronDown } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { VITE_API_BASE_URL } from '../../constant/config';
import { useNavigate } from 'react-router-dom';

const StudentCard = () => {
  const navigate = useNavigate();
  const authToken = sessionStorage.getItem('token');
  const [studentCards, setStudentCards] = useState([]);
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  const fetchStudentCards = async () => {
    try {
      const response = await fetch(VITE_API_BASE_URL + "customers/student-card", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch student cards');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setStudentCards(data.data);
      } else {
        toast.error('Failed to load student card submissions');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while fetching student card submissions');
    }
  };

  useEffect(() => {
    fetchStudentCards();
  }, []);

  const handleReview = (row) => {
    navigate(`/student-card/student_card_approval/${row.id}`);
  };

  const columns = [
    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
      minWidth: '200px',
      center: true,
    },
    // {
    //   name: 'Student ID',
    //   selector: row => row.student_id,
    //   sortable: true,
    //   minWidth: '150px',
    //   center: true,
    // },
    {
      name: 'Institution',
      selector: row => row.institution,
      sortable: true,
      minWidth: '200px',
      center: true,
    },
    {
      name: 'Graduation Date',
      selector: row => row.graduate_date,
      sortable: true,
      minWidth: '150px',
      center: true,
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      minWidth: '150px',
      center: true,
      cell: row => {
        let color = 'gray';
        if (row.status === 'approved') color = 'green';
        else if (row.status === 'pending') color = 'orange';
        else if (row.status === 'rejected') color = 'red';
        return <span style={{ color, fontWeight: 'bold', textTransform: 'capitalize' }}>{row.status}</span>;
      }
    },
    {
      name: 'Action',
      minWidth: '120px',
      center: true,
      cell: row => (
        <button
            onClick={() => handleReview(row)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            type="button"
            >
            Review
        </button>
      ),
    }
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#312e81',
        color: 'white',
        fontSize: '16px',
        justifyContent: 'center',
        textAlign: 'center',
      },
    },
    headCells: {
      style: {
        justifyContent: 'center',
        textAlign: 'center',
      }
    },
    rows: {
      style: {
        minHeight: '60px',
        fontSize: '15px',
        justifyContent: 'center',
        textAlign: 'center',
      },
      highlightOnHoverStyle: {
        backgroundColor: '#f9fafb',
      },
    },
    cells: {
      style: {
        justifyContent: 'center',
        textAlign: 'center',
      },
    },
    pagination: {
      style: {
        borderTopStyle: 'solid',
        borderTopWidth: '1px',
        borderTopColor: '#e5e7eb',
      },
    },
  };

  return (
    <div>
      <ToastContainer />
      <h1 className="text-xl font-medium text-gray-600 mb-6 ml-3">Student Card Submissions</h1>
      <div className="bg-white shadow-sm overflow-hidden rounded-lg">
        <DataTable
          columns={columns}
          data={studentCards}
          pagination
          paginationResetDefaultPage={resetPaginationToggle}
          persistTableHead
          customStyles={customStyles}
          sortIcon={<ChevronDown size={16} />}
          responsive
        />
      </div>
    </div>
  );
};

export default StudentCard;
