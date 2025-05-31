// frontend/src/components/orders/OrderModal.tsx

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderData: any) => void;
  orderToEdit?: any;
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
  const [formData, setFormData] = useState({
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
    notes: ''
  });

  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (orderToEdit) {
      setFormData({
        ...formData,
        ...orderToEdit,
        projectValue: orderToEdit.projectValue || 0,
        marginPercent: orderToEdit.marginPercent || 20,
        leadTimeWeeks: orderToEdit.leadTimeWeeks || 1
      });
    }
  }, [orderToEdit]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/api/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Customers fetched:', response.data);
      const customersArray = Array.isArray(response.data) ? response.data : 
                            (response.data.customers && Array.isArray(response.data.customers) ? response.data.customers : []);
      setCustomers(customersArray);
    } catch (err) {
      setError('Failed to load customers');
      console.error('Error loading customers:', err);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      projectValue: Number(formData.projectValue),
      marginPercent: Number(formData.marginPercent),
      leadTimeWeeks: Number(formData.leadTimeWeeks),
      vatRate: Number(formData.vatRate),
      items: formData.items.length ? formData.items : [{}]
    };

    console.log('Submitting order data:', submitData);
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer*
              </label>
              <select
                required
                value={formData.customerName}
                onChange={(e) => {
                  const customer = customers.find(c => c.name === e.target.value);
                  setFormData({
                    ...formData,
                    customerName: e.target.value,
                    contactPerson: customer?.contactPerson || '',
                    contactEmail: customer?.email || '',
                    contactPhone: customer?.phone || ''
                  });
                }}
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

          <div className="grid grid-cols-2 gap-4">
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
                value={formData.projectValue}
                onChange={(e) => setFormData({ ...formData, projectValue: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
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

          {/* ✅ CLEAN: Status dropdown with only Order statuses */}
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
            {/* ✅ NEW: Helper text explaining the workflow */}
            <p className="text-xs text-gray-500 mt-1">
              When set to "APPROVED", a job will be automatically created with status "IN_PRODUCTION"
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

          <div className="flex justify-end space-x-4 pt-4">
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