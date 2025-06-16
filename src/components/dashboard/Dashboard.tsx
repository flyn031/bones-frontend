import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, Legend, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts';
import {
  Activity, Users, AlertTriangle, TrendingUp, RefreshCcw,
  UserCircle, DollarSign, Info, LayoutDashboard, Brain
} from "lucide-react";

// --- UI Component Imports ---
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

// --- Dashboard Specific Component Imports ---
import EnhancedCustomerHealthDashboard from "./EnhancedCustomerHealthDashboard";
import RecentActivitySection from './RecentActivitySection';
import JobStatusOverview from './JobStatusOverview';
import MonthlyQuotesWidget from "./MonthlyQuotesWidget";
import { OrderTrendKPICard } from './OrderTrendKPICard';

// --- API Utility Imports ---
import { dashboardApi, jobApi } from '../../utils/api';
import { fetchInventoryAlerts } from '../../utils/inventoryApi';
import { fetchFinancialMetrics } from '../../utils/financialApi';
import { useAuth } from '../../context/AuthContext';

// --- Interface Definitions ---
interface DashboardStats {
  activeOrders: number;
  totalSuppliers: number;
  lowStock: number;
  monthlyRevenue: number;
  totalCustomers: number;
}

interface JobStats {
  draft: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  [key: string]: number;
}

interface RecentActivity {
  id: string;
  title: string;
  time: string;
  status: string;
  type: 'quote' | 'order' | 'job' | 'customer' | 'supplier' | 'inventory';
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

// Fixed: JSX-safe helper type guards for Promise results - moved outside component
function isPromiseFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled';
}

