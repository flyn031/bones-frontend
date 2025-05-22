import React, { useState, useEffect } from 'react';
// --- CORRECTED IMPORT ---
// Import the specific dashboardApi object we created in api.ts
import { dashboardApi } from '../../utils/api'; // Adjust path if needed

// Interface for the expected data structure from the backend KPI endpoint
interface OrderTrendKPI {
  currentPeriodValue: number;
  previousPeriodValue: number;
  percentageChange: number | null; // Can be null if previous was 0 or both are 0
}

// Helper to format currency (adjust locale and currency as needed)
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
  // Example: Changed to GBP
};

// Helper to format percentage
const formatPercentage = (value: number | null): string => {
  if (value === null || isNaN(value) || !isFinite(value)) { // Added isFinite check
    return '--%'; // Display for null, NaN, or Infinity
  }
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

export const OrderTrendKPICard: React.FC = () => {
  const [kpiData, setKpiData] = useState<OrderTrendKPI | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKpiData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // --- CORRECTED API CALL ---
        // Use the specific function from the dashboardApi object
        const response = await dashboardApi.getOrderTrendKPI();
        // Axios responses have data under the .data property
        setKpiData(response.data);
      } catch (err: any) { // Catch block improved
        console.error("Error fetching order trend KPI:", err);
        const message = err.response?.data?.error || err.message || "Failed to load trend data.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKpiData();
  }, []); // Empty dependency array means run once on mount

  const renderContent = () => {
    if (isLoading) {
      // Simple loading spinner or text
      return <div className="flex items-center justify-center h-20"><span className="text-gray-500">Loading...</span></div>;
    }

    if (error) {
      return <p className="text-red-600 text-sm">{error}</p>;
    }

    if (!kpiData) {
      return <p className="text-gray-500">No data available.</p>;
    }

    const { currentPeriodValue, previousPeriodValue, percentageChange } = kpiData;

    // Determine arrow and color based on percentageChange
    let ArrowComponent = null;
    let percentageColor = 'text-gray-700 dark:text-gray-300'; // Neutral
    if (percentageChange !== null && percentageChange > 0) {
      percentageColor = 'text-green-600 dark:text-green-500';
      ArrowComponent = <span className="mr-1 text-lg">▲</span>; // Up arrow
    } else if (percentageChange !== null && percentageChange < 0) {
      percentageColor = 'text-red-600 dark:text-red-500';
      ArrowComponent = <span className="mr-1 text-lg">▼</span>; // Down arrow
    }

    return (
      <div className="text-center md:text-left"> {/* Align text */}
        {/* Current Value */}
        <p className="text-2xl md:text-3xl font-bold mb-1 text-gray-900 dark:text-gray-100">
          {formatCurrency(currentPeriodValue)}
        </p>
        {/* Percentage Change and Arrow */}
        <div className={`flex items-center justify-center md:justify-start text-base md:text-lg font-semibold ${percentageColor}`}>
          {ArrowComponent}
          <span>{formatPercentage(percentageChange)}</span>
        </div>
        {/* Context Text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          vs Last Month (Same Period)
        </p>
        {/* Previous Value (Optional for context) */}
         <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          (Prev: {formatCurrency(previousPeriodValue)})
        </p>
      </div>
    );
  };

  // Using basic divs - Adapt if you use a Card component from a UI library (e.g., Shadcn/ui)
  // Example using Shadcn structure:
  // import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
  // return (
  //   <Card>
  //     <CardHeader>
  //       <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
  //         Order Value Trend (MTD)
  //       </CardTitle>
  //     </CardHeader>
  //     <CardContent>
  //       {renderContent()}
  //     </CardContent>
  //   </Card>
  // );

  // Default structure:
  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 shadow rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 text-center md:text-left">
        Order Value Trend (MTD)
      </h3>
      {renderContent()}
    </div>
  );
};

// Default export might be needed depending on how you import in Dashboard.tsx
// If Dashboard.tsx uses: import OrderTrendKPICard from './OrderTrendKPICard';
// then add: export default OrderTrendKPICard;
// If Dashboard.tsx uses: import { OrderTrendKPICard } from './OrderTrendKPICard';
// then the current export is fine. (Your Dashboard.tsx used named import, so this is correct).