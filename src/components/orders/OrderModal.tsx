// frontend/src/components/orders/OrderModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Plus, Search, Package, RefreshCw, Trash2 } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config/constants';
import { Customer, CustomersResponse } from '../../types/api';

// Enhanced OrderData interface with delivery addresses and items
interface OrderData {
  projectTitle: string;
  quoteRef: string;
  customerName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  projectValue: number;
  marginPercent: number;
  leadTimeWeeks: number;
  status: string;
  items: OrderItem[];
  currency: string;
  vatRate: number;
  paymentTerms: string;
  notes: string;
  // 📦 NEW: Delivery address fields
  deliveryAddress: string;
  deliveryPostcode: string;
  deliveryCity: string;
  deliveryCountry: string;
  deliveryContact: string;
  deliveryPhone: string;
  specialInstructions: string;
}

// 📋 NEW: Order item interface
interface OrderItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  category: string;
  total: number;
}

// 📋 NEW: Material/Stock item interface
interface Material {
  id: string;
  name: string;
  code: string;
  unitPrice: number;
  unit: string;
  category: string;
  description?: string;
  currentStockLevel?: number;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderData: OrderData) => void;
  orderToEdit?: Partial<OrderData>;
}

// ✅ CLEAN: Only Order statuses - no Job statuses
const ORDER_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'DECLINED',
  'CANCELLED'
];

