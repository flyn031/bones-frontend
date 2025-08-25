import { BundleRecommendation } from '../types/smartQuote';

// Base API configuration
import { API_URL } from '../config/constants';
const API_BASE_URL = API_URL.replace('/api', '');

// Generic API request handler
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Customer Intelligence API endpoints
export const customerIntelligenceApi = {
  // Get customer intelligence data
  getCustomerIntelligence: async (customerId: string) => {
    return apiRequest(`/api/customer-intelligence/${customerId}`);
  },

  // Get customer suggestions
  getCustomerSuggestions: async (customerId: string) => {
    return apiRequest(`/api/customer-intelligence/${customerId}/suggestions`);
  },

  // Get bundle recommendations
  getBundleRecommendations: async (customerId: string) => {
    return apiRequest(`/api/customer-intelligence/${customerId}/bundles`);
  },

  // Get dynamic bundle recommendations
  getDynamicBundleRecommendations: async (customerId: string, existingItems: string[] = []) => {
    const queryParams = new URLSearchParams({
      customerId,
      ...(existingItems.length > 0 && { existingItems: existingItems.join(',') })
    });
    return apiRequest(`/api/customer-intelligence/dynamic-bundles?${queryParams}`);
  },

  // Get seasonal recommendations
  getSeasonalRecommendations: async () => {
    return apiRequest('/api/customer-intelligence/seasonal-recommendations');
  },

  // Get quick templates
  getQuickTemplates: async (industry?: string) => {
    const queryParam = industry ? `?industry=${encodeURIComponent(industry)}` : '';
    return apiRequest(`/api/customer-intelligence/quick-templates${queryParam}`);
  },

  // Get quick assembly templates (alias for getQuickTemplates)
  getQuickAssemblyTemplates: async (industry?: string) => {
    const queryParam = industry ? `?industry=${encodeURIComponent(industry)}` : '';
    return apiRequest(`/api/customer-intelligence/quick-templates${queryParam}`);
  },

  // Analyze quote health
  analyzeQuoteHealth: async (quoteData: any) => {
    return apiRequest('/api/customer-intelligence/analyze-quote-health', {
      method: 'POST',
      body: JSON.stringify(quoteData),
    });
  },

  // Get comprehensive insights
  getComprehensiveInsights: async (customerId: string) => {
    return apiRequest(`/api/customer-intelligence/${customerId}/comprehensive`);
  },
};

