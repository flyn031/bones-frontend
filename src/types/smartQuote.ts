// Smart Quote Types
export interface SmartQuoteItem {
  id: number | string;
  itemName: string;        // ADDED: Missing property
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  materialId?: string;
  required?: boolean;      // ADDED: Missing property for templates
  source: 'previous_quote' | 'customer_history' | 'suggestion' | 'frequent' | 'manual' | 'template' | 'bundle';  // ADDED: template, bundle
  sourceQuoteId?: string;
  sourceQuoteNumber?: string;
  confidence?: number;
  reason?: string;
  category?: string;
  lastUsed?: string | Date;
  usageCount?: number;
  templateName?: string;   // ADDED: For template source
  bundleName?: string;     // ADDED: For bundle source
  bundleId?: string;       // ADDED: For bundle source
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
  itemId: string;          // ADDED: Missing property
  itemName: string;
  description?: string;
  suggestedPrice: number;
  unitPrice: number;       // ADDED: Missing property
  confidence: number;
  reason: string;
  category?: string;
  lastPurchased?: string | Date;
  usageCount?: number;
  materialId?: string;
}

export interface BundleRecommendation {
  id: string;
  bundleId: string;        // ADDED: Missing property
  name: string;
  description: string;
  items: SmartQuoteItem[];
  totalPrice: number;
  confidence: number;
  reason: string;
  category: string;
  estimatedSavings?: number;
  savings: number;         // ADDED: Missing property
  bundleType: string;      // ADDED: Missing property
  frequency?: number;      // ADDED: Missing property
}

export interface QuickAssemblyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  items: SmartQuoteItem[];
  estimatedValue: number;
  industryType?: string;
  icon: string;            // ADDED: Missing property
  itemCount: number;       // ADDED: Missing property
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
  lastUsed?: string | Date;   // ADDED: Missing property
  timesUsed?: number;         // ADDED: Missing property
  confidence?: number;        // ADDED: Missing property
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
  total: number;              // ADDED: Missing property
  categories: string[];
  priceRange: { min: number; max: number };
}

export interface QuoteHealth {
  score: number;
  margin: any;                // ADDED: Missing property
  pricing: any;               // ADDED: Missing property
  inventory: any;             // ADDED: Missing property
  winProbability: any;        // ADDED: Missing property
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

// ADDED: Missing interface for SelectedItem (used in NewQuoteModal)
export interface SelectedItem {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  source: string;           // ADDED: Missing property
  confidence?: number;      // ADDED: Missing property
}