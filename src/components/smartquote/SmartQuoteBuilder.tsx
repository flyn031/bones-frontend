import React, { useState, useEffect } from 'react';
import { SmartQuoteItemSearch } from './SmartQuoteItemSearch';
import { CustomerSuggestions } from './CustomerSuggestions';
import { QuickAssemblyShortcuts } from './QuickAssemblyShortcuts';
import { ManualItemAdd } from './ManualItemAdd';
import { SmartQuoteItem, QuoteHealthScore } from '../../types/smartQuote';
import { analyzeQuoteHealth } from '../../utils/smartQuoteApi';

interface SmartQuoteBuilderProps {
  customerId?: string;
  customerName?: string;
  existingItems: any[];
  onItemsAdded: (items: SmartQuoteItem[]) => void;
  totalValue: number;
}

export const SmartQuoteBuilder: React.FC<SmartQuoteBuilderProps> = ({
  customerId,
  customerName,
  existingItems,
  onItemsAdded,
  totalValue,
}) => {
  const [activeTab, setActiveTab] = useState<'customer-history' | 'search-all' | 'templates' | 'add-item'>('customer-history');
  const [quoteHealth, setQuoteHealth] = useState<QuoteHealthScore | null>(null);

  // Helper function to convert any item format to SmartQuoteItem
  const convertToSmartQuoteItems = (items: any[]): SmartQuoteItem[] => {
    return items.map(item => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      description: item.itemName || item.description || 'Unknown Item',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      materialId: item.materialId,
      source: item.source || 'manual',
      sourceQuoteId: item.sourceQuoteId,
      sourceQuoteNumber: item.sourceQuoteNumber,
      confidence: item.confidence,
      reason: item.reason,
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

  const handleManualItemAdded = (item: SmartQuoteItem) => {
    handleItemsAdded([item]);
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

      {/* Updated 4-Tab Interface */}
      <div className="grid grid-cols-4 gap-3">
        <button 
          key="customer-history"
          type="button"
          onClick={() => setActiveTab('customer-history')}
          className={`p-3 rounded-lg border transition-colors text-left ${
            activeTab === 'customer-history' 
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500' 
              : 'bg-white border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="text-sm font-medium text-gray-900">Customer History</div>
          <div className="text-xs text-gray-500">Smart suggestions + search</div>
          {customerId && (
            <div className="text-xs text-blue-600 mt-1">
              {customerName || 'Selected customer'}
            </div>
          )}
        </button>
        
        <button 
          key="search-all"
          type="button"
          onClick={() => setActiveTab('search-all')}
          className={`p-3 rounded-lg border transition-colors text-left ${
            activeTab === 'search-all' 
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500' 
              : 'bg-white border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="text-sm font-medium text-gray-900">Search All Items</div>
          <div className="text-xs text-gray-500">Recent company quotes</div>
        </button>
        
        <button 
          key="templates"
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`p-3 rounded-lg border transition-colors text-left ${
            activeTab === 'templates' 
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500' 
              : 'bg-white border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="text-sm font-medium text-gray-900">Quick Templates</div>
          <div className="text-xs text-gray-500">Pre-built solutions</div>
        </button>

        <button 
          key="add-item"
          type="button"
          onClick={() => setActiveTab('add-item')}
          className={`p-3 rounded-lg border transition-colors text-left ${
            activeTab === 'add-item' 
              ? 'bg-green-50 border-green-300 ring-2 ring-green-500' 
              : 'bg-white border-gray-200 hover:border-green-300'
          }`}
        >
          <div className="text-sm font-medium text-gray-900 flex items-center">
            <span className="mr-1">+</span>
            Add Item
          </div>
          <div className="text-xs text-gray-500">Manual entry</div>
        </button>
      </div>

      {/* Customer History - Consolidated Smart Features */}
      {activeTab === 'customer-history' && (
        <div className="space-y-4">
          {customerId ? (
            <>
              {/* Smart Suggestions */}
              <CustomerSuggestions
                customerId={customerId}
                customerName={customerName}
                currentItems={existingItems.map(item => item.description)}
                onItemsSelected={items => handleItemsAdded(convertToSmartQuoteItems(items))}
              />
              
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gray-50 px-2 text-sm text-gray-500">or search this customer's items</span>
                </div>
              </div>
              
              {/* Customer Search - Fixed Modal Trap */}
              <SmartQuoteItemSearch
                customerId={customerId}
                searchScope="customer"
                isOpen={false}
                onClose={() => {}}
                onItemsSelected={items => handleItemsAdded(convertToSmartQuoteItems(items))}
                currentItems={existingItems.map(item => item.description)}
              />
            </>
          ) : (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <div className="text-gray-400 text-4xl mb-4">👤</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Select a Customer</h4>
              <p className="text-gray-500">
                Choose a customer to see their purchase history and get intelligent suggestions
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Search All Items */}
      {activeTab === 'search-all' && (
        <div className="bg-white rounded-lg border border-amber-200 p-4 mb-4">
          <div className="flex items-start">
            <div className="text-amber-500 mr-3">⚠️</div>
            <div>
              <h4 className="text-sm font-medium text-amber-800">Performance Notice</h4>
              <p className="text-sm text-amber-700 mt-1">
                Searching all quotes shows recent items only (last 6 months) for better performance.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'search-all' && (
        <SmartQuoteItemSearch
          customerId={undefined}
          searchScope="global"
          isOpen={true}
          onClose={() => setActiveTab('customer-history')}
          onItemsSelected={items => handleItemsAdded(convertToSmartQuoteItems(items))}
          currentItems={existingItems.map(item => item.description)}
        />
      )}
      
      {/* Templates */}
      {activeTab === 'templates' && (
        <QuickAssemblyShortcuts
          onTemplateSelected={items => handleItemsAdded(convertToSmartQuoteItems(items))}
        />
      )}

      {/* Manual Add Item Tab */}
      {activeTab === 'add-item' && (
        <ManualItemAdd
          onItemAdded={handleManualItemAdded}
          customerId={customerId}
        />
      )}
    </div>
  );
};