import React, { useState, useEffect } from 'react';
import { SmartQuoteItemSearch } from './SmartQuoteItemSearch';
import { CustomerSuggestions } from './CustomerSuggestions';
import { QuickAssemblyShortcuts } from './QuickAssemblyShortcuts';
import { SmartQuoteItem, QuoteHealthScore } from '../../types/smartQuote';
import { analyzeQuoteHealth } from '../../utils/smartQuoteApi';

interface SmartQuoteBuilderProps {
  customerId?: string;
  customerName?: string;
  existingItems: any[];
  onItemsAdded: (items: SmartQuoteItem[]) => void;
  totalValue: number;
  mode?: 'compact' | 'full' | 'suggestions-only';
}

export const SmartQuoteBuilder: React.FC<SmartQuoteBuilderProps> = ({
  customerId,
  customerName: _customerName,  // Prefix with underscore to indicate intentionally unused
  existingItems,
  onItemsAdded,
  totalValue,
  mode: _mode = 'full'  // Prefix with underscore to indicate intentionally unused
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'search-all' | 'suggestions' | 'templates' | 'bundles'>('suggestions');
  const [quoteHealth, setQuoteHealth] = useState<QuoteHealthScore | null>(null);

  // Helper function to convert any item format to SmartQuoteItem
  const convertToSmartQuoteItems = (items: any[]): SmartQuoteItem[] => {
    return items.map(item => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      itemName: item.itemName || item.description || 'Unknown Item',
      description: item.description || 'No description available',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      totalPrice: item.totalPrice || (item.unitPrice * item.quantity) || 0,
      materialId: item.materialId,
      source: item.source || 'manual',
      sourceQuoteId: item.sourceQuoteId,
      sourceQuoteNumber: item.sourceQuoteNumber,
      confidence: item.confidence,
      reason: item.reason,
      category: item.category,
      lastUsed: item.lastUsed,
      usageCount: item.usageCount,
      required: item.required,
      templateName: item.templateName,
      bundleName: item.bundleName,
      bundleId: item.bundleId,
      material: item.material
    }));
  };

  useEffect(() => {
    if (existingItems.length > 0) {
      analyzeQuote();
    }
  }, [existingItems, totalValue]);

  const analyzeQuote = async () => {
    if (existingItems.length === 0) return;

    try {
      const analysis = await analyzeQuoteHealth({
        items: existingItems,
        customerId,
        totalValue
      });
      
      // Add missing metrics property to match QuoteHealthScore interface
      setQuoteHealth({
        ...analysis,
        metrics: {
          itemCount: existingItems.length,
          totalValue: totalValue,
          completeness: 80,
          customerFit: 75
        }
      });
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
          customerId={customerId || ''}
          currentItems={existingItems.map(item => item.description)}
          onItemsSelected={items => handleItemsAdded(convertToSmartQuoteItems(items))}
        />
      )}
      
      {activeTab === 'search' && (
        <SmartQuoteItemSearch
          customerId={customerId}
          searchScope="customer"
          isOpen={true}
          onClose={() => setActiveTab('suggestions')}
          onItemsSelected={items => handleItemsAdded(convertToSmartQuoteItems(items))}
          currentItems={existingItems.map(item => item.description)}
        />
      )}
      
      {activeTab === 'search-all' && (
        <SmartQuoteItemSearch
          customerId={undefined}
          searchScope="global"
          isOpen={true}
          onClose={() => setActiveTab('suggestions')}
          onItemsSelected={items => handleItemsAdded(convertToSmartQuoteItems(items))}
          currentItems={existingItems.map(item => item.description)}
        />
      )}
      
      {activeTab === 'templates' && (
        <QuickAssemblyShortcuts
          onTemplateSelected={items => handleItemsAdded(convertToSmartQuoteItems(items))}
        />
      )}
    </div>
  );
};