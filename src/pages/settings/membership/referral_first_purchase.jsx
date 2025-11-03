import React, { useState, useEffect } from 'react';
import { Save, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import promoService from '../../../store/api/promoService';
import membershipSettingService from '../../../store/api/membershipSettingService';

const ReferralFirstPurchase = () => {
  const [voucherForm, setVoucherForm] = useState({
    rows: [],
    bonus: 0,
    status: 'Inactive',
    type: 'referral_first_purchase',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPromoSettings, setLoadingPromoSettings] = useState(true);
  const [promoList, setPromoList] = useState([]); // For the list of available promos
  const navigate = useNavigate();

  useEffect(() => {
    fetchPromos();
    fetchMembershipSettings();
  }, []);

  const fetchPromos = async () => {
    try {
      setLoadingPromoSettings(true);
      const response = await promoService.getAll();

      const transformedPromos =
        response.result?.map((promo) => ({
          id: promo.id,
          title: promo.title,
        })) || [];

      setPromoList(transformedPromos);
    } catch (err) {
      console.error("Error fetching promos:", err);
    } finally {
      setLoadingPromoSettings(false);
    }
  };

  const fetchMembershipSettings = async () => {
    try {
      const response = await membershipSettingService.get('referral_first_purchase');
      const parsedSetting = (() => {
        if (!response?.setting) return null;
        try {
          return typeof response.setting === 'string'
            ? JSON.parse(response.setting)
            : response.setting;
        } catch (parseErr) {
          console.error('Failed to parse membership setting JSON:', parseErr);
          return null;
        }
      })();

      const voucherRows = Array.isArray(parsedSetting?.voucher)
        ? parsedSetting.voucher.map((item) =>
            createEmptyVoucherRow({
              promoId: item.promoId ?? '',
              expirationDays: item.expirationDays ?? '',
              quantity: item.quantity ?? '',
            })
          )
        : [];

      const normalizeStatus = (statusValue) => {
        const normalized = String(statusValue || '').toLowerCase();
        if (normalized === 'active') return 'Active';
        if (normalized === 'inactive') return 'Inactive';
        return 'Inactive';
      };

      setVoucherForm((prev) => ({
        ...prev,
        rows: voucherRows,
        bonus:
          parsedSetting?.bonus === null || parsedSetting?.bonus === undefined
            ? ''
            : parsedSetting.bonus,
        status: normalizeStatus(response?.status || parsedSetting?.status || prev.status),
        type: response?.type || prev.type,
      }));
    } catch (err) {
      console.error("Error fetching membership settings:", err);
    }
  };

  const createEmptyVoucherRow = (overrides = {}) => ({
    id: `${Date.now()}-${Math.random()}`,
    promoId: overrides.promoId ?? '',
    expirationDays: overrides.expirationDays ?? '',
    quantity: overrides.quantity ?? '',
  });

  const handleAddVoucherRow = () => {
    setVoucherForm((prev) => ({
      ...prev,
      rows: [...prev.rows, createEmptyVoucherRow()],
    }));
  };

  const handleVoucherChange = (rowId, field, value) => {
    setVoucherForm((prev) => ({
      ...prev,
      rows: prev.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]:
                field === 'expirationDays' || field === 'quantity'
                  ? value === ''
                    ? ''
                    : Math.max(1, Number(value))
                  : value,
            }
          : row
      ),
    }));
  };

  const handleRemoveVoucherRow = (rowId) => {
    setVoucherForm((prev) => ({
      ...prev,
      rows: prev.rows.filter((row) => row.id !== rowId),
    }));
  };

  const handleVoucherMetaChange = (field, value) => {
    setVoucherForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumberWheel = (event) => {
    event.currentTarget.blur();
  };

  const handleNumberKeyDown = (event) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Prepare user data
      const data = {
        voucher: voucherForm.rows.map((row) => ({
          promoId: row.promoId,
          expirationDays: row.expirationDays === '' ? null : Number(row.expirationDays),
          quantity: row.quantity === '' ? null : Number(row.quantity),
        })),
        bonus: voucherForm.bonus === '' ? null : Number(voucherForm.bonus),
        status: voucherForm.status,
        type: voucherForm.type,
      };

      const response = await membershipSettingService.update(data);
      toast.success('Membership settings updated successfully!');
      
      // Navigate back to user list
      navigate('/settings/membership/referral_first_purchase');
      
    } catch (error) {
      console.error('Error updating membership settings:', error);
      toast.error(`Error updating membership settings: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      navigate(-1);
    }
  };

  const handleBack = () => {
    navigate(-1);
  }

  return (
    <div className='rounded-lg shadow-lg bg-white max-w-3xl mx-auto mt-10'>
      <div className="mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="p-3 pb-2 pt-5 flex justify-between items-center">
            <h2 className="text-xl font-medium text-gray-800">Referral First Purchase</h2>
            <button className="text-gray-400 hover:text-gray-600" onClick={handleBack}> 
            <X size={24} />
            </button>
        </div>
        <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between bg-indigo-900 text-white px-4 py-2 text-sm font-medium">
                <span>Free Voucher</span>
                <button
                  type="button"
                  onClick={handleAddVoucherRow}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded"
                  disabled={loadingPromoSettings}
                >
                  Add New
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left font-medium text-gray-700">No.</th>
                      <th scope="col" className="px-4 py-2 text-left font-medium text-gray-700">Promo Setting</th>
                      <th scope="col" className="px-4 py-2 text-left font-medium text-gray-700">Voucher Expiration Days</th>
                      <th scope="col" className="px-4 py-2 text-left font-medium text-gray-700">Quantity</th>
                      <th scope="col" className="px-4 py-2 text-center font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {voucherForm.rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                          No vouchers added. Click "Add New" to create one.
                        </td>
                      </tr>
                    ) : (
                      voucherForm.rows.map((row, index) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3 text-gray-700">{index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="relative">
                              <select
                                className="w-full appearance-none rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={row.promoId}
                                onChange={(e) => handleVoucherChange(row.id, 'promoId', e.target.value)}
                              >
                                <option value="">Choose</option>
                                {promoList.map((promo) => (
                                  <option key={promo.id} value={promo.id}>
                                    {promo.title}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-gray-400" />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              value={row.expirationDays}
                              onChange={(e) => handleVoucherChange(row.id, 'expirationDays', e.target.value)}
                              onWheel={handleNumberWheel}
                              onKeyDown={handleNumberKeyDown}
                              placeholder="e.g. 30"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              value={row.quantity}
                              onChange={(e) => handleVoucherChange(row.id, 'quantity', e.target.value)}
                              onWheel={handleNumberWheel}
                              onKeyDown={handleNumberKeyDown}
                              placeholder="e.g. 1"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveVoucherRow(row.id)}
                              className="inline-flex items-center justify-center rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm pt-8">
              <div className="bg-white rounded-lg shadow-sm ">
                <div className="bg-indigo-900 text-white text-center py-2 text-sm font-medium mb-4">
                  Extra Bonus
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bonus Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={voucherForm.bonus}
                    onChange={(e) =>
                      handleVoucherMetaChange('bonus', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
                    }
                    onWheel={handleNumberWheel}
                    onKeyDown={handleNumberKeyDown}
                  />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm pt-8">
                <div className="bg-white rounded-lg shadow-sm ">
                    <div className="bg-indigo-900 text-white text-center py-2 text-sm font-medium mb-4">
                        Status
                    </div>
                </div>
              
                <div className="grid grid-cols-1 md:grid-cols-1">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Active Status
                        </label>
                        <select
                            value={voucherForm.status}
                            onChange={(e) => handleVoucherMetaChange('status', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

          {/* Action Buttons */}
          <div className="flex bg-white p-6 justify-end space-x-4 pt-6">
          <button
              type="button"
              onClick={handleCancel}
              className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
              <X size={20} className="mr-2" />
              Cancel
          </button>
          <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
              <Save size={20} className="mr-2" />
              {isSubmitting ? 'Saving...' : 'Save'}
          </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReferralFirstPurchase;
