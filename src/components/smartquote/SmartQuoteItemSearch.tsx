// Smart Quote Item Search Component - Optimized for Large Datasets
// Location: bones-frontend/src/components/smartquote/SmartQuoteItemSearch.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  customerId?: string;
  searchScope?: 'customer' | 'global';
  currentItems?: string[];
}

export const SmartQuoteItemSearch: React.FC<SmartQuoteItemSearchProps> = ({
  isOpen,
  onClose,
  onItemsSelected,
  customerId,
  searchScope = 'customer',
  currentItems = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<QuoteItemSearchFilters>({
    customerId: searchScope === 'customer' ? customerId : undefined,
    limit: 50,
    offset: 0
  });
  const [searchResults, setSearchResults] = useState<QuoteItemSearchResult | null>(null);
  const [allResults, setAllResults] = useState<HistoricalQuoteItem[]>([]); // Store all loaded results
  const [selectedItems, setSelectedItems] = useState<HistoricalQuoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [performanceWarning, setPerformanceWarning] = useState<string[]>([]);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);

  // Enhanced debounced search function
  const debouncedSearch = useCallback(
    smartQuoteUtils.debounce(async (searchFilters: QuoteItemSearchFilters) => {
      setIsLoading(true);
      setPerformanceWarning([]);
      
      try {
        let results;
        if (searchScope === 'global') {
          results = await smartQuoteApi.searchAllQuoteItems(searchFilters);
        } else {
          results = await smartQuoteApi.searchQuoteItems(searchFilters);
        }
        
        // Reset accumulated results when new search
        if (searchFilters.offset === 0) {
          setAllResults(results.items);
          setSearchResults(results);
        } else {
          // Append to existing results for pagination
          setAllResults(prev => [...prev, ...results.items]);
          setSearchResults(prev => prev ? {
            ...results,
            items: [...prev.items, ...results.items]
          } : results);
        }

        // Performance warnings
        const warnings = smartQuoteUtils.getPerformanceRecommendations(results.total || 0);
        setPerformanceWarning(warnings);
        
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300), // Reduced delay for better responsiveness
    [searchScope]
  );

  // Update filters when searchScope or customerId changes
  useEffect(() => {
    const newFilters: QuoteItemSearchFilters = { 
  customerId: searchScope === 'customer' ? customerId : undefined,
  offset: 0 // Reset pagination
};

// Default to 6 months for global search performance
if (searchScope === 'global') {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  newFilters.dateFrom = sixMonthsAgo;
}
    
    setFilters(newFilters);
  }, [customerId, searchScope]);

  // Load filter options on mount
  useEffect(() => {
    if (isOpen) {
      loadFilterOptions();
      // Perform initial search to show recent items
      const initialFilters = { 
        ...filters, 
        customerId: searchScope === 'customer' ? customerId : undefined, 
        searchTerm: '',
        offset: 0
      };
      
      // Apply default 6-month filter for global search
      if (searchScope === 'global') {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        initialFilters.dateFrom = sixMonthsAgo;
      }
      
      performSearch(initialFilters);
    }
  }, [isOpen, customerId, searchScope]);

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
        const suggestions = await smartQuoteApi.getSearchSuggestions(value, 8);
        setSearchSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error('Error getting suggestions:', error);
      }
    } else {
      setShowSuggestions(false);
    }

    // Perform search with reset
    const newFilters = { 
      ...filters, 
      customerId: searchScope === 'customer' ? customerId : undefined, 
      searchTerm: value, 
      offset: 0 
    };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  // Perform search
  const performSearch = async (searchFilters: QuoteItemSearchFilters) => {
    setIsLoading(true);
    try {
      let results;
      if (searchScope === 'global') {
        results = await smartQuoteApi.searchAllQuoteItems(searchFilters);
      } else {
        results = await smartQuoteApi.searchQuoteItems(searchFilters);
      }
      
      if (searchFilters.offset === 0) {
        setAllResults(results.items);
        setSearchResults(results);
      } else {
        setAllResults(prev => [...prev, ...results.items]);
        setSearchResults(prev => prev ? {
          ...results,
          items: [...prev.items, ...results.items]
        } : results);
      }

      const warnings = smartQuoteUtils.getPerformanceRecommendations(results.total || 0);
      setPerformanceWarning(warnings);
      
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { 
      ...filters, 
      customerId: searchScope === 'customer' ? customerId : undefined, 
      [key]: value, 
      offset: 0 
    };
    setFilters(newFilters);
    performSearch(newFilters);
  };

  // Quick date range functions
  const setDateRange = (days: number | null) => {
    if (days === null) {
      // All time - clear date filters
      handleFilterChange('dateFrom', undefined);
      handleFilterChange('dateTo', undefined);
    } else {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      const toDate = new Date();
      
      const newFilters = { 
        ...filters, 
        customerId: searchScope === 'customer' ? customerId : undefined,
        dateFrom: fromDate,
        dateTo: toDate,
        offset: 0 
      };
      setFilters(newFilters);
      performSearch(newFilters);
    }
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

  // Bulk selection functions
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

  const selectByCategory = (category: string) => {
    const categoryItems = allResults.filter(item => item.category === category);
    const newSelected = [...selectedItems];
    
    categoryItems.forEach(item => {
      if (!newSelected.some(selected => selected.id === item.id)) {
        newSelected.push(item);
      }
    });
    
    setSelectedItems(newSelected);
  };

  const selectByPriceRange = (min: number, max: number) => {
    const priceRangeItems = allResults.filter(item => 
      item.unitPrice >= min && item.unitPrice <= max
    );
    const newSelected = [...selectedItems];
    
    priceRangeItems.forEach(item => {
      if (!newSelected.some(selected => selected.id === item.id)) {
        newSelected.push(item);
      }
    });
    
    setSelectedItems(newSelected);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems([]);
    setBulkSelectMode(false);
  };

  // Handle import selected items
  const handleImportSelected = () => {
    if (selectedItems.length > 0) {
      onItemsSelected(selectedItems);
      setSelectedItems([]);
      onClose();
    }
  };

  // Load more results (enhanced pagination)
  const loadMore = async () => {
    if (!searchResults?.hasMore) return;
    
    setIsLoadingMore(true);
    const newFilters = { 
      ...filters, 
      customerId: searchScope === 'customer' ? customerId : undefined, 
      offset: (filters.offset || 0) + (filters.limit || 50) 
    };
    setFilters(newFilters);
    
    try {
      let results;
      if (searchScope === 'global') {
        results = await smartQuoteApi.searchAllQuoteItems(newFilters);
      } else {
        results = await smartQuoteApi.searchQuoteItems(newFilters);
      }
      
      setAllResults(prev => [...prev, ...results.items]);
      setSearchResults(prev => prev ? {
        ...results,
        total: prev.total,
        items: [...prev.items, ...results.items]
      } : results);
      
    } catch (error) {
      console.error('Error loading more results:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Get search title based on scope
  const getSearchTitle = () => {
    if (searchScope === 'global') {
      return 'Search All Quote Items';
    }
    return 'Search Previous Quote Items';
  };

  // Get search description based on scope
  const getSearchDescription = () => {
    if (searchScope === 'global') {
      return 'Search across all customers and quotes in your company';
    }
    return `Search ${customerId ? 'this customer\'s' : ''} previous quote items`;
  };

  // Memoized grouped categories for bulk selection
  const groupedCategories = useMemo(() => {
    return smartQuoteUtils.groupItemsByCategory(allResults);
  }, [allResults]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={getSearchTitle()}
      size="xl"
    >
      <div className="flex flex-col h-full max-h-[80vh]">
        {/* Search Header */}
        <div className="border-b border-gray-200 pb-4 mb-4">
          {/* Search Description */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {getSearchDescription()}
            </p>
            {searchScope === 'global' && (
              <div className="mt-1 text-xs text-blue-600">
                Global search includes items from all customers and quotes (defaults to last 6 months for performance)
              </div>
            )}
          </div>

          {/* Performance Warning */}
          {performanceWarning.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <div className="text-amber-600 text-sm">
                  <strong>Performance Notice:</strong>
                  <ul className="mt-1 list-disc list-inside">
                    {performanceWarning.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Main Search Input */}
          <div className="relative mb-4">
            <Input
              type="text"
              placeholder={searchScope === 'global' ? 
                "Search all items by name, description, or material code..." : 
                "Search items by name, description, or material code..."
              }
              value={searchTerm}
              onChange={(e) => handleSearchTermChange(e.target.value)}
              className="w-full pl-10"
            />
            <div className="absolute left-3 top-3 text-gray-400">
              {searchScope === 'global' ? '🌍' : '🔍'}
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
              onClick={() => performSearch({ 
                customerId: searchScope === 'customer' ? customerId : undefined, 
                searchTerm: '', 
                limit: 50,
                offset: 0
              })}
            >
              Recent Items
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                console.log(`Frequent Items button clicked, searchScope: ${searchScope}, customerId:`, customerId);
                try {
                  let frequent;
                  if (searchScope === 'global') {
                  frequent = await smartQuoteApi.getFrequentItems(undefined);
                  } else {
                  frequent = await smartQuoteApi.getFrequentItems(customerId);
                  }
                  console.log('FREQUENT ITEMS RAW RESPONSE:', frequent);
                  setSearchResults({
                  items: frequent,
                  totalCount: frequent.length,
                  total: frequent.length,
                  hasMore: false,
                  categories: [],
                  priceRange: { min: 0, max: 0 }
                    });
                  setAllResults(frequent);
                } catch (error) {
                  console.error('Error loading frequent items:', error);
                }
              }}
            >
              Frequent Items
            </Button>

            <Button
              variant={bulkSelectMode ? "default" : "outline"}
              size="sm"
              onClick={() => setBulkSelectMode(!bulkSelectMode)}
            >
              Bulk Select
            </Button>
          </div>

          {/* Quick Date Range Buttons */}
          {searchScope === 'global' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Date Filters
              </label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setDateRange(30)}
                >
                  Last 30 Days
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setDateRange(90)}
                >
                  Last 3 Months
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setDateRange(180)}
                >
                  Last 6 Months
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setDateRange(365)}
                >
                  Last Year
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setDateRange(null)}
                >
                  All Time
                </Button>
              </div>
            </div>
          )}

          {/* Bulk Selection Tools */}
          {bulkSelectMode && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-2">Bulk Selection Tools</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={selectAllVisible}>
                  Select All Visible
                </Button>
                
                {Object.keys(groupedCategories).map(category => (
                  <Button 
                    key={category}
                    size="sm" 
                    variant="outline"
                    onClick={() => selectByCategory(category)}
                  >
                    Select {category} ({groupedCategories[category].length})
                  </Button>
                ))}
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => selectByPriceRange(0, 100)}
                >
                  Select £0-£100
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => selectByPriceRange(100, 500)}
                >
                  Select £100-£500
                </Button>
              </div>
            </div>
          )}

          {/* Advanced Filters */}
          {showAdvancedFilters && filterOptions && (
            <div className="p-4 bg-gray-50 rounded-lg mb-4 space-y-4">
              {/* Basic Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                {/* Customer Filter - Only show for global search */}
                {searchScope === 'global' && (
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
                )}
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Date Range
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">From Date</label>
                    <Input
                      type="date"
                      value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">To Date</label>
                    <Input
                      type="date"
                      value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        handleFilterChange('dateFrom', undefined);
                        handleFilterChange('dateTo', undefined);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                {filters.dateFrom || filters.dateTo ? (
                  <div className="text-xs text-blue-600 mt-1">
                    {filters.dateFrom ? `From: ${filters.dateFrom.toLocaleDateString()}` : 'No start date'}
                    {filters.dateFrom && filters.dateTo ? ' • ' : ''}
                    {filters.dateTo ? `To: ${filters.dateTo.toLocaleDateString()}` : ''}
                  </div>
                ) : null}
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
                  Clear ({selectedItems.length})
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
          {isLoading && !isLoadingMore && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">
                {searchScope === 'global' ? 'Searching all quotes...' : 'Searching...'}
              </div>
            </div>
          )}

          {!isLoading && searchResults && (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  {searchResults.items.length} of {searchResults.total} items loaded
                  {searchTerm && ` for "${searchTerm}"`}
                  {searchScope === 'global' && (
                    <span className="ml-1 text-blue-600">(across all customers)</span>
                  )}
                  {searchScope === 'global' && filters.dateFrom && (
                    <span className="ml-1 text-gray-500">
                      • Since {filters.dateFrom.toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllVisible}
                    disabled={searchResults.items.length === 0}
                  >
                    Select All Visible ({searchResults.items.length})
                  </Button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {searchResults.items.map((item, index) => {
                  const isSelected = selectedItems.some(selected => selected.id === item.id);
                  const isCurrentItem = currentItems.some(current => 
                    current.toLowerCase() === (item.description || '').toLowerCase()
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
                              {item.description}
                              {isCurrentItem && (
                                <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                  In Current Quote
                                </span>
                              )}
                              {searchScope === 'global' && (
                                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                  Global
                                </span>
                              )}
                            {(item.timesUsed ?? 0) > 5 && (
                                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                  Popular
                                </span>
                              )}
                            </h4>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 ml-6 text-sm text-gray-500">
                            <span>Qty: {item.quantity}</span>
                            <span>Price: {smartQuoteUtils.formatPrice(item.unitPrice)}</span>
                            <span>Total: {smartQuoteUtils.formatPrice(item.totalPrice)}</span>
                            {item.category && <span>Category: {item.category}</span>}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-1 ml-6 text-xs text-gray-400">
                            {item.lastUsed && <span>Last used: {smartQuoteUtils.formatDate(item.lastUsed)}</span>}
                           {(item.timesUsed ?? 0) > 0 && <span>Used {item.timesUsed ?? 0} times</span>}
                            {item.stockLevel && <span>Stock: {item.stockLevel}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More */}
              {searchResults.hasMore && (
                <div className="flex justify-center mt-6">
                  <Button 
                    variant="outline" 
                    onClick={loadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? 'Loading...' : `Load More (${searchResults.total - searchResults.items.length} remaining)`}
                  </Button>
                </div>
              )}

              {/* No Results */}
              {searchResults.items.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-2">No items found</div>
                  <div className="text-sm text-gray-400">
                    {searchScope === 'global' ? 
                      'No items found across all quotes. Try different search terms or expand your date range.' :
                      'Try adjusting your search terms or filters'
                    }
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {searchResults && (
                <span>
                  Loaded {searchResults.items.length} of {searchResults.total} items
                  {selectedItems.length > 0 && ` • ${selectedItems.length} selected`}
                </span>
              )}
            </div>
            <div className="flex gap-3">
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
      </div>
    </Modal>
  );
};