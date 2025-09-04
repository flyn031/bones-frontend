import React, { useState } from 'react';
import { SmartQuoteItem } from '../../types/smartQuote';

interface ManualItemAddProps {
  onItemAdded: (item: SmartQuoteItem) => void;
  customerId?: string;
}

export const ManualItemAdd: React.FC<ManualItemAddProps> = ({
  onItemAdded,
  customerId,
}) => {
  const [formData, setFormData] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0,
    category: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) return;

    setIsSubmitting(true);

    const newItem: SmartQuoteItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: formData.description.trim(),
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      source: 'manual' as any, // We'll update the type definition
      reason: customerId ? 
        `Manually added for customer-specific requirements` : 
        `Custom item added manually`
    };

    try {
      onItemAdded(newItem);
      
      // Reset form
      setFormData({
        description: '',
        quantity: 1,
        unitPrice: 0,
        category: '',
        notes: ''
      });
    } catch (error) {
      console.error('Failed to add manual item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-1">Add Custom Item</h4>
        <p className="text-xs text-gray-500">
          Create a custom quote item for services, one-off products, or items not in inventory
        </p>
      </div>

      <div className="space-y-4">
        {/* Description Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="e.g., Installation service, Custom fabrication work, Site survey..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
          />
        </div>

        {/* Quantity and Unit Price Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Price (£)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.unitPrice}
              onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Category Field (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category (Optional)
          </label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            placeholder="e.g., Services, Hardware, Installation..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Total Display */}
        <div className="bg-gray-50 rounded-md p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total:</span>
            <span className="text-lg font-bold text-gray-900">
              £{(formData.quantity * formData.unitPrice).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!formData.description.trim() || isSubmitting}
          className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
            !formData.description.trim() || isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {isSubmitting ? 'Adding Item...' : 'Add to Quote'}
        </button>
      </div>

      {/* Quick Tips */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="flex items-start">
          <div className="text-blue-500 mr-2 text-sm">💡</div>
          <div>
            <h5 className="text-xs font-medium text-blue-800">Quick Tips:</h5>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Items added here become part of this customer's history</li>
              <li>• Frequently used items can be promoted to full inventory later</li>
              <li>• Use clear descriptions for better future suggestions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};