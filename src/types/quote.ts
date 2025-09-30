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
  phone?: string;
  address?: string | null;
  contactPerson?: string | null;
}

// Customer Contact interface for multiple contacts per customer
export interface CustomerContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  isPrimary?: boolean;
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
  customer: string;
  customerId?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  jobId?: string;
  date?: string;
  validUntil?: string;
  validityDays: number;
  terms: string;
  termsAndConditions?: string;  // Additional notes
  paymentTerms?: string;        // NEW: Structured payment terms
  deliveryTerms?: string;       // NEW: Structured delivery terms
  warranty?: string;            // NEW: Structured warranty
  exclusions?: string;          // NEW: Structured exclusions
  notes?: string;
  items: QuoteItem[];
  lineItems?: QuoteLineItem[];
  totalAmount: number;
  value?: number;
  status: QuoteStatus;
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
  status: QuoteStatus;
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
  termsAndConditions?: string | null;
  paymentTerms?: string | null;        // NEW: Structured payment terms
  deliveryTerms?: string | null;       // NEW: Structured delivery terms
  warranty?: string | null;            // NEW: Structured warranty
  exclusions?: string | null;          // NEW: Structured exclusions
  value?: number;
}