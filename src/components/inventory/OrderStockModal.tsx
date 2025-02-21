import React, { useState } from 'react';
import { X } from 'lucide-react';

interface OrderStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    name: string;
    code: string;
    currentStock: number;
    minStock: number;
    unit: string;
    unitPrice: number;
    supplier: string;
  };
  onSubmit: (orderData: any) => void;
}

export default function OrderStockModal({ isOpen, onClose, item, onSubmit }: OrderStockModalProps) {
  const [quantity, setQuantity] = useState(item.minStock - item.currentStock);
  const [urgency, setUrgency] = useState('normal');
  
  if (!isOpen) return null;

  const totalCost = quantity * item.unitPrice;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Order Stock: {item.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            itemId: item.id,
            quantity,
            urgency,
            totalCost,
            supplier: item.supplier
          });
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock Level
              </label>
              <div className="text-lg font-medium">
                {item.currentStock} {item.unit}
                {item.currentStock <= item.minStock && (
                  <span className="ml-2 text-sm text-red-600">Below minimum ({item.minStock})</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Quantity ({item.unit})
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low - Standard Delivery</option>
                <option value="normal">Normal - 3-5 Days</option>
                <option value="high">High - Express Delivery</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Summary
              </label>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span>Unit Price:</span>
                  <span>${item.unitPrice}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Quantity:</span>
                  <span>{quantity} {item.unit}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total Cost:</span>
                  <span>${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}