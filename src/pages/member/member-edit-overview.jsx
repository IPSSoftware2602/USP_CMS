import React, { useEffect, useState } from 'react';
import { X, User, MapPin, ShoppingCart, CreditCard, Gift, Star, Wallet, Calendar, Clock, Home, CreditCard as CreditCardIcon, Activity } from 'lucide-react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { VITE_API_BASE_URL } from '../../constant/config';

export default function MemberEditOverview() {
  const navigate = useNavigate();
  const authToken = sessionStorage.getItem('token');
  const { id } = useParams();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${VITE_API_BASE_URL}customer-dashboard/${id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load customer dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get status color and text
  const getStatusInfo = (status) => {
    switch (status) {
      case 'active':
        return { color: 'text-green-600', bg: 'bg-green-100', text: 'Active' };
      case 'dormant':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Dormant' };
      case 'churned':
        return { color: 'text-red-600', bg: 'bg-red-100', text: 'Churned' };
      case 'new':
        return { color: 'text-blue-600', bg: 'bg-blue-100', text: 'New' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', text: 'Unknown' };
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-lg w-full mx-auto shadow-lg">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-950"></div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-lg w-full mx-auto shadow-lg">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const { orders, topups, wallet, points, vouchers, lifecycle, checkins } = dashboardData;
  const statusInfo = getStatusInfo(lifecycle?.customer_status);

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg w-full mx-auto shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Overview</h1>
        <button className="p-1 rounded-full hover:bg-gray-100" onClick={handleBack}>
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-4 mb-6">
        {[
          { icon: User, label: "Profile", link: `member/member_overview/member_profile/${id}`, key: 'profile' },
          { icon: MapPin, label: "Address", link: `member/member_overview/member_address/${id}`, key: 'address' },
          { icon: ShoppingCart, label: "Order Record", link: `member/member_overview/member_order/${id}`, key: 'order' },
          { icon: CreditCard, label: "Topup Record", link: `member/member_overview/member_topup/${id}`, key: 'topup' },
          { icon: Gift, label: "Voucher Record", link: `member/member_overview/member_voucher/${id}`, key: 'voucher' },
          { icon: Star, label: "Point", link: `member/member_overview/member_point/${id}`, key: 'point' },
          { icon: Wallet, label: "Wallet", link: `member/member_overview/member_wallet/${id}`, key: 'wallet' },
        ].map((tab) => (
          <Link
            key={tab.label}
            to={`/${tab.link}`}
            className="flex items-center gap-2 bg-indigo-950 text-white p-3 rounded-lg cursor-pointer justify-center"
          >
            <div className="rounded-full mr-1 text-center">
              <tab.icon size={20} />
            </div>
            <span className="font-medium text-sm text-center md:text-base">{tab.label}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {/* Left section - Customer Overview */}
        <div className="w-full lg:flex-1 border rounded-lg p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Customer Overview</h2>

          {/* Revenue, Transaction Count, Activity Count */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Lifetime Revenue</p>
              <p className="text-xl md:text-2xl font-bold">RM{orders?.total_grand || '0.00'}</p>
              <p className="text-xs md:text-sm text-gray-400">{orders?.total_orders || 0} orders</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Transaction Count</p>
              <p className="text-xl md:text-2xl font-bold">{orders?.total_orders || 0}</p>
              <p className="text-xs md:text-sm text-gray-400">Orders completed</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Topup Amount</p>
              <p className="text-xl md:text-2xl font-bold">RM{topups?.total_topup_amount || '0.00'}</p>
              <p className="text-xs md:text-sm text-gray-400">{topups?.total_topups || 0} topups</p>
            </div>
          </div>

          <hr className="my-4 md:my-6" />

          {/* Wallet, Vouchers, Credits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600 text-sm mb-1">Wallet Balance</p>
              <p className="text-xl md:text-2xl font-bold">RM{wallet?.total_wallet_balance || '0.00'}</p>
              <p className="text-xs md:text-sm text-gray-400">Current balance</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Active Vouchers</p>
              <p className="text-xl md:text-2xl font-bold">{vouchers?.summary?.active_vouchers || 0}</p>
              <p className="text-xs md:text-sm text-gray-400">Total: {vouchers?.summary?.total_vouchers || 0}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Points</p>
              <p className="text-xl md:text-2xl font-bold">
                {points?.current_points ? Math.floor(points.current_points) : '0'}
              </p>
              <p className="text-xs md:text-sm text-gray-400">From points</p>
            </div>
          </div>
        </div>

        {/* Right section - Wallet Summary */}
        <div className="w-full lg:w-96 border rounded-lg p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Wallet Summary</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total In</p>
              <p className="text-xl font-bold text-green-600">+RM{topups?.total_in || '0.00'}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Out</p>
              <p className="text-xl font-bold text-red-600">-RM{topups?.total_out || '0.00'}</p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-gray-600 text-sm mb-1">Customer Status</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
              {lifecycle?.days_since_last_activity && (
                <p className="text-md text-gray-500 mt-1 ">
                  {lifecycle.days_since_last_activity} days since last activity
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lifecycle Insight */}
      {lifecycle && (
        <div className="border rounded-lg p-4 md:p-6 mt-4 md:mt-6">
          <h2 className="text-lg font-semibold mb-4 md:mb-6 flex items-center gap-2">
            <Activity size={20} className="text-indigo-600" />
            Lifecycle Insight
          </h2>

          <div className="flex flex-wrap justify-between mb-6 gap-4">
            {/* First Activity */}
            <div className="text-center w-20">
              <p className="font-medium text-xs md:text-sm">{formatDate(lifecycle.first_activity)}</p>
              <div className="mt-2 p-1 md:p-2 flex justify-center">
                <Home size={20} className="text-indigo-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">First Seen</p>
            </div>

            {/* First Order */}
            <div className="text-center w-20">
              <p className="font-medium text-xs md:text-sm">{formatDate(lifecycle.first_order)}</p>
              <div className="mt-2 p-1 md:p-2 flex justify-center">
                <ShoppingCart size={20} className="text-indigo-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">First Order</p>
            </div>

            {/* First Topup */}
            <div className="text-center w-20">
              <p className="font-medium text-xs md:text-sm">{formatDate(lifecycle.first_topup)}</p>
              <div className="mt-2 p-1 md:p-2 flex justify-center">
                <CreditCardIcon size={20} className="text-indigo-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">First Topup</p>
            </div>

            {/* Last Activity */}
            <div className="text-center w-20">
              <p className="font-medium text-xs md:text-sm">{formatDate(lifecycle.last_activity)}</p>
              <div className="mt-2 p-1 md:p-2 flex justify-center">
                <Clock size={20} className="text-indigo-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Last Activity</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative pt-4 px-2">
            <div className="absolute h-1 bg-indigo-950 left-0 right-0 top-0 rounded-full"></div>
            <div className="flex justify-between">
              {[
                { label: 'First Seen', date: lifecycle.first_activity },
                { label: 'First Order', date: lifecycle.first_order },
                { label: 'First Topup', date: lifecycle.first_topup },
                { label: 'Latest Activity', date: lifecycle.last_activity }
              ].map((milestone, index) => (
                <div key={milestone.label} className="flex flex-col items-center">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-indigo-950 rounded-full -mt-6 md:-mt-8 mb-2"></div>
                  <p className="text-xs md:text-sm text-center">{milestone.label}</p>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    {formatDate(milestone.date)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Status Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Customer Status: <span className={statusInfo.color}>{statusInfo.text}</span></p>
                {lifecycle.days_since_last_activity && (
                  <p className="text-sm text-gray-600">
                    {lifecycle.days_since_last_activity} days since last activity
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Orders: {orders?.total_orders || 0}</p>
                <p className="text-sm text-gray-600">Total Topups: {topups?.total_topups || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}