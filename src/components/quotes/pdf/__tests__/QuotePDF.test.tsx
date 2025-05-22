import { generateQuotePDF } from '../QuotePDF';

// Mock pdfMake since it's used in QuotePDF
jest.mock('pdfmake/build/pdfmake', () => ({
  createPdf: jest.fn().mockReturnValue({
    download: jest.fn()
  })
}));
jest.mock('pdfmake/build/vfs_fonts', () => ({}));

describe('QuotePDF', () => {
  test('generates PDF with correct data', () => {
    const mockQuote = {
      id: 'Q2025-001',
      title: 'Test Project',
      customer: 'Test Customer',
      date: '2025-03-27',
      validUntil: '2025-04-27',
      items: [
        {
          id: 'item1',
          description: 'Test Item',
          quantity: 2,
          unitPrice: 100,
          total: 200
        }
      ],
      value: 200,
      terms: 'Net 30'
    };
    
    const mockUserProfile = {
      companyName: 'Bones Ltd',
      companyAddress: '123 Main St',
      companyPhone: '555-1234',
      companyEmail: 'info@example.com',
      companyWebsite: 'example.com',
      companyVatNumber: 'GB12345',
      companyLogo: 'data:image/png;base64,test',
      useCompanyDetailsOnQuotes: true
    };
    
    // This will call the function but we're primarily testing that it doesn't throw errors
    expect(() => generateQuotePDF(mockQuote, mockUserProfile)).not.toThrow();
    
    // Further tests could verify the correct structure was passed to pdfMake
    const pdfMake = require('pdfmake/build/pdfmake');
    expect(pdfMake.createPdf).toHaveBeenCalled();
  });
  
  test('handles missing company details', () => {
    const mockQuote = {
      id: 'Q2025-001',
      title: 'Test Project',
      customer: 'Test Customer',
      date: '2025-03-27',
      validUntil: '2025-04-27',
      items: [],
      value: 0,
      terms: 'Net 30'
    };
    
    expect(() => generateQuotePDF(mockQuote)).not.toThrow();
  });
});