import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, Legend, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts';
import {
  Activity, Users, AlertTriangle, TrendingUp, RefreshCcw,
  UserCircle, DollarSign, Info, LayoutDashboard, Brain, Zap
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
        title = `Production Order: ${item.projectTitle || item.id || 'N/A'}`; 
      } else if (item.type === 'customer' || (item.email !== undefined && item.status === 'Added')) { 
        type = 'customer'; 
        title = `Client: ${item.name || item.id}`; 
      } else if (item.type === 'quote' || item.quoteRef !== undefined) { 
        type = 'quote'; 
        title = `Quote: ${item.quoteRef || item.id}`; 
      } else if (item.type === 'job') { 
        type = 'job'; 
        title = `Manufacturing Job: ${item.jobTitle || item.id}`; 
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="p-8 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <RefreshCcw className="h-12 w-12 animate-spin mx-auto mb-6 text-cyan-400" />
          <p className="text-slate-300 text-lg">Loading Manufacturing Dashboard...</p>
          <div className="mt-4 flex items-center justify-center space-x-1 text-cyan-400">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    description, 
    onClick, 
    iconColor,
    gradient 
  }: { 
    icon: React.ElementType;
    title: string;
    value: number | string;
    description: string;
    onClick?: () => void;
    iconColor: string;
    gradient?: string;
  }) => (
    <div 
      onClick={onClick} 
      className={`bg-white/95 backdrop-blur-sm border border-slate-200/50 rounded-xl shadow-xl p-4 md:p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 relative overflow-hidden ${
        onClick ? 'cursor-pointer group' : ''
      }`}
    >
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 opacity-5 ${gradient || 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}></div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wide">
            {title}
          </h3>
          <div className={`p-2 rounded-lg ${iconColor} bg-white/80 shadow-sm`}>
            <Icon className="h-4 w-4 md:h-5 md:w-5" />
          </div>
        </div>
        <div className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
          {value}
        </div>
        <p className="text-xs md:text-sm text-slate-600">
          {description}
        </p>
        
        {/* Connecting line hint */}
        {onClick && (
          <div className="absolute -right-1 top-1/2 w-4 h-px bg-gradient-to-r from-cyan-400 to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
        )}
      </div>
    </div>
  );

  // --- Render Logic ---
  if (isLoading && !isRefreshing) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Geometric background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 border-2 border-cyan-400/30 rounded-lg rotate-12"></div>
        <div className="absolute top-40 right-40 w-24 h-24 border border-blue-400/20 rounded-full"></div>
        <div className="absolute bottom-32 left-1/3 w-16 h-16 border border-cyan-300/20 rotate-45"></div>
        <div className="absolute top-1/3 right-1/4 w-20 h-20 border-2 border-blue-300/20 rounded-lg -rotate-12"></div>
      </div>
      
      <div className="relative z-10 p-4 md:p-8 max-w-full xl:max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Manufacturing Command Center
            </h1>
            <div className="flex items-center space-x-2 text-cyan-400">
              <Zap className="h-5 w-5" />
              <p className="text-lg">The X-Factor in Manufacturing Management</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleRefresh} 
            disabled={isRefreshing} 
            className={`p-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 ${isRefreshing ? 'animate-spin' : 'hover:scale-110'}`}
          >
            <RefreshCcw className="h-5 w-5" />
          </Button>
        </div>

        {/* Dashboard View Tabs */}
        <div className="flex border-b border-white/20 mb-8">
          <button 
            className={`px-6 py-4 flex items-center space-x-3 border-b-2 font-semibold text-base transition-all duration-300 ${
              dashboardView === 'overview' 
                ? 'border-cyan-400 text-cyan-400 bg-white/10' 
                : 'border-transparent text-white/70 hover:text-white hover:bg-white/5'
            }`} 
            onClick={() => setDashboardView('overview')}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Production Overview</span>
          </button>
          <button 
            className={`px-6 py-4 flex items-center space-x-3 border-b-2 font-semibold text-base transition-all duration-300 ${
              dashboardView === 'customerHealth' 
                ? 'border-cyan-400 text-cyan-400 bg-white/10' 
                : 'border-transparent text-white/70 hover:text-white hover:bg-white/5'
            }`} 
            onClick={() => setDashboardView('customerHealth')}
          >
            <Brain className="h-5 w-5" />
            <span>Client Intelligence</span>
            <span className="px-2 py-1 text-xs rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium">
              AI
            </span>
          </button>
        </div>

        {/* Error Display */}
        {error && !isRefreshing && (
          <div className="mb-8">
            <Alert type="error" message={error} className="bg-red-900/50 border-red-500/50 text-red-200" />
          </div>
        )}

        {/* Main Content Area */}
        {dashboardView === 'overview' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
              <StatCard 
                icon={Activity} 
                title="Active Production" 
                value={stats.activeOrders} 
                description="Orders in progress" 
                onClick={() => navigate('/orders')} 
                iconColor="text-blue-600" 
                gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
              />
              <StatCard 
                icon={Users} 
                title="Supply Partners" 
                value={stats.totalSuppliers} 
                description="Active suppliers" 
                onClick={() => navigate('/suppliers')} 
                iconColor="text-emerald-600" 
                gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
              />
              <StatCard 
                icon={UserCircle} 
                title="Manufacturing Clients" 
                value={stats.totalCustomers} 
                description="Total active" 
                onClick={() => navigate('/customers')} 
                iconColor="text-indigo-600" 
                gradient="bg-gradient-to-br from-indigo-500 to-purple-500"
              />
              <StatCard 
                icon={AlertTriangle} 
                title="Material Alerts" 
                value={stats.lowStock} 
                description="Require attention" 
                onClick={() => navigate('/inventory')} 
                iconColor="text-amber-600" 
                gradient="bg-gradient-to-br from-amber-500 to-orange-500"
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
                gradient="bg-gradient-to-br from-purple-500 to-pink-500"
              />
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Col 1 */}
              <div className="space-y-6">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/20">
                  <JobStatusOverview jobStats={jobStats} />
                </div>
                
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/20">
                  <MonthlyQuotesWidget />
                </div>
                
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/20">
                  <h2 className="text-lg font-bold mb-4 flex items-center text-slate-800">
                    <AlertTriangle className="h-5 w-5 mr-3 text-amber-500" />
                    Material Stock Alerts
                  </h2>
                  {inventoryAlerts.length > 0 ? (
                    <div className="space-y-3">
                      {inventoryAlerts.map(alert => (
                        <div 
                          key={alert.id} 
                          className={`p-4 rounded-lg border-l-4 ${
                            alert.status === 'Critical' 
                              ? 'bg-red-50 border-red-500' 
                              : alert.status === 'Low' 
                              ? 'bg-amber-50 border-amber-500' 
                              : 'bg-orange-50 border-orange-500'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-800">
                              {alert.materialName}
                            </span>
                            <span 
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                alert.status === 'Critical' 
                                  ? 'bg-red-100 text-red-800' 
                                  : alert.status === 'Low' 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {alert.status}
                            </span>
                          </div>
                          <div className="text-slate-600 mt-1 text-sm">
                            Stock: {alert.currentStock} | Min Required: {alert.minStockLevel}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">All materials adequately stocked.</p>
                  )}
                  <div className="mt-4">
                    <Button 
                      variant="link" 
                      onClick={() => navigate('/inventory')} 
                      className="text-sm p-0 h-auto text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      View Full Inventory →
                    </Button>
                  </div>
                </div>
              </div>

              {/* Col 2 */}
              <div className="space-y-6">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/20">
                  <OrderTrendKPICard />
                </div>
                
                {customerHealth && (
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/20">
                    <h2 className="text-lg font-bold mb-4 flex items-center text-slate-800">
                      <Users className="h-5 w-5 mr-3 text-emerald-500" />
                      Client Health Matrix
                    </h2>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={[
                              { name: 'Stable', value: customerHealth.churnRiskBreakdown.low }, 
                              { name: 'Watch', value: customerHealth.churnRiskBreakdown.medium }, 
                              { name: 'Risk', value: customerHealth.churnRiskBreakdown.high }
                            ]} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius="60%" 
                            outerRadius="85%" 
                            fill="#8884d8" 
                            dataKey="value"
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value} clients`, name]} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4">
                      <Button 
                        variant="link" 
                        onClick={() => setDashboardView('customerHealth')} 
                        className="text-sm p-0 h-auto text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        View AI Analysis →
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Col 3 */}
              <div className="space-y-6">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/20">
                  <h2 className="text-lg font-bold mb-4 flex items-center text-slate-800">
                    <DollarSign className="h-5 w-5 mr-3 text-emerald-500" />
                    Financial Performance
                  </h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={financialData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                        <XAxis dataKey="period" fontSize={12} />
                        <YAxis fontSize={12} tickFormatter={(value) => `£${value/1000}k`} />
                        <Tooltip formatter={(value: number) => [`£${value.toLocaleString()}`, '']} />
                        <Legend />
                        <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="costs" fill="#64748b" name="Costs" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4">
                    <Button 
                      variant="link" 
                      onClick={() => navigate('/financial')} 
                      className="text-sm p-0 h-auto text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      View Detailed Reports →
                    </Button>
                  </div>
                </div>
                
                {customerHealth && (
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/20">
                    <h2 className="text-lg font-bold mb-4 flex items-center text-slate-800">
                      <Info className="h-5 w-5 mr-3 text-cyan-500" />
                      Strategic Insights
                    </h2>
                    <ul className="space-y-3">
                      {customerHealth.healthScores
                        .filter(s => s.churnRisk === 'High' || s.potentialUpsell)
                        .slice(0, 2)
                        .map((s) => (
                          <li 
                            key={s.customerId} 
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                          >
                            <span className="block font-semibold text-slate-800">
                              {s.name}
                            </span>
                            <span 
                              className={`text-sm ${
                                s.churnRisk === 'High' 
                                  ? 'text-red-600 font-medium' 
                                  : s.potentialUpsell 
                                  ? 'text-emerald-600 font-medium' 
                                  : 'text-slate-600'
                              }`}
                            >
                              {s.churnRisk === 'High' 
                                ? 'High Churn Risk' 
                                : s.potentialUpsell 
                                ? 'Expansion Opportunity' 
                                : ''}
                              {s.insights.length > 0 ? `: ${s.insights[0]}` : ''}
                            </span>
                          </li>
                        ))
                      }
                      {stats.lowStock > 0 && (
                        <li className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <span className="font-semibold text-amber-800">Material Alert: </span>
                          <span className="text-amber-700">
                            {stats.lowStock} items below minimum stock
                          </span>
                        </li>
                      )}
                      {jobStats.inProgress > 0 && (
                        <li className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="font-semibold text-blue-800">Production: </span>
                          <span className="text-blue-700">
                            {jobStats.inProgress} jobs currently active
                          </span>
                        </li>
                      )}
                      {customerHealth.healthScores.length === 0 && stats.lowStock === 0 && jobStats.inProgress === 0 && (
                        <li className="text-slate-500">All systems operating optimally.</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20">
              <RecentActivitySection activities={recentActivity} isLoading={isLoading || isRefreshing} />
            </div>
          </>
        ) : (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20">
            <EnhancedCustomerHealthDashboard />
          </div>
        )}
      </div>
    </div>
  );
}