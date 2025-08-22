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

// Helper function to map API response to HistoricalQuoteItem format
const mapApiItemToHistoricalQuoteItem = (item: any): HistoricalQuoteItem => {
  return {
    id: item.id || item.itemId || Math.random().toString(36).substr(2, 9),
    description: item.description || item.name || 'Unknown Item',
    unitPrice: parseFloat(item.unitPrice || item.price || 0),
    quantity: parseInt(item.quantity || 1),
    totalPrice: parseFloat(item.totalPrice || (item.unitPrice * (item.quantity || 1)) || 0),
    category: item.material?.category || item.category || 'Uncategorized',
    confidence: parseFloat(item.confidence || 0),
    lastUsed: item.lastUsed || new Date().toISOString(),
    timesUsed: parseInt(item.orderCount || item.timesUsed || 0),
    material: item.material || null,
    supplier: item.supplier || null,
    leadTime: item.leadTime || null,
    stockLevel: item.stockLevel || null,
    discount: item.discount || 0,
    notes: item.notes || null
  };
};

export const smartQuoteApi = {
  /**
   * Search through historical quote items
   */
  searchQuoteItems: async (filters: QuoteItemSearchFilters): Promise<QuoteItemSearchResult> => {
    console.log('🔍 [API] Searching quote items with filters:', filters);
    
    try {
      // Use existing customer intelligence search
      if (filters.customerId) {
        const response = await apiRequest(`/customer-intelligence/${filters.customerId}/suggestions`);
        const items = response.data || [];
        
        // Apply client-side filtering if needed
        let filteredItems = items;
        if (filters.searchTerm) {
          filteredItems = items.filter(item => 
            item.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            item.name?.toLowerCase().includes(filters.searchTerm.toLowerCase())
          );
        }
        
        // Map to HistoricalQuoteItem format
        const mappedItems = filteredItems
          .slice(0, filters.limit || 20)
          .map(mapApiItemToHistoricalQuoteItem);
        
        console.log('🔍 [API] Search results mapped:', mappedItems.length, 'items');
        
        return {
          items: mappedItems,
          total: filteredItems.length
        };
      }
      
      return { items: [], total: 0 };
    } catch (error) {
      console.error('Error searching quote items:', error);
      return { items: [], total: 0 };
    }
  },

  /**
   * Get items from a specific quote for copying
   */
  getQuoteItems: async (quoteId: string): Promise<HistoricalQuoteItem[]> => {
    console.log('📋 [API] Getting items for quote:', quoteId);
    
    try {
      // This would need a backend endpoint, return empty for now
      return [];
    } catch (error) {
      console.error('Error getting quote items:', error);
      return [];
    }
  },

  /**
   * Get frequently used items across all quotes
   */
  getFrequentItems: async (customerId?: number, limit: number = 20): Promise<HistoricalQuoteItem[]> => {
    console.log('🔥 [API] Getting frequent items, limit:', limit);
    
    try {
      if (!customerId) return [];
      
      const response = await apiRequest(`/api/customer-intelligence/${customerId}/suggestions`);
      const items = response.data || [];
      
      // Map the response to match expected format
      const mappedItems = items
        .slice(0, limit)
        .map(mapApiItemToHistoricalQuoteItem);
      
      console.log('🔥 [API] Frequent items mapped:', mappedItems.length, 'items');
      
      return mappedItems;
    } catch (error) {
      console.error('Error getting frequent items:', error);
      return [];
    }
  },

  /**
   * Get similar items based on name/description
   */
  getSimilarItems: async (itemName: string, limit: number = 10): Promise<HistoricalQuoteItem[]> => {
    console.log('🔍 [API] Getting similar items for:', itemName);
    
    try {
      // This would need backend implementation, return empty for now
      return [];
    } catch (error) {
      console.error('Error getting similar items:', error);
      return [];
    }
  },

  /**
   * Get search suggestions/autocomplete
   */
  getSearchSuggestions: async (term: string, limit: number = 10): Promise<string[]> => {
    if (term.length < 2) {
      return [];
    }

    console.log('💡 [API] Getting search suggestions for:', term);
    
    try {
      // Return common conveyor-related suggestions
      const suggestions = [
        'Standard Widget',
        'Polyurethane Conveyor Belt',
        'Medium Duty Gravity Roller Conveyor',
        'Motor',
        'Control Panel',
        'Safety Barrier',
        'Rubber Matting'
      ].filter(suggestion => 
        suggestion.toLowerCase().includes(term.toLowerCase())
      );
      
      return suggestions.slice(0, limit);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
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
    
    try {
      // Return static filter options based on your conveyor business
      return {
        categories: [
          'Motors',
          'Belts', 
          'Conveyors',
          'Controls',
          'Safety Equipment',
          'Accessories'
        ],
        priceRange: { min: 0, max: 2000 },
        customers: [], // Could be populated from customer API
        dateRanges: [
          { label: 'Last 7 days', value: '7d' },
          { label: 'Last 30 days', value: '30d' },
          { label: 'Last 90 days', value: '90d' },
          { label: 'Last year', value: '1y' }
        ]
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      return {
        categories: [],
        priceRange: { min: 0, max: 1000 },
        customers: [],
        dateRanges: []
      };
    }
  },

  /**
   * Analyze quote health
   */
  analyzeQuoteHealth: async (data: { items: any[]; customerId?: number; totalValue: number }): Promise<QuoteHealth> => {
    console.log('🏥 [API] Analyzing quote health for customer:', data.customerId);
    console.log('📊 [API] Items count:', data.items.length, 'Total value:', data.totalValue);
    
    try {
      const response = await apiRequest('/customer-intelligence/analyze-quote-health', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      console.log('✅ [API] Quote health analyzed, score:', response.data.score);
      
      return response.data;
    } catch (error) {
      console.error('Error analyzing quote health:', error);
      // Return default health data
      return {
        score: 75,
        factors: {
          completeness: 80,
          pricing: 70,
          margin: 75
        },
        recommendations: ['Consider adding complementary items'],
        issues: []
      };
    }
  },

  /**
   * Get bundle recommendations based on existing items
   */
  getBundleRecommendations: async (data: { existingItems: any[]; customerId?: number }): Promise<any[]> => {
    console.log('📦 [API] Getting bundle recommendations for customer:', data.customerId);
    console.log('📋 [API] Based on existing items:', data.existingItems.length);
    
    try {
      if (!data.customerId) return [];
      
      const response = await apiRequest(`/api/customer-intelligence/${data.customerId}/bundles`);
      return response.data || [];
    } catch (error) {
      console.error('Error getting bundle recommendations:', error);
      return [];
    }
  },

  /**
   * Get pricing intelligence for items
   */
  getPricingIntelligence: async (items: any[]): Promise<any[]> => {
    console.log('💰 [API] Getting pricing intelligence for', items.length, 'items');
    
    try {
      // This would need backend implementation, return items as-is for now
      return items.map(item => ({
        ...item,
        priceAnalysis: {
          competitive: true,
          trend: 'stable',
          recommendation: 'current price is competitive'
        }
      }));
    } catch (error) {
      console.error('Error getting pricing intelligence:', error);
      return items;
    }
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