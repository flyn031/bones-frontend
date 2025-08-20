// Customer Intelligence API Utilities
// Location: bones-frontend/src/utils/customerIntelligenceApi.ts

import { API_URL } from '../config/constants';
import { 
  CustomerSuggestion, 
  BundleRecommendation, 
  QuickAssemblyTemplate 
} from '../types/smartQuote';
import { CustomerIntelligence } from '../types/customerIntelligence';

// Get auth token from localStorage
const getAuthToken = (): string => {
  return localStorage.getItem('token') || '';
};

// Base API request function with authentication
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const customerIntelligenceApi = {
  /**
   * Get intelligent suggestions for a customer
   */
  getCustomerSuggestions: async (customerId: string | number, currentItems: string[] = []): Promise<CustomerSuggestion[]> => {
    console.log('🎯 [API] Getting customer suggestions for:', customerId);
    console.log('📋 [API] Current items:', currentItems);
    
    const queryParams = new URLSearchParams();
    if (currentItems.length > 0) {
      queryParams.append('currentItems', currentItems.join(','));
    }

    const response = await apiRequest(`/customer-intelligence/${customerId}/suggestions?${queryParams}`);
    console.log('✅ [API] Customer suggestions retrieved:', response.data.length);
    
    return response.data;
  },

  /**
   * Get bundle recommendations for a customer
   */
  getBundleRecommendations: async (customerId: string | number, currentItems: string[] = []): Promise<BundleRecommendation[]> => {
    console.log('📦 [API] Getting bundle recommendations for:', customerId);
    
    const queryParams = new URLSearchParams();
    if (currentItems.length > 0) {
      queryParams.append('currentItems', currentItems.join(','));
    }

    const response = await apiRequest(`/customer-intelligence/${customerId}/bundles?${queryParams}`);
    console.log('✅ [API] Bundle recommendations retrieved:', response.data.length);
    
    return response.data;
  },

  /**
   * Get customer intelligence summary
   */
  getCustomerIntelligence: async (customerId: string | number): Promise<CustomerIntelligence> => {
    console.log('🧠 [API] Getting customer intelligence for:', customerId);
    
    const response = await apiRequest(`/customer-intelligence/${customerId}`);
    console.log('✅ [API] Customer intelligence retrieved for:', response.data.customerName);
    
    return response.data;
  },

  /**
   * Get comprehensive customer insights
   */
  getComprehensiveInsights: async (customerId: string | number, currentItems: string[] = []): Promise<{
    customerProfile: CustomerIntelligence;
    itemSuggestions: CustomerSuggestion[];
    bundleRecommendations: BundleRecommendation[];
    quickTemplates: QuickAssemblyTemplate[];
    dynamicBundles: BundleRecommendation[];
    summary: {
      totalSuggestions: number;
      totalBundles: number;
      averageConfidence: number;
      riskLevel: string;
      conversionRate: number;
    };
  }> => {
    console.log('🔍 [API] Getting comprehensive insights for:', customerId);
    
    const queryParams = new URLSearchParams();
    if (currentItems.length > 0) {
      queryParams.append('currentItems', currentItems.join(','));
    }

    const response = await apiRequest(`/customer-intelligence/${customerId}/insights?${queryParams}`);
    console.log('✅ [API] Comprehensive insights retrieved');
    
    return response.data;
  },

  /**
   * Get quick assembly templates
   */
  getQuickAssemblyTemplates: async (customerType?: string): Promise<QuickAssemblyTemplate[]> => {
    console.log('⚡ [API] Getting quick assembly templates for type:', customerType);
    
    const queryParams = new URLSearchParams();
    if (customerType) {
      queryParams.append('customerType', customerType);
    }

    const response = await apiRequest(`/customer-intelligence/quick-templates?${queryParams}`);
    console.log('✅ [API] Quick assembly templates retrieved:', response.data.length);
    
    return response.data;
  },

  /**
   * Get dynamic bundle recommendations
   */
  getDynamicBundleRecommendations: async (customerId?: string | number, currentItems: string[] = []): Promise<BundleRecommendation[]> => {
    console.log('🔮 [API] Getting dynamic bundle recommendations');
    
    const queryParams = new URLSearchParams();
    if (customerId) {
      queryParams.append('customerId', customerId.toString());
    }
    if (currentItems.length > 0) {
      queryParams.append('currentItems', currentItems.join(','));
    }

    const response = await apiRequest(`/customer-intelligence/dynamic-bundles?${queryParams}`);
    console.log('✅ [API] Dynamic bundle recommendations retrieved:', response.data.length);
    
    return response.data;
  },

  /**
   * Get seasonal recommendations
   */
  getSeasonalRecommendations: async (month?: number): Promise<BundleRecommendation[]> => {
    console.log('🌱 [API] Getting seasonal recommendations for month:', month);
    
    const queryParams = new URLSearchParams();
    if (month) {
      queryParams.append('month', month.toString());
    }

    const response = await apiRequest(`/customer-intelligence/seasonal-recommendations?${queryParams}`);
    console.log('✅ [API] Seasonal recommendations retrieved:', response.data.length);
    
    return response.data;
  }
};

