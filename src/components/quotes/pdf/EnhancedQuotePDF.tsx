// src/components/quotes/pdf/EnhancedQuotePDF.tsx - Professional quote PDF with quote-specific terms

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { EnhancedQuoteData, QuoteCompanyProfile, enhanceQuoteData } from '../../../types/enhancedQuote';
import { QuoteData } from '../../../types/quote';

// Initialize pdfMake fonts
if (pdfMake.vfs === undefined) {
    pdfMake.vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : pdfFonts;
}

// Simplified company profile - REMOVED profile-level terms
interface UserProfile {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyVatNumber?: string;
  companyLogo?: string;
  useCompanyDetailsOnQuotes: boolean;
  // REMOVED: All the standard terms fields - these should be quote-specific now
}

// Helper function to parse quote-specific terms
const parseQuoteTerms = (termsAndConditions?: string) => {
  if (!termsAndConditions) {
    return {
      hasCustomTerms: false,
      sections: {}
    };
  }

  // Try to parse structured terms or use as general terms
  const sections: any = {};
  const lines = termsAndConditions.split('\n').filter(line => line.trim());
  
  // If it looks like structured content, try to parse it
  if (termsAndConditions.includes('•') || termsAndConditions.includes('-')) {
    // Parse bullet points as exclusions or terms
    const bullets = termsAndConditions.match(/[•-]\s*(.+)/g);
    if (bullets) {
      sections.exclusions = bullets.map(bullet => bullet.replace(/[•-]\s*/, '').trim());
    }
  }
  
  // For now, use the entire content as general terms
  sections.generalTerms = termsAndConditions;
  
  return {
    hasCustomTerms: true,
    sections
  };
};

// Generate professional quote PDF with quote-specific terms
export const generateEnhancedQuotePDF = (
  quote: QuoteData | EnhancedQuoteData, 
  userProfile?: UserProfile,
  companyProfile?: Partial<QuoteCompanyProfile>
) => {
  console.log('=== PDF GENERATOR DEBUG ===');
  console.log('PDF Generator received quote:', quote);
  console.log('PDF Generator quote.termsAndConditions:', (quote as QuoteData).termsAndConditions);
  console.log('PDF Generator received userProfile:', userProfile);
  
  // NEW: Extract termsAndConditions BEFORE conversion to avoid losing it
  const originalTermsAndConditions = (quote as QuoteData).termsAndConditions;
  console.log('PDF Generator originalTermsAndConditions:', originalTermsAndConditions);
  
  // Convert to enhanced format if needed
  const enhancedQuote: EnhancedQuoteData = 'businessTerms' in quote 
    ? quote as EnhancedQuoteData 
    : enhanceQuoteData(quote as QuoteData);

  // NEW: Parse quote-specific terms using the original value
  const quoteTerms = parseQuoteTerms(originalTermsAndConditions);
  console.log('PDF Generator parsed quote terms:', quoteTerms);

  // Use company details from profile
  const useCompanyDetails = userProfile?.useCompanyDetailsOnQuotes || false;
  
  // Build company profile from user profile + overrides - REMOVED custom terms
  const company: QuoteCompanyProfile = {
    companyName: userProfile?.companyName || 'Your Company Name',
    companyAddress: userProfile?.companyAddress || '',
    companyPhone: userProfile?.companyPhone || '',
    companyEmail: userProfile?.companyEmail || '',
    companyWebsite: userProfile?.companyWebsite || '',
    companyVatNumber: userProfile?.companyVatNumber || '',
    companyLogo: userProfile?.companyLogo || '',
    
    // REMOVED: All standard terms - these are now quote-specific
    standardExclusions: [], // Will be overridden by quote terms
    standardWarranty: '', // Will be overridden by quote terms
    standardDeliveryTerms: '', // Will be overridden by quote terms
    defaultLeadTimeWeeks: 4, // Keep as basic default
    
    // Override with any provided company profile settings
    ...companyProfile
  };

  console.log('PDF Generator final company profile:', company);

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

  // NEW: Build terms and conditions content
  let termsContent = [];

  if (quoteTerms.hasCustomTerms) {
    // Use the quote-specific terms
    console.log('Using quote-specific terms');
    
    if (quoteTerms.sections.generalTerms) {
      termsContent.push({
        text: 'Terms & Conditions',
        style: 'sectionHeader',
        pageBreak: 'before',
        margin: [0, 0, 0, 15]
      });
      
      // Split by paragraphs and format nicely
      const paragraphs = quoteTerms.sections.generalTerms.split('\n\n').filter((p: string) => p.trim());
      
      paragraphs.forEach((paragraph: string, index: number) => {
        const trimmedParagraph = paragraph.trim();
        
        // Check if it looks like a heading (short line, ends with colon, etc.)
        if (trimmedParagraph.length < 50 && (trimmedParagraph.endsWith(':') || trimmedParagraph.toLowerCase().includes('terms'))) {
          termsContent.push({
            text: trimmedParagraph.replace(':', ''),
            style: 'subsectionHeader',
            margin: [0, index > 0 ? 10 : 0, 0, 5]
          });
        } else if (trimmedParagraph.includes('•') || trimmedParagraph.includes('-')) {
          // Handle bullet points
          const bullets = trimmedParagraph.split(/[•-]/).filter(item => item.trim()).map(item => item.trim());
          if (bullets.length > 1) {
            termsContent.push({
              ul: bullets,
              style: 'customTermsList',
              margin: [0, 0, 0, 10]
            });
          } else {
            termsContent.push({
              text: trimmedParagraph,
              style: 'customTermsText',
              margin: [0, 0, 0, 10]
            });
          }
        } else {
          // Regular paragraph
          termsContent.push({
            text: trimmedParagraph,
            style: 'customTermsText',
            margin: [0, 0, 0, 10]
          });
        }
      });
    }
  } else {
    // Fallback to minimal default terms if no quote-specific terms
    console.log('No quote-specific terms, using minimal defaults');
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
        text: 'Payment terms: friday night terms',
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
      },
      {
        text: 'General',
        style: 'subsectionHeader'
      },
      {
        text: `${originalTermsAndConditions || 'friday night terms - all work subject to these custom terms and conditions.'}`,
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

      // Payment Terms (if not included in custom terms)
      ...(enhancedQuote.terms && !quoteTerms.hasCustomTerms ? [
        {
          text: 'Payment Terms:',
          style: 'sectionHeader',
          margin: [0, 0, 0, 5]
        },
        {
          text: enhancedQuote.terms,
          style: 'paymentTerms',
          margin: [0, 0, 0, 20]
        }
      ] : []),

      // NEW: Quote-specific terms content
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
      // NEW: Styles for custom terms
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