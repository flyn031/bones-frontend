// src/components/quotes/pdf/EnhancedQuotePDF.tsx - Professional quote PDF with structured terms

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { EnhancedQuoteData, QuoteCompanyProfile, enhanceQuoteData } from '../../../types/enhancedQuote';
import { QuoteData } from '../../../types/quote';

// Initialize pdfMake fonts
if (pdfMake.vfs === undefined) {
    pdfMake.vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : pdfFonts;
}

interface UserProfile {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyVatNumber?: string;
  companyLogo?: string;
  useCompanyDetailsOnQuotes: boolean;
}

// Generate professional quote PDF with structured terms
export const generateEnhancedQuotePDF = (
  quote: QuoteData | EnhancedQuoteData, 
  userProfile?: UserProfile,
  companyProfile?: Partial<QuoteCompanyProfile>
) => {
  console.log('=== PDF GENERATOR DEBUG ===');
  console.log('PDF Generator received quote:', quote);
  console.log('🔍 ALL QUOTE KEYS:', Object.keys(quote));
  console.log('🔍 RAW QUOTE OBJECT:', JSON.stringify(quote, null, 2));
  
  // Extract the 4 structured term fields from the quote
  const paymentTerms = (quote as any).paymentTerms || '';
  const deliveryTerms = (quote as any).deliveryTerms || '';
  const warranty = (quote as any).warranty || '';
  const exclusions = (quote as any).exclusions || '';
  
  console.log('📋 PDF Generator structured terms:', {
    paymentTerms,
    deliveryTerms,
    warranty,
    exclusions
  });
  console.log('🚨 Are they empty?', {
    paymentTermsEmpty: !paymentTerms,
    deliveryTermsEmpty: !deliveryTerms,
    warrantyEmpty: !warranty,
    exclusionsEmpty: !exclusions
  });
  
  // Convert to enhanced format if needed
  const enhancedQuote: EnhancedQuoteData = 'businessTerms' in quote 
    ? quote as EnhancedQuoteData 
    : enhanceQuoteData(quote as QuoteData);

  // Use company details from profile
  const useCompanyDetails = userProfile?.useCompanyDetailsOnQuotes || false;
  
  // Build company profile from user profile + overrides
  const company: QuoteCompanyProfile = {
    companyName: userProfile?.companyName || 'Your Company Name',
    companyAddress: userProfile?.companyAddress || '',
    companyPhone: userProfile?.companyPhone || '',
    companyEmail: userProfile?.companyEmail || '',
    companyWebsite: userProfile?.companyWebsite || '',
    companyVatNumber: userProfile?.companyVatNumber || '',
    companyLogo: userProfile?.companyLogo || '',
    standardExclusions: [],
    standardWarranty: '',
    standardDeliveryTerms: '',
    defaultLeadTimeWeeks: 4,
    ...companyProfile
  };

  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB');
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return dateString;
    }
  };

  // Calculate totals
  const subtotal = enhancedQuote.items.reduce((sum, item) => sum + (item.total || 0), 0);
  const vat = subtotal * 0.2;
  const total = subtotal + vat;

  // Build customer information
  const customer = typeof enhancedQuote.customer === 'string' 
    ? { name: enhancedQuote.customer }
    : enhancedQuote.customer;

  // Header content with logo
  let headerContent = [];
  
  if (useCompanyDetails) {
    if (company.companyLogo) {
      try {
        headerContent.push({
          image: company.companyLogo,
          fit: [150, 80],
          alignment: 'left'
        });
      } catch (error) {
        console.warn('Logo failed to load, using text header');
        headerContent.push({
          text: company.companyName,
          style: 'companyHeader'
        });
      }
    } else {
      headerContent.push({
        text: company.companyName,
        style: 'companyHeader'
      });
    }
  }

  // Build structured terms sections
  const termsContent = [];
  const hasAnyTerms = paymentTerms || deliveryTerms || warranty || exclusions;

  if (hasAnyTerms) {
    // Add main "Terms & Conditions" header
    termsContent.push({
      text: 'Terms & Conditions',
      style: 'sectionHeader',
      pageBreak: 'before',
      margin: [0, 0, 0, 20]
    });

    // PAYMENT TERMS section
    if (paymentTerms) {
      termsContent.push(
        {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 0,
              x2: 515, y2: 0,
              lineWidth: 1,
              lineColor: '#e5e7eb'
            }
          ],
          margin: [0, 0, 0, 8]
        },
        {
          text: 'PAYMENT TERMS',
          style: 'termsSectionHeader',
          margin: [0, 0, 0, 8]
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 0,
              x2: 515, y2: 0,
              lineWidth: 1,
              lineColor: '#e5e7eb'
            }
          ],
          margin: [0, 0, 0, 10]
        },
        {
          text: paymentTerms,
          style: 'termsContent',
          margin: [0, 0, 0, 15]
        }
      );
    }

    // DELIVERY section
    if (deliveryTerms) {
      termsContent.push(
        {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 0,
              x2: 515, y2: 0,
              lineWidth: 1,
              lineColor: '#e5e7eb'
            }
          ],
          margin: [0, 0, 0, 8]
        },
        {
          text: 'DELIVERY',
          style: 'termsSectionHeader',
          margin: [0, 0, 0, 8]
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 0,
              x2: 515, y2: 0,
              lineWidth: 1,
              lineColor: '#e5e7eb'
            }
          ],
          margin: [0, 0, 0, 10]
        },
        {
          text: deliveryTerms,
          style: 'termsContent',
          margin: [0, 0, 0, 15]
        }
      );
    }

    // WARRANTY section
    if (warranty) {
      termsContent.push(
        {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 0,
              x2: 515, y2: 0,
              lineWidth: 1,
              lineColor: '#e5e7eb'
            }
          ],
          margin: [0, 0, 0, 8]
        },
        {
          text: 'WARRANTY',
          style: 'termsSectionHeader',
          margin: [0, 0, 0, 8]
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 0,
              x2: 515, y2: 0,
              lineWidth: 1,
              lineColor: '#e5e7eb'
            }
          ],
          margin: [0, 0, 0, 10]
        },
        {
          text: warranty,
          style: 'termsContent',
          margin: [0, 0, 0, 15]
        }
      );
    }

    // EXCLUSIONS section
    if (exclusions) {
      termsContent.push(
        {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 0,
              x2: 515, y2: 0,
              lineWidth: 1,
              lineColor: '#e5e7eb'
            }
          ],
          margin: [0, 0, 0, 8]
        },
        {
          text: 'EXCLUSIONS',
          style: 'termsSectionHeader',
          margin: [0, 0, 0, 8]
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 0,
              x2: 515, y2: 0,
              lineWidth: 1,
              lineColor: '#e5e7eb'
            }
          ],
          margin: [0, 0, 0, 10]
        },
        {
          text: exclusions,
          style: 'termsContent',
          margin: [0, 0, 0, 15]
        }
      );
    }
  } else {
    // Fallback to minimal default terms if no structured terms provided
    termsContent.push(
      {
        text: 'Terms & Conditions',
        style: 'sectionHeader',
        pageBreak: 'before',
        margin: [0, 0, 0, 15]
      },
      {
        text: 'Payment Terms',
        style: 'subsectionHeader'
      },
      {
        text: 'Payment terms: Net 30 days',
        style: 'customTermsText',
        margin: [0, 0, 0, 10]
      },
      {
        text: 'Validity',
        style: 'subsectionHeader'
      },
      {
        text: `This quotation is valid for ${enhancedQuote.validityDays || 30} days from the date of issue.`,
        style: 'customTermsText',
        margin: [0, 0, 0, 10]
      }
    );
  }

  // Document definition
  const documentDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    
    info: {
      title: `Quotation ${enhancedQuote.quoteNumber || enhancedQuote.id}`,
      author: company.companyName,
      subject: enhancedQuote.title,
      keywords: 'quotation, manufacturing, professional'
    },

    content: [
      // Professional Header Section
      {
        columns: [
          {
            width: '*',
            stack: headerContent
          },
          {
            width: '*',
            stack: [
              { 
                text: useCompanyDetails ? [
                  { text: company.companyName + '\n', style: 'companyDetails' },
                  { text: company.companyAddress + '\n', style: 'companyDetails' },
                  { text: `Tel: ${company.companyPhone}\n`, style: 'companyDetails' },
                  { text: `Web: ${company.companyWebsite}\n`, style: 'companyDetails' },
                  { text: `Email: ${company.companyEmail}`, style: 'companyDetails' }
                ] : '',
                alignment: 'right'
              }
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      },

      // Customer Quotation Header
      {
        text: 'Customer Quotation',
        style: 'quotationTitle',
        alignment: 'center',
        margin: [0, 20, 0, 30]
      },

      // Quote Details Section
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'To:', style: 'sectionLabel' },
              { text: customer.name || 'Customer Name', style: 'customerInfo' },
              enhancedQuote.contactPerson ? { text: enhancedQuote.contactPerson, style: 'customerInfo' } : {},
              enhancedQuote.contactEmail ? { text: enhancedQuote.contactEmail, style: 'customerInfo' } : {},
              enhancedQuote.contactPhone ? { text: enhancedQuote.contactPhone, style: 'customerInfo' } : {}
            ]
          },
          {
            width: '*',
            stack: [
              { text: `Quotation Date: ${formatDate(enhancedQuote.quotationDate || enhancedQuote.date)}`, style: 'quoteDetails', alignment: 'right' },
              { text: `Quotation ref: ${enhancedQuote.quoteNumber || enhancedQuote.id}`, style: 'quoteDetails', alignment: 'right' },
              { text: `Valid for: ${enhancedQuote.validityDays || 30} days`, style: 'quoteDetails', alignment: 'right' },
              useCompanyDetails ? { text: `Contact: Sales Team`, style: 'quoteDetails', alignment: 'right' } : {}
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      },

      // Professional Introduction
      {
        text: `Thank you for your enquiry. We are pleased to provide the following quotation for your consideration.`,
        style: 'introduction',
        margin: [0, 0, 0, 20]
      },

      // Quotation Summary Header
      {
        text: 'Quotation Summary',
        style: 'sectionHeader',
        margin: [0, 10, 0, 10]
      },

      // Items Table
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Line\nnumber', style: 'tableHeader', alignment: 'center' },
              { text: 'Item', style: 'tableHeader' },
              { text: 'Quantity', style: 'tableHeader', alignment: 'center' },
              { text: 'Unit\nPrice', style: 'tableHeader', alignment: 'right' },
              { text: 'Total', style: 'tableHeader', alignment: 'right' }
            ],
            ...enhancedQuote.items.map((item, index) => [
              { text: (index + 1).toString(), style: 'tableCell', alignment: 'center' },
              {
                stack: [
                  { text: item.description, style: 'itemTitle' },
                  ...(item.technicalSpecs || []).map(spec => ({ text: spec, style: 'itemSpec' }))
                ]
              },
              { text: item.quantity.toString(), style: 'tableCell', alignment: 'center' },
              { text: `£${item.unitPrice.toLocaleString('en-GB', {minimumFractionDigits: 2})}`, style: 'tableCell', alignment: 'right' },
              { text: `£${item.total.toLocaleString('en-GB', {minimumFractionDigits: 2})}`, style: 'tableCell', alignment: 'right' }
            ])
          ]
        },
        layout: {
          hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cccccc',
          vLineColor: () => '#cccccc',
          paddingTop: () => 8,
          paddingBottom: () => 8,
          paddingLeft: () => 8,
          paddingRight: () => 8
        },
        margin: [0, 0, 0, 20]
      },

      // Total Section
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            stack: [
              { text: `Total value of quote is £${total.toLocaleString('en-GB', {minimumFractionDigits: 2})}`, style: 'totalValue' },
              { text: 'This price excludes VAT', style: 'totalNote' }
            ]
          }
        ],
        margin: [0, 0, 0, 30]
      },

      // Structured terms content
      ...termsContent,

      // Closing
      { text: 'Thank you for your consideration.', style: 'closing', margin: [0, 20, 0, 5] },
      { text: company.companyName, style: 'signature' }
    ],

    // Styles
    styles: {
      companyHeader: {
        fontSize: 18,
        bold: true,
        color: '#2563eb'
      },
      companyDetails: {
        fontSize: 9,
        lineHeight: 1.3
      },
      quotationTitle: {
        fontSize: 24,
        bold: true,
        color: '#1f2937'
      },
      sectionLabel: {
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 5]
      },
      customerInfo: {
        fontSize: 11,
        lineHeight: 1.4
      },
      quoteDetails: {
        fontSize: 11,
        lineHeight: 1.4
      },
      introduction: {
        fontSize: 11,
        lineHeight: 1.5,
        alignment: 'justify'
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        color: '#1f2937'
      },
      subsectionHeader: {
        fontSize: 11,
        bold: true,
        color: '#1f2937',
        margin: [0, 5, 0, 3]
      },
      // NEW: Style for structured term section headers
      termsSectionHeader: {
        fontSize: 12,
        bold: true,
        color: '#1f2937',
        letterSpacing: 0.5
      },
      // NEW: Style for term content
      termsContent: {
        fontSize: 10,
        lineHeight: 1.5,
        alignment: 'justify'
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
        color: '#ffffff',
        fillColor: '#374151'
      },
      tableCell: {
        fontSize: 10
      },
      itemTitle: {
        fontSize: 10,
        bold: true
      },
      itemSpec: {
        fontSize: 9,
        lineHeight: 1.2,
        margin: [0, 2, 0, 0]
      },
      totalValue: {
        fontSize: 12,
        bold: true
      },
      totalNote: {
        fontSize: 10,
        italics: true
      },
      customTermsText: {
        fontSize: 10,
        lineHeight: 1.4,
        alignment: 'justify'
      },
      customTermsList: {
        fontSize: 10,
        lineHeight: 1.3
      },
      closing: {
        fontSize: 11
      },
      signature: {
        fontSize: 11,
        bold: true
      }
    },

    defaultStyle: {
      fontSize: 10,
      lineHeight: 1.3
    }
  };

  // Generate PDF
  try {
    return pdfMake.createPdf(documentDefinition as any);
  } catch (error) {
    console.error('Enhanced PDF generation error:', error);
    throw new Error('Failed to generate professional quote PDF');
  }
};

// Convenience function for generating with current user profile
export const generateProfessionalQuotePDF = (
  quote: QuoteData | EnhancedQuoteData,
  userProfile?: UserProfile
) => {
  return generateEnhancedQuotePDF(quote, userProfile);
};

// Download the PDF
export const downloadQuotePDF = (
  quote: QuoteData | EnhancedQuoteData,
  userProfile?: UserProfile,
  filename?: string
) => {
  const pdf = generateProfessionalQuotePDF(quote, userProfile);
  const defaultFilename = `Quote-${quote.quoteNumber || quote.id}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.download(filename || defaultFilename);
};

// Open PDF in new tab
export const openQuotePDF = (
  quote: QuoteData | EnhancedQuoteData,
  userProfile?: UserProfile
) => {
  const pdf = generateProfessionalQuotePDF(quote, userProfile);
  pdf.open();
};