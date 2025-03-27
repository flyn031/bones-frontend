import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, Filter, Plus, FileText, ArrowRight, LinkIcon, Check, X, Copy } from "lucide-react";
import NewQuoteModal from './NewQuoteModal';
import CloneQuoteModal from './CloneQuoteModal';
import { generateQuotePDF } from './pdf/QuotePDF';
import { apiClient, quoteApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext'; // Add this import for user context

// Helper function to calculate total from line items
const calculateTotalFromItems = (items) => {
  if (!items || items.length === 0) return 0;
  
  return items.reduce((sum, item) => {
    const quantity = parseFloat(item.quantity || 1);
    const unitPrice = parseFloat(item.unitPrice || 0);
    return sum + (quantity * unitPrice);
  }, 0);
};

const statusColors = {
 DRAFT: "bg-gray-100 text-gray-800",
 PENDING: "bg-yellow-100 text-yellow-800",
 APPROVED: "bg-green-100 text-green-800",
 DECLINED: "bg-red-100 text-red-800",
 CONVERTED: "bg-blue-100 text-blue-800"
};

function Quotes() {
 const [quotes, setQuotes] = useState([]);
 const [searchTerm, setSearchTerm] = useState('');
 const [filterOpen, setFilterOpen] = useState(false);
 const [selectedStatus, setSelectedStatus] = useState('all');
 const [hideConverted, setHideConverted] = useState(true);
 const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = useState(false);
 const [quoteToEdit, setQuoteToEdit] = useState(null);
 const [customers, setCustomers] = useState([]);
 const [refreshKey, setRefreshKey] = useState(0);
 const [loading, setLoading] = useState(true);
 const { user, updateUser } = useAuth(); // Add user context to get company details and updateUser function
 
 // New state for clone functionality
 const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
 const [quoteToClone, setQuoteToClone] = useState(null);
 // Fetch quotes from the backend - made into a separate function for reusability
 const fetchQuotes = useCallback(async () => {
  try {
    setLoading(true);
    console.log('Attempting to fetch quotes from API...');
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:4000/api/quotes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Quotes API response:', response.data);
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      // Process the quotes to ensure they have all required fields
      const processedQuotes = response.data.map(quote => ({
        ...quote,
        // Ensure these fields exist for rendering
        value: Number(quote.value || quote.totalAmount || 0),
        customer: quote.customer?.name || quote.customerName || '',
        status: quote.status || 'DRAFT',
        date: quote.date || (quote.createdAt ? new Date(quote.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : (quote.updatedAt ? new Date(quote.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        // Ensure items and lineItems are always present and synchronized
        items: quote.items || quote.lineItems || [],
        lineItems: quote.lineItems || quote.items || []
      }));
      setQuotes(processedQuotes);
    } else {
      console.log('No quotes found in API');
      setQuotes([]);
    }
  } catch (error) {
    console.error('Error fetching quotes:', error);
    setQuotes([]);
  } finally {
    setLoading(false);
  }
}, []);

// Function to fetch customers
const fetchCustomers = useCallback(async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:4000/api/customers', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Raw customer API response:', response.data);
    
    // Handle different response formats
    let customersArray = [];
    
    if (Array.isArray(response.data)) {
      customersArray = response.data;
    } else if (response.data && typeof response.data === 'object') {
      if (response.data.data && Array.isArray(response.data.data)) {
        customersArray = response.data.data;
      } else if (response.data.customers && Array.isArray(response.data.customers)) {
        customersArray = response.data.customers;
      } else if (response.data.items && Array.isArray(response.data.items)) {
        customersArray = response.data.items;
      } else {
        // Try to extract customers from the object
        customersArray = Object.values(response.data)
          .filter(item => item && typeof item === 'object' && (item.id || item.name));
      }
    }
    
    console.log('Processed customers array:', customersArray);
    setCustomers(customersArray);
  } catch (error) {
    console.error('Error fetching customers:', error);
    setCustomers([]);
  }
}, []);

// Function to refresh user data from the server
const refreshUserData = useCallback(async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:4000/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Refreshed user profile:', response.data);
    if (response.data && updateUser) {
      updateUser(response.data);
    }
    return response.data;
  } catch (error) {
    console.error('Error refreshing user data:', error);
    return null;
  }
}, [updateUser]);

