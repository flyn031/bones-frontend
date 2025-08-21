// Customer Suggestions Component
// Location: bones-frontend/src/components/smartquote/CustomerSuggestions.tsx

import React, { useState, useEffect } from 'react';
import { customerIntelligenceApi, customerIntelligenceUtils } from '../../utils/customerIntelligenceApi';
import { CustomerSuggestion } from '../../types/smartQuote';
import { CustomerIntelligence } from '../../types/customerIntelligence';
import { Button } from '../ui/Button';

interface CustomerSuggestionsProps {
  customerId: string;
  customerName?: string;
  currentItems: string[];
  onItemsSelected: (items: Array<{
    itemName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    source: 'suggestion';
    confidence: number;
    reason: string;
  }>) => void;
  className?: string;
}

export const CustomerSuggestions: React.FC<CustomerSuggestionsProps> = ({
  customerId,
  customerName,
  currentItems,
  onItemsSelected,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [customerIntel, setCustomerIntel] = useState<CustomerIntelligence | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<CustomerSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupedSuggestions, setGroupedSuggestions] = useState<Record<string, CustomerSuggestion[]>>({});

  // Load suggestions when customer or items change
  useEffect(() => {
    if (customerId) {
      loadCustomerSuggestions();
    }
  }, [customerId, currentItems]);

  const loadCustomerSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading suggestions for customer:', customerId);
      
      // Load suggestions and customer intelligence in parallel
      const [suggestionsData, customerData] = await Promise.all([
        customerIntelligenceApi.getCustomerSuggestions(customerId, currentItems),
        customerIntelligenceApi.getCustomerIntelligence(customerId)
      ]);

      // Sort and group suggestions
      const sortedSuggestions = customerIntelligenceUtils.sortSuggestions(suggestionsData);
      const grouped = customerIntelligenceUtils.groupSuggestionsByReason(sortedSuggestions);
      
      setSuggestions(sortedSuggestions);
      setGroupedSuggestions(grouped);
      setCustomerIntel(customerData);
      
      console.log('Loaded', sortedSuggestions.length, 'suggestions');
      
    } catch (err: any) {
      console.error('Error loading customer suggestions:', err);
      setError(err.message || 'Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle suggestion selection
  const toggleSuggestionSelection = (suggestion: CustomerSuggestion) => {
    const isSelected = (selectedSuggestions || []).some(s => s.itemId === suggestion.itemId);
    
    if (isSelected) {
      setSelectedSuggestions(selectedSuggestions.filter(s => s.itemId !== suggestion.itemId));
    } else {
      setSelectedSuggestions([...selectedSuggestions, suggestion]);
    }
  };

  // Select all suggestions in a group
  const selectGroupSuggestions = (reason: string) => {
    const groupSuggestions = groupedSuggestions[reason] || [];
    const newSelected = [...selectedSuggestions];
    
    groupSuggestions.forEach(suggestion => {
      if (!newSelected.some(s => s.itemId === suggestion.itemId)) {
        newSelected.push(suggestion);
      }
    });
    
    setSelectedSuggestions(newSelected);
  };

  // Add selected suggestions to quote
  const addSelectedToQuote = () => {
    if (selectedSuggestions.length === 0) return;

    const itemsToAdd = selectedSuggestions.map(suggestion => ({
      itemName: suggestion.itemName,
      description: suggestion.description,
      quantity: 1, // Default quantity
      unitPrice: suggestion.unitPrice,
      source: 'suggestion' as const,
      confidence: suggestion.confidence,
      reason: suggestion.reason
    }));

    onItemsSelected(itemsToAdd);
    setSelectedSuggestions([]);
  };

  // Quick add single suggestion
  const quickAddSuggestion = (suggestion: CustomerSuggestion) => {
    const itemToAdd = {
      itemName: suggestion.itemName,
      description: suggestion.description,
      quantity: 1,
      unitPrice: suggestion.unitPrice,
      source: 'suggestion' as const,
      confidence: suggestion.confidence,
      reason: suggestion.reason
    };

    onItemsSelected([itemToAdd]);
  };

  if (!customerId) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="text-gray-500 text-center">
          Select a customer to see intelligent suggestions
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
              Smart Suggestions
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Based on {customerName || 'customer'} purchase history and patterns
            </p>
          </div>
          
          {/* Customer Intelligence Summary */}
          {customerIntel && (
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-gray-900">{customerIntel.conversionRate}%</div>
                <div className="text-gray-500">Win Rate</div>
              </div>
              <div className="text-center">
                <div className={`font-medium ${customerIntelligenceUtils.getRiskLevelColor(customerIntel?.riskLevel || "low")}`}>
                  {(customerIntel?.riskLevel || "low").toUpperCase()}
                </div>
                <div className="text-gray-500">Risk</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900">
                  {customerIntelligenceUtils.formatCurrency(customerIntel.averageOrderValue)}
                </div>
                <div className="text-gray-500">Avg Order</div>
              </div>
            </div>
          )}
        </div>

        {/* Selection Actions */}
        {selectedSuggestions.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedSuggestions.length} suggestion{selectedSuggestions.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSuggestions([])}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={addSelectedToQuote}
              >
                Add to Quote
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Analyzing customer patterns...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">
              {error}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCustomerSuggestions}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && suggestions.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">No suggestions available</div>
            <div className="text-sm text-gray-400">
              This customer may be new or have limited purchase history
            </div>
          </div>
        )}

        {!isLoading && !error && suggestions.length > 0 && (
          <div className="space-y-6">
            {Object.entries(groupedSuggestions).map(([reason, reasonSuggestions]) => (
              <div key={reason} className="space-y-3">
                {/* Group Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {customerIntelligenceUtils.getSuggestionReasonIcon(reason)}
                    </span>
                    <h4 className="font-medium text-gray-900">
                      {customerIntelligenceUtils.getSuggestionReasonLabel(reason)}
                    </h4>
                    <span className="text-sm text-gray-500">
                      ({reasonSuggestions.length} item{reasonSuggestions.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectGroupSuggestions(reason)}
                  >
                    Select All
                  </Button>
                </div>

                {/* Group Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reasonSuggestions.map((suggestion, index) => {
                    const isSelected = (selectedSuggestions || []).some(s => s.itemId === suggestion.itemId);
                    const isCurrentItem = (currentItems || []).some(current => 
                      current.toLowerCase() === suggestion.itemName.toLowerCase()
                    );

                    return (
                      <div
                        key={`suggestion_${suggestion.itemId}_${index}`}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200' 
                            : isCurrentItem
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => toggleSuggestionSelection(suggestion)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                              }`}>
                                {isSelected && <span className="text-white text-xs">✓</span>}
                              </div>
                              <h5 className="font-medium text-gray-900 text-sm">
                                {suggestion.itemName}
                              </h5>
                            </div>

                            {suggestion.description && (
                              <p className="text-xs text-gray-600 mt-1 ml-6">
                                {suggestion.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between mt-2 ml-6">
                              <div className="text-sm">
                                <span className="font-medium text-gray-900">
                                  {customerIntelligenceUtils.formatCurrency(suggestion.unitPrice)}
                                </span>
                                {suggestion.lastPurchased && (
                                  <span className="text-gray-500 ml-2">
                                    Last: {new Date(suggestion.lastPurchased).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  suggestion.confidence >= 0.8 ? "bg-green-100 text-green-800" : suggestion.confidence >= 0.6 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                                }`}>
                                  {customerIntelligenceUtils.formatConfidence(suggestion.confidence)}
                                </span>
                              </div>
                            </div>

                            {isCurrentItem && (
                              <div className="mt-2 ml-6">
                                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                                  Already in quote
                                </span>
                              </div>
                            )}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              quickAddSuggestion(suggestion);
                            }}
                            className="ml-2 text-xs"
                            disabled={isCurrentItem}
                          >
                            Quick Add
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};