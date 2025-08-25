// Quote Health Indicator Component
// Location: bones-frontend/src/components/smartquote/QuoteHealthIndicator.tsx

import React, { useState, useEffect } from 'react';
import { smartQuoteApi } from '../../utils/smartQuoteApi';
import { QuoteHealth } from '../../types/smartQuote';
import { Button } from '../ui/Button';

interface QuoteHealthIndicatorProps {
  customerId?: string;
  items: Array<{
    itemName: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
  }>;
  totalValue: number;
  onRefresh?: () => void;
  className?: string;
  autoRefresh?: boolean;
}

export const QuoteHealthIndicator: React.FC<QuoteHealthIndicatorProps> = ({
  customerId,
  items,
  totalValue,
  className = '',
  autoRefresh = true
}) => {
  const [quoteHealth, setQuoteHealth] = useState<QuoteHealth | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Auto-refresh when items or customer changes
  useEffect(() => {
    if (autoRefresh && customerId && items.length > 0) {
      analyzeQuoteHealth();
    }
  }, [customerId, items, totalValue, autoRefresh]);

  const analyzeQuoteHealth = async () => {
    if (!customerId || items.length === 0) {
      setQuoteHealth(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🏥 Analyzing quote health...');
      
      const healthData = await smartQuoteApi.analyzeQuoteHealth({items, customerId: customerId, totalValue});
      setQuoteHealth(healthData);
      setLastUpdated(new Date());
      
      console.log('✅ Quote health analyzed, score:', healthData.score);
      
    } catch (err: any) {
      console.error('Error analyzing quote health:', err);
      setError(err.message || 'Failed to analyze quote health');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number): string => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const getMarginStatusColor = (status: string): string => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'acceptable': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!customerId) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">🏥</div>
          <div>Select a customer to analyze quote health</div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📋</div>
          <div>Add items to analyze quote health</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              🏥 Quote Health
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Real-time analysis of quote performance indicators
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={analyzeQuoteHealth}
              disabled={isLoading}
            >
              {isLoading ? '🔄' : '🔄'} Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">🔍 Analyzing quote health...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">
              ❌ {error}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={analyzeQuoteHealth}
              className="mt-2"
            >
              Retry Analysis
            </Button>
          </div>
        )}

        {!isLoading && !error && quoteHealth && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className={`text-4xl font-bold ${getScoreColor(quoteHealth.score)}`}>
                {quoteHealth.score}
              </div>
              <div className="text-lg font-medium text-gray-700 mt-1">
                {getScoreLabel(quoteHealth.score)}
              </div>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getScoreBadge(quoteHealth.score)}`}>
                Health Score
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Margin Analysis */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">💰 Margin</h4>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getMarginStatusColor(quoteHealth.margin.status)}`}>
                    {quoteHealth.margin.status.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current:</span>
                    <span className="font-medium">{quoteHealth.margin.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Target:</span>
                    <span className="font-medium">{quoteHealth.margin.target}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        quoteHealth.margin.percentage >= quoteHealth.margin.target 
                          ? 'bg-green-500' 
                          : 'bg-yellow-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (quoteHealth.margin.percentage / quoteHealth.margin.target) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Competitiveness */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">📊 Pricing</h4>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    quoteHealth.pricing.competitive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {quoteHealth.pricing.competitive ? 'COMPETITIVE' : 'CHECK PRICING'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Industry Avg:</span>
                    <span className="font-medium">
                      £{quoteHealth.pricing.industryAverage.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Recommendation:</span>
                    <span className={`font-medium ${
                      quoteHealth.pricing.recommendation === 'maintain' 
                        ? 'text-green-600' 
                        : quoteHealth.pricing.recommendation === 'increase'
                        ? 'text-blue-600'
                        : 'text-orange-600'
                    }`}>
                      {quoteHealth.pricing.recommendation.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inventory Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">📦 Inventory</h4>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    quoteHealth.inventory.allAvailable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {quoteHealth.inventory.allAvailable ? 'ALL AVAILABLE' : 'CHECK STOCK'}
                  </span>
                </div>
                <div className="space-y-2">
                  {quoteHealth.inventory.lowStockItems.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Low Stock:</div>
                      <div className="text-xs text-orange-600">
                        {quoteHealth.inventory.lowStockItems.join(', ')}
                      </div>
                    </div>
                  )}
                  {quoteHealth.inventory.leadTimeWarnings.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Lead Time Warnings:</div>
                      <div className="text-xs text-yellow-600">
                        {quoteHealth.inventory.leadTimeWarnings.join(', ')}
                      </div>
                    </div>
                  )}
                  {quoteHealth.inventory.allAvailable && (
                    <div className="text-sm text-green-600">
                      ✅ All items in stock
                    </div>
                  )}
                </div>
              </div>

              {/* Win Probability */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">🎯 Win Probability</h4>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    quoteHealth.winProbability.percentage >= 70 
                      ? 'bg-green-100 text-green-800' 
                      : quoteHealth.winProbability.percentage >= 50
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {quoteHealth.winProbability.percentage}%
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        quoteHealth.winProbability.percentage >= 70 
                          ? 'bg-green-500' 
                          : quoteHealth.winProbability.percentage >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${quoteHealth.winProbability.percentage}%`
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-600">
                    <div className="font-medium mb-1">Key Factors:</div>
                    {quoteHealth.winProbability.factors.slice(0, 3).map((factor: any, index: number) => (
                      <div key={index}>• {factor}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Recommendations */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 Recommendations</h4>
              <div className="space-y-1 text-sm text-blue-800">
                {quoteHealth.margin.status === 'poor' && (
                  <div>• Consider increasing prices to improve margin</div>
                )}
                {!quoteHealth.pricing.competitive && (
                  <div>• Review pricing against industry standards</div>
                )}
                {!quoteHealth.inventory.allAvailable && (
                  <div>• Check inventory availability before finalizing</div>
                )}
                {quoteHealth.winProbability.percentage < 50 && (
                  <div>• Consider adjusting terms or pricing to improve win probability</div>
                )}
                {quoteHealth.margin.status === 'excellent' && quoteHealth.pricing.competitive && quoteHealth.inventory.allAvailable && (
                  <div>• Quote looks strong - good to send to customer!</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};