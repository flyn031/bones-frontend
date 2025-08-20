// Smart Quote Item Search Component
// Location: bones-frontend/src/components/smartquote/SmartQuoteItemSearch.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { smartQuoteApi, smartQuoteUtils } from '../../utils/smartQuoteApi';
import { 
  HistoricalQuoteItem, 
  QuoteItemSearchFilters, 
  QuoteItemSearchResult 
} from '../../types/smartQuote';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

interface SmartQuoteItemSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onItemsSelected: (items: HistoricalQuoteItem[]) => void;
  currentItems?: string[];
}

export const SmartQuoteItemSearch: React.FC<SmartQuoteItemSearchProps> = ({
  isOpen,
  onClose,
  onItemsSelected,
  currentItems = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<QuoteItemSearchFilters>({
    limit: 50,
    offset: 0
  });
  const [searchResults, setSearchResults] = useState<QuoteItemSearchResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<HistoricalQuoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    smartQuoteUtils.debounce(async (searchFilters: QuoteItemSearchFilters) => {
      setIsLoading(true);
      try {
        const results = await smartQuoteApi.searchQuoteItems(searchFilters);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  // Load filter options on mount
  useEffect(() => {
    if (isOpen) {
      loadFilterOptions();
      // Perform initial search to show recent items
      performSearch({ ...filters, searchTerm: '' });
    }
  }, [isOpen]);

  // Load filter options
  const loadFilterOptions = async () => {
    try {
      const options = await smartQuoteApi.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  // Handle search term changes with suggestions
  const handleSearchTermChange = async (value: string) => {
    setSearchTerm(value);
    
    // Get search suggestions
    if (value.length >= 2) {
      try {
        const suggestions = await smartQuoteApi.getSearchSuggestions(value, 5);
        setSearchSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error('Error getting suggestions:', error);
      }
    } else {
      setShowSuggestions(false);
    }

    // Perform search
    const newFilters = { ...filters, searchTerm: value, offset: 0 };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  // Perform search
  const performSearch = async (searchFilters: QuoteItemSearchFilters) => {
    setIsLoading(true);
    try {
      const results = await smartQuoteApi.searchQuoteItems(searchFilters);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value, offset: 0 };
    setFilters(newFilters);
    performSearch(newFilters);
  };

  // Toggle item selection
  const toggleItemSelection = (item: HistoricalQuoteItem) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id);
    if (isSelected) {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  // Select all visible items
  const selectAllVisible = () => {
    const visibleItems = searchResults?.items || [];
    const newSelected = [...selectedItems];
    
    visibleItems.forEach(item => {
      if (!newSelected.some(selected => selected.id === item.id)) {
        newSelected.push(item);
      }
    });
    
    setSelectedItems(newSelected);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems([]);
  };

  // Handle import selected items
  const handleImportSelected = () => {
    if (selectedItems.length > 0) {
      onItemsSelected(selectedItems);
      setSelectedItems([]);
      onClose();
    }
  };

  // Load more results (pagination)
  const loadMore = () => {
    const newFilters = { ...filters, offset: (filters.offset || 0) + (filters.limit || 50) };
    setFilters(newFilters);
    performSearch(newFilters);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Search Previous Quote Items"
      size="xl"
    >
      <div className="flex flex-col h-full max-h-[80vh]">
        {/* Search Header */}
        <div className="border-b border-gray-200 pb-4 mb-4">
          {/* Main Search Input */}
          <div className="relative mb-4">
            <Input
              type="text"
              placeholder="Search items by name, description, or material code..."
              value={searchTerm}
              onChange={(e) => handleSearchTermChange(e.target.value)}
              className="w-full pl-10"
            />
            <div className="absolute left-3 top-3 text-gray-400">
              🔍
            </div>
            
            {/* Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    onClick={() => {
                      setSearchTerm(suggestion);
                      setShowSuggestions(false);
                      handleSearchTermChange(suggestion);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? 'Hide' : 'Show'} Filters
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => performSearch({ searchTerm: '', limit: 20 })}
            >
              Recent Items
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const frequent = await smartQuoteApi.getFrequentItems(20);
                  setSearchResults({
                    items: frequent,
                    totalCount: frequent.length,
                    categories: [],
                    priceRange: { min: 0, max: 0 }
                  });
                } catch (error) {
                  console.error('Error loading frequent items:', error);
                }
              }}
            >
              Frequent Items
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && filterOptions && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {filterOptions.categories.map((category: string) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin || ''}
                    onChange={(e) => handleFilterChange('priceMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-1/2"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax || ''}
                    onChange={(e) => handleFilterChange('priceMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-1/2"
                  />
                </div>
              </div>

              {/* Customer Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <select
                  value={filters.customerId || ''}
                  onChange={(e) => handleFilterChange('customerId', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Customers</option>
                  {filterOptions.customers.map((customer: any) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Selection Summary */}
          {selectedItems.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-800">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                {selectedItems.length > 0 && (
                  <span className="ml-2 font-medium">
                    Total: {smartQuoteUtils.formatPrice(smartQuoteUtils.calculateTotalValue(selectedItems))}
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
                <Button size="sm" onClick={handleImportSelected}>
                  Import Selected
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">🔍 Searching...</div>
            </div>
          )}

          {!isLoading && searchResults && (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  {searchResults.totalCount} items found
                  {searchTerm && ` for "${searchTerm}"`}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllVisible}
                    disabled={searchResults.items.length === 0}
                  >
                    Select All Visible
                  </Button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {searchResults.items.map((item, index) => {
                  const isSelected = selectedItems.some(selected => selected.id === item.id);
                  const isCurrentItem = currentItems.some(current => 
                    current.toLowerCase() === item.itemName.toLowerCase()
                  );

                  return (
                    <div
                      key={`${item.id}_${index}`}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-200' 
                          : isCurrentItem
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleItemSelection(item)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                            }`}>
                              {isSelected && <span className="text-white text-xs">✓</span>}
                            </div>
                            <h4 className="font-medium text-gray-900">
                              {item.itemName}
                              {isCurrentItem && (
                                <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                  In Current Quote
                                </span>
                              )}
                            </h4>
                          </div>
                          
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1 ml-6">
                              {item.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 mt-2 ml-6 text-sm text-gray-500">
                            <span>Qty: {item.quantity}</span>
                            <span>Price: {smartQuoteUtils.formatPrice(item.unitPrice)}</span>
                            <span>Total: {smartQuoteUtils.formatPrice(item.totalPrice)}</span>
                            {item.category && <span>Category: {item.category}</span>}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-1 ml-6 text-xs text-gray-400">
                            <span>From: {item.sourceCustomerName}</span>
                            <span>Quote: {item.sourceQuoteNumber}</span>
                            <span>Date: {smartQuoteUtils.formatDate(item.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More */}
              {searchResults.items.length < searchResults.totalCount && (
                <div className="flex justify-center mt-6">
                  <Button variant="outline" onClick={loadMore}>
                    Load More ({searchResults.totalCount - searchResults.items.length} remaining)
                  </Button>
                </div>
              )}

              {/* No Results */}
              {searchResults.items.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-2">No items found</div>
                  <div className="text-sm text-gray-400">
                    Try adjusting your search terms or filters
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleImportSelected}
              disabled={selectedItems.length === 0}
            >
              Import {selectedItems.length > 0 ? `${selectedItems.length} ` : ''}Selected
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};