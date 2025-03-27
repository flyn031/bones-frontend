import { apiClient } from './api';

export interface FinancialMetricsResponse {
  currentPeriod: {
    startDate: string;
    endDate: string;
    revenue: number;
    costs: number;
    profit: number;
    profitMargin: number;
    orderCount: number;
  };
  previousPeriod: {
    revenue: number;
    costs: number;
    profit: number;
    profitMargin: number;
    comparison: {
      revenueChange: number;
      profitChange: number;
      marginChange: number;
    };
  } | null;
  monthlyTrends: Array<{
    month: string;
    year: number;
    revenue: number;
    costs: number;
    profit: number;
  }>;
}

export const financialApi = {
  // Get detailed financial metrics with period comparison
  getFinancialMetrics: (params?: {
    startDate?: string;
    endDate?: string;
    compareWithPrevious?: boolean;
  }) => {
    return apiClient.get('/financial/metrics', { params });
  }
};

// Helper function for Dashboard component
export const fetchFinancialMetrics = async (): Promise<FinancialMetricsResponse> => {
  try {
    const response = await financialApi.getFinancialMetrics();
    return response.data;
  } catch (error) {
    console.error("Error fetching financial metrics:", error);
    throw error;
  }
};