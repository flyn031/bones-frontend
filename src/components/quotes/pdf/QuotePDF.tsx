import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

if (pdfMake.vfs === undefined) {
    pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts;
}

interface QuoteData {
  id: string;
  title: string;
  customer: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  date: string;
  validUntil: string;
  items: Array<{
    name: string;
    code: string;
    quantity: number;
    unitPrice: number;
    unit: string;
    total: number;
  }>;
  total: number;
  terms: string;
  notes: string;
}

export const generateQuotePDF = (quote: QuoteData) => {
  const documentDefinition = {
    content: [
      {
        columns: [
          {
            width: '*',
            text: 'BONES CRM',
            style: 'header'
          },
          {
            width: '*',
            text: [
              { text: 'QUOTE\n', style: 'documentTitle' },
              { text: `Quote #: ${quote.id}\n`, style: 'documentInfo' },
              { text: `Date: ${new Date(quote.date).toLocaleDateString()}\n`, style: 'documentInfo' },
              { text: `Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}`, style: 'documentInfo' }
            ],
            alignment: 'right'
          }
        ]
      },
      { text: '\n\n' },
      {
        columns: [
          {
            width: '*',
            text: [
              { text: 'To:\n', style: 'subheader' },
              { text: quote.customer + '\n', style: 'customerInfo' },
              { text: quote.contactPerson + '\n', style: 'customerInfo' },
              { text: quote.contactEmail + '\n', style: 'customerInfo' },
              { text: quote.contactPhone + '\n', style: 'customerInfo' }
            ]
          }
        ]
      },
      { text: '\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Item', style: 'tableHeader' },
              { text: 'Quantity', style: 'tableHeader' },
              { text: 'Unit', style: 'tableHeader' },
              { text: 'Unit Price', style: 'tableHeader' },
              { text: 'Total', style: 'tableHeader' }
            ],
            ...quote.items.map(item => [
              { 
                text: [
                  item.name + '\n',
                  { text: item.code, fontSize: 8, color: 'gray' }
                ]
              },
              item.quantity.toString(),
              item.unit,
              `$${item.unitPrice.toFixed(2)}`,
              `$${item.total.toFixed(2)}`
            ])
          ]
        }
      },
      { text: '\n' },
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            table: {
              body: [
                ['Subtotal:', `$${quote.total.toFixed(2)}`],
                ['Tax (20%):', `$${(quote.total * 0.2).toFixed(2)}`],
                ['Total:', `$${(quote.total * 1.2).toFixed(2)}`]
              ]
            },
            layout: 'noBorders'
          }
        ]
      },
      { text: '\n\n' },
      { text: 'Terms and Conditions', style: 'subheader' },
      { text: quote.terms },
      { text: '\n' },
      { text: 'Notes', style: 'subheader' },
      { text: quote.notes },
    ],
    styles: {
      header: {
        fontSize: 24,
        bold: true
      },
      documentTitle: {
        fontSize: 20,
        bold: true
      },
      documentInfo: {
        fontSize: 12
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      customerInfo: {
        fontSize: 12
      },
      tableHeader: {
        bold: true,
        fillColor: '#f3f4f6'
      }
    },
    defaultStyle: {
      fontSize: 10
    }
  };

  return pdfMake.createPdf(documentDefinition);
};