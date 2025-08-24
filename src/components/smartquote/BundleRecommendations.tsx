// Bundle Recommendations Component
// Location: bones-frontend/src/components/smartquote/BundleRecommendations.tsx

import React, { useState, useEffect } from 'react';
import { customerIntelligenceApi, customerIntelligenceUtils } from '../../utils/customerIntelligenceApi';
import { BundleRecommendation } from '../../types/smartQuote';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface BundleRecommendationsProps {
  customerId?: string;
  currentItems: string[];
  onBundleSelected: (items: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
    source: 'bundle';
    bundleName: string;
    bundleId: string;
  }>) => void;
  className?: string;
}

export const BundleRecommendations: React.FC<BundleRecommendationsProps> = ({
  customerId,
  currentItems,
  onBundleSelected,
  className = ''
}) => {
  const [customerBundles, setCustomerBundles] = useState<BundleRecommendation[]>([]);
  const [dynamicBundles, setDynamicBundles] = useState<BundleRecommendation[]>([]);
  const [seasonalBundles, setSeasonalBundles] = useState<BundleRecommendation[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<BundleRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'customer' | 'dynamic' | 'seasonal'>('customer');

  // Load bundle recommendations when customer or items change
  useEffect(() => {
    if (customerId) {
      loadBundleRecommendations();
    } else {
      loadDynamicBundles();
    }
  }, [customerId, currentItems]);

  const loadBundleRecommendations = async () => {
    if (!customerId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('📦 Loading bundle recommendations for customer:', customerId);
      
      // Load all types of bundles in parallel
      const [customerBundlesData, dynamicBundlesData, seasonalBundlesData] = await Promise.all([
        customerIntelligenceApi.getBundleRecommendations(customerId),
        customerIntelligenceApi.getDynamicBundleRecommendations(customerId, currentItems),
        customerIntelligenceApi.getSeasonalRecommendations()
      ]);

      setCustomerBundles(customerBundlesData);
      setDynamicBundles(dynamicBundlesData);
      setSeasonalBundles(seasonalBundlesData);
      
      console.log('✅ Loaded bundles:', {
        customer: customerBundlesData.length,
        dynamic: dynamicBundlesData.length,
        seasonal: seasonalBundlesData.length
      });
      
    } catch (err: any) {
      console.error('Error loading bundle recommendations:', err);
      setError(err.message || 'Failed to load bundle recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDynamicBundles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('📦 Loading dynamic bundles...');
      
      const [dynamicBundlesData, seasonalBundlesData] = await Promise.all([
        customerIntelligenceApi.getDynamicBundleRecommendations("", currentItems),
        customerIntelligenceApi.getSeasonalRecommendations()
      ]);

      setDynamicBundles(dynamicBundlesData);
      setSeasonalBundles(seasonalBundlesData);
      setActiveTab('dynamic');
      
      console.log('✅ Loaded dynamic bundles:', dynamicBundlesData.length);
      
    } catch (err: any) {
      console.error('Error loading dynamic bundles:', err);
      setError(err.message || 'Failed to load bundle recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick add bundle without customization
  const quickAddBundle = (bundle: BundleRecommendation) => {
    console.log('📦 Quick adding bundle:', bundle.name);
    
    const itemsToAdd = bundle.items.map(item => ({
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      source: 'bundle' as const,
      bundleName: bundle.name,
      bundleId: bundle.bundleId
    }));

    onBundleSelected(itemsToAdd);
  };

  // Open bundle for detailed view and customization
  const viewBundleDetails = (bundle: BundleRecommendation) => {
    console.log('🔍 Viewing bundle details:', bundle.name);
    setSelectedBundle(bundle);
    setShowBundleModal(true);
  };

  // Get bundles for current tab
  const getCurrentBundles = (): BundleRecommendation[] => {
    switch (activeTab) {
      case 'customer': return customerBundles;
      case 'dynamic': return dynamicBundles;
      case 'seasonal': return seasonalBundles;
      default: return [];
    }
  };

  // Get tab label with count
  const getTabLabel = (tab: string, bundles: BundleRecommendation[]): string => {
    const labels = {
      customer: 'Customer Specific',
      dynamic: 'Popular Combinations',
      seasonal: 'Seasonal Picks'
    };
    return `${labels[tab as keyof typeof labels]} (${bundles.length})`;
  };

  const renderBundleCard = (bundle: BundleRecommendation) => {
    const savingsPercentage = customerIntelligenceUtils.calculateBundleSavingsPercentage(bundle);
    const enhancedConfidence = customerIntelligenceUtils.calculateBundleConfidenceScore(bundle);
    
    return (
      <div
        key={bundle.bundleId}
        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
      >
        {/* Bundle Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-1">{bundle.name}</h4>
            <p className="text-sm text-gray-600">{bundle.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              customerIntelligenceUtils.getConfidenceBadge(enhancedConfidence)
            }`}>
              {enhancedConfidence}% match
            </span>
          </div>
        </div>

        {/* Bundle Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded">
          <div className="text-center">
            <div className="font-medium text-gray-900">{bundle.items.length}</div>
            <div className="text-xs text-gray-500">Items</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">
              {customerIntelligenceUtils.formatCurrency(bundle.totalPrice)}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-green-600">
              {savingsPercentage}% off
            </div>
            <div className="text-xs text-gray-500">
              Save {customerIntelligenceUtils.formatCurrency(bundle.savings)}
            </div>
          </div>
        </div>

        {/* Bundle Items Preview */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Bundle includes:</div>
          <div className="space-y-1">
            {bundle.items.slice(0, 3).map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate flex-1">
                  {item.quantity}x {item.itemName}
                </span>
                <span className="text-gray-500 ml-2">
                  {customerIntelligenceUtils.formatCurrency(item.unitPrice)}
                </span>
              </div>
            ))}
            {bundle.items.length > 3 && (
              <div className="text-sm text-gray-500">
                + {bundle.items.length - 3} more items...
              </div>
            )}
          </div>
        </div>

        {/* Bundle Reason */}
        <div className="mb-4 p-2 bg-blue-50 rounded text-sm text-blue-800">
          💡 {bundle.reason}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => quickAddBundle(bundle)}
            className="flex-1"
          >
            📦 Add Bundle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => viewBundleDetails(bundle)}
          >
            👁️ Details
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                📦 Bundle Recommendations
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Smart combinations to save time and money
              </p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={customerId ? loadBundleRecommendations : loadDynamicBundles}
              disabled={isLoading}
            >
              {isLoading ? '🔄' : '🔄'} Refresh
            </Button>
          </div>

          {/* Tabs */}
          <div className="mt-4 border-b border-gray-200">
            <div className="flex space-x-8">
              {customerId && (
                <button
                  className={`py-2 border-b-2 font-medium text-sm ${
                    activeTab === 'customer'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('customer')}
                >
                  {getTabLabel('customer', customerBundles)}
                </button>
              )}
              <button
                className={`py-2 border-b-2 font-medium text-sm ${
                  activeTab === 'dynamic'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('dynamic')}
              >
                {getTabLabel('dynamic', dynamicBundles)}
              </button>
              <button
                className={`py-2 border-b-2 font-medium text-sm ${
                  activeTab === 'seasonal'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('seasonal')}
              >
                {getTabLabel('seasonal', seasonalBundles)}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">📦 Loading bundle recommendations...</div>
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
                onClick={customerId ? loadBundleRecommendations : loadDynamicBundles}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && getCurrentBundles().length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">No bundle recommendations available</div>
              <div className="text-sm text-gray-400">
                {activeTab === 'customer' 
                  ? 'This customer may not have established purchase patterns yet'
                  : 'No popular combinations found for current items'
                }
              </div>
            </div>
          )}

          {!isLoading && !error && getCurrentBundles().length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getCurrentBundles().map(bundle => renderBundleCard(bundle))}
            </div>
          )}
        </div>
      </div>

      {/* Bundle Details Modal */}
      <Modal
        isOpen={showBundleModal}
        onClose={() => setShowBundleModal(false)}
        title={selectedBundle?.name || 'Bundle Details'}
        size="lg"
      >
        {selectedBundle && (
          <div className="space-y-6">
            {/* Bundle Overview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{selectedBundle.name}</h3>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  customerIntelligenceUtils.getConfidenceBadge(selectedBundle.confidence)
                }`}>
                  {selectedBundle.confidence}% confidence
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{selectedBundle.description}</p>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-medium text-gray-900">{selectedBundle.items.length}</div>
                  <div className="text-xs text-gray-500">Items</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {customerIntelligenceUtils.formatCurrency(selectedBundle.totalPrice)}
                  </div>
                  <div className="text-xs text-gray-500">Bundle Price</div>
                </div>
                <div>
                  <div className="font-medium text-green-600">
                    {customerIntelligenceUtils.formatCurrency(selectedBundle.savings)} saved
                  </div>
                  <div className="text-xs text-gray-500">
                    ({customerIntelligenceUtils.calculateBundleSavingsPercentage(selectedBundle)}% off)
                  </div>
                </div>
              </div>
            </div>

            {/* Bundle Items */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Bundle Items</h4>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {selectedBundle.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{item.itemName}</h5>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>Quantity: {item.quantity}</span>
                        <span>Unit Price: {customerIntelligenceUtils.formatCurrency(item.unitPrice)}</span>
                        <span>Total: {customerIntelligenceUtils.formatCurrency(item.quantity * item.unitPrice)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bundle Reasoning */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">💡 Why this bundle?</h4>
              <p className="text-sm text-blue-800">{selectedBundle.reason}</p>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowBundleModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  quickAddBundle(selectedBundle);
                  setShowBundleModal(false);
                }}
              >
                Add Bundle to Quote
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};