// Utility functions for customer intelligence
export const customerIntelligenceUtils = {
  /**
   * Format currency values
   */
  formatCurrency: (value: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(value || 0);
  },

  /**
   * Format confidence value for display
   */
  formatConfidence: (confidence: number): string => {
    const percent = Math.round(confidence || 0);
    return `${percent}%`;
  },

  /**
   * Calculate bundle savings percentage
   */
  calculateBundleSavingsPercentage: (bundle: BundleRecommendation): number => {
    const originalPrice = bundle.totalPrice + bundle.savings;
    return originalPrice > 0 ? Math.round((bundle.savings / originalPrice) * 100) : 0;
  },

  /**
   * Get confidence badge styling and text
   */
  getConfidenceBadge: (confidence: number): { text: string; className: string } => {
    if (confidence >= 85) {
      return { text: 'High Confidence', className: 'bg-green-100 text-green-800' };
    } else if (confidence >= 70) {
      return { text: 'Good Confidence', className: 'bg-blue-100 text-blue-800' };
    } else if (confidence >= 50) {
      return { text: 'Medium Confidence', className: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { text: 'Low Confidence', className: 'bg-red-100 text-red-800' };
    }
  },

  /**
   * Calculate confidence score for bundle based on multiple factors
   */
  calculateBundleConfidenceScore: (bundle: BundleRecommendation): number => {
    let score = bundle.confidence;
    
    // Boost score for larger savings
    const savingsPercentage = customerIntelligenceUtils.calculateBundleSavingsPercentage(bundle);
    if (savingsPercentage >= 10) score += 5;
    
    // Boost score for reasonable item count
    if (bundle.items.length >= 2 && bundle.items.length <= 8) score += 5;
    
    // Boost score for higher total value (indicates established bundle)
    if (bundle.totalPrice >= 1000) score += 5;
    
    return Math.min(100, score);
  },

  /**
   * Get template category icon
   */
  getTemplateCategoryIcon: (category: string): string => {
    switch (category.toLowerCase()) {
      case 'conveyor systems': return '🔄';
      case 'material handling': return '📦';
      case 'safety & controls': return '🛡️';
      case 'production line': return '🏭';
      case 'warehouse': return '🏬';
      case 'manufacturing': return '⚙️';
      default: return '📋';
    }
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
   * Calculate bundle value proposition
   */
  getBundleValueProposition: (bundle: BundleRecommendation): string => {
    const savingsPercentage = customerIntelligenceUtils.calculateBundleSavingsPercentage(bundle);
    
    if (savingsPercentage >= 15) {
      return 'Excellent Value - High Savings';
    } else if (savingsPercentage >= 10) {
      return 'Good Value - Solid Savings';
    } else if (savingsPercentage >= 5) {
      return 'Fair Value - Some Savings';
    } else {
      return 'Standard Value - Convenience Bundle';
    }
  },

  /**
   * Get bundle recommendation reason
   */
  getBundleRecommendationReason: (bundle: BundleRecommendation): string => {
    if (bundle.bundleType === 'frequently_bought_together') {
      return `Customers frequently purchase these items together (${bundle.frequency} times)`;
    } else if (bundle.bundleType === 'seasonal') {
      return 'Seasonal demand indicates these items work well together';
    } else if (bundle.bundleType === 'complementary') {
      return 'These items complement each other in typical conveyor setups';
    } else {
      return 'Recommended based on customer purchase patterns';
    }
  },

  /**
   * Format confidence percentage
   */
  formatConfidencePercentage: (confidence: number): string => {
    return `${Math.round(confidence)}% confidence`;
  },

  /**
   * Get savings color class
   */
  getSavingsColorClass: (savingsPercentage: number): string => {
    if (savingsPercentage >= 15) return 'text-green-600';
    if (savingsPercentage >= 10) return 'text-blue-600';
    if (savingsPercentage >= 5) return 'text-yellow-600';
    return 'text-gray-600';
  },

  /**
   * Sort suggestions by confidence and relevance
   */
  sortSuggestions: (suggestions: any): any[] => {
    // Handle API response structure {success: true, data: [...]}
    const suggestionsArray = Array.isArray(suggestions) ? suggestions : (suggestions?.data || []);
    
    if (!Array.isArray(suggestionsArray)) {
      console.warn('sortSuggestions received invalid data:', suggestions);
      return [];
    }
    
    return suggestionsArray.sort((a, b) => {
      // Sort by confidence first (higher is better)
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      // Then by frequency/usage count
      if (b.orderCount && a.orderCount) {
        return b.orderCount - a.orderCount;
      }
      // Finally by price (lower is better for suggestions)
      return (a.unitPrice || 0) - (b.unitPrice || 0);
    });
  },

  /**
   * Group suggestions by their reason/source
   */
  groupSuggestionsByReason: (suggestions: any): Record<string, any[]> => {
    // Handle API response structure {success: true, data: [...]}
    const suggestionsArray = Array.isArray(suggestions) ? suggestions : (suggestions?.data || []);
    
    if (!Array.isArray(suggestionsArray)) {
      console.warn('groupSuggestionsByReason received invalid data:', suggestions);
      return {};
    }

    const grouped: Record<string, any[]> = {};
    
    suggestionsArray.forEach(suggestion => {
      const reason = suggestion.source || suggestion.reason || 'other';
      if (!grouped[reason]) {
        grouped[reason] = [];
      }
      grouped[reason].push(suggestion);
    });

    return grouped;
  },

  /**
   * Get CSS color class for risk level
   */
  getRiskLevelColor: (riskLevel: string): string => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  },

  /**
   * Get confidence color class
   */
  getConfidenceColor: (confidence: number): string => {
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 70) return 'text-blue-600';
    if (confidence >= 50) return 'text-yellow-600';
    return 'text-red-600';
  },

  /**
   * Format price with discount
   */
  formatPriceWithDiscount: (originalPrice: number, discountedPrice: number): string => {
    if (originalPrice === discountedPrice) {
      return customerIntelligenceUtils.formatCurrency(originalPrice);
    }
    return `${customerIntelligenceUtils.formatCurrency(discountedPrice)} (was ${customerIntelligenceUtils.formatCurrency(originalPrice)})`;
  },

  /**
   * Get source description
   */
  getSourceDescription: (source: string): string => {
    switch (source) {
      case 'customer_history': return 'Based on your purchase history';
      case 'previous_quote': return 'From previous quotes';
      case 'frequently_bought': return 'Frequently purchased together';
      case 'seasonal': return 'Seasonal recommendation';
      case 'trending': return 'Currently trending';
      default: return 'Recommended for you';
    }
  },

  /**
   * Get priority level styling
   */
  getPriorityColor: (priority: string): string => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  },

  /**
   * Format date for display
   */
  formatDate: (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB');
  },

  /**
   * Calculate days since
   */
  daysSince: (date: string | Date): number => {
    const then = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - then.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Get icon for suggestion reason/source
   */
  getSuggestionReasonIcon: (reason: string): string => {
    switch (reason?.toLowerCase()) {
      case 'customer_history': return '📊';
      case 'previous_quote': return '📋';
      case 'frequently_bought': return '🔄';
      case 'seasonal': return '🌟';
      case 'trending': return '📈';
      case 'bundle': return '📦';
      case 'recommended': return '💡';
      default: return '🔧';
    }
  },

  /**
   * Get human-readable label for suggestion reason/source
   */
  getSuggestionReasonLabel: (reason: string): string => {
    switch (reason?.toLowerCase()) {
      case 'customer_history': return 'Purchase History';
      case 'previous_quote': return 'Previous Quote';
      case 'frequently_bought': return 'Frequently Bought';
      case 'seasonal': return 'Seasonal';
      case 'trending': return 'Trending';
      case 'bundle': return 'Bundle';
      case 'recommended': return 'Recommended';
      default: return 'Suggested';
    }
  },
};

// Export individual functions for backward compatibility
export const getCustomerIntelligence = customerIntelligenceApi.getCustomerIntelligence;
export const getCustomerSuggestions = customerIntelligenceApi.getCustomerSuggestions;
export const getBundleRecommendations = customerIntelligenceApi.getBundleRecommendations;
export const getDynamicBundleRecommendations = customerIntelligenceApi.getDynamicBundleRecommendations;
export const getSeasonalRecommendations = customerIntelligenceApi.getSeasonalRecommendations;
export const getQuickTemplates = customerIntelligenceApi.getQuickTemplates;
export const getQuickAssemblyTemplates = customerIntelligenceApi.getQuickAssemblyTemplates;
export const analyzeQuoteHealth = customerIntelligenceApi.analyzeQuoteHealth;