import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

// Interface for the data structure expected *from* the form
interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  shippingAddress: string;
  billingAddress: string;
  paymentTerms: string;
  creditLimit: string; // Keep as string for form input, convert on submit
  specialTermsNotes: string;
  discountPercentage: string; // Keep as string for form input, convert on submit
  status: string;
  notes: string;
}

// Interface for the customer data passed *into* the modal
interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string; // Optional fields from Customer type
  shippingAddress?: string;
  billingAddress?: string;
  paymentTerms?: string;
  creditLimit?: number | null;
  specialTermsNotes?: string;
  discountPercentage?: number | null;
  status?: string;
  notes?: string;
  // Add any other fields your Customer type might have
}

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (customerId: string, data: CustomerFormData) => void; // Expects ID and form data
  customerToEdit: CustomerData | null; // The customer object to edit
}


export default function EditCustomerModal({ isOpen, onClose, onUpdate, customerToEdit }: EditCustomerModalProps) {
  // Initial empty state
  const initialFormData: CustomerFormData = {
    name: '', email: '', phone: '', address: '', shippingAddress: '',
    billingAddress: '', paymentTerms: '', creditLimit: '',
    specialTermsNotes: '', discountPercentage: '', status: 'ACTIVE', notes: ''
  };

  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);

  // Section expansion state
  const [expandedSections, setExpandedSections] = useState({
    address: false,
    terms: false
  });

  // Effect to pre-fill the form when customerToEdit changes or modal opens
  useEffect(() => {
    if (customerToEdit && isOpen) {
      console.log('[EditCustomerModal] Pre-filling form for customer:', customerToEdit.id);
      setFormData({
        name: customerToEdit.name || '',
        email: customerToEdit.email || '',
        phone: customerToEdit.phone || '',
        address: customerToEdit.address || '',
        shippingAddress: customerToEdit.shippingAddress || '',
        billingAddress: customerToEdit.billingAddress || '',
        paymentTerms: customerToEdit.paymentTerms || '',
        // Convert numbers to strings for input fields, handle null/undefined
        creditLimit: customerToEdit.creditLimit?.toString() ?? '',
        specialTermsNotes: customerToEdit.specialTermsNotes || customerToEdit.notes || '', // Prioritize new field, fallback to old notes
        discountPercentage: customerToEdit.discountPercentage?.toString() ?? '',
        status: customerToEdit.status || 'ACTIVE',
        notes: customerToEdit.notes || '' // Retain general notes if needed
      });
      // Optionally expand sections if data exists
      setExpandedSections({
           address: !!(customerToEdit.address || customerToEdit.shippingAddress || customerToEdit.billingAddress),
           terms: !!(customerToEdit.paymentTerms || customerToEdit.creditLimit || customerToEdit.specialTermsNotes || customerToEdit.discountPercentage)
      });
    } else if (!isOpen) {
       // Reset form when modal is closed (optional, prevents stale data flash)
       // setFormData(initialFormData);
       // setExpandedSections({ address: false, terms: false });
    }
  }, [customerToEdit, isOpen]); // Re-run when these change

  const toggleSection = (section: 'address' | 'terms') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToEdit) {
        console.error("Cannot submit update without customer data.");
        return;
    }
    if (onUpdate) {
      onUpdate(customerToEdit.id, formData); // Pass the ID and current form data
      // Don't necessarily reset the form here, onClose might handle that or parent might refresh
    } else {
      console.error('onUpdate function is not defined');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto py-10">
      {/* Make modal content scrollable if it overflows */}
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pt-1 pb-3 z-10"> {/* Make header sticky */}
          <h2 className="text-2xl font-bold">Edit Customer</h2> {/* <-- Changed Title */}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Add a check in case customerToEdit is null */}
        {!customerToEdit ? (
            <div className="text-center text-red-500 py-10">Error: No customer data provided for editing.</div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-b pb-4 mb-4">
                <h3 className="text-lg font-medium mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name Field */}
                <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                    </label>
                    <input
                    id="edit-name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter customer name"
                    />
                </div>

                {/* Status Field */}
                <div>
                    <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                    </label>
                    <select
                    id="edit-status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="LEAD">Lead</option>
                    <option value="PROSPECT">Prospect</option>
                    {/* Add other statuses if needed */}
                    </select>
                </div>

                {/* Email Field */}
                <div>
                    <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                    </label>
                    <input
                    id="edit-email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter email address"
                    />
                </div>

                {/* Phone Field */}
                <div>
                    <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                    id="edit-phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter phone number"
                    />
                </div>
                </div>
            </div>

            {/* Address Section (Collapsible) */}
            <div className="border-b pb-4 mb-4">
                <button
                type="button"
                onClick={() => toggleSection('address')}
                className="flex items-center justify-between w-full mb-2 text-left"
                >
                <h3 className="text-lg font-medium">Address Information</h3>
                {expandedSections.address ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
                </button>

                {expandedSections.address && (
                <div className="space-y-4 mt-3">
                    <div>
                    <label htmlFor="edit-address" className="block text-sm font-medium text-gray-700 mb-1">
                        General Address
                    </label>
                    <textarea
                        id="edit-address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter address"
                        rows={2}
                    />
                    </div>

                    <div>
                    <label htmlFor="edit-shippingAddress" className="block text-sm font-medium text-gray-700 mb-1">
                        Shipping Address (if different)
                    </label>
                    <textarea
                        id="edit-shippingAddress"
                        name="shippingAddress"
                        value={formData.shippingAddress}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter shipping address"
                        rows={2}
                    />
                    </div>

                    <div>
                    <label htmlFor="edit-billingAddress" className="block text-sm font-medium text-gray-700 mb-1">
                        Billing Address (if different)
                    </label>
                    <textarea
                        id="edit-billingAddress"
                        name="billingAddress"
                        value={formData.billingAddress}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter billing address"
                        rows={2}
                    />
                    </div>
                </div>
                )}
            </div>

            {/* Special Terms Section (Collapsible) */}
            <div className="border-b pb-4 mb-4">
                <button
                type="button"
                onClick={() => toggleSection('terms')}
                className="flex items-center justify-between w-full mb-2 text-left"
                >
                <h3 className="text-lg font-medium">Special Terms</h3>
                {expandedSections.terms ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
                </button>

                {expandedSections.terms && (
                <div className="space-y-4 mt-3">
                    <div>
                    <label htmlFor="edit-paymentTerms" className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Terms
                    </label>
                    <select
                        id="edit-paymentTerms"
                        name="paymentTerms"
                        value={formData.paymentTerms}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">-- Select Payment Terms --</option>
                        <option value="WITH_ORDER">100% With Order</option>
                        <option value="SPLIT_50_50">50% With Order, 50% On Completion</option>
                        <option value="PRIOR_TO_DISPATCH">100% Prior to Dispatch</option>
                        <option value="THIRTY_DAYS">Net 30 Days</option>
                        <option value="SIXTY_DAYS">Net 60 Days</option>
                        <option value="NINETY_DAYS">Net 90 Days</option>
                        <option value="SPLIT_50_40_10">50% With Order, 40% Prior to Dispatch, 10% Net 30</option>
                        <option value="CUSTOM">Custom Terms (Specify in Notes)</option>
                    </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="edit-creditLimit" className="block text-sm font-medium text-gray-700 mb-1">
                        Credit Limit (£)
                        </label>
                        <input
                        id="edit-creditLimit"
                        name="creditLimit"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.creditLimit}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter credit limit"
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-discountPercentage" className="block text-sm font-medium text-gray-700 mb-1">
                        Standard Discount (%)
                        </label>
                        <input
                        id="edit-discountPercentage"
                        name="discountPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.discountPercentage}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter discount percentage"
                        />
                    </div>
                    </div>

                    <div>
                    <label htmlFor="edit-specialTermsNotes" className="block text-sm font-medium text-gray-700 mb-1">
                        Special Terms Notes
                    </label>
                    <textarea
                        id="edit-specialTermsNotes"
                        name="specialTermsNotes"
                        value={formData.specialTermsNotes}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter any special arrangements or notes"
                        rows={2}
                    />
                    </div>
                </div>
                )}
            </div>

            {/* Notes Field */}
            <div>
                <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-700 mb-1">
                General Notes
                </label>
                <textarea
                id="edit-notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Add any additional notes"
                rows={3}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 sticky bottom-0 bg-white pb-1 z-10"> {/* Make buttons sticky */}
                <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                Cancel
                </button>
                <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                Update Customer {/* <-- Changed Button Text */}
                </button>
            </div>
            </form>
        )}
      </div>
    </div>
  );
}