import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { 
  Users, TrendingUp, ArrowUp, ArrowDown, ChevronsUp, Phone, 
  Calendar, AlertTriangle, Info, Filter, FileText
} from "lucide-react";
import { fetchPredictiveHealth } from '../../utils/customerHealthApi';
import { Button } from '@/components/ui';

// Interface for customer prediction data
interface CustomerPrediction {
  id: string;
  name: string;
  company?: string;
  currentScore: number;
  predictedScore: number;
  churnProbability: number;
  upsellPotential: number;
  revenueImpact: number;
  lastOrder: string;
  insight: string;
  recommendedActions: string[];
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  orderFrequency: number; // Average days between orders
  lifetimeValue: number;
  segments: string[];
}

// Interface for aggregate metrics
interface PredictiveMetrics {
  totalPredictedChurn: number;
  churnRiskValue: number;
  upsellOpportunities: number;
  upsellPotentialValue: number;
  customerSegmentation: {
    label: string;
    value: number;
    growth: number;
  }[];
  retentionTrend: {
    month: string;
    rate: number;
  }[];
}

const PredictiveCustomerHealth: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerPrediction[]>([]);
  const [metrics, setMetrics] = useState<PredictiveMetrics | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'30' | '60' | '90'>('90');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  
  useEffect(() => {
    const loadPredictiveData = async () => {
      try {
        setLoading(true);
        const data = await fetchPredictiveHealth(timeframe);
        
        if (data) {
          setCustomers(data.customers);
          setMetrics(data.metrics);
        }
      } catch (error) {
        console.error('Failed to load predictive data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPredictiveData();
  }, [timeframe]);
  
  // Filter customers by segment when a segment is selected
  const filteredCustomers = selectedSegment 
    ? customers.filter(customer => customer.segments.includes(selectedSegment))
    : customers;
  
  // Get all unique segments for the filter
  const segments = Array.from(
    new Set(customers.flatMap(customer => customer.segments))
  );
  
  // Component for Prediction Summary Cards
  const PredictionSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Predicted Churn (Next {timeframe} Days)</p>
            <h3 className="text-2xl font-bold">{metrics?.totalPredictedChurn || 0}</h3>
            <p className="text-sm text-red-500">Est. Value: £{metrics?.churnRiskValue?.toLocaleString() || 0}</p>
          </div>
          <AlertTriangle className="text-red-500" size={24} />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Upsell Opportunities</p>
            <h3 className="text-2xl font-bold">{metrics?.upsellOpportunities || 0}</h3>
            <p className="text-sm text-green-500">Est. Value: £{metrics?.upsellPotentialValue?.toLocaleString() || 0}</p>
          </div>
          <ChevronsUp className="text-green-500" size={24} />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Avg. Order Frequency</p>
            <h3 className="text-2xl font-bold">
              {customers.length > 0 
                ? Math.round(customers.reduce((acc, c) => acc + c.orderFrequency, 0) / customers.length) 
                : 0} days
            </h3>
            <p className="text-sm text-gray-500">Between purchases</p>
          </div>
          <Calendar className="text-blue-500" size={24} />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Retention Forecast</p>
            <h3 className="text-2xl font-bold">
              {metrics?.retentionTrend && metrics.retentionTrend.length > 0 
                ? `${(metrics.retentionTrend[metrics.retentionTrend.length - 1].rate * 100).toFixed(1)}%` 
                : 'N/A'}
            </h3>
            <p className="text-sm text-blue-500">Projected {timeframe}-day retention</p>
          </div>
          <Users className="text-blue-500" size={24} />
        </div>
      </div>
    </div>
  );
  
  // Retention Trend Chart
  const RetentionTrendChart = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Retention Forecast Trend</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={metrics?.retentionTrend || []}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
            <XAxis dataKey="month" />
            <YAxis 
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} 
              domain={[0.7, 1]} 
            />
            <Tooltip formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'Retention Rate']} />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
  
  // Customer Segmentation Chart
  const SegmentationChart = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Customer Segmentation</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={metrics?.customerSegmentation || []}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" name="Customers" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        {metrics?.customerSegmentation.map((segment) => (
          <div 
            key={segment.label}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100"
            onClick={() => setSelectedSegment(selectedSegment === segment.label ? null : segment.label)}
          >
            <span className="font-medium">{segment.label}</span>
            <div className="flex items-center space-x-2">
              <span>{segment.value}</span>
              <span className={`text-xs ${segment.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {segment.growth > 0 ? '+' : ''}{segment.growth}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  // At-Risk Customers Table
  const AtRiskCustomersTable = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">High-Risk Customers</h3>
        <Button 
          onClick={() => navigate('/customers?filter=high-risk')}
          variant="outline"
          size="sm"
        >
          View All
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-center">Current Score</th>
              <th className="px-4 py-2 text-center">Predicted Score</th>
              <th className="px-4 py-2 text-center">Churn Probability</th>
              <th className="px-4 py-2 text-right">Revenue Impact</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers
              .filter(customer => customer.churnProbability > 0.5)
              .sort((a, b) => b.churnProbability - a.churnProbability)
              .slice(0, 5)
              .map(customer => (
                <tr key={customer.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.company || ''}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{customer.currentScore.toFixed(1)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={customer.predictedScore < customer.currentScore ? 'text-red-500' : 'text-green-500'}>
                      {customer.predictedScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {(customer.churnProbability * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">£{customer.revenueImpact.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        title="View Details"
                        onClick={() => navigate(`/customers/${customer.id}`)}
                      >
                        <Info size={18} />
                      </button>
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Contact Customer"
                        onClick={() => navigate(`/customers/${customer.id}/contact`)}
                      >
                        <Phone size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  // Upsell Opportunities Table
  const UpsellOpportunitiesTable = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Upsell Opportunities</h3>
        <Button 
          onClick={() => navigate('/customers?filter=upsell')}
          variant="outline"
          size="sm"
        >
          View All
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-center">Health Score</th>
              <th className="px-4 py-2 text-center">Upsell Potential</th>
              <th className="px-4 py-2 text-center">Potential Value</th>
              <th className="px-4 py-2 text-left">Recommended Action</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers
              .filter(customer => customer.upsellPotential > 0.6)
              .sort((a, b) => b.upsellPotential - a.upsellPotential)
              .slice(0, 5)
              .map(customer => (
                <tr key={customer.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.company || ''}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{customer.currentScore.toFixed(1)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {(customer.upsellPotential * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">£{customer.revenueImpact.toLocaleString()}</td>
                  <td className="px-4 py-3 text-left">
                    <span className="text-sm">
                      {customer.recommendedActions[0] || 'Contact customer'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Create Quote"
                        onClick={() => navigate('/quotes/new?customer=' + customer.id)}
                      >
                        <FileText size={18} />
                      </button>
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Contact Customer"
                        onClick={() => navigate(`/customers/${customer.id}/contact`)}
                      >
                        <Phone size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  // Customer Insights Panel
  const CustomerInsights = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">AI-Generated Customer Insights</h3>
      
      <div className="space-y-4">
        {filteredCustomers
          .sort((a, b) => (b.churnProbability * 0.6 + b.upsellPotential * 0.4) - 
                          (a.churnProbability * 0.6 + a.upsellPotential * 0.4))
          .slice(0, 3)
          .map(customer => (
            <div key={customer.id} className="p-4 rounded-lg border">
              <div className="flex justify-between mb-2">
                <span className="font-medium">{customer.name}</span>
                {customer.churnProbability > 0.5 ? (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    High Churn Risk
                  </span>
                ) : customer.upsellPotential > 0.6 ? (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Upsell Opportunity
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Key Account
                  </span>
                )}
              </div>
              
              <p className="text-gray-700 mb-2">{customer.insight}</p>
              
              <div className="mt-3">
                <div className="text-sm font-medium mb-1">Recommended Actions:</div>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {customer.recommendedActions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-3 flex justify-end">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  View Customer
                </Button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
  
  // The time frame selector for prediction window
  const TimeframeSelector = () => (
    <div className="flex space-x-2 mb-6">
      <Button
        variant={timeframe === '30' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => setTimeframe('30')}
      >
        30 Days
      </Button>
      <Button
        variant={timeframe === '60' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => setTimeframe('60')}
      >
        60 Days
      </Button>
      <Button
        variant={timeframe === '90' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => setTimeframe('90')}
      >
        90 Days
      </Button>
    </div>
  );
  
  // View mode selector - overview or detailed
  const ViewModeSelector = () => (
    <div className="flex space-x-2 mb-6">
      <Button
        variant={viewMode === 'overview' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => setViewMode('overview')}
      >
        Overview
      </Button>
      <Button
        variant={viewMode === 'detailed' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => setViewMode('detailed')}
      >
        Detailed View
      </Button>
    </div>
  );
  
  // Segment filter component
  const SegmentFilter = () => {
    if (segments.length === 0) return null;
    
    return (
      <div className="flex items-center space-x-2 mb-6">
        <Filter size={16} className="text-gray-400" />
        <span className="text-sm text-gray-500">Filter by segment:</span>
        <div className="flex flex-wrap gap-2">
          {segments.map(segment => (
            <button
              key={segment}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                selectedSegment === segment 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedSegment(selectedSegment === segment ? null : segment)}
            >
              {segment}
            </button>
          ))}
          {selectedSegment && (
            <button
              className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
              onClick={() => setSelectedSegment(null)}
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gray-50">
      <h2 className="text-2xl font-bold mb-2">AI-Powered Customer Health Predictions</h2>
      <p className="text-gray-500 mb-6">
        Proactive insights to help you retain customers and identify growth opportunities
      </p>
      
      <div className="flex flex-wrap justify-between items-center mb-6">
        <TimeframeSelector />
        <ViewModeSelector />
      </div>
      
      <SegmentFilter />
      
      <PredictionSummary />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RetentionTrendChart />
        <SegmentationChart />
      </div>
      
      {viewMode === 'overview' ? (
        <CustomerInsights />
      ) : (
        <>
          <AtRiskCustomersTable />
          <UpsellOpportunitiesTable />
        </>
      )}
    </div>
  );
};

export default PredictiveCustomerHealth;