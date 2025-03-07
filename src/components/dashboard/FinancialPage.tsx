import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Temporarily define constants directly to bypass import issues
const API_BASE_URL = 'http://localhost:4000';
const getAuthToken = () => localStorage.getItem('authToken') || localStorage.getItem('token') || '';

// Financial summary interface
interface FinancialSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  totalExpenses: number;
  profitMargin: number;
  pendingInvoices: number;
  currencySymbol?: string;
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
  }>;
}

// Export component as a named export to match: import { FinancialPage } from './components/dashboard/FinancialPage';
export const FinancialPage: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Format currency with pound symbol
  const formatCurrency = (amount: number): string => {
    const currencySymbol = summary?.currencySymbol || '£';
    return `${currencySymbol}${amount.toLocaleString('en-GB', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Format date safely
  const formatDate = (dateString: string | Date): string => {
    try {
      if (dateString instanceof Date) {
        return dateString.toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      }
      return new Date(dateString).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      const response = await axios.get(`${API_BASE_URL}/api/financial/summary`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSummary(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching financial summary:', err);
      setError('Failed to load financial data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialSummary();
  }, []);

  if (loading) {
    return <div className="p-4">Loading financial data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!summary) {
    return <div className="p-4">No financial data available.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Financial Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Summary Cards */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalRevenue)}</p>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Monthly Revenue</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.monthlyRevenue)}</p>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</p>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Profit Margin</h3>
          <p className="text-2xl font-bold text-purple-600">
            {summary.profitMargin.toFixed(2)}%
          </p>
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-white p-4 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left">Description</th>
                <th className="py-2 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentTransactions.length > 0 ? (
                summary.recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t">
                    <td className="py-2 px-4">
                      {transaction.date || formatDate(transaction.date)}
                    </td>
                    <td className="py-2 px-4">{transaction.description}</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(transaction.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-4 px-4 text-center text-gray-500">
                    No recent transactions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};