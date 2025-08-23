// Quick Assembly Shortcuts Component
// Location: bones-frontend/src/components/smartquote/QuickAssemblyShortcuts.tsx

import React, { useState, useEffect } from 'react';
import { customerIntelligenceApi, customerIntelligenceUtils } from '../../utils/customerIntelligenceApi';
import { QuickAssemblyTemplate } from '../../types/smartQuote';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface QuickAssemblyShortcutsProps {
  onTemplateSelected: (items: Array<{
    itemName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    required: boolean;
    source: 'template';
    templateName: string;
  }>) => void;
  className?: string;
}

export const QuickAssemblyShortcuts: React.FC<QuickAssemblyShortcutsProps> = ({
  onTemplateSelected,
  className = ''
}) => {
  const [templates, setTemplates] = useState<QuickAssemblyTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<QuickAssemblyTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [customizedItems, setCustomizedItems] = useState<any[]>([]);

  // Load templates on mount
  useEffect(() => {
    loadQuickTemplates();
  }, []);

  const loadQuickTemplates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('⚡ Loading quick assembly templates...');
      
      const templatesData = await customerIntelligenceApi.getQuickTemplates();
      setTemplates(templatesData);
      
      console.log('✅ Loaded', templatesData.length, 'templates');
      
    } catch (err: any) {
      console.error('Error loading templates:', err);
      setError(err.message || 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick add template without customization
  const quickAddTemplate = (template: QuickAssemblyTemplate) => {
    console.log('⚡ Quick adding template:', template.name);
    
    const itemsToAdd = template.items.map(item => ({
      itemName: item.itemName,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      required: item.required ?? false,
      source: 'template' as const,
      templateName: template.name
    }));

    onTemplateSelected(itemsToAdd);
  };

  // Open template for customization
  const customizeTemplate = (template: QuickAssemblyTemplate) => {
    console.log('⚙️ Customizing template:', template.name);
    
    setSelectedTemplate(template);
    setCustomizedItems(template.items.map(item => ({
      ...item,
      selected: item.required,
      originalQuantity: item.quantity,
      originalPrice: item.unitPrice
    })));
    setShowTemplateModal(true);
  };

  // Handle template customization
  const handleTemplateCustomization = () => {
    if (!selectedTemplate) return;

    const selectedItems = customizedItems
      .filter(item => item.selected)
      .map(item => ({
        itemName: item.itemName,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        required: item.required,
        source: 'template' as const,
        templateName: selectedTemplate.name
      }));

    onTemplateSelected(selectedItems);
    setShowTemplateModal(false);
    setSelectedTemplate(null);
  };

  // Update customized item
  const updateCustomizedItem = (index: number, field: string, value: any) => {
    const updated = [...customizedItems];
    updated[index] = { ...updated[index], [field]: value };
    setCustomizedItems(updated);
  };

  // Toggle item selection in customization
  const toggleItemSelection = (index: number) => {
    updateCustomizedItem(index, 'selected', !customizedItems[index].selected);
  };

  // Calculate customized template total
  const calculateCustomizedTotal = () => {
    return customizedItems
      .filter(item => item.selected)
      .reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'warehouse': return 'bg-blue-100 text-blue-800';
      case 'packaging': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'custom': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                ⚡ Quick Assembly Templates
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Pre-configured solutions for common requirements
              </p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={loadQuickTemplates}
              disabled={isLoading}
            >
              {isLoading ? '🔄' : '🔄'} Refresh
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">⚡ Loading templates...</div>
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
                onClick={loadQuickTemplates}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && templates.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">No templates available</div>
              <div className="text-sm text-gray-400">
                Templates will appear here once configured
              </div>
            </div>
          )}

          {!isLoading && !error && templates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{template.icon}</div>
                      <div>
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(template.category)}`}>
                            {template.category.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {customerIntelligenceUtils.getItemCountDescription(template.itemCount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Template Description */}
                  <p className="text-sm text-gray-600 mb-3">
                    {template.description}
                  </p>

                  {/* Template Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded">
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {customerIntelligenceUtils.formatCurrency(template.estimatedValue)}
                      </div>
                      <div className="text-xs text-gray-500">Estimated Value</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">{template.itemCount}</div>
                      <div className="text-xs text-gray-500">Items Included</div>
                    </div>
                  </div>

                  {/* Sample Items Preview */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Includes:</div>
                    <div className="space-y-1">
                      {template.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {item.required && <span className="text-red-500">* </span>}
                            {item.itemName}
                          </span>
                          <span className="text-gray-500">
                            {item.quantity}x {customerIntelligenceUtils.formatCurrency(item.unitPrice)}
                          </span>
                        </div>
                      ))}
                      {template.items.length > 3 && (
                        <div className="text-sm text-gray-500">
                          + {template.items.length - 3} more items...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => quickAddTemplate(template)}
                      className="flex-1"
                    >
                      ⚡ Quick Add
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => customizeTemplate(template)}
                      className="flex-1"
                    >
                      ⚙️ Customize
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template Customization Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title={`Customize: ${selectedTemplate?.name}`}
        size="lg"
      >
        {selectedTemplate && (
          <div className="space-y-6">
            {/* Template Info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl">{selectedTemplate.icon}</div>
              <div>
                <h3 className="font-medium text-gray-900">{selectedTemplate.name}</h3>
                <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
              </div>
            </div>

            {/* Customizable Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Template Items</h4>
                <div className="text-sm text-gray-600">
                  Total: {customerIntelligenceUtils.formatCurrency(calculateCustomizedTotal())}
                </div>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {customizedItems.map((item, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 ${
                      item.selected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center pt-1">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleItemSelection(index)}
                          disabled={item.required}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-900">
                            {item.itemName}
                            {item.required && <span className="text-red-500 text-sm">*</span>}
                          </h5>
                        </div>
                        
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Qty:</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateCustomizedItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              disabled={!item.selected}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Price:</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateCustomizedItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              disabled={!item.selected}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            Total: {customerIntelligenceUtils.formatCurrency(item.quantity * item.unitPrice)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-900">
                    {customizedItems.filter(item => item.selected).length} items selected
                  </div>
                  <div className="text-sm text-blue-700">
                    Required items: {customizedItems.filter(item => item.required).length}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-blue-900">
                    {customerIntelligenceUtils.formatCurrency(calculateCustomizedTotal())}
                  </div>
                  <div className="text-sm text-blue-700">Total Value</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowTemplateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleTemplateCustomization}
                disabled={customizedItems.filter(item => item.selected).length === 0}
              >
                Add to Quote ({customizedItems.filter(item => item.selected).length} items)
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};