export default function OrderModal({ isOpen, onClose, onSubmit, orderToEdit }: OrderModalProps) {
  const [formData, setFormData] = useState<OrderData>({
    projectTitle: '',
    quoteRef: '',
    customerName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    projectValue: 0,
    marginPercent: 20,
    leadTimeWeeks: 1,
    status: 'DRAFT',
    items: [],
    currency: 'GBP',
    vatRate: 20,
    paymentTerms: 'THIRTY_DAYS',
    notes: '',
    // 📦 NEW: Initialize delivery fields
    deliveryAddress: '',
    deliveryPostcode: '',
    deliveryCity: '',
    deliveryCountry: 'United Kingdom',
    deliveryContact: '',
    deliveryPhone: '',
    specialInstructions: ''
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 📋 NEW: State for stock items selection
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [showItemsSection, setShowItemsSection] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      fetchMaterials();
    }
  }, [isOpen]);

  useEffect(() => {
    if (orderToEdit) {
      setFormData({
        ...formData,
        ...orderToEdit,
        projectValue: orderToEdit.projectValue || 0,
        marginPercent: orderToEdit.marginPercent || 20,
        leadTimeWeeks: orderToEdit.leadTimeWeeks || 1,
        // 📦 Set delivery fields from edit data
        deliveryAddress: orderToEdit.deliveryAddress || '',
        deliveryPostcode: orderToEdit.deliveryPostcode || '',
        deliveryCity: orderToEdit.deliveryCity || '',
        deliveryCountry: orderToEdit.deliveryCountry || 'United Kingdom',
        deliveryContact: orderToEdit.deliveryContact || '',
        deliveryPhone: orderToEdit.deliveryPhone || '',
        specialInstructions: orderToEdit.specialInstructions || ''
      });
      
      // 📋 Set items from edit data
      if (orderToEdit.items && orderToEdit.items.length > 0) {
        setSelectedItems(orderToEdit.items);
        setShowItemsSection(true);
      }
    }
  }, [orderToEdit]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Customers fetched:', response.data);
      
      // Type assertion for customers response
      const customersData = response.data as CustomersResponse | Customer[];
      
      // Handle different response structures
      let customersArray: Customer[] = [];
      
      if (Array.isArray(customersData)) {
        customersArray = customersData;
      } else if (customersData && typeof customersData === 'object' && 'customers' in customersData) {
        customersArray = customersData.customers || [];
      }
      
      setCustomers(customersArray);
    } catch (err) {
      setError('Failed to load customers');
      console.error('Error loading customers:', err);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 📋 NEW: Fetch materials/stock items
  const fetchMaterials = async () => {
    setMaterialsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/materials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Materials fetched:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        const materialsData = response.data.map((material: any) => ({
          id: material.id,
          name: material.name,
          code: material.code || `MAT-${material.id.substring(0, 4)}`,
          unitPrice: material.unitPrice,
          unit: material.unit || 'unit',
          category: material.category || 'other',
          description: material.description,
          currentStockLevel: material.currentStockLevel
        }));
        
        setMaterials(materialsData);
      } else {
        setMaterials([]);
      }
    } catch (err) {
      console.error('Error loading materials:', err);
      setMaterials([]);
    } finally {
      setMaterialsLoading(false);
    }
  };

  // 📋 NEW: Add item to order
  const addItem = (material: Material) => {
    const existingIndex = selectedItems.findIndex(item => item.id === material.id);
    
    if (existingIndex >= 0) {
      // Increment quantity if already exists
      const updatedItems = [...selectedItems];
      updatedItems[existingIndex].quantity += 1;
      updatedItems[existingIndex].total = updatedItems[existingIndex].quantity * updatedItems[existingIndex].unitPrice;
      setSelectedItems(updatedItems);
    } else {
      // Add new item
      const newItem: OrderItem = {
        id: material.id,
        name: material.name,
        code: material.code,
        description: material.description,
        quantity: 1,
        unitPrice: material.unitPrice,
        unit: material.unit,
        category: material.category,
        total: material.unitPrice
      };
      setSelectedItems([...selectedItems, newItem]);
    }
    
    if (!showItemsSection) {
      setShowItemsSection(true);
    }
  };

  // 📋 NEW: Update item quantity
  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const updatedItems = [...selectedItems];
    updatedItems[index].quantity = quantity;
    updatedItems[index].total = quantity * updatedItems[index].unitPrice;
    setSelectedItems(updatedItems);
  };

  // 📋 NEW: Remove item
  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  // 📋 NEW: Calculate total
  const calculateTotal = (): number => {
    return selectedItems.reduce((sum, item) => sum + item.total, 0);
  };

  // 📦 NEW: Copy customer address to delivery address
  const copyCustomerAddress = () => {
    const selectedCustomer = customers.find(c => c.name === formData.customerName);
    if (selectedCustomer && selectedCustomer.address) {
      setFormData({
        ...formData,
        deliveryAddress: selectedCustomer.address,
        deliveryContact: selectedCustomer.contactPerson || formData.contactPerson,
        deliveryPhone: selectedCustomer.phone || formData.contactPhone
      });
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 📋 Update project value based on selected items
    const itemsTotal = calculateTotal();
    const finalProjectValue = itemsTotal > 0 ? itemsTotal : formData.projectValue;
    
    const submitData: OrderData = {
      ...formData,
      projectValue: Number(finalProjectValue),
      marginPercent: Number(formData.marginPercent),
      leadTimeWeeks: Number(formData.leadTimeWeeks),
      vatRate: Number(formData.vatRate),
      items: selectedItems
    };

    console.log('Submitting order data:', submitData);
    onSubmit(submitData);
  };

  const handleCustomerChange = (customerName: string) => {
    const customer = customers.find(c => c.name === customerName);
    setFormData({
      ...formData,
      customerName: customerName,
      contactPerson: customer?.contactPerson || '',
      contactEmail: customer?.email || '',
      contactPhone: customer?.phone || ''
    });
  };

  // Filter materials
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = !searchTerm || 
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {orderToEdit ? 'Edit Order' : 'Create New Order'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Title*
                </label>
                <input
                  type="text"
                  required
                  value={formData.projectTitle}
                  onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quote Reference*
                </label>
                <input
                  type="text"
                  required
                  value={formData.quoteRef}
                  onChange={(e) => setFormData({ ...formData, quoteRef: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Q2025-001"
                />
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer*
                </label>
                <select
                  required
                  value={formData.customerName}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Customer</option>
                  {customers.length > 0 ? (
                    customers.map(customer => (
                      <option key={customer.id} value={customer.name}>
                        {customer.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      {isLoading ? 'Loading customers...' : 'No customers available'}
                    </option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person*
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email*
                </label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone*
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 📦 NEW: Delivery Address Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-blue-800">📦 Delivery Address</h3>
              <button
                type="button"
                onClick={copyCustomerAddress}
                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Copy Customer Address
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address*
                </label>
                <textarea
                  required
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Street address, building name, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City*
                </label>
                <input
                  type="text"
                  required
                  value={formData.deliveryCity}
                  onChange={(e) => setFormData({ ...formData, deliveryCity: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postcode*
                </label>
                <input
                  type="text"
                  required
                  value={formData.deliveryPostcode}
                  onChange={(e) => setFormData({ ...formData, deliveryPostcode: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="SW1A 1AA"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country*
                </label>
                <select
                  required
                  value={formData.deliveryCountry}
                  onChange={(e) => setFormData({ ...formData, deliveryCountry: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Ireland">Ireland</option>
                  <option value="France">France</option>
                  <option value="Germany">Germany</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Contact
                </label>
                <input
                  type="text"
                  value={formData.deliveryContact}
                  onChange={(e) => setFormData({ ...formData, deliveryContact: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="On-site contact person"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Phone
                </label>
                <input
                  type="tel"
                  value={formData.deliveryPhone}
                  onChange={(e) => setFormData({ ...formData, deliveryPhone: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="On-site contact number"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Delivery Instructions
                </label>
                <textarea
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Access codes, delivery times, special requirements..."
                />
              </div>
            </div>
          </div>

          {/* 📋 NEW: Stock Items Section */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-green-800">📋 Order Items</h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowItemsSection(!showItemsSection)}
                  className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  <Package className="h-4 w-4" />
                  <span>{showItemsSection ? 'Hide Items' : 'Add Items'}</span>
                </button>
                <button
                  type="button"
                  onClick={fetchMaterials}
                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                  title="Refresh materials"
                >
                  <RefreshCw className={`h-4 w-4 ${materialsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {showItemsSection && (
              <>
                {/* Search and Filter */}
                <div className="flex space-x-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search materials..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="all">All Categories</option>
                    <option value="RAW_MATERIAL">Raw Material</option>
                    <option value="MACHINE_PART">Machine Part</option>
                    <option value="CONVEYOR_COMPONENT">Conveyor Component</option>
                    <option value="OFFICE_SUPPLY">Office Supply</option>
                    <option value="KITCHEN_SUPPLY">Kitchen Supply</option>
                    <option value="SAFETY_EQUIPMENT">Safety Equipment</option>
                    <option value="CLEANING_SUPPLY">Cleaning Supply</option>
                    <option value="ELECTRICAL_COMPONENT">Electrical Component</option>
                    <option value="MECHANICAL_COMPONENT">Mechanical Component</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Available Materials */}
                <div className="mb-4 max-h-40 overflow-y-auto border rounded-lg bg-white">
                  {materialsLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading materials...</div>
                  ) : filteredMaterials.length > 0 ? (
                    filteredMaterials.map((material) => (
                      <div
                        key={material.id}
                        className="p-2 hover:bg-gray-50 flex justify-between items-center border-b"
                      >
                        <div>
                          <div className="font-medium">{material.name}</div>
                          <div className="text-sm text-gray-500">{material.code}</div>
                          {material.description && (
                            <div className="text-xs text-gray-400">{material.description}</div>
                          )}
                          {material.currentStockLevel !== undefined && (
                            <div className="text-xs text-blue-600">Stock: {material.currentStockLevel}</div>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div>£{material.unitPrice.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">per {material.unit}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => addItem(material)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      {materials.length === 0 ? 'No materials available' : 'No items match your search'}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-medium mb-3">Selected Items ({selectedItems.length})</h4>
                <div className="space-y-2">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.code}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(index, parseInt(e.target.value))}
                          className="w-16 p-1 border rounded text-center"
                        />
                        <span className="text-sm text-gray-500">{item.unit}</span>
                        <div className="text-right min-w-[80px]">
                          <div className="font-medium">£{item.total.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">£{item.unitPrice.toFixed(2)}/{item.unit}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Total */}
                <div className="border-t mt-4 pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Value:</span>
                    <span>£{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Project Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Project Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Value (£)*
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={selectedItems.length > 0 ? calculateTotal() : formData.projectValue}
                  onChange={(e) => setFormData({ ...formData, projectValue: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  readOnly={selectedItems.length > 0}
                />
                {selectedItems.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">Calculated from selected items</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Margin %*
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={formData.marginPercent}
                  onChange={(e) => setFormData({ ...formData, marginPercent: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Time (Weeks)*
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.leadTimeWeeks}
                  onChange={(e) => setFormData({ ...formData, leadTimeWeeks: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Status and Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {ORDER_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                    {status === 'APPROVED' ? ' (→ Auto-creates Job)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                When set to "APPROVED", a job will be automatically created
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes or instructions..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={isLoading}
            >
              {orderToEdit ? 'Update Order' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}