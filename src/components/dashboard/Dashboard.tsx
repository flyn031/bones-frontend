import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Activity, Box, Users, AlertTriangle, TrendingUp, RefreshCcw, 
  UserCircle, FileText, ShoppingCart, Briefcase, ExternalLink,
  DollarSign, Settings, Info
} from "lucide-react";
import { Button, Alert } from '@/components/ui';
import { CustomerHealthDashboard } from "./CustomerHealthDashboard";
import RecentActivitySection from './RecentActivitySection';
import JobStatusOverview from './JobStatusOverview';
import { fetchInventoryAlerts } from '../../utils/inventoryApi';
import { fetchFinancialMetrics } from '../../utils/financialApi';

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

interface JobStats {
  draft: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
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

interface InventoryAlert {
  id: string;
  materialName: string;
  currentStock: number;
  minStockLevel: number;
  status: 'Low' | 'Critical' | 'Backorder';
}

interface CustomerHealth {
  healthScores: Array<{
    customerId: string;
    name: string;
    overallScore: number;
    churnRisk: 'Low' | 'Medium' | 'High';
    potentialUpsell: boolean;
    insights: string[];
  }>;
  totalCustomers: number;
  churnRiskBreakdown: {
    low: number;
    medium: number;
    high: number;
  };
}

interface FinancialData {
  period: string;
  revenue: number;
  costs: number;
  profit: number;
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
  const [jobStats, setJobStats] = useState<JobStats>({
    draft: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0
  });
  const [orderTrends, setOrderTrends] = useState<OrderTrend[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [customerHealth, setCustomerHealth] = useState<CustomerHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Replace mock financial data with state
  const [financialData, setFinancialData] = useState<FinancialData[]>([
    { period: 'Jan', revenue: 95000, costs: 65000, profit: 30000 },
    { period: 'Feb', revenue: 105000, costs: 70000, profit: 35000 },
    { period: 'Mar', revenue: 115000, costs: 75000, profit: 40000 },
    { period: 'Apr', revenue: 125000, costs: 80000, profit: 45000 }
  ]);

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
      const [statsRes, trendsRes, activityRes, jobStatsRes] = await Promise.all([
        axios.get('http://localhost:4000/api/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get('http://localhost:4000/api/dashboard/trends', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get('http://localhost:4000/api/dashboard/activity', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get('http://localhost:4000/api/jobs/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Detailed logging of responses
      console.log('Stats Response:', statsRes.data);
      console.log('Trends Response:', trendsRes.data);
      console.log('Activity Response:', activityRes.data);
      console.log('Job Stats Response:', jobStatsRes.data);

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

      if (jobStatsRes.data) {
        setJobStats(jobStatsRes.data);
      } else {
        console.warn('No job stats data received');
      }

      const activityData = Array.isArray(activityRes.data) ? activityRes.data : [];
      setRecentActivity(activityData);

      // Fetch real inventory alerts from the API
      try {
        // Get inventory alerts
        const alertsData = await fetchInventoryAlerts();
        console.log('Inventory Alerts Response:', alertsData);
        
        if (Array.isArray(alertsData) && alertsData.length > 0) {
          // Format and limit to 5 most critical alerts for the dashboard display
          const formattedAlerts = alertsData
            .slice(0, 5)
            .map(alert => ({
              id: alert.id,
              materialName: alert.materialName,
              currentStock: alert.currentStock,
              minStockLevel: alert.minStockLevel,
              status: alert.status
            }));
          
          setInventoryAlerts(formattedAlerts);
          
          // Update the lowStock count in dashboard stats
          setStats(prevStats => ({
            ...prevStats,
            lowStock: alertsData.length
          }));
        } else {
          console.warn('No inventory alerts data or unexpected format');
          setInventoryAlerts([]);
        }
      } catch (alertError) {
        console.error('Error fetching inventory alerts:', alertError);
        // Fallback to empty alerts if there's an error
        setInventoryAlerts([]);
      }

      // Fetch real financial metrics data
      try {
        // Get financial metrics
        const financialMetricsData = await fetchFinancialMetrics();
        console.log('Financial Metrics Response:', financialMetricsData);
        
        // Transform the monthly trends into the format expected by the chart
        if (financialMetricsData && financialMetricsData.monthlyTrends) {
          const formattedData = financialMetricsData.monthlyTrends.map(item => ({
            period: item.month,
            revenue: item.revenue,
            costs: item.costs,
            profit: item.profit
          }));
          setFinancialData(formattedData);
        }
      } catch (financialError) {
        console.error('Error fetching financial metrics:', financialError);
        // Keep using mock data if API fails - already set as initial state
      }

      // Mock customer health data - would be replaced with actual API call
      setCustomerHealth({
        healthScores: [
          { customerId: 'C1', name: 'Acme Corp', overallScore: 92, churnRisk: 'Low', potentialUpsell: true, insights: ['Regular monthly orders', 'Consistent payment history'] },
          { customerId: 'C2', name: 'Smith Family', overallScore: 78, churnRisk: 'Medium', potentialUpsell: true, insights: ['Recently requested quote for additional work'] },
          { customerId: 'C3', name: 'Johnson Residence', overallScore: 85, churnRisk: 'Low', potentialUpsell: false, insights: ['Completed three jobs in past year'] },
          { customerId: 'C4', name: 'City Services', overallScore: 65, churnRisk: 'High', potentialUpsell: false, insights: ['Payment delays', 'Decreased order frequency'] },
          { customerId: 'C5', name: 'Tech Solutions Inc', overallScore: 88, churnRisk: 'Low', potentialUpsell: true, insights: ['Expanding office space', 'Consistent growth'] }
        ],
        totalCustomers: stats.totalCustomers || 32,
        churnRiskBreakdown: {
          low: 20,
          medium: 8,
          high: 4
        }
      });

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

  // Calculate totals for job stats
  const totalJobs = 
    jobStats.draft + 
    jobStats.pending + 
    jobStats.inProgress + 
    jobStats.completed + 
    jobStats.cancelled;

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

      {/* Main Dashboard Content - Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* First Column */}
        <div className="space-y-6">
          {/* Job Status Overview */}
          <JobStatusOverview jobStats={jobStats} />
          
          {/* Inventory Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
              Inventory Alerts
            </h2>
            
            {inventoryAlerts.length > 0 ? (
              <div className="space-y-3">
                {inventoryAlerts.map(alert => (
                  <div key={alert.id} className={`p-3 rounded-md ${
                    alert.status === 'Critical' ? 'bg-red-50 border-l-4 border-red-500' :
                    alert.status === 'Low' ? 'bg-amber-50 border-l-4 border-amber-500' :
                    'bg-orange-50 border-l-4 border-orange-500'
                  }`}>
                    <div className="flex justify-between">
                      <span className="font-medium">{alert.materialName}</span>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        alert.status === 'Critical' ? 'bg-red-100 text-red-800' :
                        alert.status === 'Low' ? 'bg-amber-100 text-amber-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Current: {alert.currentStock} | Minimum: {alert.minStockLevel}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No inventory alerts at this time.</p>
            )}
            
            <div className="mt-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/inventory')}
                className="text-sm text-blue-600 hover:text-blue-800 p-0"
              >
                View inventory →
              </Button>
            </div>
          </div>
        </div>
        
        {/* Second Column */}
        <div className="space-y-6">
          {/* Order Trends Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
              Order Trends
            </h3>
            <div className="h-64">
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
          
          {/* Customer Health Mini-View */}
          {customerHealth && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-500" />
                Customer Health
              </h2>
              
              {/* Donut Chart for Churn Risk */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Low Risk', value: customerHealth.churnRiskBreakdown.low },
                        { name: 'Medium Risk', value: customerHealth.churnRiskBreakdown.medium },
                        { name: 'High Risk', value: customerHealth.churnRiskBreakdown.high }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#4ade80" /> {/* Low - green */}
                      <Cell fill="#fbbf24" /> {/* Medium - amber */}
                      <Cell fill="#f87171" /> {/* High - red */}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} customers`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/customers')}
                  className="text-sm text-blue-600 hover:text-blue-800 p-0"
                >
                  View all customers →
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Third Column */}
        <div className="space-y-6">
          {/* Financial Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-emerald-500" />
              Financial Overview
            </h2>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={financialData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`£${value.toLocaleString()}`, '']} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  <Bar dataKey="costs" fill="#9ca3af" name="Costs" />
                  <Bar dataKey="profit" fill="#10b981" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/financial')}
                className="text-sm text-blue-600 hover:text-blue-800 p-0"
              >
                View financial reports →
              </Button>
            </div>
          </div>
          
          {/* Business Insights */}
          {customerHealth && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Info className="h-5 w-5 mr-2 text-blue-500" />
                Business Insights
              </h2>
              
              <ul className="space-y-3">
                {customerHealth.healthScores
                  .flatMap(score => score.insights
                    .map(insight => ({ customer: score.name, insight }))
                  )
                  .slice(0, 3)
                  .map((item, index) => (
                    <li key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="block text-sm font-medium text-blue-800">{item.customer}</span>
                      <span className="text-blue-700">{item.insight}</span>
                    </li>
                  ))}
                
                <li className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <span className="font-medium text-amber-800">Inventory Alert</span>
                  <span className="block text-amber-700">{stats.lowStock} materials below minimum stock levels</span>
                </li>
                
                <li className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <span className="font-medium text-green-800">Active Jobs</span>
                  <span className="block text-green-700">{jobStats.inProgress} jobs currently in progress</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Section */}
      <RecentActivitySection 
        activities={transformActivityData(recentActivity)} 
        isLoading={isLoading} 
      />

      {/* Full Customer Health Dashboard Section */}
      <div className="mt-8">
        <CustomerHealthDashboard />
      </div>
    </div>
  );
}