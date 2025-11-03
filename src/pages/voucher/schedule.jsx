import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Download, Edit, Trash2 } from 'lucide-react';
import DataTable from 'react-data-table-component';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../../components/ui/DeletePopUp';
import { ToastContainer, toast } from 'react-toastify';
import { CSVLink } from 'react-csv';
import voucherScheduleService from '../../store/api/voucherScheduleService';
import promoSettingsService from '../../store/api/promoSettingsService';
import UserService from '../../store/api/userService';

const VoucherSchedule = () => {
  const [searchTitle, setSearchTitle] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [voucherData, setVoucherData] = useState([]);
  const navigate = useNavigate();
  const [userPermissions, setUserPermissions] = useState({});
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    title: '',
    owner: ''
  });

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

          // Corrected path for Voucher List permissions
          if (permissions.Voucher &&
            permissions.Voucher.subItems &&
            permissions.Voucher.subItems.Schedule) {
            if (permissions.Voucher.subItems.Schedule.create === true) {
              setHasCreatePermission(true);
            }
            if (permissions.Voucher.subItems.Schedule.update === true) {
              setHasUpdatePermission(true);
            }
            if (permissions.Voucher.subItems.Schedule.delete === true) {
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

  const fetchVoucherScheduleData = async () => {
    setLoading(true);
    try {
      // Always fetch ALL schedules (no search params)
      const scheduleResponse = await voucherScheduleService.getAllWithSettings();

      if (scheduleResponse.status === 200) {
        const promoSettingsResponse = await promoSettingsService.getAll();

        if (promoSettingsResponse.status === 200) {
          const promoSettings = promoSettingsResponse.data;

          const mergedData = scheduleResponse.data.map(schedule => {
            const promoSetting = promoSettings.find(promo =>
              promo.id === schedule.promo_setting_id ||
              promo.id === schedule.promo_id ||
              promo.title === schedule.voucher_title
            );

            let parsedPromoSetting = null;
            if (promoSetting && promoSetting.promo_setting) {
              try {
                parsedPromoSetting = JSON.parse(promoSetting.promo_setting);
              } catch (e) {
                console.error('Error parsing promo_setting JSON:', e);
              }
            }

            const getDiscountType = () => {
              if (parsedPromoSetting?.Promo?.promo_type === 'discount') {
                return parsedPromoSetting.Promo.discount_type === 'amount'
                  ? 'Fixed Amount'
                  : 'Percentage';
              }
              if (parsedPromoSetting?.Promo?.promo_type === 'free_item') {
                return 'Free Item';
              }
              if (parsedPromoSetting?.Promo?.promo_type === 'delivery') {
                return 'Free Delivery';
              }
              return schedule.voucher_type;
            };

            const getAmount = () => {
              if (parsedPromoSetting?.Promo?.amount) {
                return parsedPromoSetting.Promo.amount;
              }
              return schedule.amount;
            };

            const getMinimumPurchase = () => {
              if (parsedPromoSetting?.MinimumSpend?.amount && parsedPromoSetting?.MinimumSpend?.amount > 0) {
                return parsedPromoSetting.MinimumSpend.amount;
              }
              return schedule.voucher_minimum_purchase;
            };

            const getVoucherMode = () => {
              if (promoSetting?.promotion_type) {
                if (promoSetting.promotion_type.includes('selected item')) {
                  return 'Item Based';
                }
                if (promoSetting.promotion_type.includes('total order')) {
                  return 'Order Based';
                }
              }
              return schedule.voucher_date_type;
            };

            return {
              ...schedule,
              voucher_title: promoSetting?.title || schedule.voucher_title,
              voucher_date_type: getVoucherMode(),
              voucher_type: getDiscountType(),
              amount: getAmount(),
              voucher_minimum_purchase: getMinimumPurchase(),
              promotion_type: promoSetting?.promotion_type || schedule.promotion_type,
              promo_status: promoSetting?.status || schedule.status,
              scheduleId: schedule.scheduleId || schedule.id,
              created_at: schedule.created_at
            };
          });

          setVoucherData(mergedData);
        } else {
          setVoucherData(scheduleResponse.data);
        }
      } else {
        toast.error('Failed to fetch voucher schedules');
      }
    } catch (error) {
      console.error("Error fetching voucher schedule data:", error);
      toast.error(error.message || 'Error fetching voucher schedules');
    } finally {
      setLoading(false);
    }
  };
  const getFilteredSchedules = () => {
    return voucherData.filter(item => {
      let matchesTitle = true;
      let matchesOwner = true;

      if (appliedFilters.title) {
        matchesTitle = item.voucher_title?.toLowerCase().includes(appliedFilters.title.toLowerCase());
      }

      if (appliedFilters.owner && appliedFilters.owner !== 'Choose') {
        matchesOwner = item.voucher_owner?.toLowerCase() === appliedFilters.owner.toLowerCase();
      }

      return matchesTitle && matchesOwner;
    });
  };


  // Alternative approach: Fetch individual promo settings for each schedule
  const fetchVoucherScheduleDataAlternative = async (searchTitle = '', searchOwner = '') => {
    setLoading(true);
    try {
      const searchParams = {};
      if (searchTitle) searchParams.voucher_title = searchTitle;
      if (searchOwner && searchOwner !== 'Choose') searchParams.voucher_owner = searchOwner;

      const scheduleResponse = await voucherScheduleService.getAllWithSettings(searchParams);

      if (scheduleResponse.status === 200) {
        // Fetch detailed promo settings for each schedule
        const enrichedData = await Promise.all(
          scheduleResponse.data.map(async (schedule) => {
            try {
              // Assuming there's a promo_setting_id field in schedule
              if (schedule.promo_setting_id) {
                const promoSettingResponse = await promoSettingsService.getById(schedule.promo_setting_id);
                if (promoSettingResponse.status === 200) {
                  return {
                    ...schedule,
                    ...promoSettingResponse.data,
                    scheduleId: schedule.scheduleId || schedule.id, // Preserve schedule ID
                  };
                }
              }
              return schedule;
            } catch (error) {
              console.error(`Error fetching promo setting for schedule ${schedule.id}:`, error);
              return schedule;
            }
          })
        );

        setVoucherData(enrichedData);
      } else {
        toast.error('Failed to fetch voucher schedules');
      }
    } catch (error) {
      console.error("Error fetching voucher schedule data:", error);
      toast.error(error.message || 'Error fetching voucher schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoucherScheduleData();
    fetchUserPermissions();
  }, []);

  const owners = ['Choose', 'Admin', 'Manager', 'Staff'];

  // const handleSearch = () => {
  //   fetchVoucherScheduleData(searchTitle, selectedOwner);
  // };
  const handleSearch = () => {
    setAppliedFilters({
      title: searchTitle,
      owner: selectedOwner
    });
  };

  const handleAddNew = () => {
    navigate('/voucher/schedule/add_new_schedule');
  };

  const handleEdit = (scheduleId) => {
    navigate('/voucher/schedule/edit_schedule/' + scheduleId);
  };

  const confirmDelete = async (scheduleId) => {
    try {
      setLoading(true);
      const response = await voucherScheduleService.delete(scheduleId);

      if (response.status === 200) {
        // toast.success('Schedule deleted successfully');
        fetchVoucherScheduleData(searchTitle, selectedOwner);
      } else {
        toast.error('Failed to delete schedule');
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast.error(error.message || "Error deleting schedule");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteClick = (id) => {
    try {
      if (id) {
        setItemToDelete(id);
        setShowDeleteModal(true);
      }
    } catch (error) {
      console.error('Error in handleDeleteClick:', error);
    }
  };

  const columns = [
    {
      name: 'Action',
      cell: (row) => (
        <div className="flex gap-2">
          {(isAdmin || hasUpdatePermission) && (
            <button
              onClick={() => handleEdit(row.scheduleId)}
              className=" hover:text-indigo-600 p-1"
              disabled={loading}
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {(isAdmin || hasDeletePermission) && (
            <button
              onClick={() => handleDeleteClick(row.scheduleId)}
              className=" hover:text-red-600 p-1"
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      minWidth: '100px',
    },
    {
      name: 'Voucher Title',
      selector: row => row.voucher_title,
      minWidth: '200px',
      cell: row => row.voucher_title || '-'
    },
    {
      name: 'Schedule Mode',
      selector: row => row.voucher_schedule_mode,
      minWidth: '160px',
      cell: row => {
        return row.voucher_schedule_mode ?
          String(row.voucher_schedule_mode).charAt(0).toUpperCase() + String(row.voucher_schedule_mode).slice(1) :
          '-';
      }
    },
    {
      name: 'Schedule Date',
      selector: row => row.schedule_date,
      minWidth: '150px',
      cell: row => row.schedule_date || '-'
    },
    {
      name: 'Schedule Time',
      selector: row => row.schedule_time,
      minWidth: '150px',
      cell: row => row.schedule_time || '-'
    },
    {
      name: 'Quantity',
      selector: row => row.quantity,
      sortable: true,
      minWidth: '120px',
      cell: row => row.quantity || '-'
    },
    {
      name: 'Expiration',
      selector: row => row.voucher_expiration,
      minWidth: '150px',
      cell: row => row.voucher_expiration || '-'
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#312e81',
        color: 'white',
        minHeight: '50px',
        fontSize: '16px',
        justifyContent: 'center',
      },
    },
    headCells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        fontWeight: '500',
        justifyContent: 'center',
        textAlign: 'center',
        subHeaderWrap: true,
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        maxWidth: '200px',
      },
    },
    rows: {
      style: {
        minHeight: '60px',
        fontSize: '15px',
        '&:hover': {
          backgroundColor: '#f9fafb',
        },
        justifyContent: 'center',
        center: true,
      },
      highlightOnHoverStyle: {
        backgroundColor: '#f9fafb',
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        justifyContent: 'center',
        textAlign: 'center',
        alignItems: 'center',
        center: true,
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

  const csvData = [
    [
      'Voucher Title',
      'Schedule Mode',
      'Schedule Date',
      'Schedule Time',
      'Quantity',
      'Expiration',
      'Filter Membership',
      'Filter Customer Type',
      'Created At'
    ],
    ...voucherData.map(c => [
      c.voucher_title || '-',
      c.voucher_schedule_mode || '-',
      c.schedule_date || '-',
      c.schedule_time || '-',
      c.quantity || '-',
      c.voucher_expiration || '-',
      c.filter_membership || '-',
      c.filter_customer_type || '-',
      c.created_at || '-'
    ])
  ];

  return (
    <div className="p-6">
      <h3 className='mb-5 ml-2 text-[20px] text-gray-500'>Schedule</h3>
      <div className="mx-auto">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="bg-indigo-900 text-white px-6 py-4 rounded-t-lg">
            <h2 className="text-lg text-white font-medium">Search</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Search Voucher"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner
                </label>
                <div className="relative">
                  <select
                    value={selectedOwner}
                    onChange={(e) => setSelectedOwner(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                    disabled={loading}
                  >
                    {owners.map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSearch}
                className="bg-indigo-900 text-white px-6 py-2 rounded-md hover:bg-indigo-800 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Listing</h2>
            <div className="flex gap-3">
              {(isAdmin || hasCreatePermission) && (
                <button
                  onClick={handleAddNew}
                  className="bg-indigo-900 text-white px-4 py-2 rounded-md hover:bg-indigo-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                  disabled={loading}
                >
                  <Plus className="h-4 w-4" />
                  Add New Schedule
                </button>
              )}
              <CSVLink data={csvData} filename="voucher_schedule.csv">
                <button className="bg-[#312e81] text-white px-6 py-3 rounded-lg flex items-center gap-2 text-sm font-medium disabled:opacity-50">
                  <Download size={20} />
                  Export Report
                </button>
              </CSVLink>
            </div>
          </div>

          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={getFilteredSchedules()}
              customStyles={customStyles}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[5, 10, 15, 20]}
              highlightOnHover
              pointerOnHover
              responsive
              sortIcon={<ChevronDown size={16} />}
              progressPending={loading}
              progressComponent={<div className="py-8 text-center text-gray-500">Loading...</div>}
              noDataComponent={
                <div className="py-8 text-center text-gray-500">
                  No schedules found
                </div>
              }
              paginationComponentOptions={{
                rowsPerPageText: 'Rows per page:',
                rangeSeparatorText: 'of',
                noRowsPerPage: false,
                selectAllRowsItem: false,
              }}
            />

            <DeleteConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => {
                setShowDeleteModal(false);
                setItemToDelete(null);
              }}
              onConfirm={() => confirmDelete(itemToDelete)}
              itemName="Schedule"
            />
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default VoucherSchedule;