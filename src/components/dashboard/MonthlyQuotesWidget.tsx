import { API_URL } from '../../config/constants';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { Calendar } from 'lucide-react';

// Helper function to extract sent date from description
const extractSentDate = (description: string | null | undefined): string | null => {
  if (!description) return null;
  // Use a robust regex that can handle various formats and line breaks
  const match = description.match(/Sent on:\s*(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
};

// Function to aggregate quotes by month
const aggregateQuotesByMonth = (quotes: any[]) => {
  // Create an object to store counts by month
  const monthlyCounts: {[key: string]: number} = {};
  
  // Get the current date and calculate dates for displaying last 6 months
  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 5); // Set to 5 months ago to include current month (total of 6)
  
  // Initialize the last 6 months with zero counts (ensures all months are shown even with no data)
  for (let i = 0; i < 6; i++) {
    const date = new Date(sixMonthsAgo);
    date.setMonth(sixMonthsAgo.getMonth() + i);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyCounts[yearMonth] = 0;
  }
  
  // Process each quote
  quotes.forEach(quote => {
    // Only count quotes with SENT status
    if (quote.status === 'SENT' && quote.sentDate) {
      // Extract year and month from the sent date
      const date = new Date(quote.sentDate);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Increment count for this month
      monthlyCounts[yearMonth] = (monthlyCounts[yearMonth] || 0) + 1;
    }
  });
  
  // Convert to array for easier charting
  return Object.entries(monthlyCounts)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

const MonthlyQuotesWidget = () => {
  const [quoteData, setQuoteData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authentication token not found.");

        const response = await axios.get(API_URL + '/quotes', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (Array.isArray(response.data)) {
          // Process quotes data to extract sent dates
          const processedQuotes = response.data.map(quote => {
            // Extract sent date from description
            const sentDate = extractSentDate(quote.description);
            return {
              ...quote,
              status: String(quote.status || 'DRAFT').toUpperCase(),
              sentDate: sentDate
            };
          });
          
          setQuoteData(processedQuotes);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error('Error fetching quotes for widget:', error);
        setError('Failed to load quote data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []);

  // Aggregate data by month
  const monthlyData = aggregateQuotesByMonth(quoteData);
  
  // Format month labels for display
  const formattedData = monthlyData.map(item => ({
    ...item,
    monthLabel: new Date(item.month + '-01').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  }));
  
  // Calculate total quotes sent
  const totalQuotesSent = quoteData.filter(q => q.status === 'SENT').length;
  
  // Current month's quotes count
  const currentMonth = new Date().toISOString().substring(0, 7); // Format: YYYY-MM
  const currentMonthCount = monthlyData.find(item => item.month === currentMonth)?.count || 0;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Widget Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
          Monthly Sent Quotes
        </h3>
      </div>
      
      {/* Widget Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 dark:text-gray-400">Loading data...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </div>
        ) : formattedData.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 dark:text-gray-400">No quote data available</p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3">
                <p className="text-xs text-indigo-500 dark:text-indigo-300 font-medium">Total Quotes Sent</p>
                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">{totalQuotesSent}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                <p className="text-xs text-green-500 dark:text-green-300 font-medium">This Month</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{currentMonthCount}</p>
              </div>
            </div>
            
            {/* Chart */}
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="monthLabel" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} quotes`, 'Sent']}
                    contentStyle={{ 
                      borderRadius: '0.375rem',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#FFFFFF'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#6366F1" 
                    radius={[4, 4, 0, 0]}
                    name="Quotes Sent" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MonthlyQuotesWidget;