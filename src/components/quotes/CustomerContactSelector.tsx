import React from 'react';
import { Customer, CustomerContact } from '../../types/quote';
import { User, Phone, Mail, Building } from 'lucide-react';

interface CustomerContactSelectorProps {
  customer: Customer & { contacts?: CustomerContact[] };
  selectedContactId?: string;
  onContactSelected: (contact: CustomerContact) => void;
}

// Helper function to get primary contact or create legacy fallback
const getPrimaryContact = (customer: Customer & { contacts?: CustomerContact[] }): CustomerContact | null => {
  if (!customer.contacts || customer.contacts.length === 0) {
    // Fallback to legacy single contact
    if (customer.contactPerson || customer.email) {
      return {
        id: `legacy-${customer.id}`,
        name: customer.contactPerson || 'Main Contact',
        email: customer.email,
        phone: customer.phone,
        isPrimary: true,
        customerId: customer.id
      };
    }
    return null;
  }
  
  // Find primary contact or return first one
  return customer.contacts.find(contact => contact.isPrimary) || customer.contacts[0];
};

export const CustomerContactSelector: React.FC<CustomerContactSelectorProps> = ({
  customer,
  selectedContactId,
  onContactSelected,
}) => {
  // Get available contacts - either new format or legacy fallback
  const availableContacts: CustomerContact[] = customer.contacts && customer.contacts.length > 0 
    ? customer.contacts 
    : getPrimaryContact(customer) 
      ? [getPrimaryContact(customer)!] 
      : [];

  const selectedContact = availableContacts.find(c => c.id === selectedContactId);

  if (availableContacts.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No contacts available for this customer
      </div>
    );
  }

  if (availableContacts.length === 1) {
    // Auto-select single contact
    const singleContact = availableContacts[0];
    if (!selectedContact) {
      onContactSelected(singleContact);
    }
    
    return (
      <div className="bg-gray-50 border rounded-lg p-3">
        <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
          <User className="h-4 w-4 mr-2" />
          Contact Information
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center">
            <span className="font-medium">{singleContact.name}</span>
            {singleContact.isPrimary && (
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                Primary
              </span>
            )}
          </div>
          {singleContact.title && (
            <div className="flex items-center text-gray-600">
              <Building className="h-3 w-3 mr-1" />
              {singleContact.title}
              {singleContact.department && ` • ${singleContact.department}`}
            </div>
          )}
          <div className="flex items-center text-gray-600">
            <Mail className="h-3 w-3 mr-1" />
            {singleContact.email}
          </div>
          {singleContact.phone && (
            <div className="flex items-center text-gray-600">
              <Phone className="h-3 w-3 mr-1" />
              {singleContact.phone}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Contact
      </label>
      <div className="space-y-2">
        {availableContacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => onContactSelected(contact)}
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedContact?.id === contact.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">{contact.name}</span>
                  {contact.isPrimary && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Primary
                    </span>
                  )}
                </div>
                {contact.title && (
                  <div className="text-sm text-gray-600 mt-1">
                    {contact.title}
                    {contact.department && ` • ${contact.department}`}
                  </div>
                )}
                <div className="flex items-center mt-1 space-x-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-3 w-3 mr-1" />
                    {contact.email}
                  </div>
                  {contact.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-3 w-3 mr-1" />
                      {contact.phone}
                    </div>
                  )}
                </div>
              </div>
              
              {selectedContact?.id === contact.id && (
                <div className="ml-3">
                  <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {selectedContact && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-800">
            Contact details will be auto-filled in the quote
          </div>
        </div>
      )}
    </div>
  );
};