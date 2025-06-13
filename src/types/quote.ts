// Shared type definitions for quotes
export interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;  // Unified as optional string
    address?: string | null;
    contactPerson?: string | null;
  }
  
  export interface QuoteLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    materialId: string | null;
    quoteId?: string;
  }
  
  export interface QuoteItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
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
    notes?: string;
    items: QuoteItem[];
    lineItems?: QuoteLineItem[]; // For backend compatibility
    totalAmount: number;         // Always required
    value?: number;             // Legacy support
    status?: string;
    quoteNumber?: string;
    quoteReference?: string;
    versionNumber?: number;
    customerReference?: string;
    parentQuoteId?: string;
    changeReason?: string;
  }
  
  export interface QuoteVersion {
    id: string;
    quoteReference: string;
    versionNumber: number;
    isLatestVersion: boolean;
    status: string;
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
    value?: number;
  }