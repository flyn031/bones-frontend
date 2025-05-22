import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Plus, Trash2, UserCheck } from 'lucide-react';

// Define the contact role options (should match your backend enum)
const CONTACT_ROLES = [
  'ACCOUNTS',
  'DELIVERIES',
  'PRIMARY_BUYER',
  'TECHNICAL_CONTACT',
  'SITE_CONTACT',
  'PROJECT_MANAGER',
  'GENERAL_INQUIRY',
  'OTHER'
];

// Define the contact interface
interface ContactPerson {
  id?: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  notes: string | null;
  isPrimary: boolean;
}

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => void;
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  // Address fields
  address: string;
  shippingAddress: string;
  billingAddress: string;
  // Special terms fields
  paymentTerms: string;
  creditLimit: string;
  specialTermsNotes: string;
  discountPercentage: string;
  // Other fields
  status: string;
  notes: string;
  // New contacts field
  contacts: ContactPerson[];
}

export default function AddCustomerModal({ isOpen, onClose, onSubmit }: AddCustomerModalProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    shippingAddress: '',
    billingAddress: '',
    paymentTerms: '',
    creditLimit: '',
    specialTermsNotes: '',
    discountPercentage: '',
    status: 'ACTIVE',
    notes: '',
    contacts: [] // Initialize empty contacts array
  });

  // Section expansion state
  const [expandedSections, setExpandedSections] = useState({
    address: false,
    terms: false,
    contacts: false // Add contacts section toggle
  });

  const toggleSection = (section: 'address' | 'terms' | 'contacts') => {
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

  // Add a new empty contact
  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          name: '',
          email: '',
          phone: '',
          role: null,
          notes: '',
          isPrimary: prev.contacts.length === 0 // First contact is primary by default
        }
      ]
    }));
    
    // Auto-expand the contacts section when adding a new contact
    if (!expandedSections.contacts) {
      setExpandedSections(prev => ({
        ...prev,
        contacts: true
      }));
    }
  };

  // Handle changes for contact fields
  const handleContactChange = (index: number, field: keyof ContactPerson, value: any) => {
    const updatedContacts = [...formData.contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      contacts: updatedContacts
    }));
  };

  // Set a contact as primary (and unset others)
  const setPrimaryContact = (index: number) => {
    const updatedContacts = formData.contacts.map((contact, i) => ({
      ...contact,
      isPrimary: i === index
    }));
    setFormData(prev => ({
      ...prev,
      contacts: updatedContacts
    }));
  };

  // Remove a contact
  const removeContact = (index: number) => {
    const updatedContacts = [...formData.contacts];
    const removingPrimary = updatedContacts[index].isPrimary;
    updatedContacts.splice(index, 1);
    
    // If we removed the primary contact and there are still contacts left,
    // make the first one primary
    if (removingPrimary && updatedContacts.length > 0) {
      updatedContacts[0].isPrimary = true;
    }
    
    setFormData(prev => ({
      ...prev,
      contacts: updatedContacts
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
      // Reset form after submission
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        shippingAddress: '',
        billingAddress: '',
        paymentTerms: '',
        creditLimit: '',
        specialTermsNotes: '',
        discountPercentage: '',
        status: 'ACTIVE',
        notes: '',
        contacts: []
      });
    } else {
      console.error('onSubmit function is not defined');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto py-10">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Add New Customer</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-b pb-4 mb-4">
            <h3 className="text-lg font-medium mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
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
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="LEAD">Lead</option>
                  <option value="PROSPECT">Prospect</option>
                </select>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
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
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
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

          {/* Contacts Section (Collapsible) - NEW SECTION */}
          <div className="border-b pb-4 mb-4">
            <div className="flex items-center justify-between w-full mb-2">
              <button 
                type="button"
                onClick={() => toggleSection('contacts')}
                className="flex items-center text-left"
              >
                <h3 className="text-lg font-medium">Contact Persons</h3>
                {expandedSections.contacts ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 ml-2" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 ml-2" />
                )}
              </button>
              
              <button 
                type="button"
                onClick={addContact}
                className="flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Contact
              </button>
            </div>
            
            {expandedSections.contacts && (
              <div className="space-y-4 mt-3">
                {formData.contacts.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No contacts added yet. Click "Add Contact" to add contact persons.</p>
                  </div>
                ) : (
                  formData.contacts.map((contact, index) => (
                    <div key={index} className="bg-gray-50 rounded-md p-4 relative">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium">Contact {index + 1}</h4>
                        <div className="flex space-x-2">
                          <button 
                            type="button"
                            onClick={() => setPrimaryContact(index)}
                            className={`flex items-center text-sm px-2 py-1 rounded-md ${
                              contact.isPrimary 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            {contact.isPrimary ? 'Primary' : 'Set Primary'}
                          </button>
                          <button 
                            type="button"
                            onClick={() => removeContact(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={contact.name}
                            onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Enter contact name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                          </label>
                          <select
                            value={contact.role || ''}
                            onChange={(e) => handleContactChange(index, 'role', e.target.value || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-- Select Role --</option>
                            {CONTACT_ROLES.map(role => (
                              <option key={role} value={role}>
                                {role.replace(/_/g, ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={contact.email || ''}
                            onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Enter contact email"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={contact.phone || ''}
                            onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Enter contact phone"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                          </label>
                          <textarea
                            value={contact.notes || ''}
                            onChange={(e) => handleContactChange(index, 'notes', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Any additional notes about this contact"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
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
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    General Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter address"
                    rows={2}
                  />
                </div>

                <div>
                  <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Address (if different)
                  </label>
                  <textarea
                    id="shippingAddress"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter shipping address"
                    rows={2}
                  />
                </div>

                <div>
                  <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Address (if different)
                  </label>
                  <textarea
                    id="billingAddress"
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
                  <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    id="paymentTerms"
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
                    <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Limit (£)
                    </label>
                    <input
                      id="creditLimit"
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
                    <label htmlFor="discountPercentage" className="block text-sm font-medium text-gray-700 mb-1">
                      Standard Discount (%)
                    </label>
                    <input
                      id="discountPercentage"
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
                  <label htmlFor="specialTermsNotes" className="block text-sm font-medium text-gray-700 mb-1">
                    Special Terms Notes
                  </label>
                  <textarea
                    id="specialTermsNotes"
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
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              General Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Add any additional notes"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
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
              Add Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}