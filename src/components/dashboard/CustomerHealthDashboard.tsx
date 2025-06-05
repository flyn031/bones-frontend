import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// TypeScript interfaces
interface CustomerHealthScore {
  customerId: string;
  name: string;
  overallScore: number;
  churnRisk: 'Low' | 'Medium' | 'High';
  potentialUpsell: boolean;
  insights: string[];
}

interface DashboardData {
  healthScores: CustomerHealthScore[];
  lastUpdated: Date;
  totalCustomers: number;
  churnRiskBreakdown: {
    low: number;
    medium: number;
    high: number;
  };
}

interface ChurnRiskData {
  low: number;
  medium: number;
  high: number;
}

interface ChurnRiskDonutProps {
  data: ChurnRiskData;
}

interface CustomerHealthScoreTableProps {
  scores: CustomerHealthScore[];
}

interface InsightPanelProps {
  insights?: string[];
}

export function CustomerHealthDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/dashboard/customer-health', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setDashboardData(response.data as DashboardData);
      } catch (error) {
        console.error('Failed to fetch dashboard', error);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) return <div>Loading customer health data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!dashboardData || !dashboardData.healthScores) return <div>No data available</div>;

  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Customer Health Dashboard</h1>
      
      <div className="grid grid-cols-3 gap-6">
        <ChurnRiskDonut data={dashboardData.churnRiskBreakdown} />
        <CustomerHealthScoreTable 
  scores={dashboardData.healthScores} 
/>
        <InsightPanel 
          insights={dashboardData.healthScores
            .flatMap(score => score.insights)
            .slice(0, 5)
          } 
        />
      </div>
    </div>
  );
}

// Churn Risk Donut Chart Component
function ChurnRiskDonut({ data }: ChurnRiskDonutProps) {
  const chartData = [
    { name: 'Low Risk', value: data.low },
    { name: 'Medium Risk', value: data.medium },
    { name: 'High Risk', value: data.high }
  ];

  const COLORS = ['#4CAF50', '#FFC107', '#F44336'];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Churn Risk Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Customer Health Score Table Component
function CustomerHealthScoreTable({ scores }: CustomerHealthScoreTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Top Customer Health Scores</h2>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Customer</th>
            <th className="p-2 text-right">Health Score</th>
            <th className="p-2 text-right">Churn Risk</th>
          </tr>
        </thead>
        <tbody>
          {scores
            .sort((a: CustomerHealthScore, b: CustomerHealthScore) => b.overallScore - a.overallScore)
            .slice(0, 5)
            .map((score: CustomerHealthScore) => (
              <tr key={score.customerId} className="border-b">
                <td className="p-2">{score.name}</td>
                <td className="p-2 text-right">{score.overallScore.toFixed(2)}</td>
                <td className="p-2 text-right">{score.churnRisk}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

// Insights Panel Component
function InsightPanel({ insights = [] }: InsightPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Key Insights</h2>
      {insights && insights.length > 0 ? (
        <ul className="space-y-2">
          {insights.map((insight, index) => (
            <li 
              key={index} 
              className="p-3 bg-blue-50 rounded-md hover:bg-blue-100 transition"
            >
              {insight}
            </li>
          ))}
        </ul>
      ) : (
        <p>No insights available at this time.</p>
      )}
    </div>
  );
}