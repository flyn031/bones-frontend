import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Initialize pdfMake fonts - Fixed type assertion
if (pdfMake.vfs === undefined) {
    pdfMake.vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : pdfFonts;
}

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuoteData {
  id: string;
  title: string;
  customer: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  date: string;
  validUntil: string;
  items: QuoteItem[];
  value: number;
  terms: string;
  notes?: string;
  customerId?: string;
  // New fields for quote references
  quoteNumber?: string;
  customerReference?: string;
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

// Generate the PDF
export const generateQuotePDF = (quote: QuoteData, userProfile?: UserProfile) => {
  // Determine which company details to use
  const useCompanyDetails = userProfile?.useCompanyDetailsOnQuotes || false;
  
  // Company details - only use if enabled
  const companyDetails = useCompanyDetails && userProfile ? {
    name: userProfile.companyName || '',
    address: userProfile.companyAddress || '',
    phone: userProfile.companyPhone || '',
    email: userProfile.companyEmail || '',
    website: userProfile.companyWebsite || '',
    vatNumber: userProfile.companyVatNumber || '',
    logo: userProfile.companyLogo || ''
  } : {
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    vatNumber: '',
    logo: ''
  };

  // Format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch (e) {
      return 'N/A';
    }
  };

  // Calculate subtotal from line items
  const subtotal = quote.items.reduce((sum, item) => {
    const quantity = parseFloat(item.quantity?.toString() || '0');
    const unitPrice = parseFloat(item.unitPrice?.toString() || '0');
    const itemTotal = item.total || (quantity * unitPrice);
    return sum + itemTotal;
  }, 0);
  const vat = subtotal * 0.2;
  const total = subtotal + vat;

  // Create header with just the logo (or company name if no logo)
  let headerLogo = null;
  let headerText = null;
  
  if (useCompanyDetails) {
    try {
      if (companyDetails.logo) {
        console.log('PDF: Attempting to include logo');
        
        // Make sure the logo is a valid data URL for images
        if (typeof companyDetails.logo === 'string' && 
            (companyDetails.logo.startsWith('data:image/jpeg;base64,') || 
             companyDetails.logo.startsWith('data:image/png;base64,') || 
             companyDetails.logo.startsWith('data:image/gif;base64,') ||
             companyDetails.logo.startsWith('data:image/'))) {
          
          console.log('PDF: Logo appears to be a valid data URL');
          
          // Just the logo in the header
          headerLogo = {
            image: companyDetails.logo,
            fit: [120, 60],
            alignment: 'left'
          };
        } else {
          console.log('PDF: Logo is present but not in a valid format for pdfMake');
          // Fallback to text if logo format is invalid
          headerText = { text: companyDetails.name, style: 'header' };
        }
      } else {
        // Without logo, just use company name text
        console.log('PDF: No logo provided, using text-only header');
        headerText = { text: companyDetails.name, style: 'header' };
      }
    } catch (logoError) {
      console.error('PDF: Error including logo in PDF:', logoError);
      // Fallback to text-only version if any error occurs with the logo
      headerText = { text: companyDetails.name, style: 'header' };
    }
  }

  // Create document definition for pdfMake
  const documentDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    info: {
      title: `Quote-${quote.quoteNumber || quote.id}`,
      author: useCompanyDetails ? companyDetails.name : 'Quote',
      subject: quote.title,
      keywords: 'quote, conveyor systems',
    },
    content: [
      // Header: Logo on left, quote details on right
      {
        columns: [
          {
            width: '*',
            stack: [
              headerLogo || headerText || { text: '' }
            ]
          },
          {
            width: '*',
            stack: [
              { text: 'QUOTATION', style: 'documentTitle', alignment: 'right' },
              { text: `Quote #: ${quote.quoteNumber || quote.id}`, style: 'documentInfo', alignment: 'right' },
              quote.customerReference ? { text: `Customer Ref: ${quote.customerReference}`, style: 'documentInfo', alignment: 'right' } : {},
              { text: `Date: ${formatDate(quote.date)}`, style: 'documentInfo', alignment: 'right' },
              { text: `Valid Until: ${formatDate(quote.validUntil)}`, style: 'documentInfo', alignment: 'right' }
            ]
          }
        ]
      },
      { text: '\n\n' },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'To:', style: 'subheader' },
              { text: quote.customer, style: 'customerInfo' },
              quote.contactPerson ? { text: quote.contactPerson, style: 'customerInfo' } : {},
              quote.contactEmail ? { text: quote.contactEmail, style: 'customerInfo' } : {},
              quote.contactPhone ? { text: quote.contactPhone, style: 'customerInfo' } : {}
            ]
          },
          {
            width: '*',
            stack: [
              { text: 'Project:', style: 'subheader', alignment: 'right' },
              { text: quote.title, style: 'customerInfo', alignment: 'right' }
            ]
          }
        ]
      },
      { text: '\n' },
      { text: 'Dear Customer,', margin: [0, 10, 0, 10] },
      { text: 'Thank you for your interest in our products and services. We are pleased to submit the following quotation for your consideration:', margin: [0, 0, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Item Description', style: 'tableHeader' },
              { text: 'Quantity', style: 'tableHeader', alignment: 'center' },
              { text: 'Unit', style: 'tableHeader', alignment: 'center' },
              { text: 'Unit Price', style: 'tableHeader', alignment: 'right' },
              { text: 'Total', style: 'tableHeader', alignment: 'right' }
            ],
            ...quote.items.map((_item, i) => [
              { text: _item.description || 'No description', style: 'tableCell' },
              { text: (_item.quantity || 0).toString(), style: 'tableCell', alignment: 'center' },
              { text: 'Unit', style: 'tableCell', alignment: 'center' },
              { text: `£${(_item.unitPrice || 0).toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, style: 'tableCell', alignment: 'right' },
              { text: `£${((_item.total !== undefined ? _item.total : _item.quantity * _item.unitPrice) || 0).toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, style: 'tableCell', alignment: 'right' }
            ])
          ]
        },
        layout: {
          hLineWidth: function(_i: any, _node: any) {
            return (_i === 0 || _i === 1 || _i === _node.table.body.length) ? 1 : 0.5;
          },
          vLineWidth: function(_i: any, _node: any) {
            return 0;
          },
          hLineColor: function(_i: any, _node: any) {
            return (_i === 0 || _i === 1) ? '#aaaaaa' : '#dddddd';
          },
          paddingTop: function(_i: any) {
            return 8;
          },
          paddingBottom: function(_i: any) {
            return 8;
          }
        }
      },
      { text: '\n' },
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            table: {
              widths: ['*', 'auto'],
              body: [
                [
                  { text: 'Subtotal:', style: 'summaryLabel', alignment: 'right' },
                  { text: `£${(subtotal || 0).toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, style: 'summaryValue', alignment: 'right' }
                ],
                [
                  { text: 'VAT (20%):', style: 'summaryLabel', alignment: 'right' },
                  { text: `£${(vat || 0).toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, style: 'summaryValue', alignment: 'right' }
                ],
                [
                  { text: 'TOTAL:', style: 'summaryLabelBold', alignment: 'right' },
                  { text: `£${(total || 0).toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, style: 'summaryValueBold', alignment: 'right' }
                ]
              ]
            },
            layout: {
              hLineWidth: function(_i: any, _node: any) {
                return (_i === _node.table.body.length - 1) ? 1 : 0;
              },
              vLineWidth: function() {
                return 0;
              }
            }
          }
        ]
      },
      { text: '\n\n' },
      { text: 'Terms and Conditions', style: 'subheader' },
      {
        ul: [
          { text: `Payment terms: ${quote.terms || 'Standard terms apply'}` },
          { text: 'Prices are valid for the period indicated above' },
          { text: 'Delivery: Ex works unless otherwise stated' }
        ],
        style: 'list'
      },
      { text: '\n' },
      quote.notes ? { text: 'Notes', style: 'subheader' } : {},
      quote.notes ? { text: quote.notes, style: 'notes' } : {},
      { text: '\n\n' },
      { text: 'If you have any questions or require additional information, please do not hesitate to contact us.', margin: [0, 0, 0, 10] },
      { text: 'We look forward to working with you.', margin: [0, 0, 0, 10] },
      { text: '\n' },
      { text: 'Yours sincerely,', margin: [0, 0, 0, 5] },
      useCompanyDetails ? { text: `${companyDetails.name} Sales Team`, margin: [0, 0, 0, 5] } : {},
      useCompanyDetails ? { text: companyDetails.email } : {}
    ],
    styles: {
      header: {
        fontSize: 22,
        bold: true,
        color: '#2563eb'
      },
      companyInfo: {
        fontSize: 9,
        color: '#4b5563',
        lineHeight: 1.2
      },
      documentTitle: {
        fontSize: 24,
        bold: true,
        color: '#2563eb',
        margin: [0, 0, 0, 5]
      },
      documentInfo: {
        fontSize: 11,
        color: '#4b5563',
        lineHeight: 1.4
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      customerInfo: {
        fontSize: 11,
        lineHeight: 1.4
      },
      tableHeader: {
        fontSize: 11,
        bold: true,
        color: '#ffffff',
        fillColor: '#2563eb',
        margin: [0, 5, 0, 5]
      },
      tableCell: {
        fontSize: 10,
        margin: [0, 5, 0, 5]
      },
      summaryLabel: {
        fontSize: 11,
        margin: [0, 5, 10, 5]
      },
      summaryValue: {
        fontSize: 11,
        margin: [0, 5, 0, 5]
      },
      summaryLabelBold: {
        fontSize: 12,
        bold: true,
        margin: [0, 5, 10, 5]
      },
      summaryValueBold: {
        fontSize: 12,
        bold: true,
        margin: [0, 5, 0, 5]
      },
      list: {
        fontSize: 10,
        lineHeight: 1.3
      },
      notes: {
        fontSize: 10,
        italics: true,
        lineHeight: 1.3
      },
      footerText: {
        fontSize: 8,
        color: '#9ca3af'
      }
    },
    defaultStyle: {
      fontSize: 10,
      color: '#1f2937'
    },
    footer: function(currentPage: any, pageCount: any) {
      if (!useCompanyDetails) return null;
      
      // Enhanced footer with company details
      return {
        columns: [
          {
            width: '*',
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    border: [false, true, false, false],
                    stack: [
                      {
                        columns: [
                          {
                            width: '*',
                            stack: [
                              { text: companyDetails.name, style: 'footerText', bold: true },
                              { text: companyDetails.address, style: 'footerText' },
                              { text: `Tel: ${companyDetails.phone}`, style: 'footerText' }
                            ]
                          },
                          {
                            width: '*',
                            stack: [
                              { text: `Email: ${companyDetails.email}`, style: 'footerText' },
                              { text: `Web: ${companyDetails.website}`, style: 'footerText' },
                              { text: `VAT No: ${companyDetails.vatNumber}`, style: 'footerText' }
                            ]
                          },
                          {
                            width: 'auto',
                            stack: [
                              { text: `Page ${currentPage} of ${pageCount}`, style: 'footerText', alignment: 'right' }
                            ]
                          }
                        ],
                        margin: [0, 5, 0, 0]
                      }
                    ]
                  }
                ]
              ]
            },
            layout: {
              hLineWidth: function(_i: any, _node: any) {
                return (_i === 0) ? 0.5 : 0;
              },
              vLineWidth: function() {
                return 0;
              },
              hLineColor: function() {
                return '#dddddd';
              }
            }
          }
        ],
        margin: [40, 20, 40, 0]
      };
    }
  };

  // Create and return the PDF - Fixed type assertion
  try {
    return pdfMake.createPdf(documentDefinition as any);
  } catch (error) {
    console.error("PDF: Error creating PDF document:", error);
    // Try to create a simpler version without the logo if there's an error
    if (useCompanyDetails && companyDetails.logo) {
      console.log("PDF: Attempting to create PDF without logo as fallback");
      // Create a new version without the logo - Fixed with proper type checking
      const content = documentDefinition.content as any[];
      if (content && content[0] && content[0].columns && content[0].columns[0] && content[0].columns[0].stack) {
        content[0].columns[0].stack = [
          { text: companyDetails.name, style: 'header' }
        ];
      }
      return pdfMake.createPdf(documentDefinition as any);
    }
    throw error; // Re-throw the error if we can't fix it
  }
};