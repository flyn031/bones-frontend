// src/components/inventory/CreateItemModal.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';

export enum MaterialCategory {
  RAW_MATERIAL = 'RAW_MATERIAL',
  MACHINE_PART = 'MACHINE_PART',
  CONVEYOR_COMPONENT = 'CONVEYOR_COMPONENT',
  OFFICE_SUPPLY = 'OFFICE_SUPPLY',
  KITCHEN_SUPPLY = 'KITCHEN_SUPPLY',
  SAFETY_EQUIPMENT = 'SAFETY_EQUIPMENT',
  CLEANING_SUPPLY = 'CLEANING_SUPPLY',
  ELECTRICAL_COMPONENT = 'ELECTRICAL_COMPONENT',
  MECHANICAL_COMPONENT = 'MECHANICAL_COMPONENT',
  OTHER = 'OTHER'
}

export enum InventoryPurpose {
  INTERNAL = 'INTERNAL',
  CUSTOMER = 'CUSTOMER',
  DUAL = 'DUAL'
}

interface Supplier {
  id: string;
  name: string;
}

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: any) => void;
  categories: string[];
  suppliers: Supplier[];
}

export default function CreateItemModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  categories, 
  suppliers 
}: CreateItemModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: MaterialCategory.OTHER,
    description: '',
    currentStockLevel: 0,
    minStockLevel: 0,
    unit: '',
    unitPrice: 0,
    reorderPoint: 0,
    leadTimeInDays: 0,
    supplierId: '',
    // New fields
    inventoryPurpose: InventoryPurpose.INTERNAL,
    isQuotable: false,
    isOrderable: true,
    customerMarkupPercent: 0,
    visibleToCustomers: false,
    preferredSupplierId: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      category: formData.category as MaterialCategory,
      currentStockLevel: Number(formData.currentStockLevel),
      minStockLevel: Number(formData.minStockLevel),
      unitPrice: Number(formData.unitPrice),
      reorderPoint: Number(formData.reorderPoint),
      supplierId: formData.supplierId || undefined,
      customerMarkupPercent: Number(formData.customerMarkupPercent),
      preferredSupplierId: formData.preferredSupplierId || undefined,
    };

    console.log('Form data being submitted:', JSON.stringify(submitData, null, 2));
    onSubmit(submitData);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      category: MaterialCategory.OTHER,
      description: '',
      currentStockLevel: 0,
      minStockLevel: 0,
      unit: '',
      unitPrice: 0,
      reorderPoint: 0,
      leadTimeInDays: 0,
      supplierId: '',
      // Reset new fields
      inventoryPurpose: InventoryPurpose.INTERNAL,
      isQuotable: false,
      isOrderable: true,
      customerMarkupPercent: 0,
      visibleToCustomers: false,
      preferredSupplierId: '',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const categoryOptions = categories.map(cat => ({
    value: cat,
    label: cat.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }));

  const handlePurposeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const purpose = e.target.value as InventoryPurpose;
    setFormData({
      ...formData,
      inventoryPurpose: purpose,
      // Set logical defaults based on selection
      isQuotable: purpose === InventoryPurpose.CUSTOMER || purpose === InventoryPurpose.DUAL,
      isOrderable: purpose === InventoryPurpose.INTERNAL || purpose === InventoryPurpose.DUAL,
      visibleToCustomers: purpose === InventoryPurpose.CUSTOMER || purpose === InventoryPurpose.DUAL
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create New Inventory Item</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Purpose Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Item Purpose</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inventory Purpose
              </label>
              <select
                value={formData.inventoryPurpose}
                onChange={handlePurposeChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={InventoryPurpose.INTERNAL}>Internal Material (for ordering into company)</option>
                <option value={InventoryPurpose.CUSTOMER}>Customer Item (for quotes/orders)</option>
                <option value={InventoryPurpose.DUAL}>Dual Purpose (both internal and customer)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {formData.inventoryPurpose === InventoryPurpose.INTERNAL 
                  ? 'Materials that are ordered into the company (like steel or coffee)' 
                  : formData.inventoryPurpose === InventoryPurpose.CUSTOMER
                  ? 'Items that go on customer quotes, orders, or jobs'
                  : 'Items that both are ordered internally and offered to customers'}
              </p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Code
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category and Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  category: e.target.value as MaterialCategory,
                })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categoryOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Stock Information */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock Level
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.currentStockLevel}
                onChange={(e) => setFormData({ ...formData, currentStockLevel: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Stock Level
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  minStockLevel: Number(e.target.value),
                  reorderPoint: Number(e.target.value) // Update reorderPoint along with minStockLevel
                })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., pieces, meters"
              />
            </div>
          </div>

          {/* Price and Lead Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (£)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Time (Days)
              </label>
              <input
  type="number"
  min="0"
  value={formData.leadTimeInDays}
  onChange={(e) => setFormData({ ...formData, leadTimeInDays: Number(e.target.value) })}
  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
  placeholder="e.g., 7"
/>
            </div>
          </div>

          {/* Supplier Selection */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier (Optional)
              </label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a Supplier (Optional)</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Purpose-specific fields */}
          {(formData.inventoryPurpose === InventoryPurpose.CUSTOMER || formData.inventoryPurpose === InventoryPurpose.DUAL) && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-4">Customer Item Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isQuotable"
                    checked={formData.isQuotable}
                    onChange={(e) => setFormData({ ...formData, isQuotable: e.target.checked })}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor="isQuotable" className="text-sm text-gray-700">
                    Available for Quotes
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="visibleToCustomers"
                    checked={formData.visibleToCustomers}
                    onChange={(e) => setFormData({ ...formData, visibleToCustomers: e.target.checked })}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor="visibleToCustomers" className="text-sm text-gray-700">
                    Visible to Customers
                  </label>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Markup % (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.customerMarkupPercent || 0}
                    onChange={(e) => setFormData({ ...formData, customerMarkupPercent: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Percentage to mark up this item when added to quotes or orders
                  </p>
                </div>
              </div>
            </div>
          )}

          {(formData.inventoryPurpose === InventoryPurpose.INTERNAL || formData.inventoryPurpose === InventoryPurpose.DUAL) && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-4">Internal Material Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isOrderable"
                    checked={formData.isOrderable}
                    onChange={(e) => setFormData({ ...formData, isOrderable: e.target.checked })}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor="isOrderable" className="text-sm text-gray-700">
                    Can be Ordered from Supplier
                  </label>
                </div>
                {formData.isOrderable && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Supplier (Optional)
                    </label>
                    <select
                      value={formData.preferredSupplierId}
                      onChange={(e) => setFormData({ ...formData, preferredSupplierId: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Preferred Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Preferred supplier for reordering this material
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}