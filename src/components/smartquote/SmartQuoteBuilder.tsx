import React, { useState, useEffect } from 'react';
import { SmartQuoteItemSearch } from './SmartQuoteItemSearch';
import { CustomerSuggestions } from './CustomerSuggestions';
import { QuoteHealthIndicator } from './QuoteHealthIndicator';
import { QuickAssemblyShortcuts } from './QuickAssemblyShortcuts';
import { BundleRecommendations } from './BundleRecommendations';
import { SmartQuoteItem, QuoteHealthScore } from '../../types/smartQuote';
import { CustomerIntelligence } from '../../types/customerIntelligence';
import { analyzeQuoteHealth } from '../../utils/smartQuoteApi';
import { getCustomerIntelligence } from '../../utils/customerIntelligenceApi';

interface SmartQuoteBuilderProps {
  customerId?: number;
  customerName?: string;
  existingItems: any[];
  onItemsAdded: (items: SmartQuoteItem[]) => void;
  totalValue: number;
  mode?: 'compact' | 'full';
}

export const SmartQuoteBuilder: React.FC<SmartQuoteBuilderProps> = ({
  customerId,
  customerName,
  existingItems,
  onItemsAdded,
  totalValue,
  mode = 'full'
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'search-all' | 'suggestions' | 'templates' | 'bundles'>('suggestions');
  const [quoteHealth, setQuoteHealth] = useState<QuoteHealthScore | null>(null);
  const [customerIntel, setCustomerIntel] = useState<CustomerIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (customerId) {
      loadCustomerIntelligence();
    }
  }, [customerId]);

  useEffect(() => {
    if (existingItems.length > 0) {
      analyzeQuote();
    }
  }, [existingItems, totalValue]);

  const loadCustomerIntelligence = async () => {
    if (!customerId) return;
    
    try {
      setIsLoading(true);
      const intelligence = await getCustomerIntelligence(customerId);
      setCustomerIntel(intelligence);
    } catch (error) {
      console.error('Failed to load customer intelligence:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeQuote = async () => {
    if (existingItems.length === 0) return;

    try {
      const analysis = await analyzeQuoteHealth({
        items: existingItems,
        customerId,
        totalValue
      });
      setQuoteHealth(analysis);
    } catch (error) {
      console.error('Failed to analyze quote health:', error);
    }
  };

  const handleItemsAdded = (items: SmartQuoteItem[]) => {
    onItemsAdded(items);
    setTimeout(analyzeQuote, 100);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Smart Quote Builder</h3>
        {quoteHealth && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Quote Health:</span>
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              quoteHealth.score >= 80 ? 'bg-green-100 text-green-800' :
              quoteHealth.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {quoteHealth.score}/100
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button"
          onClick={() => setActiveTab('suggestions')}
          className="p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors text-left"
        >
          <div className="text-sm font-medium text-gray-900">Customer Suggestions</div>
          <div className="text-xs text-gray-500">Based on history</div>
        </button>
        
        <button type="button"
          onClick={() => setActiveTab('search')}
          className="p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors text-left"
        >
          <div className="text-sm font-medium text-gray-900">Search Items</div>
          <div className="text-xs text-gray-500">From this customer's quotes</div>
        </button>
        
        <button type="button"
          onClick={() => setActiveTab('search-all')}
          className="p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors text-left"
        >
          <div className="text-sm font-medium text-gray-900">Search All Items</div>
          <div className="text-xs text-gray-500">From all company quotes</div>
        </button>
        
        <button type="button"
          onClick={() => setActiveTab('templates')}
          className="p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors text-left"
        >
          <div className="text-sm font-medium text-gray-900">Quick Templates</div>
          <div className="text-xs text-gray-500">Pre-built solutions</div>
        </button>
      </div>

      {activeTab === 'suggestions' && (
        <CustomerSuggestions
          customerId={customerId}
          customerIntelligence={customerIntel}
          onItemsSelected={handleItemsAdded}
          isLoading={isLoading}
        />
      )}
      
      {activeTab === 'search' && (
        <SmartQuoteItemSearch
          customerId={customerId}
          searchScope="customer"
          isOpen={true}
          onClose={() => setActiveTab('suggestions')}
          onItemsSelected={handleItemsAdded}
          currentItems={existingItems.map(item => item.description)}
        />
      )}
      
      {activeTab === 'search-all' && (
        <SmartQuoteItemSearch
          customerId={undefined}
          searchScope="global"
          isOpen={true}
          onClose={() => setActiveTab('suggestions')}
          onItemsSelected={handleItemsAdded}
          currentItems={existingItems.map(item => item.description)}
        />
      )}
      
      {activeTab === 'templates' && (
        <QuickAssemblyShortcuts
          onTemplateSelected={handleItemsAdded}
          customerType={customerIntel?.industry}
        />
      )}
    </div>
  );
};