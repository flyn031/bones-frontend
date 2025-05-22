import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
// --- CORRECTED IMPORT ---
// Import apiClient instead of api
import { customerApi, apiClient } from '../utils/api';
// ------------------------
import { ContactRole } from './CustomerDetails'; // Import from CustomerDetails where it's defined

// Define interface for the component props
interface AddEditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  customerId: string;
  contactToEdit: ContactPerson | null;
}

// Interface for form data
interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  role: ContactRole | '';
  notes: string;
  isPrimary: boolean;
}

// Interface for the contact person data (Ensure this matches your actual data structure)
interface ContactPerson {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: ContactRole | null;
  notes?: string | null;
  isPrimary: boolean;
  customerId: string;
  createdAt: string;
  updatedAt: string;
}

export default function AddEditContactModal({
  isOpen,
  onClose,
  onSave,
  customerId,
  contactToEdit
}: AddEditContactModalProps) {

  // Diagnostic log (keep for now)
  console.log('[AddEditContactModal] Component function START. Props received - isOpen:', isOpen, 'contactToEdit:', contactToEdit);

  if (!isOpen) {
    return null;
  }

  // Initial form state
  const initialFormData: ContactFormData = {
    name: '',
    email: '',
    phone: '',
    role: '',
    notes: '',
    isPrimary: false
  };

  // State definitions...
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // useEffect...
  useEffect(() => {
    console.log('[AddEditContactModal] useEffect running. contactToEdit:', contactToEdit);
    if (contactToEdit) {
      setFormData({
        name: contactToEdit.name || '',
        email: contactToEdit.email || '',
        phone: contactToEdit.phone || '',
        role: contactToEdit.role || '',
        notes: contactToEdit.notes || '',
        isPrimary: contactToEdit.isPrimary
      });
    } else {
      setFormData({ ...initialFormData, isPrimary: false });
    }
    setErrors({});
    setApiError(null);
  }, [contactToEdit, isOpen]);

  // handleChange...
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prevData => ({ ...prevData, [name]: checked }));
    } else {
      setFormData(prevData => ({ ...prevData, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => { const updated = { ...prev }; delete updated[name]; return updated; });
    }
  };

  // validateForm...
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) { newErrors.name = 'Name is required'; }
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) { newErrors.email = 'Please enter a valid email address'; }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // handleSubmit...
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validateForm()) return;
    setIsSubmitting(true);
    const payload = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      role: formData.role || null,
      notes: formData.notes || null,
      isPrimary: contactToEdit ? formData.isPrimary : false
    };

    try {
      console.log(`[ContactModal] ${contactToEdit ? 'Updating' : 'Creating'} contact. Payload:`, payload);
      if (contactToEdit) {
        console.log(`[ContactModal] Calling PUT /api/contacts/${contactToEdit.id}`);
        // --- CORRECTED: Use apiClient.put ---
        await apiClient.put(`/api/contacts/${contactToEdit.id}`, payload);
        // ----------------------------------
      } else {
        console.log(`[ContactModal] Calling POST /api/customers/${customerId}/contacts`);
        await customerApi.createContactPerson(customerId, payload);
      }
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving contact:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save contact. Please try again.';
      setApiError(errorMessage);
      console.error('[ContactModal] API Error Response:', error.response?.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Diagnostic log (keep for now)
  console.log('[AddEditContactModal] Rendering body. Value of contactToEdit:', contactToEdit);

  return (
    // --- Modal Wrapper ---
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
        {/* --- Modal Header --- */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">
            {contactToEdit ? 'Edit Contact' : 'Add New Contact'}
          </h3>
          <button onClick={onClose} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center" aria-label="Close" disabled={isSubmitting}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* --- Modal Body --- */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {apiError && (<div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">{apiError}</div>)}
            {/* --- Form Fields --- */}
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Contact name" required />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`} placeholder="email@example.com" />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>
            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} placeholder="Phone number" />
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
            </div>
            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white">
                <option value="">-- Select a role --</option>
                {Object.entries(ContactRole).map(([key, value]) => (<option key={key} value={value}>{key.replace(/_/g, ' ')}</option>))}
              </select>
            </div>
            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Additional notes"></textarea>
            </div>
            {/* --- CONDITIONAL CHECKBOX --- */}
            {contactToEdit && (
              <div className="flex items-center">
                <input type="checkbox" id="isPrimary" name="isPrimary" checked={formData.isPrimary} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                <label htmlFor="isPrimary" className="ml-2 block text-sm font-medium text-gray-700">Set as primary contact</label>
              </div>
            )}
            {/* ----------------------------- */}
          </div>
          {/* --- Modal Footer --- */}
          <div className="flex items-center justify-end p-4 border-t border-gray-200 rounded-b">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="ml-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (contactToEdit ? 'Update Contact' : 'Add Contact')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}