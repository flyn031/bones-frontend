// src/types/quote.ts - Complete shared type definitions for quotes

// Quote Status Types - Fixed: Removed CONVERTED_TO_ORDER, matches backend enum exactly
export type QuoteStatus = 
  | 'DRAFT'
  | 'SENT' 
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CONVERTED';

// Customer interface - unified version
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;  // Unified as optional string
  address?: string | null;
  contactPerson?: string | null;
}

// Customer Contact interface for multiple contacts per customer
export interface CustomerContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  title?: string; // Job title like "Procurement Manager", "Site Engineer"
  department?: string;
  isPrimary?: boolean; // Mark one contact as primary
  customerId: string;
}

// Extended Customer interface with multiple contacts
export interface CustomerWithContacts extends Customer {
  contacts?: CustomerContact[];
}

// Helper function to get primary contact or create legacy fallback
export const getPrimaryContact = (customer: Customer): CustomerContact | null => {
  const custWithContacts = customer as CustomerWithContacts;
  if (!custWithContacts.contacts || custWithContacts.contacts.length === 0) {
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
  return custWithContacts.contacts.find(contact => contact.isPrimary) || custWithContacts.contacts[0];
};

// Quote line item for backend compatibility
export interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  materialId: string | null;
  quoteId?: string;
}

// Quote item for frontend display
export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  materialId?: string | null;
}

// Main QuoteData interface - unified version
export interface QuoteData {
  id?: string;
  title: string;
  customer: string;           // Customer name as string
  customerId?: string;        // Customer ID reference
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  jobId?: string;
  date?: string;
  validUntil?: string;
  validityDays: number;
  terms: string;
  termsAndConditions?: string;  // NEW: Quote-specific terms and conditions
  notes?: string;
  items: QuoteItem[];
  lineItems?: QuoteLineItem[]; // For backend compatibility
  totalAmount: number;         // Always required
  value?: number;             // Legacy support
  status: QuoteStatus;        // Fixed: Use QuoteStatus type
  quoteNumber?: string;
  quoteReference?: string;
  versionNumber?: number;
  customerReference?: string;
  parentQuoteId?: string;
  changeReason?: string;
}

// Quote version interface for versioned quotes
export interface QuoteVersion {
  id: string;
  quoteReference: string;
  versionNumber: number;
  isLatestVersion: boolean;
  status: QuoteStatus;        // Fixed: Use QuoteStatus type
  title: string;
  description?: string | null;
  customerId: string;
  customerName?: string;
  customer?: Customer | null;
  quoteNumber?: string | null;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  validUntil?: string | null;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  changeReason?: string | null;
  parentQuoteId?: string | null;
  createdById: string;
  lineItems: QuoteLineItem[];
  orderId?: string | null;
  jobId?: string | null;
  sentDate?: string | null;
  notes?: string | null;
  customerReference?: string | null;
  termsAndConditions?: string | null;  // NEW: Added to version interface too
  value?: number;
}