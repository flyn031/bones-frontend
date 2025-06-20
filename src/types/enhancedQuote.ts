// src/types/enhancedQuote.ts - Professional quote enhancements for CCL-style quotes

import { QuoteData, QuoteItem, QuoteStatus, Customer } from './quote';

// Enhanced payment terms structure
export interface PaymentTerms {
  withOrder: number;        // Percentage (e.g. 50)
  beforeDispatch: number;   // Percentage (e.g. 40) 
  thirtyDays: number;       // Percentage (e.g. 10)
  description?: string;     // Custom payment terms text
}

// Enhanced customer address structure
export interface CustomerAddress {
  line1: string;           // "Unit 3 Charles Park"
  line2?: string;          // "Cinderhill Road"
  town: string;            // "Nottingham"
  postcode: string;        // "NG6 8RE"
  fullAddress?: string;    // Fallback for existing simple address
}

// Enhanced customer for professional quotes
export interface EnhancedCustomer extends Customer {
  structuredAddress?: CustomerAddress;
  companyNumber?: string;
  vatNumber?: string;
}

// Detailed quote item with technical specifications
export interface DetailedQuoteItem extends QuoteItem {
  // Technical specifications (multi-line)
  technicalSpecs?: string[];
  
  // Item categorization
  category?: 'CONVEYOR' | 'COMPONENT' | 'SERVICE' | 'CONSUMABLE' | 'OTHER';
  
  // Additional details
  partNumber?: string;
  manufacturer?: string;
  notes?: string;
  
  // Delivery/lead time specific to this item
  leadTimeWeeks?: number;
}

// Professional business terms
export interface BusinessTerms {
  // Delivery terms
  deliveryTerms: string;           // "Delivery will be 4-6 working weeks..."
  leadTimeWeeks: number;           // 4-6 weeks
  
  // Warranty
  warranty: string;                // "Central Conveyors Ltd Guarantee..."
  
  // Standard exclusions
  exclusions: string[];            // ["VAT", "Building Modifications", ...]
  
  // Professional scope/notes
  scope: string;                   // "Due to current instabilities..."
  
  // Validity period  
  validityDays: number;            // 14 days
}

// Enhanced quote data for professional quotes
export interface EnhancedQuoteData extends Omit<QuoteData, 'items' | 'customer'> {
  // Enhanced customer data
  customer: string | EnhancedCustomer;  // Support both string and object
  enhancedCustomer?: EnhancedCustomer;
  
  // Enhanced items with technical specs
  items: DetailedQuoteItem[];
  
  // Professional payment terms
  paymentTerms?: PaymentTerms;
  
  // Professional business terms
  businessTerms?: BusinessTerms;
  
  // Contact person details (enhanced)
  contactPersonTitle?: string;      // "Simon Unwin"
  
  // Quote metadata
  leadTimeWeeks?: number;          // Overall project lead time
  cclContact?: string;             // "Glyn Aylward" 
  projectDescription?: string;      // Enhanced description
  
  // Internal tracking
  enquiryDate?: string;
  quotationDate?: string;
}

// Company profile for quote generation (extends existing user profile)
export interface QuoteCompanyProfile {
  // Basic details (from existing user profile)
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  companyVatNumber: string;
  companyLogo?: string;
  
  // Professional additions for quotes
  defaultPaymentTerms?: PaymentTerms;
  standardExclusions: string[];
  standardWarranty: string;
  standardDeliveryTerms: string;
  defaultLeadTimeWeeks: number;
  
  // Company registration details
  companyRegistrationNumber?: string;
  companyAddress2?: string;
  companyPostcode?: string;
  companyTown?: string;
}

// Quote generation options
export interface QuoteGenerationOptions {
  includeCompanyBranding: boolean;
  includeTechnicalSpecs: boolean;
  includeBusinessTerms: boolean;
  includePaymentTerms: boolean;
  template: 'standard' | 'professional' | 'ccl_style';
}

// Backward compatibility - convert existing QuoteData to EnhancedQuoteData
export function enhanceQuoteData(quote: QuoteData): EnhancedQuoteData {
  return {
    ...quote,
    items: quote.items.map(item => ({
      ...item,
      category: 'OTHER' as const,
      technicalSpecs: item.description ? [item.description] : []
    })),
    paymentTerms: {
      withOrder: 50,
      beforeDispatch: 40, 
      thirtyDays: 10,
      description: quote.terms
    },
    businessTerms: {
      deliveryTerms: "Delivery will be arranged upon order confirmation.",
      leadTimeWeeks: Math.ceil(quote.validityDays / 7),
      warranty: "Standard warranty terms apply.",
      exclusions: ["VAT", "Installation", "Delivery"],
      scope: "Quote valid for specified period only.",
      validityDays: quote.validityDays
    },
    leadTimeWeeks: 4
  };
}

// Convert EnhancedQuoteData back to standard QuoteData for API compatibility
export function normalizeQuoteData(enhancedQuote: EnhancedQuoteData): QuoteData {
  return {
    ...enhancedQuote,
    customer: typeof enhancedQuote.customer === 'string' 
      ? enhancedQuote.customer 
      : enhancedQuote.customer.name,
    items: enhancedQuote.items.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      materialId: item.materialId
    })),
    terms: enhancedQuote.paymentTerms?.description || enhancedQuote.terms
  };
}