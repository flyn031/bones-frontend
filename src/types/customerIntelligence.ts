// Customer Intelligence Types
export interface CustomerIntelligence {
  customerId: string;
  customerName: string;
  industry?: string;
  totalQuotes: number;
  totalValue: number;
  lastQuoteDate?: Date | string;
  commonItems: string[];
  averageOrderValue: number;
  preferredCategories: string[];
  riskLevel?: 'low' | 'medium' | 'high';
  conversionRate?: number;
  purchaseFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'annually';
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

export interface CustomerPurchasePattern {
  customerId: string;
  category: string;
  frequency: number;
  averageQuantity: number;
  averagePrice: number;
  lastPurchase: Date;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface CustomerItemPreference {
  customerId: string;
  itemId: string;
  itemName: string;
  preferenceScore: number;
  purchaseCount: number;
  totalSpent: number;
  lastPurchased: Date;
}

export interface IndustryBenchmarks {
  industry: string;
  averageOrderValue: number;
  commonCategories: string[];
  seasonalTrends: Array<{
    period: string;
    multiplier: number;
  }>;
  competitiveFactors: string[];
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    minOrderValue?: number;
    maxOrderValue?: number;
    categories?: string[];
    frequency?: string;
    industry?: string;
  };
  customerCount: number;
  averageValue: number;
}

export interface MarketIntelligence {
  industryTrends: Array<{
    category: string;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
    timeframe: string;
  }>;
  competitiveAnalysis: {
    marketShare: number;
    pricePosition: 'premium' | 'competitive' | 'budget';
    strengths: string[];
    opportunities: string[];
  };
  seasonality: Array<{
    period: string;
    categories: string[];
    expectedChange: number;
  }>;
}

export interface PredictiveInsight {
  customerId: string;
  type: 'next_purchase' | 'price_sensitivity' | 'churn_risk' | 'upsell_opportunity';
  confidence: number;
  timeframe: string;
  description: string;
  recommendedAction: string;
  estimatedValue?: number;
}