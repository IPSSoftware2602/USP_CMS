import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EditDetailsMemberOrder = () => {
  const [selfPickupDate, setSelfPickupDate] = useState('');
  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className=" min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 mt-3">
          <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
            <button className="bg-indigo-900 text-white px-4 py-2 rounded font-medium">
              Print
            </button>
            <button className="bg-indigo-900 text-white px-4 py-2 rounded font-medium">
              Print Order
            </button>
            <button className="bg-indigo-900 text-white px-4 py-2 rounded font-medium">
              Print Pre-Order
            </button>
            <button className="bg-indigo-900 text-white px-4 py-2 rounded font-medium">
              Print Receipt
            </button>
          </div>
          <button className="flex items-center px-6 py-2 border-2 border-gray-300 rounded-full text-gray-700 font-medium" onClick={handleBack}>
            <ChevronLeft className="mr-2" />
            Go back
          </button>
        </div>

        {/* Order Details Section */}
        <div className="mb-6 border rounded shadow-sm overflow-hidden">
          <div className="bg-indigo-900 text-white px-4 py-2 font-medium">
            Order Details
          </div>
          <div className="bg-white">
            <DataRow label="Code" value="0000107" />
            <DataRow label="Permission" value="Customer" />
            <DataRow label="Full Name" value="Yap Chung Yeen" />
            <DataRow label="Phone" value="+60124736652" />
            <DataRow label="Email" value="Yapchung@gmail.com" />
            <DataRow label="Status" value="Active" valueColor="text-green-600" />
          </div>
        </div>

        {/* Order Information Section */}
        <div className="mb-6 border rounded shadow-sm overflow-hidden">
          <div className="bg-indigo-900 text-white px-4 py-2 font-medium">
            Order #000257 03-Oct-2024 04:06 PM
          </div>
          <div className="bg-white">
            <DataRow
              label="Billing Address"
              value="1, 24, MERYL BUILDING, No. 23, JALAN IKAN, 43576 MELAKA, PERAK"
            />
            <DataRow
              label="Shipping Address"
              value="1, 24, MERYL BUILDING, No. 23, JALAN IKAN, 43576 MELAKA, PERAK"
            />
            <DataRow label="Payment Method" value="Paid" valueColor="text-green-600" />
          </div>
        </div>

        {/* Self Pickup Details Section */}
        <div className="mb-6 border rounded shadow-sm overflow-hidden">
          <div className="bg-indigo-900 text-white px-4 py-2 font-medium">
            Self Pickup Details
          </div>
          <div className="bg-white">
            <DataRow label="Status" value="Completed" valueColor="text-green-600" />
            <div className="flex border-b border-gray-100 last:border-b-0">
              <div className="w-1/3 sm:w-1/4 px-4 py-3 bg-gray-50 text-gray-700 font-medium flex items-center">
                Self-Pickup Date
              </div>
              <div className="w-2/3 sm:w-3/4 px-4 py-2 flex items-center">
                <div className="w-full relative">
                  {/* <select
                    className="w-full px-3 py-2 border border-gray-300 rounded appearance-none pr-8"
                    value={selfPickupDate}
                    onChange={(e) => setSelfPickupDate(e.target.value)}
                  >
                    <option value="">DD/MM/YYYY</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div> */}
                  <input
                    type="date"
                    name="selfPickupDate"
                    placeholder="Enter here"
                    value={selfPickupDate}
                    onChange={(e) => setSelfPickupDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Other Items Section */}
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Other Items</h2>
          <div className="border rounded shadow-sm overflow-hidden overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-indigo-900 text-white">
                  <th className="py-3 px-4 text-left w-1/6">Product</th>
                  <th className="py-3 px-4 text-left w-2/6">Description</th>
                  <th className="py-3 px-4 text-left w-1/6">Amount</th>
                  <th className="py-3 px-4 text-left w-1/6">Quantity</th>
                  <th className="py-3 px-4 text-left w-1/6">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr className="border-t border-gray-100">
                  <td className="py-4 px-4">
                    <img
                      src="/api/placeholder/100/100"
                      alt="Pizza product"
                      className="w-20 h-20 object-cover"
                    />
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-medium">Demo Product</div>
                    <div className="text-gray-600">Code : DP00001</div>
                  </td>
                  <td className="py-4 px-4">RM5.00</td>
                  <td className="py-4 px-4">5</td>
                  <td className="py-4 px-4 font-medium">RM 25.00</td>
                </tr>
              </tbody>
            </table>

            {/* Order Summary Section */}
            <div className="bg-white border-t border-gray-200">
              <div className="flex flex-col items-end pr-4 py-4">
                <hr className="w-full mb-4 border-t border-gray-200" />

                {/* Product Total */}
                <div className="flex justify-between w-full md:w-1/3 mb-2">
                  <span className="font-medium">Product Total</span>
                  <span className="font-medium">RM 25.00</span>
                </div>

                {/* Courier Fee */}
                <div className="flex justify-between w-full md:w-1/3 mb-2">
                  <span className="font-medium">Courier Fee</span>
                  <span className="font-medium">RM 5.10</span>
                </div>

                <hr className="w-full md:w-1/3 my-2 border-t border-gray-400" />

                {/* Grand Total */}
                <div className="flex justify-between w-full md:w-1/3 mt-1 font-bold">
                  <span>Grand Total</span>
                  <span>RM 30.10</span>
                </div>

                <hr className="w-full md:w-1/3 mt-2 border-t border-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DataRow = ({ label, value, valueColor = "text-gray-800" }) => {
  return (
    <div className="flex border-b border-gray-100 last:border-b-0">
      <div className="w-1/3 sm:w-1/4 px-4 py-3 bg-gray-50 text-gray-700 font-medium flex items-center">
        {label}
      </div>
      <div className="w-2/3 sm:w-3/4 px-4 py-3">
        <span className={valueColor}>{value}</span>
      </div>
    </div>
  );
};

export default EditDetailsMemberOrder;