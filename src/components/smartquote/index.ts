// Smart Quote Components Index
// Location: bones-frontend/src/components/smartquote/index.ts

// Main orchestrator component
export { SmartQuoteBuilder } from './SmartQuoteBuilder';

// Individual smart quote components
export { SmartQuoteItemSearch } from './SmartQuoteItemSearch';
export { CustomerSuggestions } from './CustomerSuggestions';
export { QuoteHealthIndicator } from './QuoteHealthIndicator';
export { QuickAssemblyShortcuts } from './QuickAssemblyShortcuts';
export { BundleRecommendations } from './BundleRecommendations';

// Re-export utilities for convenience
export { smartQuoteApi, smartQuoteUtils } from '../../utils/smartQuoteApi';
export { customerIntelligenceApi, customerIntelligenceUtils } from '../../utils/customerIntelligenceApi';

// Re-export types for convenience
export type { 
  HistoricalQuoteItem,
  QuoteItemSearchFilters,
  QuoteItemSearchResult,
  CustomerSuggestion,
  BundleRecommendation,
  QuickAssemblyTemplate,
  QuoteHealth,
  SmartQuoteBuilderState,
  SmartQuoteEvent,
  SmartQuoteConfig
} from '../../types/smartQuote';

export type {
  CustomerIntelligence,
  CustomerPurchasePattern,
  CustomerItemPreference,
  IndustryBenchmarks,
  CustomerSegment,
  MarketIntelligence,
  PredictiveInsight
} from '../../types/customerIntelligence';