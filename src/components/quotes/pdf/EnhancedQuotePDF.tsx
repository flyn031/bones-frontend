// src/components/quotes/pdf/EnhancedQuotePDF.tsx - Professional quote PDF with custom terms

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { EnhancedQuoteData, QuoteCompanyProfile, enhanceQuoteData } from '../../../types/enhancedQuote';
import { QuoteData } from '../../../types/quote';

// Initialize pdfMake fonts
if (pdfMake.vfs === undefined) {
    pdfMake.vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : pdfFonts;
}

// Company profile from user profile - UPDATED with custom terms
interface UserProfile {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyVatNumber?: string;
  companyLogo?: string;
  useCompanyDetailsOnQuotes: boolean;
  // NEW: Custom quote terms
  standardWarranty?: string;
  standardDeliveryTerms?: string;
  defaultLeadTimeWeeks?: number;
  standardExclusions?: string; // Comma-separated string
}

// Generate professional quote PDF with custom terms
export const generateEnhancedQuotePDF = (
  quote: QuoteData | EnhancedQuoteData, 
  userProfile?: UserProfile,
  companyProfile?: Partial<QuoteCompanyProfile>
) => {
  // 🔍 DEBUG: Log what data the PDF generator receives
  console.log('=== PDF GENERATOR DEBUG ===');
  console.log('PDF Generator received userProfile:', userProfile);
  console.log('PDF Generator received defaultLeadTimeWeeks:', userProfile?.defaultLeadTimeWeeks);
  console.log('PDF Generator received quote:', quote);
  console.log('PDF Generator received companyProfile override:', companyProfile);
  
  // Convert to enhanced format if needed
  const enhancedQuote: EnhancedQuoteData = 'businessTerms' in quote 
    ? quote as EnhancedQuoteData 
    : enhanceQuoteData(quote as QuoteData);

  // Use company details from profile
  const useCompanyDetails = userProfile?.useCompanyDetailsOnQuotes || false;
  
  // Build company profile from user profile + overrides - UPDATED to use custom terms
  const company: QuoteCompanyProfile = {
    companyName: userProfile?.companyName || 'Your Company Name',
    companyAddress: userProfile?.companyAddress || '',
    companyPhone: userProfile?.companyPhone || '',
    companyEmail: userProfile?.companyEmail || '',
    companyWebsite: userProfile?.companyWebsite || '',
    companyVatNumber: userProfile?.companyVatNumber || '',
    companyLogo: userProfile?.companyLogo || '',
    
    // Use custom terms from user profile OR fall back to sensible defaults
    standardExclusions: userProfile?.standardExclusions 
      ? userProfile.standardExclusions.split(',').map(item => item.trim()).filter(item => item)
      : [
          'VAT',
          'Installation',
          'Delivery',
          'Controls',
          'Any other items not stated on the quote'
        ],
        
    standardWarranty: userProfile?.standardWarranty || 
      'Your Company guarantees equipment to be free of defects in workmanship or material for twelve months from delivery, standard working conditions.',
      
    standardDeliveryTerms: userProfile?.standardDeliveryTerms || 
      'Delivery will be arranged upon order confirmation with standard lead times.',
      
    defaultLeadTimeWeeks: userProfile?.defaultLeadTimeWeeks || 4,
    
    // Override with any provided company profile settings
    ...companyProfile
  };

  // 🔍 DEBUG: Log the final company profile that will be used
  console.log('PDF Generator final company profile:', company);
  console.log('PDF Generator final defaultLeadTimeWeeks:', company.defaultLeadTimeWeeks);

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

  // Payment terms formatting
  const paymentTerms = enhancedQuote.paymentTerms || {
    withOrder: 50,
    beforeDispatch: 40,
    thirtyDays: 10
  };

  // Business terms - ALWAYS use custom terms from user profile when available
  const existingBusinessTerms = enhancedQuote.businessTerms || {};
  const businessTerms = {
    deliveryTerms: company.standardDeliveryTerms,
    leadTimeWeeks: company.defaultLeadTimeWeeks,  // Always use user's custom setting
    warranty: company.standardWarranty,
    exclusions: company.standardExclusions,
    scope: (existingBusinessTerms as any).scope || 'Quote subject to our standard terms and conditions.',
    validityDays: (existingBusinessTerms as any).validityDays || enhancedQuote.validityDays || 30
  };

  // 🔍 DEBUG: Log the business terms that will be used in the PDF
  console.log('PDF Generator businessTerms:', businessTerms);
  console.log('PDF Generator businessTerms.leadTimeWeeks:', businessTerms.leadTimeWeeks);

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
              { 
                text: `Lead time: ${businessTerms.leadTimeWeeks} weeks`, 
                style: 'quoteDetails', 
                alignment: 'right'
              },
              { text: `Quotation ref: ${enhancedQuote.quoteNumber || enhancedQuote.id}`, style: 'quoteDetails', alignment: 'right' },
              useCompanyDetails ? { text: `Contact: ${enhancedQuote.cclContact || 'Sales Team'}`, style: 'quoteDetails', alignment: 'right' } : {}
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      },

      // Professional Introduction
      {
        text: `Thank you for your recent enquiry; we have pleasure in supplying the following quotation for your consideration. If there are any details of the quotation omitted or which you do not fully understand please contact the ${company.companyName} sales office for further information.`,
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
            // Items rows
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

      // Payment Terms
      {
        text: 'Payment Terms:',
        style: 'sectionHeader',
        margin: [0, 0, 0, 5]
      },
      {
        columns: [
          { text: `With order: ${paymentTerms.withOrder}%`, style: 'paymentTerms' },
          { text: `Prior to despatch: ${paymentTerms.beforeDispatch}%`, style: 'paymentTerms' },
          { text: `30-days terms: ${paymentTerms.thirtyDays}%`, style: 'paymentTerms' }
        ],
        margin: [0, 0, 0, 20]
      },

      // Quote Exclusions and Notes
      {
        text: 'Quote Exclusions and Notes',
        style: 'sectionHeader',
        pageBreak: 'before',
        margin: [0, 0, 0, 15]
      },

      // Business Terms Sections - UPDATED to use custom terms
      { text: 'compliance', style: 'subsectionHeader' },
      { text: `To conform with current health and safety legislation, all of our equipment will carry the relevant CE Marking; either a Declaration of Conformity or Declaration of Incorporation, dependant on whether ${company.companyName} is the prime contractor.`, style: 'businessTermsText', margin: [0, 0, 0, 10] },

      { text: 'delivery', style: 'subsectionHeader' },
      { text: businessTerms.deliveryTerms, style: 'businessTermsText', margin: [0, 0, 0, 10] },

      { text: 'drawings', style: 'subsectionHeader' },
      { text: 'Mechanical Layout and Electrical schematic circuit diagrams will be prepared. Three (3) copies of the fitted drawing will be provided on the completion of equipment.', style: 'businessTermsText', margin: [0, 0, 0, 10] },

      { text: 'exclusions', style: 'subsectionHeader' },
      {
        ul: businessTerms.exclusions,
        style: 'exclusionsList',
        margin: [0, 0, 0, 10]
      },

      { text: 'warranty', style: 'subsectionHeader' },
      { text: businessTerms.warranty, style: 'businessTermsText', margin: [0, 0, 0, 10] },

      { text: 'scope', style: 'subsectionHeader' },
      { text: `Due to current instabilities in currency, oil and steel values, this quote is only valid for ${businessTerms.validityDays || 30} calendar days.`, style: 'businessTermsText', margin: [0, 0, 0, 10] },

      { text: 'General Terms and conditions', style: 'subsectionHeader' },
      { text: `All quotes and orders are subject to our standard terms and conditions. ${company.companyWebsite ? `These can be found on our website at ${company.companyWebsite}` : ''} Written copies available on request`, style: 'businessTermsText', margin: [0, 0, 0, 20] },

      // Closing
      { text: 'Warm regards,', style: 'closing', margin: [0, 10, 0, 5] },
      { text: enhancedQuote.cclContact || company.companyName, style: 'signature' }
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
      paymentTerms: {
        fontSize: 11
      },
      businessTermsText: {
        fontSize: 10,
        lineHeight: 1.4,
        alignment: 'justify'
      },
      exclusionsList: {
        fontSize: 10
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