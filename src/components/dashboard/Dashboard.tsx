import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Activity, Box, Users, AlertTriangle, TrendingUp, RefreshCcw, 
  UserCircle, FileText, ShoppingCart, Briefcase, ExternalLink 
} from "lucide-react";
import { Button, Alert } from '@/components/ui';
import { CustomerHealthDashboard } from "./CustomerHealthDashboard";
import RecentActivitySection from './RecentActivitySection';

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
  type?: 'quote' | 'order' | 'job' | 'customer' | 'supplier' | 'inventory';
  entityId?: string;
  description?: string;
  quoteRef?: string;
  customerName?: string;
  projectTitle?: string;
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
    console.log('Fetching dashboard data - Token exists:', !!token);

    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }

    try {
      setError(null);
      if (!isRefreshing) setIsLoading(true);

      console.log('Initiating parallel data fetch...');

      // Fetch all dashboard data in parallel
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

      // Detailed logging of responses
      console.log('Stats Response:', statsRes.data);
      console.log('Trends Response:', trendsRes.data);
      console.log('Activity Response:', activityRes.data);

      // Validate and set data with additional checks
      if (statsRes.data) {
        setStats(prevStats => ({
          ...prevStats,
          ...statsRes.data
        }));
      } else {
        console.warn('No stats data received');
      }

      if (Array.isArray(trendsRes.data)) {
        setOrderTrends(trendsRes.data);
      } else {
        console.warn('Invalid trends data:', trendsRes.data);
        setOrderTrends([]);
      }

      const activityData = Array.isArray(activityRes.data) ? activityRes.data : [];
      setRecentActivity(activityData);

    } catch (error: any) {
      console.error('Full error details:', error);

      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        if (error.response.status === 403) {
          console.log('Unauthorized access, removing token');
          localStorage.removeItem('token');
          navigate('/login');
        }

        setError(`Failed to fetch dashboard data: ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        setError('No response from server. Please check your network connection.');
      } else {
        console.error('Error setting up request:', error.message);
        setError(`Request setup error: ${error.message}`);
      }
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

  const getActivityIcon = (type: RecentActivity['type']) => {
    const icons = {
      'quote': FileText,
      'order': ShoppingCart,
      'job': Briefcase,
      'customer': UserCircle,
      'supplier': Users,
      'inventory': Box
    };
    return icons[type] || Box;
  };

  const navigateToActivity = (activity: RecentActivity) => {
    const routes = {
      'quote': `/quotes/${activity.entityId}`,
      'order': `/orders/${activity.entityId}`,
      'job': `/jobs/${activity.entityId}`,
      'customer': `/customers/${activity.entityId}`,
      'supplier': `/suppliers/${activity.entityId}`,
      'inventory': `/inventory`
    };
    navigate(routes[activity.type]);
  };

  // Loading state component
  const LoadingState = () => (
    <div className="p-8 flex justify-center items-center min-h-screen">
      <div className="text-center">
        <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-500" />
        <p className="text-neutral-600">Loading dashboard data...</p>
      </div>
    </div>
  );

  // Stat Card Component
  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    description, 
    onClick,
    iconColor 
  }: { 
    icon: React.ElementType, 
    title: string, 
    value: number | string, 
    description: string, 
    onClick: () => void,
    iconColor: string
  }) => (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-soft p-6 hover:shadow-medium transition-shadow cursor-pointer hover:bg-neutral-50 group"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-neutral-700">{title}</h3>
        <Icon className={`h-5 w-5 ${iconColor} group-hover:scale-110 transition-transform`} />
      </div>
      <div className="text-2xl font-bold text-neutral-900">{value}</div>
      <p className="text-sm text-neutral-500">{description}</p>
    </div>
  );

  // Transform the raw API data into the format expected by RecentActivitySection
  const transformActivityData = (rawData: any[]): RecentActivity[] => {
    if (!Array.isArray(rawData)) return [];
    
    return rawData.map(item => {
      // Determine the activity type based on available properties
      let type: RecentActivity['type'] = 'order';
      if (item.quoteRef) type = 'quote';
      else if (item.jobId) type = 'job';
      
      // Create a transformed activity object
      return {
        id: item.id,
        title: item.projectTitle || item.title || (item.quoteRef ? `Quote ${item.quoteRef}` : 'Activity'),
        time: new Date(item.createdAt || item.updatedAt).toLocaleString('en-US', { 
          hour: 'numeric', 
          minute: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        status: item.status || 'ACTIVE',
        type,
        entityId: item.id,
        quoteRef: item.quoteRef,
        customerName: item.customerName,
        projectTitle: item.projectTitle
      };
    });
  };

  // Render loading state if initial load
  if (isLoading && !isRefreshing) {
    return <LoadingState />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 
            onClick={handleRefresh}
            className="text-3xl font-bold 
                       bg-gradient-to-r from-neutral-800 to-neutral-600 
                       bg-clip-text text-transparent 
                       cursor-pointer 
                       select-none"
          >
            BONES CRM Dashboard
          </h2>
        </div>
        <Button 
          variant="ghost"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={isRefreshing ? 'opacity-50' : ''}
        >
          <RefreshCcw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Error Handling */}
      {error && (
        <Alert 
          type="error" 
          message={error} 
          className="mb-8" 
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          icon={Activity}
          title="Active Orders"
          value={stats.activeOrders}
          description="Orders in progress"
          onClick={() => navigate('/orders')}
          iconColor="text-brand-500"
        />
        <StatCard
          icon={Users}
          title="Total Suppliers"
          value={stats.totalSuppliers}
          description="Active partnerships"
          onClick={() => navigate('/suppliers')}
          iconColor="text-green-600"
        />
        <StatCard
          icon={UserCircle}
          title="Total Customers"
          value={stats.totalCustomers}
          description="Active customers"
          onClick={() => navigate('/customers')}
          iconColor="text-indigo-600"
        />
        <StatCard
          icon={AlertTriangle}
          title="Low Stock Items"
          value={stats.lowStock}
          description="Need attention"
          onClick={() => navigate('/inventory')}
          iconColor="text-red-600"
        />
        <StatCard
          icon={TrendingUp}
          title="Monthly Revenue"
          value={`£${stats.monthlyRevenue.toLocaleString('en-GB', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`}
          description={new Date().toLocaleString('default', { month: 'long' })}
          onClick={() => navigate('/financial')}
          iconColor="text-purple-600"
        />
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
      <RecentActivitySection 
        activities={transformActivityData(recentActivity)} 
        isLoading={isLoading} 
      />

      {/* Customer Health Dashboard Section */}
      <div className="mt-8">
        <CustomerHealthDashboard />
      </div>
    </div>
  );
}