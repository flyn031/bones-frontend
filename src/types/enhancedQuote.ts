// src/types/enhancedQuote.ts - Professional quote enhancements for CCL-style quotes

import { QuoteData, QuoteItem, Customer } from './quote';

// Enhanced payment terms structure (renamed to avoid conflict)
export interface StructuredPaymentTerms {
  withOrder: number;
  beforeDispatch: number;
  thirtyDays: number;
  description?: string;
}

export interface CustomerAddress {
  line1: string;
  line2?: string;
  town: string;
  postcode: string;
  fullAddress?: string;
}

export interface EnhancedCustomer extends Customer {
  structuredAddress?: CustomerAddress;
  companyNumber?: string;
  vatNumber?: string;
}

export interface DetailedQuoteItem extends QuoteItem {
  technicalSpecs?: string[];
  category?: 'CONVEYOR' | 'COMPONENT' | 'SERVICE' | 'CONSUMABLE' | 'OTHER';
  partNumber?: string;
  manufacturer?: string;
  notes?: string;
  leadTimeWeeks?: number;
}

export interface BusinessTerms {
  deliveryTerms: string;
  leadTimeWeeks: number;
  warranty: string;
  exclusions: string[];
  scope: string;
  validityDays: number;
}

// CHANGED: paymentTerms is now string to match QuoteData
export interface EnhancedQuoteData extends Omit<QuoteData, 'items' | 'customer'> {
  customer: string | EnhancedCustomer;
  enhancedCustomer?: EnhancedCustomer;
  items: DetailedQuoteItem[];
  paymentTerms?: string; // CHANGED: Now string instead of StructuredPaymentTerms
  businessTerms?: BusinessTerms;
  contactPersonTitle?: string;
  leadTimeWeeks?: number;
  cclContact?: string;
  projectDescription?: string;
  enquiryDate?: string;
  quotationDate?: string;
}

export interface QuoteCompanyProfile {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  companyVatNumber: string;
  companyLogo?: string;
  defaultPaymentTerms?: StructuredPaymentTerms;
  standardExclusions: string[];
  standardWarranty: string;
  standardDeliveryTerms: string;
  defaultLeadTimeWeeks: number;
  companyRegistrationNumber?: string;
  companyAddress2?: string;
  companyPostcode?: string;
  companyTown?: string;
}

export interface QuoteGenerationOptions {
  includeCompanyBranding: boolean;
  includeTechnicalSpecs: boolean;
  includeBusinessTerms: boolean;
  includePaymentTerms: boolean;
  template: 'standard' | 'professional' | 'ccl_style';
}

export function enhanceQuoteData(quote: QuoteData): EnhancedQuoteData {
  return {
    ...quote,
    items: quote.items.map(item => ({
      ...item,
      category: 'OTHER' as const,
      technicalSpecs: item.description ? [item.description] : []
    })),
    paymentTerms: quote.paymentTerms || quote.terms, // CHANGED: Use string
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
    terms: enhancedQuote.paymentTerms || enhancedQuote.terms // CHANGED: paymentTerms is now string
  };
}
