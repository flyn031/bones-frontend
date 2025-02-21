import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Box, Users, AlertTriangle, TrendingUp, RefreshCcw, UserCircle } from "lucide-react";

interface DashboardStats {
  activeOrders: number;
  totalSuppliers: number;
  lowStock: number;
  monthlyRevenue: number;
  totalCustomers: number;
}

interface OrderTrend {
  month: string;
  value: number;
}

interface RecentActivity {
  id: string;
  title: string;
  time: string;
  status: string;
  description?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    activeOrders: 0,
    totalSuppliers: 0,
    lowStock: 0,
    monthlyRevenue: 0,
    totalCustomers: 0
  });
  const [orderTrends, setOrderTrends] = useState<OrderTrend[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setError(null);
      if (!isRefreshing) setIsLoading(true);

      // Fetch all dashboard data in parallel using new endpoints
      const [statsRes, trendsRes, activityRes] = await Promise.all([
        axios.get('http://localhost:4000/api/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get('http://localhost:4000/api/dashboard/trends', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get('http://localhost:4000/api/dashboard/activity', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data);
      setOrderTrends(trendsRes.data);
      setRecentActivity(activityRes.data);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      setError('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  if (isLoading && !isRefreshing) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 
            onClick={handleRefresh}
            className="text-3xl font-bold hover:text-blue-600 transition-colors cursor-pointer"
          >
            BONES CRM Dashboard
          </h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="Refresh dashboard"
        >
          <RefreshCcw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {/* Active Orders Card */}
        <div 
          onClick={() => navigate('/orders')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Active Orders</h3>
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold">{stats.activeOrders}</div>
          <p className="text-sm text-gray-500">Orders in progress</p>
        </div>

        {/* Suppliers Card */}
        <div 
          onClick={() => navigate('/suppliers')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Total Suppliers</h3>
            <Users className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
          <p className="text-sm text-gray-500">Active partnerships</p>
        </div>

        {/* Customers Card */}
        <div 
          onClick={() => navigate('/customers')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Total Customers</h3>
            <UserCircle className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          <p className="text-sm text-gray-500">Active customers</p>
        </div>

        {/* Low Stock Card */}
        <div 
          onClick={() => navigate('/inventory')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Low Stock Items</h3>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold">{stats.lowStock}</div>
          <p className="text-sm text-gray-500">Need attention</p>
        </div>

        {/* Revenue Card */}
        <div 
          onClick={() => navigate('/financial')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Monthly Revenue</h3>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleString('default', { month: 'long' })}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Order Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={orderTrends}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis 
                  dataKey="month" 
                  stroke="#6B7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4">
              <Box className="h-4 w-4 mt-1 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">{activity.title}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span>{activity.time}</span>
                  <span className="mx-2">•</span>
                  <span>{activity.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}