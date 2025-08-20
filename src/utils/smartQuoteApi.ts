// Smart Quote API Utilities
// Location: bones-frontend/src/utils/smartQuoteApi.ts

import { API_URL } from '../config/constants';
import { 
  HistoricalQuoteItem, 
  QuoteItemSearchFilters, 
  QuoteItemSearchResult,
  QuoteHealth 
} from '../types/smartQuote';

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

export const smartQuoteApi = {
  /**
   * Search through historical quote items
   */
  searchQuoteItems: async (filters: QuoteItemSearchFilters): Promise<QuoteItemSearchResult> => {
    console.log('🔍 [API] Searching quote items with filters:', filters);
    
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (value instanceof Date) {
          queryParams.append(key, value.toISOString());
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const response = await apiRequest(`/quote-items/search?${queryParams}`);
    console.log('✅ [API] Quote items search result:', response.data);
    
    return response.data;
  },

  /**
   * Get items from a specific quote for copying
   */
  getQuoteItems: async (quoteId: string): Promise<HistoricalQuoteItem[]> => {
    console.log('📋 [API] Getting items for quote:', quoteId);
    
    const response = await apiRequest(`/quote-items/quote/${quoteId}`);
    console.log('✅ [API] Quote items retrieved:', response.data.length);
    
    return response.data;
  },

  /**
   * Get frequently used items across all quotes
   */
  getFrequentItems: async (customerId?: number, limit: number = 20): Promise<HistoricalQuoteItem[]> => {
    console.log('🔥 [API] Getting frequent items, limit:', limit);
    
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());
    if (customerId) {
      queryParams.append('customerId', customerId.toString());
    }

    const response = await apiRequest(`/quote-items/frequent?${queryParams}`);
    console.log('✅ [API] Frequent items retrieved:', response.data.length);
    
    return response.data;
  },

  /**
   * Get similar items based on name/description
   */
  getSimilarItems: async (itemName: string, limit: number = 10): Promise<HistoricalQuoteItem[]> => {
    console.log('🔍 [API] Getting similar items for:', itemName);
    
    const queryParams = new URLSearchParams({
      itemName,
      limit: limit.toString()
    });

    const response = await apiRequest(`/quote-items/similar?${queryParams}`);
    console.log('✅ [API] Similar items retrieved:', response.data.length);
    
    return response.data;
  },

  /**
   * Get search suggestions/autocomplete
   */
  getSearchSuggestions: async (term: string, limit: number = 10): Promise<string[]> => {
    if (term.length < 2) {
      return [];
    }

    console.log('💡 [API] Getting search suggestions for:', term);
    
    const queryParams = new URLSearchParams({
      term,
      limit: limit.toString()
    });

    const response = await apiRequest(`/quote-items/suggestions?${queryParams}`);
    console.log('✅ [API] Search suggestions retrieved:', response.data.length);
    
    return response.data;
  },

  /**
   * Get available filter options
   */
  getFilterOptions: async (): Promise<{
    categories: string[];
    priceRange: { min: number; max: number };
    customers: Array<{ id: string; name: string }>;
    dateRanges: Array<{ label: string; value: string }>;
  }> => {
    console.log('⚙️ [API] Getting filter options');
    
    const response = await apiRequest('/quote-items/filters');
    console.log('✅ [API] Filter options retrieved');
    
    return response.data;
  },

  /**
   * Analyze quote health
   */
  analyzeQuoteHealth: async (data: { items: any[]; customerId?: number; totalValue: number }): Promise<QuoteHealth> => {
    console.log('🏥 [API] Analyzing quote health for customer:', data.customerId);
    console.log('📊 [API] Items count:', data.items.length, 'Total value:', data.totalValue);
    
    const response = await apiRequest('/customer-intelligence/quote-health', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    console.log('✅ [API] Quote health analyzed, score:', response.data.score);
    
    return response.data;
  },

  /**
   * Get bundle recommendations based on existing items
   */
  getBundleRecommendations: async (data: { existingItems: any[]; customerId?: number }): Promise<any[]> => {
    console.log('📦 [API] Getting bundle recommendations for customer:', data.customerId);
    console.log('📋 [API] Based on existing items:', data.existingItems.length);
    
    const response = await apiRequest('/customer-intelligence/bundles', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    console.log('✅ [API] Bundle recommendations retrieved:', response.data.length);
    
    return response.data;
  },

  /**
   * Get pricing intelligence for items
   */
  getPricingIntelligence: async (items: any[]): Promise<any[]> => {
    console.log('💰 [API] Getting pricing intelligence for', items.length, 'items');
    
    const response = await apiRequest('/customer-intelligence/pricing-intelligence', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });

    console.log('✅ [API] Pricing intelligence retrieved');
    
    return response.data;
  }
};

// Utility functions for processing API responses
export const smartQuoteUtils = {
  /**
   * Group items by category
   */
  groupItemsByCategory: (items: HistoricalQuoteItem[]): Record<string, HistoricalQuoteItem[]> => {
    return items.reduce((groups, item) => {
      const category = item.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {} as Record<string, HistoricalQuoteItem[]>);
  },

  /**
   * Calculate total value of selected items
   */
  calculateTotalValue: (items: HistoricalQuoteItem[]): number => {
    return items.reduce((total, item) => total + (item.totalPrice || item.unitPrice * item.quantity), 0);
  },

  /**
   * Format price for display
   */
  formatPrice: (price: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  },

  /**
   * Format date for display
   */
  formatDate: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObj);
  },

  /**
   * Get confidence color for UI
   */
  getConfidenceColor: (confidence: number): string => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  },

  /**
   * Get confidence badge class
   */
  getConfidenceBadge: (confidence: number): string => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  },

  /**
   * Debounce function for search inputs
   */
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number): T => {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    }) as T;
  },

  /**
   * Validate search filters
   */
  validateSearchFilters: (filters: QuoteItemSearchFilters): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (filters.priceMin !== undefined && filters.priceMax !== undefined) {
      if (filters.priceMin > filters.priceMax) {
        errors.push('Minimum price cannot be greater than maximum price');
      }
    }

    if (filters.dateFrom && filters.dateTo) {
      if (filters.dateFrom > filters.dateTo) {
        errors.push('Start date cannot be after end date');
      }
    }

    if (filters.limit !== undefined && (filters.limit < 1 || filters.limit > 100)) {
      errors.push('Limit must be between 1 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Direct exports for components
export const searchQuoteItems = smartQuoteApi.searchQuoteItems;
export const getFrequentItems = smartQuoteApi.getFrequentItems;
export const analyzeQuoteHealth = smartQuoteApi.analyzeQuoteHealth;
export const getBundleRecommendations = smartQuoteApi.getBundleRecommendations;