// Initial load - check which quotes are already converted and fetch customers
useEffect(() => {
  const checkConvertedQuotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Get all quoteRef values from orders
      const convertedQuoteRefs = response.data.map(order => order.quoteRef);
      
      // Mark quotes that have already been converted
      setQuotes(prevQuotes => prevQuotes.map(quote => {
        if (convertedQuoteRefs.includes(quote.id)) {
          return { 
            ...quote, 
            orderId: `order-${quote.id.replace('Q', '')}`, // Generate a placeholder order ID
            status: 'CONVERTED' 
          };
        }
        return quote;
      }));
    } catch (error) {
      console.error('Error checking converted quotes:', error);
    }
  };
  
  const loadInitialData = async () => {
    await Promise.all([fetchQuotes(), fetchCustomers()]);
    await checkConvertedQuotes();
  };
  
  loadInitialData();
}, [fetchQuotes, fetchCustomers, refreshKey]);

// Add effect to refresh on visibility change
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      setRefreshKey(prev => prev + 1);
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Cleanup
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, []);
// Filter quotes based on search term and status filter
const filteredQuotes = quotes.filter(quote => {
  // Hide quotes that have been converted to orders if the option is selected
  if (hideConverted && quote.orderId) return false;
  
  const titleMatch = quote.title?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false;
  const customerMatch = quote.customer?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false;
  const idMatch = quote.id?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false;
  
  return (
    (titleMatch || customerMatch || idMatch) &&
    (selectedStatus === 'all' || quote.status === selectedStatus)
  );
}).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

