import { apiClient } from './api';

// Local interface to avoid conflicts
interface FinancialMetricsResponse {
  metrics: {
    totalRevenue: number;
    totalCosts: number;
    profit: number;
    marginPercentage: number;
  };
  trends: {
    revenueGrowth: number;
    costGrowth: number;
  };
}

export const fetchFinancialMetrics = async (period: string = 'month') => {
  const response = await apiClient.get(`/financial/metrics?period=${period}`);
  return response.data as FinancialMetricsResponse;
};