// Default empty/mock states
const defaultJobStats: JobStats = { draft: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 };
const defaultFinancialData: FinancialData[] = [
  { period: 'Jan', revenue: 95000, costs: 65000, profit: 30000 },
  { period: 'Feb', revenue: 105000, costs: 70000, profit: 35000 },
  { period: 'Mar', revenue: 115000, costs: 75000, profit: 40000 },
  { period: 'Apr', revenue: 125000, costs: 80000, profit: 45000 }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [dashboardView, setDashboardView] = useState('overview' as 'overview' | 'customerHealth');

  // --- State Variables - Fixed: Use explicit typing instead of generics in JSX context ---
  const [stats, setStats] = useState({
    activeOrders: 0, 
    totalSuppliers: 0, 
    lowStock: 0, 
    monthlyRevenue: 0, 
    totalCustomers: 0 
  } as DashboardStats);
  
  const [jobStats, setJobStats] = useState(defaultJobStats as JobStats);
  const [recentActivity, setRecentActivity] = useState([] as RecentActivity[]);
  const [inventoryAlerts, setInventoryAlerts] = useState([] as InventoryAlert[]);
  const [customerHealth, setCustomerHealth] = useState(null as CustomerHealth | null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null as string | null);
  const [financialData, setFinancialData] = useState(defaultFinancialData as FinancialData[]);

  // --- Helper: transformActivityData ---
  const transformActivityData = useCallback((rawData: any[]): RecentActivity[] => {
    if (!Array.isArray(rawData)) return [];
    return rawData.map(item => {
      let type: RecentActivity['type'] = 'inventory';
      let title = item.title || 'Activity';
      
      if (item.type === 'order' || (item.projectTitle !== undefined && item.status !== undefined)) { 
        type = 'order'; 
        title = `Order: ${item.projectTitle || item.id || 'N/A'}`; 
      } else if (item.type === 'customer' || (item.email !== undefined && item.status === 'Added')) { 
        type = 'customer'; 
        title = `Customer: ${item.name || item.id}`; 
      } else if (item.type === 'quote' || item.quoteRef !== undefined) { 
        type = 'quote'; 
        title = `Quote: ${item.quoteRef || item.id}`; 
      } else if (item.type === 'job') { 
        type = 'job'; 
        title = `Job: ${item.jobTitle || item.id}`; 
      }

      const formatDate = (date: Date | string | null | undefined): string => {
        if (!date) return 'N/A';
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) return 'Invalid Date';
        return dateObj.toLocaleString('en-GB', { 
          hour: 'numeric', 
          minute: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      };

      return {
        id: item.id || `activity-${Math.random()}`,
        title: title,
        time: formatDate(item.time || item.originalDate || item.createdAt || item.updatedAt),
        status: item.status || 'Info',
        type: type,
        entityId: item.entityId || item.id,
        description: item.description || '',
        quoteRef: item.quoteRef,
        customerName: item.customerName,
        projectTitle: item.projectTitle
      };
    });
  }, []);

  // --- Data Fetching Logic ---
  const fetchDashboardData = useCallback(async (authStatus: boolean | null) => {
    if (authStatus !== true) {
      console.log("fetchDashboardData: Not authenticated, setting defaults.");
      setStats({ activeOrders: 0, totalSuppliers: 0, lowStock: 0, monthlyRevenue: 0, totalCustomers: 0 });
      setJobStats(defaultJobStats); 
      setRecentActivity([]); 
      setInventoryAlerts([]); 
      setCustomerHealth(null); 
      setFinancialData(defaultFinancialData); 
      setError(null);
      return;
    }
    
    console.log('Fetching dashboard data...');
    setError(null);

    try {
      const results = await Promise.allSettled([
        dashboardApi.getStats(), 
        dashboardApi.getRecentActivity(), 
        jobApi.getJobStats(),
        fetchInventoryAlerts(), 
        fetchFinancialMetrics(), 
        dashboardApi.getCustomerHealth()
      ]);
      
      console.log('API Fetch Results:', results);

      let lowStockCount = 0;

      // Fixed: Process results safely with proper type guards
      const statsResult = results[0];
      if (isPromiseFulfilled(statsResult) && statsResult.value?.data) {
        const statsData = statsResult.value.data as Partial<DashboardStats>;
        setStats(prev => ({ ...prev, ...statsData }));
      } else {
        console.warn('Failed fetch stats');
      }
      
      const activityResult = results[1];
      if (isPromiseFulfilled(activityResult) && Array.isArray(activityResult.value?.data)) {
        const activityData = activityResult.value.data;
        setRecentActivity(transformActivityData(activityData));
      } else {
        console.warn('Failed fetch activity');
        setRecentActivity([]);
      }
      
      const jobStatsResult = results[2];
      if (isPromiseFulfilled(jobStatsResult) && jobStatsResult.value?.data) {
        const jobStatsData = jobStatsResult.value.data as JobStats;
        setJobStats(jobStatsData);
      } else {
        console.warn('Failed fetch job stats');
        setJobStats(defaultJobStats);
      }
      
      const inventoryResult = results[3];
      if (isPromiseFulfilled(inventoryResult) && Array.isArray(inventoryResult.value)) {
        const inventoryData = inventoryResult.value as InventoryAlert[];
        setInventoryAlerts(inventoryData.slice(0, 5));
        lowStockCount = inventoryData.length;
      } else {
        console.warn('Failed fetch alerts');
        setInventoryAlerts([]);
      }
      
      // Fixed: Update lowStock count safely
      setStats(prev => ({ ...prev, lowStock: lowStockCount }));
      
      // Fixed: Financial metrics processing with proper type checking
      const financialResult = results[4];
      if (isPromiseFulfilled(financialResult)) {
        const financialMetricsData = financialResult.value as any;
        if (financialMetricsData?.monthlyTrends) {
          const formattedData = (financialMetricsData.monthlyTrends || []).map((item: any) => ({
            period: item.month || 'N/A', 
            revenue: item.revenue || 0, 
            costs: item.costs || 0, 
            profit: item.profit || 0
          }));
          setFinancialData(formattedData);
        } else {
          console.warn('Failed fetch financial metrics - no monthlyTrends');
          setFinancialData(defaultFinancialData);
        }
      } else {
        console.warn('Failed fetch financial metrics');
        setFinancialData(defaultFinancialData);
      }
      
      const customerHealthResult = results[5];
      if (isPromiseFulfilled(customerHealthResult) && customerHealthResult.value?.data) {
        const customerHealthData = customerHealthResult.value.data as CustomerHealth;
        setCustomerHealth(customerHealthData);
      } else {
        console.warn('Failed fetch customer health');
        setCustomerHealth(null);
      }

    } catch (error: any) {
      console.error('Error processing dashboard data:', error);
      setError(`Failed to process dashboard data: ${error.message}`);
    }
  }, [transformActivityData]);

  // --- Effect Hook for Initial Load / Auth Change ---
  useEffect(() => {
    console.log("Dashboard useEffect triggered. isAuthenticated:", isAuthenticated);
    let isMounted = true;

    const initOrRefetch = async () => {
      if (isAuthenticated !== null) {
        console.log("Auth determined, calling fetchDashboardData");
        if (isMounted) setIsLoading(true);
        await fetchDashboardData(isAuthenticated);
        if (isMounted) setIsLoading(false);
      } else {
        console.log("Auth not determined yet, waiting...");
        if (isMounted) setIsLoading(true);
      }
    };

    initOrRefetch();

    return () => { isMounted = false; };
  }, [isAuthenticated, fetchDashboardData]);

  // --- handleRefresh function ---
  const handleRefresh = useCallback(async () => {
    console.log("Manual refresh triggered");
    setIsRefreshing(true); 
    setError(null);
    await fetchDashboardData(isAuthenticated);
    setIsRefreshing(false);
  }, [fetchDashboardData, isAuthenticated]);

  // --- Other Helpers ---
  const LoadingState = () => (
    <div className="p-8 flex justify-center items-center min-h-screen">
      <div className="text-center">
        <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
        <p className="text-neutral-600 dark:text-neutral-400">Loading dashboard...</p>
      </div>
    </div>
  );

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    description, 
    onClick, 
    iconColor 
  }: { 
    icon: React.ElementType;
    title: string;
    value: number | string;
    description: string;
    onClick?: () => void;
    iconColor: string;
  }) => (
    <div 
      onClick={onClick} 
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-soft p-4 md:p-6 transition-shadow border dark:border-gray-700 ${
        onClick ? 'hover:shadow-medium cursor-pointer hover:bg-neutral-50 dark:hover:bg-gray-700 group' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1 md:mb-2">
        <h3 className="text-xs md:text-sm font-medium text-neutral-700 dark:text-gray-300">
          {title}
        </h3>
        <Icon className={`h-4 w-4 md:h-5 md:w-5 ${iconColor} ${
          onClick ? 'group-hover:scale-110 transition-transform' : ''
        }`} />
      </div>
      <div className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-gray-100">
        {value}
      </div>
      <p className="text-xs md:text-sm text-neutral-500 dark:text-gray-400 mt-1">
        {description}
      </p>
    </div>
  );

  // --- Render Logic ---
  if (isLoading && !isRefreshing) {
    return <LoadingState />;
  }

  return (
    <div className="p-4 md:p-8 max-w-full xl:max-w-7xl mx-auto">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 
            onClick={handleRefresh} 
            className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-transparent cursor-pointer select-none dark:from-neutral-300 dark:to-neutral-500"
          >
            Dashboard
          </h2>
        </div>
        <Button 
          variant="ghost" 
          onClick={handleRefresh} 
          disabled={isRefreshing} 
          className={`p-2 text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCcw className="h-5 w-5" />
        </Button>
      </div>

      {/* Dashboard View Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button 
          className={`px-4 py-2 md:px-6 md:py-3 flex items-center space-x-2 border-b-2 font-medium text-sm md:text-base transition-colors duration-150 ${
            dashboardView === 'overview' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
          }`} 
          onClick={() => setDashboardView('overview')}
        >
          <LayoutDashboard className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
          <span>Overview</span>
        </button>
        <button 
          className={`px-4 py-2 md:px-6 md:py-3 flex items-center space-x-2 border-b-2 font-medium text-sm md:text-base transition-colors duration-150 ${
            dashboardView === 'customerHealth' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
          }`} 
          onClick={() => setDashboardView('customerHealth')}
        >
          <Brain className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
          <span>Customer Health</span>
          <span className="ml-1 md:ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            AI
          </span>
        </button>
      </div>

      {/* Error Display */}
      {error && !isRefreshing && (
        <Alert type="error" message={error} className="mb-6 md:mb-8" />
      )}

      {/* Main Content Area */}
      {dashboardView === 'overview' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
            <StatCard 
              icon={Activity} 
              title="Active Orders" 
              value={stats.activeOrders} 
              description="In progress" 
              onClick={() => navigate('/orders')} 
              iconColor="text-blue-500" 
            />
            <StatCard 
              icon={Users} 
              title="Suppliers" 
              value={stats.totalSuppliers} 
              description="Active partners" 
              onClick={() => navigate('/suppliers')} 
              iconColor="text-green-600" 
            />
            <StatCard 
              icon={UserCircle} 
              title="Customers" 
              value={stats.totalCustomers} 
              description="Total active" 
              onClick={() => navigate('/customers')} 
              iconColor="text-indigo-600" 
            />
            <StatCard 
              icon={AlertTriangle} 
              title="Low Stock" 
              value={stats.lowStock} 
              description="Items need attention" 
              onClick={() => navigate('/inventory')} 
              iconColor="text-red-600" 
            />
            <StatCard 
              icon={TrendingUp} 
              title="Revenue (MTD)" 
              value={`£${stats.monthlyRevenue.toLocaleString('en-GB', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
              })}`} 
              description={new Date().toLocaleString('default', { month: 'long' })} 
              onClick={() => navigate('/financial')} 
              iconColor="text-purple-600" 
            />
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Col 1 */}
            <div className="space-y-6">
              <JobStatusOverview jobStats={jobStats} />
              <MonthlyQuotesWidget />
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 border dark:border-gray-700">
                <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-200">
                  <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                  Inventory Alerts
                </h2>
                {inventoryAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {inventoryAlerts.map(alert => (
                      <div 
                        key={alert.id} 
                        className={`p-3 rounded-md text-sm ${
                          alert.status === 'Critical' 
                            ? 'bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500' 
                            : alert.status === 'Low' 
                            ? 'bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500' 
                            : 'bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {alert.materialName}
                          </span>
                          <span 
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              alert.status === 'Critical' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' 
                                : alert.status === 'Low' 
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-amber-100' 
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-100'
                            }`}
                          >
                            {alert.status}
                          </span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 mt-1">
                          Current: {alert.currentStock} | Min: {alert.minStockLevel}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No inventory alerts.</p>
                )}
                <div className="mt-4">
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/inventory')} 
                    className="text-sm p-0 h-auto text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View inventory →
                  </Button>
                </div>
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-6">
              <OrderTrendKPICard />
              {customerHealth && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 border dark:border-gray-700">
                  <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-200">
                    <Users className="h-5 w-5 mr-2 text-green-500" />
                    Customer Health
                  </h2>
                  <div className="h-40 md:h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={[
                            { name: 'Low', value: customerHealth.churnRiskBreakdown.low }, 
                            { name: 'Med', value: customerHealth.churnRiskBreakdown.medium }, 
                            { name: 'High', value: customerHealth.churnRiskBreakdown.high }
                          ]} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius="60%" 
                          outerRadius="80%" 
                          fill="#8884d8" 
                          dataKey="value"
                        >
                          <Cell fill="#4ade80" />
                          <Cell fill="#fbbf24" />
                          <Cell fill="#f87171" />
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} customers`, name]} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4">
                    <Button 
                      variant="link" 
                      onClick={() => setDashboardView('customerHealth')} 
                      className="text-sm p-0 h-auto text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View AI insights →
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Col 3 */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 border dark:border-gray-700">
                <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-200">
                  <DollarSign className="h-5 w-5 mr-2 text-emerald-500" />
                  Financial Overview
                </h2>
                <div className="h-60 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                      <XAxis dataKey="period" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(value) => `£${value/1000}k`} />
                      <Tooltip formatter={(value: number) => [`£${value.toLocaleString()}`, '']} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                      <Bar dataKey="costs" fill="#9ca3af" name="Costs" />
                      <Bar dataKey="profit" fill="#10b981" name="Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4">
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/financial')} 
                    className="text-sm p-0 h-auto text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View reports →
                  </Button>
                </div>
              </div>
              
              {customerHealth && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 border dark:border-gray-700">
                  <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-200">
                    <Info className="h-5 w-5 mr-2 text-blue-500" />
                    Key Insights
                  </h2>
                  <ul className="space-y-2 text-sm">
                    {customerHealth.healthScores
                      .filter(s => s.churnRisk === 'High' || s.potentialUpsell)
                      .slice(0, 2)
                      .map((s) => (
                        <li 
                          key={s.customerId} 
                          className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-100 dark:border-gray-700"
                        >
                          <span className="block font-medium text-gray-800 dark:text-gray-200">
                            {s.name}
                          </span>
                          <span 
                            className={`text-gray-600 dark:text-gray-400 ${
                              s.churnRisk === 'High' 
                                ? 'text-red-600 dark:text-red-400' 
                                : s.potentialUpsell 
                                ? 'text-green-600 dark:text-green-400' 
                                : ''
                            }`}
                          >
                            {s.churnRisk === 'High' 
                              ? 'High Churn Risk' 
                              : s.potentialUpsell 
                              ? 'Upsell Potential' 
                              : ''}
                            {s.insights.length > 0 ? `: ${s.insights[0]}` : ''}
                          </span>
                        </li>
                      ))
                    }
                    {stats.lowStock > 0 && (
                      <li className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded border border-amber-100 dark:border-amber-800/50">
                        <span className="font-medium text-amber-800 dark:text-amber-300">Inventory: </span>
                        <span className="text-amber-700 dark:text-amber-400">
                          {stats.lowStock} items below min. stock
                        </span>
                      </li>
                    )}
                    {jobStats.inProgress > 0 && (
                      <li className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-100 dark:border-blue-800/50">
                        <span className="font-medium text-blue-800 dark:text-blue-300">Jobs: </span>
                        <span className="text-blue-700 dark:text-blue-400">
                          {jobStats.inProgress} currently in progress
                        </span>
                      </li>
                    )}
                    {customerHealth.healthScores.length === 0 && stats.lowStock === 0 && jobStats.inProgress === 0 && (
                      <li className="text-gray-500 dark:text-gray-400">No specific insights available.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <RecentActivitySection activities={recentActivity} isLoading={isLoading || isRefreshing} />
        </>
      ) : (
        <EnhancedCustomerHealthDashboard />
      )}
    </div>
  );
}