// Generate PDF for a quote WITH COMPANY DETAILS
const handleGeneratePDF = async (quoteId) => {
  // First, refresh user data to get the latest profile settings
  const freshUserData = await refreshUserData();
  const userToUse = freshUserData || user;
  
  // Debug the entire user profile structure
  console.log('FULL USER PROFILE:', JSON.stringify(userToUse, null, 2));
  console.log('Company details setting:', userToUse?.useCompanyDetailsOnQuotes);

  const quote = quotes.find(q => q.id === quoteId);
  if (quote) {
    try {
      // Debug the company logo in detail
      if (userToUse?.companyLogo) {
        console.log('Logo found in user profile!');
        console.log('Logo type:', typeof userToUse.companyLogo);
        console.log('Logo starts with:', userToUse.companyLogo.substring(0, 100));
        console.log('Logo length:', userToUse.companyLogo.length);
        
        // Just pass the logo directly without trying to process it
        const userProfile = {
          companyName: userToUse.companyName || '',
          companyAddress: userToUse.companyAddress || '',
          companyPhone: userToUse.companyPhone || '',
          companyEmail: userToUse.companyEmail || '',
          companyWebsite: userToUse.companyWebsite || '',
          companyVatNumber: userToUse.companyVatNumber || '',
          companyLogo: userToUse.companyLogo, // Pass the logo directly
          useCompanyDetailsOnQuotes: userToUse.useCompanyDetailsOnQuotes || false
        };
        
        console.log('Passing logo to PDF generator, length:', userProfile.companyLogo?.length || 0);
        
        // Generate PDF with the unmodified logo
        try {
          const pdfDoc = generateQuotePDF(quote, userProfile);
          pdfDoc.download(`Quote-${quote.id}.pdf`);
          console.log('PDF generation completed');
        } catch (pdfError) {
          console.error('Error in PDF generation:', pdfError);
          alert('Could not generate PDF with logo. Please check your company details.');
        }
      } else {
        console.log('No logo found in user profile');
        
        // Generate PDF without logo
        const userProfile = userToUse ? {
          companyName: userToUse.companyName || '',
          companyAddress: userToUse.companyAddress || '',
          companyPhone: userToUse.companyPhone || '',
          companyEmail: userToUse.companyEmail || '',
          companyWebsite: userToUse.companyWebsite || '',
          companyVatNumber: userToUse.companyVatNumber || '',
          companyLogo: null,
          useCompanyDetailsOnQuotes: userToUse.useCompanyDetailsOnQuotes || false
        } : undefined;
        
        try {
          const pdfDoc = generateQuotePDF(quote, userProfile);
          pdfDoc.download(`Quote-${quote.id}.pdf`);
          console.log('PDF generation completed (without logo)');
        } catch (pdfError) {
          console.error('Error in PDF generation (no logo):', pdfError);
          alert('Could not generate PDF. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Overall error in PDF process:', error);
      alert('Failed to process PDF. Please try again.');
    }
  }
};

// MODIFIED: Create or update a quote with API call
const handleSaveQuote = async (quoteData) => {
  try {
    const token = localStorage.getItem('token');
    
    if (quoteToEdit) {
      // Update existing quote via API
      console.log('Updating quote via API:', quoteData);
      
      // Process items to prevent foreign key violations
      const processedItems = (quoteData.items || []).map(item => {
        // Strip materialId to prevent foreign key constraint errors
        // Just keep the necessary fields for line items
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        };
      });
      
      // Ensure items is properly formatted for submission
      const updatedData = {
        ...quoteData,
        // Use processed items without materialId
        items: processedItems
      };
      const response = await axios.put(
        `http://localhost:4000/api/quotes/${quoteToEdit.id}`, 
        updatedData,
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      console.log('Quote update response:', response.data);
      
      // Update local state with the response from the server
      try {
        setQuotes(prev => prev.map(q => 
          q.id === quoteToEdit.id ? {
            ...response.data,
            // Ensure these fields are present regardless of what the server returns
            status: response.data.status || quoteToEdit.status || 'DRAFT',
            customer: response.data.customer?.name || response.data.customerName || quoteToEdit.customer || '',
            value: Number(response.data.value || response.data.totalAmount || 0),
            items: response.data.items || response.data.lineItems || [],
            lineItems: response.data.lineItems || response.data.items || [],
            orderId: quoteToEdit.orderId
          } : q
        ));
      } catch (renderError) {
        console.error('Error updating UI after quote save:', renderError);
        // Force a refresh if UI update fails
        setTimeout(() => setRefreshKey(prev => prev + 1), 500);
      } finally {
        // Always close modal and reset state
        setQuoteToEdit(null);
        setIsNewQuoteModalOpen(false);
      }
    } else {
      // Create new quote via API
      console.log('Creating new quote via API:', quoteData);
      
      // Process items for new quotes as well
      const processedItems = (quoteData.items || []).map(item => {
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        };
      });
      
      const response = await axios.post(
        'http://localhost:4000/api/quotes', 
        {
          ...quoteData,
          items: processedItems,
          customerId: quoteData.customerId, // Make sure customerId is included
          status: 'DRAFT'
        },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      console.log('Quote creation response:', response.data);
      
      try {
        // Add the new quote to state with consistent field naming
        setQuotes(prev => [...prev, {
          ...response.data,
          status: response.data.status || 'DRAFT',
          customer: response.data.customer?.name || response.data.customerName || '',
          value: Number(response.data.value || response.data.totalAmount || 0),
          items: response.data.items || response.data.lineItems || [],
          lineItems: response.data.lineItems || response.data.items || []
        }]);
      } catch (renderError) {
        console.error('Error updating UI after quote creation:', renderError);
      } finally {
        setQuoteToEdit(null);
        setIsNewQuoteModalOpen(false);
        // Refresh quotes after a short delay
        setTimeout(() => setRefreshKey(prev => prev + 1), 500);
      }
    }
  } catch (error) {
    console.error('Error saving quote:', error);
    console.error('Error details:', error.response?.data);
    alert(`Failed to save quote: ${error.response?.data?.message || error.message}`);
    
    // Keep the modal open when there's an error
    // Don't reset quoteToEdit state so the user can try again
  }
};

// New function to handle cloning a quote
const handleCloneQuote = (quoteId) => {
  const quote = quotes.find(q => q.id === quoteId);
  if (quote) {
    setQuoteToClone(quote);
    setIsCloneModalOpen(true);
  }
};

// Handle save for cloned quote
const handleSaveClonedQuote = (clonedQuoteData) => {
  // Create new quote based on the cloned data
  const newQuote = {
    ...clonedQuoteData,
    id: `Q${new Date().getFullYear()}-${String(quotes.length + 1).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0], // Set today as creation date
    status: 'DRAFT', // Start as draft
    orderId: null // Not converted yet
  };
  
  // Add to quotes array
  setQuotes(prev => [...prev, newQuote]);
  setIsCloneModalOpen(false);
  setQuoteToClone(null);
  
  // Optionally show a success message
  alert(`Quote cloned successfully: ${newQuote.id}`);
};
// Handle converting a quote to an order
const handleConvertToOrder = async (quoteId) => {
  const quote = quotes.find(q => q.id === quoteId);
  if (!quote) return;
  
  try {
    // Create new order ID based on the quote ID
    const orderId = quote.id.replace('Q', 'ORD');
    
    // Always use THIRTY_DAYS as payment terms since that's the only one that works
    const paymentTermsValue = 'THIRTY_DAYS';
    
    // Create order object
    const newOrder = {
      id: orderId,
      projectTitle: quote.title || 'Untitled Project',
      quoteRef: quote.id,
      orderType: 'CUSTOMER_LINKED',
      status: 'APPROVED',
      customerName: quote.customer || 'Unknown Customer',
      customerId: quote.customerId || '',
      contactPerson: quote.contactPerson || 'Unknown Contact',
      contactPhone: quote.contactPhone || 'No Phone',
      contactEmail: quote.contactEmail || 'no-email@example.com',
      projectValue: quote.value || 0,
      marginPercent: 20,
      leadTimeWeeks: 2,
      items: quote.items && Array.isArray(quote.items) ? quote.items.map(item => ({
        materialId: item.id,
        description: item.description || 'No Description',
        quantity: item.quantity || 1,
        price: item.unitPrice || 0
      })) : [],
      paymentTerms: paymentTermsValue,
      currency: 'GBP',
      vatRate: 20,
      subTotal: quote.value || 0,
      totalTax: (quote.value || 0) * 0.2,
      totalAmount: (quote.value || 0) * 1.2,
      profitMargin: (quote.value || 0) * 0.2,
      notes: quote.notes ? quote.notes.substring(0, 500) : '' // Trim notes to avoid length issues
    };
    
    // Log the complete order object for debugging
    console.log('Attempting to create order with data:', newOrder);
    
    // Actually send the order to the backend
    const token = localStorage.getItem('token');
    const response = await axios.post('http://localhost:4000/api/orders', newOrder, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Get the created order ID from the response
    const createdOrderId = response.data.id || orderId;
    
    // Update the quote status to "CONVERTED"
    const updatedQuote = {...quote, status: 'CONVERTED', orderId: createdOrderId};
    
    // Update local state
    setQuotes(prev => prev.map(q => 
      q.id === quoteId ? updatedQuote : q
    ));
    
    // Show success message
    alert(`Quote ${quoteId} has been converted to Order ${createdOrderId}`);
    
  } catch (error) {
    console.error('Error converting quote to order:', error);
    
    // Log the detailed error response if available
    if (error.response) {
      console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    }
    
    // Check if it's a unique constraint error (already converted)
    if (error.response?.data?.code === 'P2002' && 
        error.response?.data?.meta?.target?.includes('quoteRef')) {
      // Mark this quote as converted in our local state
      setQuotes(prev => prev.map(q => 
        q.id === quoteId ? {...q, status: 'CONVERTED', orderId: `order-${quoteId.replace('Q', '')}`} : q
      ));
      
      alert('This quote has already been converted to an order.');
    } else {
      alert('Failed to convert quote to order: ' + 
            (error.response?.data?.message || 
             error.response?.data?.error || 
             JSON.stringify(error.response?.data) || 
             error.message));
    }
  }
};

// Edit a quote
const handleEditQuote = (quoteId) => {
  const quote = quotes.find(q => q.id === quoteId);
  if (quote) {
    setQuoteToEdit(quote);
    setIsNewQuoteModalOpen(true);
  }
};

// Update quote status
const handleUpdateStatus = (quoteId, newStatus) => {
  setQuotes(prev => prev.map(q => 
    q.id === quoteId ? {...q, status: newStatus} : q
  ));
};

// Debug function to see what customers are available
const debugCustomers = () => {
  console.log("Available customers:", customers);
};

// Function to force refresh
const handleRefresh = () => {
  setRefreshKey(prev => prev + 1);
};

return (
  <div className="p-8 max-w-7xl mx-auto">
    {/* Header */}
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-3xl font-bold">Quotes Management</h2>
      <div className="flex space-x-2">
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
        >
          Refresh
        </button>
        <button
          onClick={() => {
            setQuoteToEdit(null);
            setIsNewQuoteModalOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>New Quote</span>
        </button>
      </div>
    </div>

    {/* Controls */}
    <div className="flex justify-between items-center mb-6">
      <div className="flex space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search quotes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex space-x-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="all">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="DECLINED">Declined</option>
            <option value="CONVERTED">Converted</option>
          </select>

          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="hideConverted"
              checked={hideConverted}
              onChange={() => setHideConverted(!hideConverted)}
              className="rounded"
            />
            <label htmlFor="hideConverted" className="text-sm text-gray-700">
              Hide converted quotes
            </label>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setFilterOpen(!filterOpen)}
        className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
      >
        <Filter className="h-4 w-4" />
        <span>Advanced Filter</span>
      </button>
    </div>

    {/* Quotes List */}
    <div className="space-y-4">
      {loading ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Loading quotes...
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No quotes found. Create your first quote with the "New Quote" button above.
        </div>
      ) : (
        filteredQuotes.map((quote) => (
          <div key={quote.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">{quote.title || 'Untitled Quote'}</h3>
                    {quote.jobId && (
                      <div className="flex items-center text-sm text-blue-600">
                        <LinkIcon className="h-4 w-4 mr-1" />
                        Job: {quote.jobId}
                      </div>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {quote.id} - {quote.customer || 'Unknown Customer'}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Always show converted status for quotes with orderId */}
                  {quote.orderId ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      CONVERTED
                    </span>
                  ) : (
                    <>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[quote.status] || 'bg-gray-100 text-gray-800'}`}>
                        {quote.status || 'DRAFT'}
                      </span>
                      {quote.status === 'PENDING' && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleUpdateStatus(quote.id, 'APPROVED')}
                            className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(quote.id, 'DECLINED')}
                            className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                            title="Decline"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Value</div>
                  <div className="mt-1 text-sm text-gray-900">
                    £{((quote.totalAmount || calculateTotalFromItems(quote.lineItems || quote.items || [])) || 0).toFixed(2)}
                  </div>
                </div>
                <div>
                <div className="text-sm font-medium text-gray-500">Date Created</div>
                <div className="mt-1 text-sm text-gray-900">
                 {quote.date && typeof quote.date === 'string' 
                ? new Date(quote.date).toLocaleDateString('en-GB')
                : 'N/A'}
                </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Valid Until</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {quote.validUntil && typeof quote.validUntil === 'string'
                      ? new Date(quote.validUntil).toLocaleDateString('en-GB')
                      : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Contact: {quote.contactPerson || 'N/A'} ({quote.contactEmail || 'N/A'})
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditQuote(quote.id)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm border rounded hover:bg-gray-50"
                  >
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleCloneQuote(quote.id)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    title="Clone this quote"
                  >
                    <Copy
                    className="h-4 w-4" />
                    <span>Clone</span>
                  </button>
                  <button
                    onClick={() => handleGeneratePDF(quote.id)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm border rounded hover:bg-gray-50"
                  >
                    <FileText className="h-4 w-4" />
                    <span>PDF</span>
                  </button>
                  {quote.status === 'APPROVED' && !quote.orderId && (
                    <button
                      onClick={() => handleConvertToOrder(quote.id)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>Convert to Order</span>
                    </button>
                  )}
                  {quote.orderId && (
                    <div className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                      <LinkIcon className="h-4 w-4" />
                      <span>Converted to Order</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>

    {/* New/Edit Quote Modal */}
    {isNewQuoteModalOpen && (
      <NewQuoteModal 
        isOpen={isNewQuoteModalOpen}
        onClose={() => {
          setIsNewQuoteModalOpen(false);
          setQuoteToEdit(null);
        }}
        onSubmit={handleSaveQuote}
        editQuote={quoteToEdit}
        customers={customers || []}
      />
    )}
      {/* Clone Quote Modal */}
    {isCloneModalOpen && quoteToClone && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Clone Quote</h3>
            <button onClick={() => setIsCloneModalOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            // Create a clone of the quote with new customer and title
            const customerId = e.target.customer.value;
            const customer = customers.find(c => c.id === customerId);
            
            const clonedQuote = {
              ...quoteToClone,
              customerId: customerId,
              customer: customer ? customer.name : 'Unknown Customer',
              title: e.target.title.value || `${quoteToClone.title} (Copy)`,
              // We'll set a new ID, date, etc. in handleSaveClonedQuote
            };
            
            handleSaveClonedQuote(clonedQuote);
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                name="title"
                type="text"
                defaultValue={`${quoteToClone.title || 'Untitled Quote'} (Copy)`}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer
              </label>
              <select
                name="customer"
                defaultValue={quoteToClone.customerId}
                className="w-full p-2 border rounded-lg"
                required
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name || 'Unnamed Customer'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setIsCloneModalOpen(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clone Quote
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
}

export default Quotes;