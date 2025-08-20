// Smart Quote Types
export interface SmartQuoteItem {
  id: number | string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  materialId?: string;
  source: 'previous_quote' | 'customer_history' | 'suggestion' | 'frequent' | 'manual';
  sourceQuoteId?: string;
  sourceQuoteNumber?: string;
  confidence?: number;
  reason?: string;
  category?: string;
  lastUsed?: string | Date;
  usageCount?: number;
  material?: {
    id: string;
    code: string;
    name: string;
    description: string;
    unitPrice: number;
    unit: string;
    category?: string;
  };
}

export interface CustomerSuggestion {
  id: number;
  itemName: string;
  description?: string;
  suggestedPrice: number;
  confidence: number;
  reason: string;
  category?: string;
  lastPurchased?: string | Date;
  usageCount?: number;
  materialId?: string;
}

export interface BundleRecommendation {
  id: string;
  name: string;
  description: string;
  items: SmartQuoteItem[];
  totalPrice: number;
  confidence: number;
  reason: string;
  category: string;
  estimatedSavings?: number;
}

export interface QuickAssemblyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  items: SmartQuoteItem[];
  estimatedValue: number;
  industryType?: string;
}

export interface HistoricalQuoteItem {
  id: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  sourceCustomerName: string;
  sourceQuoteNumber: string;
  createdAt: string | Date;
  materialId?: string;
}

export interface QuoteItemSearchFilters {
  searchTerm?: string;
  category?: string;
  customerId?: string;
  priceMin?: number;
  priceMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'recent' | 'frequent' | 'price';
}

export interface QuoteItemSearchResult {
  items: HistoricalQuoteItem[];
  totalCount: number;
  categories: string[];
  priceRange: { min: number; max: number };
}

export interface QuoteHealth {
  score: number;
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestion: string;
  }>;
  suggestions: Array<{
    type: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    description: string;
  }>;
}

export interface QuoteHealthScore {
  score: number;
  issues: any[];
  suggestions: any[];
  metrics: {
    itemCount: number;
    totalValue: number;
    completeness: number;
    customerFit: number;
  };
}

export interface SmartQuoteBuilderState {
  isActive: boolean;
  mode: 'compact' | 'full' | 'suggestions-only';
  selectedItems: SmartQuoteItem[];
  customerIntelligence?: any;
}

export interface SmartQuoteEvent {
  type: 'item_added' | 'item_removed' | 'mode_changed' | 'search_performed';
  data: any;
  timestamp: Date;
}

export interface SmartQuoteConfig {
  enabled: boolean;
  defaultMode: 'compact' | 'full' | 'suggestions-only';
  maxSuggestions: number;
  confidenceThreshold: number;
}