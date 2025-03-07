import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Initialize pdfMake fonts
if (pdfMake.vfs === undefined) {
    pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts;
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
}

// Company details - in a real app, this would be fetched from config or settings
const companyDetails = {
  name: "Bones CRM Ltd",
  address: "123 Business Park, London, SW1 1AB",
  phone: "020 1234 5678",
  email: "sales@bonescrm.co.uk",
  website: "www.bonescrm.co.uk",
  vatNumber: "GB123456789"
};

// Generate the PDF
export const generateQuotePDF = (quote: QuoteData) => {
  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Calculate subtotal, VAT and total
  const subtotal = quote.value;
  const vat = subtotal * 0.2;
  const total = subtotal + vat;

  // Create document definition for pdfMake
  const documentDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    info: {
      title: `Quote-${quote.id}`,
      author: companyDetails.name,
      subject: quote.title,
      keywords: 'quote, conveyor systems',
    },
    content: [
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: companyDetails.name, style: 'header' },
              { text: companyDetails.address, style: 'companyInfo' },
              { text: `Tel: ${companyDetails.phone}`, style: 'companyInfo' },
              { text: `Email: ${companyDetails.email}`, style: 'companyInfo' },
              { text: `Web: ${companyDetails.website}`, style: 'companyInfo' },
              { text: `VAT No: ${companyDetails.vatNumber}`, style: 'companyInfo' }
            ]
          },
          {
            width: '*',
            stack: [
              { text: 'QUOTATION', style: 'documentTitle', alignment: 'right' },
              { text: `Quote #: ${quote.id}`, style: 'documentInfo', alignment: 'right' },
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
              { text: 'Project:', style: 'subheader' },
              { text: quote.title, style: 'customerInfo' }
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
            ...quote.items.map(item => [
              { text: item.description, style: 'tableCell' },
              { text: item.quantity.toString(), style: 'tableCell', alignment: 'center' },
              { text: 'Unit', style: 'tableCell', alignment: 'center' },
              { text: `£${item.unitPrice.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, style: 'tableCell', alignment: 'right' },
              { text: `£${item.total.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, style: 'tableCell', alignment: 'right' }
            ])
          ]
        },
        layout: {
          hLineWidth: function(i, node) {
            return (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5;
          },
          vLineWidth: function(i, node) {
            return 0;
          },
          hLineColor: function(i, node) {
            return (i === 0 || i === 1) ? '#aaaaaa' : '#dddddd';
          },
          paddingTop: function(i) {
            return 8;
          },
          paddingBottom: function(i) {
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
                  { text: `£${subtotal.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, style: 'summaryValue', alignment: 'right' }
                ],
                [
                  { text: 'VAT (20%):', style: 'summaryLabel', alignment: 'right' },
                  { text: `£${vat.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, style: 'summaryValue', alignment: 'right' }
                ],
                [
                  { text: 'TOTAL:', style: 'summaryLabelBold', alignment: 'right' },
                  { text: `£${total.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, style: 'summaryValueBold', alignment: 'right' }
                ]
              ]
            },
            layout: {
              hLineWidth: function(i, node) {
                return (i === node.table.body.length - 1) ? 1 : 0;
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
          { text: `Payment terms: ${quote.terms}` },
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
      { text: 'Bones CRM Sales Team', margin: [0, 0, 0, 5] },
      { text: companyDetails.email }
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
      }
    },
    defaultStyle: {
      fontSize: 10,
      color: '#1f2937'
    },
    footer: function(currentPage, pageCount) {
      return {
        columns: [
          { 
            text: companyDetails.name + ' • ' + companyDetails.address + ' • VAT No: ' + companyDetails.vatNumber,
            alignment: 'center',
            fontSize: 8,
            color: '#9ca3af',
            margin: [40, 0, 40, 0]
          }
        ],
        margin: [40, 0]
      };
    }
  };

  // Create and return the PDF
  return pdfMake.createPdf(documentDefinition);
};