// Utility functions for customer intelligence
export const customerIntelligenceUtils = {
  /**
   * Get risk level color
   */
  getRiskLevelColor: (riskLevel: string): string => {
    switch (riskLevel.toLowerCase()) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  },

  /**
   * Get risk level badge class
   */
  getRiskLevelBadge: (riskLevel: string): string => {
    switch (riskLevel.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  },

  /**
   * Get conversion rate color
   */
  getConversionRateColor: (rate: number): string => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 40) return 'text-yellow-600';
    return 'text-red-600';
  },

  /**
   * Format confidence percentage
   */
  formatConfidence: (confidence: number): string => {
    return `${Math.round(confidence)}%`;
  },

  /**
   * Get suggestion reason icon
   */
  getSuggestionReasonIcon: (reason: string): string => {
    switch (reason) {
      case 'frequent_purchase': return '🔄';
      case 'industry_standard': return '🏭';
      case 'bundle_complement': return '📦';
      case 'seasonal_trend': return '🌱';
      default: return '💡';
    }
  },

  /**
   * Get suggestion reason label
   */
  getSuggestionReasonLabel: (reason: string): string => {
    switch (reason) {
      case 'frequent_purchase': return 'Frequently Purchased';
      case 'industry_standard': return 'Industry Standard';
      case 'bundle_complement': return 'Bundle Complement';
      case 'seasonal_trend': return 'Seasonal Trend';
      default: return 'Suggested';
    }
  },

  /**
   * Sort suggestions by confidence and relevance
   */
  sortSuggestions: (suggestions: CustomerSuggestion[]): CustomerSuggestion[] => {
    return [...suggestions].sort((a, b) => {
      // First sort by confidence
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      
      // Then by reason priority
      const reasonPriority = {
        'frequent_purchase': 4,
        'bundle_complement': 3,
        'industry_standard': 2,
        'seasonal_trend': 1
      };
      
      const aPriority = reasonPriority[a.reason] || 0;
      const bPriority = reasonPriority[b.reason] || 0;
      
      return bPriority - aPriority;
    });
  },

  /**
   * Group suggestions by reason
   */
  groupSuggestionsByReason: (suggestions: CustomerSuggestion[]): Record<string, CustomerSuggestion[]> => {
    return suggestions.reduce((groups, suggestion) => {
      const reason = suggestion.reason;
      if (!groups[reason]) {
        groups[reason] = [];
      }
      groups[reason].push(suggestion);
      return groups;
    }, {} as Record<string, CustomerSuggestion[]>);
  },

  /**
   * Calculate bundle savings percentage
   */
  calculateBundleSavingsPercentage: (bundle: BundleRecommendation): number => {
    const originalPrice = bundle.totalPrice + bundle.savings;
    return originalPrice > 0 ? Math.round((bundle.savings / originalPrice) * 100) : 0;
  },

  /**
   * Get template category icon
   */
  getTemplateCategoryIcon: (category: string): string => {
    switch (category) {
      case 'warehouse': return '🏭';
      case 'packaging': return '📦';
      case 'maintenance': return '🔧';
      case 'custom': return '⚙️';
      default: return '📋';
    }
  },

  /**
   * Format currency value
   */
  formatCurrency: (value: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  },

  /**
   * Get item count description
   */
  getItemCountDescription: (count: number): string => {
    if (count === 1) return '1 item';
    if (count < 5) return `${count} items`;
    if (count < 10) return `${count} items (medium complexity)`;
    return `${count} items (high complexity)`;
  },

  /**
   * Calculate confidence score for bundle based on multiple factors
   */
  calculateBundleConfidenceScore: (bundle: BundleRecommendation): number => {
    let score = bundle.confidence;
    
    // Boost score for larger savings
    const savingsPercentage = this.calculateBundleSavingsPercentage(bundle);
    if (savingsPercentage >= 10) score += 5;
    
    // Boost score for reasonable item count
    if (bundle.items.length >= 3 && bundle.items.length <= 8) score += 5;
    
    // Boost score for higher total value (indicates established bundle)
    if (bundle.totalPrice >= 5000) score += 5;
    
    return Math.min(100, score);
  }
};

// Direct exports for components
export const getCustomerSuggestions = customerIntelligenceApi.getCustomerSuggestions;
export const getCustomerIntelligence = customerIntelligenceApi.getCustomerIntelligence;
export const getQuickTemplates = customerIntelligenceApi.getQuickAssemblyTemplates;