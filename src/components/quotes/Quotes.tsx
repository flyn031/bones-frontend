import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, FileText, ArrowRight, Link as LinkIcon, Copy, Calendar, History as HistoryIcon, RefreshCw, X, Edit3, MoreVertical } from "lucide-react"; 
import NewQuoteModal from './NewQuoteModal';
// Removed unused import: generateQuotePDF
import { generateProfessionalQuotePDF } from './pdf/EnhancedQuotePDF'; // NEW: Enhanced PDF import
import { apiClient } from '../../utils/api';
import { getCustomersWithContacts, CustomerWithContacts } from '../../utils/customerApi';
import { Customer, QuoteData, QuoteVersion, QuoteStatus } from '../../types/quote';

// --- Interfaces ---

interface PaginatedCustomersResponse {
  customers: Customer[];
  currentPage: number;
  totalPages: number;
  totalCustomers: number;
}

// This interface matches the payload definition expected by handleModalSaveSuccess
interface MockSavedQuotePayload { 
    id?: string;
    title: string;
    customerId?: string; // Fixed: Made optional to match QuoteData
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    jobId?: string;
    validityDays: number;
    terms: string;
    notes?: string;
    customerReference?: string;
    status: QuoteStatus; // Fixed: Use QuoteStatus string union
    description?: string | null;
    quoteNumber?: string | null;
    quoteReference?: string | null;
    versionNumber?: number | null;
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        materialId: string | null;
        id?: string;
        total?: number; // Added to match QuoteItem
    }>;
    totalAmount: number;
    parentQuoteId?: string | null;
    changeReason?: string;
    validUntil?: string | null; 
}

// Define the structure for the mock order saved to localStorage
interface MockOrderData {
  id: string;
  projectTitle: string;
  quoteRef?: string;
  customerName: string;
  customerId: string;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  projectValue: number;
  marginPercent?: number;
  leadTimeWeeks?: number;
  status: string;
  createdAt: string;
  priority?: string;
  progress?: number;
  value?: number;
  deadline?: string;
  customer?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    materialId: string | null;
  }>;
  notes?: string | null;
  currency?: string;
  vatRate?: number;
  paymentTerms?: string;
}

// Fixed: Use exact backend enum values - removed CONVERTED_TO_ORDER, REJECTED, CANCELLED
const QUOTE_STATUSES: QuoteStatus[] = ['DRAFT', 'SENT', 'PENDING', 'APPROVED', 'DECLINED', 'EXPIRED', 'CONVERTED'];

// Fixed: Removed CONVERTED_TO_ORDER, REJECTED, CANCELLED - use only backend enum values
const QUOTE_STATUSES_DISPLAY: Record<QuoteStatus, string> = { 
    'DRAFT': "Draft", 
    'SENT': "Sent", 
    'PENDING': "Pending", 
    'APPROVED': "Approved", 
    'DECLINED': "Declined", 
    'EXPIRED': "Expired", 
    'CONVERTED': "Converted"
};

// Fixed: Removed CONVERTED_TO_ORDER, REJECTED, CANCELLED - use only backend enum values
const statusStyles: Record<QuoteStatus | 'UNKNOWN', { bg: string; text: string; border: string }> = { 
    'DRAFT': { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" }, 
    'SENT': { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" }, 
    'PENDING': { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" }, 
    'APPROVED': { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" }, 
    'DECLINED': { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" }, 
    'EXPIRED': { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" }, 
    'CONVERTED': { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
    'UNKNOWN': { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" } 
};

const extractSentDate = (description: string | null | undefined): string | null => { if (!description) return null; const match = description.match(/Sent on:\s*(\d{4}-\d{2}-\d{2})/); return match ? match[1] : null; };
const formatDate = (dateString: string | null | undefined): string => { if (!dateString) return 'N/A'; try { if (typeof dateString === 'string' && (dateString.toLowerCase() === 'invalid date' || dateString === 'NaN')) { return 'N/A'; } const date = new Date(dateString); if (isNaN(date.getTime())) { console.warn('FormatDate invalid:', dateString); return 'Invalid Date'; } return date.toLocaleDateString('en-GB'); } catch (error) { console.error('Error formatting date:', error); return String(dateString); } };

export default function Quotes() {
 const [quotes, setQuotes] = useState<QuoteVersion[]>([]);
 const [searchTerm, setSearchTerm] = useState('');
 const [selectedStatusFilter, setSelectedStatusFilter] = useState<QuoteStatus | 'all'>('all');
 const [hideConverted, setHideConverted] = useState(true);
 const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = useState(false);
 const [quoteToEdit, setQuoteToEdit] = useState<QuoteVersion | null>(null);
 const [customers, setCustomers] = useState<CustomerWithContacts[]>([]);
 const [refreshKey, setRefreshKey] = useState(0);
 const [loading, setLoading] = useState(true); 
 const [quoteHistory, setQuoteHistory] = useState<QuoteVersion[]>([]);
 const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
 const [historyLoading, setHistoryLoading] = useState(false);
 const [historyTargetRef, setHistoryTargetRef] = useState<string | null>(null);
 const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

 const fetchQuotes = useCallback(async () => {
    console.log('[API DEBUG] ==== FETCH QUOTES STARTED ====');
    try {
        const token = localStorage.getItem('token');
        if (!token) { 
            console.error("[API DEBUG] No token found");
            throw new Error("Auth token not found."); 
        }
        console.log('[API DEBUG] Token found, proceeding with API call');
        
        const response = await apiClient.get('/quotes', { 
            headers: { 'Authorization': `Bearer ${token}` },
            params: { all: 'true' } 
        });

        console.log('[API DEBUG] Response received:', {
            status: response.status,
            dataIsArray: Array.isArray(response.data),
            dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
            firstItem: Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : 'No items'
        });
        
        console.log("[API DEBUG] Full response.data:", response.data);
        
        const data = response.data as any;
        if (Array.isArray(data)) {
            console.log('[API DEBUG] Processing array of quotes...');
            const processed: QuoteVersion[] = data.map((q: any): QuoteVersion => ({
                id: q.id,
                quoteReference: q.quoteReference,
                versionNumber: q.versionNumber,
                isLatestVersion: q.isLatestVersion,
                status: ((q.status || 'DRAFT').toUpperCase() as QuoteStatus), // Fixed: Cast to QuoteStatus
                title: q.title,
                description: q.description,
                customerId: q.customerId ?? undefined,
                customerName: q.customer?.name || q.customerName || 'Unknown',
                customer: q.customer, 
                quoteNumber: q.quoteNumber,
                totalAmount: Number(q.value ?? q.totalAmount ?? 0),
                createdAt: q.createdAt,
                updatedAt: q.updatedAt,
                validUntil: q.validUntil,
                contactPerson: q.contactPerson,
                contactEmail: q.contactEmail,
                contactPhone: q.contactPhone,
                changeReason: q.changeReason,
                parentQuoteId: q.parentQuoteId,
                createdById: q.createdById,
                lineItems: q.lineItems || [],
                orderId: q.orderId, 
                jobId: q.jobId,     
                sentDate: extractSentDate(q.description), 
                notes: q.notes,     
                customerReference: q.customerReference,
                value: q.value
            }));
            console.log('[API DEBUG] Processed quotes:', processed);
            setQuotes(processed);
            console.log('[API DEBUG] State updated with quotes:', processed.length);
        } else {
            console.warn('[API DEBUG] Quotes API response was not an array:', data);
            setQuotes([]);
        }
    } catch (error) {
        console.error('[API DEBUG] Error in fetchQuotes:', error);
        if ((error as any).response) {
            console.error('[API DEBUG] Error response:', {
                status: (error as any).response.status,
                data: (error as any).response.data
            });
        }
        setQuotes([]); 
    } 
 }, []);

 const fetchCustomers = useCallback(async () => {
    console.log("[Quotes.tsx] fetchCustomers starting with contacts...");
    try {
      // Use the new API that includes contacts
      const customersWithContacts = await getCustomersWithContacts();
      
      console.log("[Quotes.tsx] fetchCustomers with contacts SUCCESS:", customersWithContacts);
      console.log("[Quotes.tsx] Number of customers:", customersWithContacts.length);
      
      // Log the first customer to see if contacts are included
      if (customersWithContacts.length > 0) {
        console.log("[Quotes.tsx] First customer with contacts:", customersWithContacts[0]);
        console.log("[Quotes.tsx] First customer contacts:", customersWithContacts[0].contacts);
      }
      
      setCustomers(customersWithContacts);
      
    } catch (error) {
      console.error('[Quotes.tsx] fetchCustomers with contacts ERROR:', error);
      
      // Fallback to original API if new one fails
      try {
        console.log("[Quotes.tsx] Falling back to original customer API...");
        const token = localStorage.getItem('token');
        const response = await apiClient.get('/customers', { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });

        console.log("[Quotes.tsx] fetchCustomers FALLBACK RAW RESPONSE:", response.data);
        const data = response.data as PaginatedCustomersResponse;
        if (data && Array.isArray(data.customers)) {
          // Handle phone null conversion for customers
          const processedCustomers = data.customers.map(customer => ({
            ...customer,
            phone: customer.phone || undefined,
            contacts: [] // Add empty contacts array for fallback
          }));
          setCustomers(processedCustomers);
          console.log("[Quotes.tsx] fetchCustomers FALLBACK SUCCESS. Number of customers:", processedCustomers.length);
        } else {
          console.warn("[Quotes.tsx] fetchCustomers fallback response malformed:", data);
          setCustomers([]); 
        }
      } catch (fallbackError) {
        console.error('[Quotes.tsx] fetchCustomers FALLBACK also failed:', fallbackError);
        setCustomers([]);
      }
    }
  }, []);

 const loadData = useCallback(async () => {
    console.log(`[Quotes.tsx] loadData called.`);
    setLoading(true); 
    try {
        console.log("[Quotes.tsx] loadData: awaiting Promise.all for fetchQuotes and fetchCustomers...");
        await Promise.all([fetchQuotes(), fetchCustomers()]);
        console.log("[Quotes.tsx] loadData: Promise.all completed.");
    } catch (error) {
        console.error("[Quotes.tsx] loadData: An error occurred during data fetching operations:", error);
    } finally {
        console.log("[Quotes.tsx] loadData: finally block. Setting loading to false.");
        setLoading(false); 
    }
 }, [fetchQuotes, fetchCustomers]); 

 useEffect(() => {
     console.log("[Quotes.tsx] Initial mount: Calling loadData.");
     loadData();
 }, []); 

 useEffect(() => {
     if (refreshKey > 0) { 
         console.log("[Quotes.tsx] refreshKey changed: Calling loadData. New key:", refreshKey);
         loadData();
     }
 }, [refreshKey]); 

 useEffect(() => {
     console.log('[API DEBUG] quotes state changed, new length:', quotes.length);
     console.log('[API DEBUG] quotes content:', quotes);
 }, [quotes]);

 const filteredQuotes = quotes.filter(quote => { 
    const currentStatus = quote.status; 
    console.log('[API DEBUG] Filtering quote:', { 
        id: quote.id, 
        status: currentStatus, 
        hideConverted: hideConverted, 
        selectedStatusFilter: selectedStatusFilter 
    });
    
    if (hideConverted && currentStatus === 'CONVERTED') {
        console.log('[API DEBUG] Quote filtered out due to CONVERTED status');
        return false;
    }
    
    if (selectedStatusFilter !== 'all' && currentStatus !== selectedStatusFilter) {
        console.log('[API DEBUG] Quote filtered out due to status filter mismatch');
        return false;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase(); 
    if (searchTerm && !(
        (quote.title || '').toLowerCase().includes(lowerSearchTerm) || 
        (quote.customerName || '').toLowerCase().includes(lowerSearchTerm) || 
        (quote.id || '').toLowerCase().includes(lowerSearchTerm) || 
        (quote.quoteNumber || '').toLowerCase().includes(lowerSearchTerm) || 
        (quote.quoteReference || '').toLowerCase().includes(lowerSearchTerm)
    )) {
        console.log('[API DEBUG] Quote filtered out due to search term mismatch');
        return false;
    }
    
    console.log('[API DEBUG] Quote included in filtered results');
    return true;
 }).sort((a, b) => { 
    if (a.quoteReference !== b.quoteReference) return (b.quoteReference || '').localeCompare(a.quoteReference || ''); 
    return (b.versionNumber || 0) - (a.versionNumber || 0); 
 });

useEffect(() => {
    console.log('[API DEBUG] filteredQuotes calculation completed, length:', filteredQuotes.length);
}, [filteredQuotes.length]);

// Fixed: Type-safe wrapper for handleModalSaveSuccess
const handleModalSaveSuccess = useCallback((data: QuoteData) => {
    console.log("[Quotes.tsx] handleModalSaveSuccess received data:", data);
    
    // Convert QuoteData to MockSavedQuotePayload format
    const savedQuotePayload: MockSavedQuotePayload = {
        ...data,
        totalAmount: data.totalAmount,
        status: data.status, // Fixed: Direct use of QuoteStatus
        // Fixed: Convert items to expected format with all required properties
        items: data.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            materialId: (item as any).materialId || null, // Fixed: Type assertion to access materialId
            id: item.id,
            total: item.total
        }))
    };
    
   const isUpdatingDraft = !!savedQuotePayload.id && !savedQuotePayload.parentQuoteId; 

// Add these debug lines:
console.log('DEBUG savedQuotePayload.id:', savedQuotePayload.id);
console.log('DEBUG savedQuotePayload.parentQuoteId:', savedQuotePayload.parentQuoteId);
console.log('DEBUG isUpdatingDraft:', isUpdatingDraft);

const apiUrl = isUpdatingDraft 
    ? `/quotes/${savedQuotePayload.id}` 
    : '/quotes';                     
const apiMethod = isUpdatingDraft ? apiClient.put : apiClient.post;

    console.log(`[Quotes.tsx] Attempting to save quote. isUpdatingDraft: ${isUpdatingDraft}, URL: ${apiUrl}, Method: ${isUpdatingDraft ? 'PATCH' : 'POST'}`);

    (async () => {
        try {
            const response = await apiMethod(apiUrl, savedQuotePayload); 
            console.log("[Quotes.tsx] API Save Response:", response.data);
            
            setIsNewQuoteModalOpen(false); 
            setQuoteToEdit(null); 
            setRefreshKey(prev => prev + 1);
            console.log("[Quotes.tsx] API Save success. Triggering data refresh.");
            alert("Quote saved successfully!"); 

        } catch (error) {
            console.error("[Quotes.tsx] API Save FAILED:", (error as any).response?.data || (error as any).message);
            const errorMsg = (error as any).response?.data?.message || (error as any).response?.data?.error || (error as any).message || "Unknown error";
            alert(`Failed to save quote: ${errorMsg}`);
        }
    })();
}, [setIsNewQuoteModalOpen, setQuoteToEdit, setRefreshKey]);

 const handleOpenNewQuoteModal = () => { 
    console.log("--- [Quotes.tsx] handleOpenNewQuoteModal START ---"); 
    if (loading && !isNewQuoteModalOpen) { console.warn("[Quotes.tsx] Click prevented: Page is loading."); return; } 
    console.log("[Quotes.tsx] Setting quoteToEdit = null for new quote."); 
    setQuoteToEdit(null); 
    setIsNewQuoteModalOpen(true); 
    console.log("--- [Quotes.tsx] handleOpenNewQuoteModal END --- Modal should be open."); 
 };

 const handleEditQuote = (quoteId: string) => { 
    console.log(`[Quotes.tsx] Edit/Version button clicked for quote ID: ${quoteId}`); 
    const quote = quotes.find(q => q.id === quoteId); 
    if (quote) { 
        if (['DRAFT', 'SENT', 'PENDING'].includes(quote.status)) { 
            console.log("[Quotes.tsx] Setting quoteToEdit for editing/versioning:", quote); 
            setQuoteToEdit(quote); 
            setIsNewQuoteModalOpen(true); 
        } else { 
            // Fixed: Safe access to display mapping
            alert(`Quotes with status '${QUOTE_STATUSES_DISPLAY[quote.status] || quote.status}' cannot be directly edited or versioned. Consider cloning for a new draft.`); 
        } 
    } else { 
        alert("Quote not found."); 
    } 
 };
 
 const handleCloneQuote = async (quoteId: string) => {
   const quote = quotes.find(q => q.id === quoteId);
   if (!quote) { alert("Quote not found to clone."); return; }
   if (!window.confirm(`Clone Quote ${quote.quoteNumber || quote.id} (Ref: ${quote.quoteReference} v${quote.versionNumber})?\nA new V1 Draft quote will be created.`)) return;
   setLoading(true);
   try {
     const token = localStorage.getItem('token');
     if (!token) throw new Error("Auth token not found.");
     
     const response = await apiClient.post(`/quotes/${quoteId}/clone`);
     const data = response.data as QuoteVersion;
     
     alert(`Quote cloned! New Ref: ${data.quoteReference || 'N/A'}`);
     loadData();
   } catch (error) {
     console.error('Error cloning quote:', (error as any).response?.data || (error as any).message);
     alert(`Failed to clone quote: ${(error as any).response?.data?.message || (error as any).message}`);
   } finally {
     setLoading(false);
   }
 };
 
 const handleConvertToOrder = async (quoteId: string) => {
   const quote = quotes.find(q => q.id === quoteId);
   if (!quote) { alert("Quote not found."); return; }
   if (quote.status !== 'APPROVED') { alert("Only APPROVED quotes can be converted."); return; }
   if (!window.confirm(`Convert Quote ${quote.quoteNumber || quote.id} (v${quote.versionNumber}) to an Order?`)) return;
   
   setLoading(true);
   
   try {
     const token = localStorage.getItem('token');
     if (!token) throw new Error("Auth token not found.");
     
     const response = await apiClient.post(`/orders/from-quote/${quoteId}`);
     const data = response.data as any;
     const newOrderId = data.order?.id || data.id; 
     
     if (!newOrderId) {
        throw new Error("Order ID not found in API response.");
     }

     alert(`Quote converted successfully via API! New Order ID: ${newOrderId}`);
     loadData(); 
     
     if (window.confirm(`Would you like to create a job from this order now?`)) {
       window.location.href = `/jobs/new?orderId=${newOrderId}`; 
     }

   } catch (error) {
     console.error("Failed to create order via API:", error); 
     
     const mockOrderId = `mock-order-${Date.now()}`;
     const orderData: MockOrderData = { 
       id: mockOrderId, 
       projectTitle: quote.title,
       quoteRef: quote.quoteReference,
       customerName: quote.customerName || 'Unknown Customer',
       customerId: quote.customerId ?? undefined,
       contactPerson: quote.contactPerson || '',
       contactEmail: quote.contactEmail || '',
       contactPhone: quote.contactPhone || '',
       projectValue: quote.totalAmount || 0,
       marginPercent: 20, 
       leadTimeWeeks: 2, 
       status: 'PENDING_APPROVAL', 
       createdAt: new Date().toISOString(),
       priority: 'MEDIUM', 
       progress: 0, 
       value: quote.totalAmount || 0, 
       deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), 
       customer: quote.customerName || 'Unknown Customer', 
       items: quote.lineItems.map(item => ({ 
         description: item.description,
         quantity: item.quantity,
         unitPrice: item.unitPrice,
         materialId: item.materialId
       })),
       notes: quote.notes || `Converted from Quote: ${quote.quoteNumber || quote.quoteReference} v${quote.versionNumber}`,
       currency: 'GBP', 
       vatRate: 20, 
       paymentTerms: 'THIRTY_DAYS' 
     };

     alert(`API conversion failed. Creating a mock order locally with ID: ${orderData.id}`);

     try {
        const existingMockOrders = JSON.parse(localStorage.getItem('mockOrders') || '[]');
        existingMockOrders.push(orderData);
        localStorage.setItem('mockOrders', JSON.stringify(existingMockOrders));
        console.log("[Quotes.tsx] Mock order saved to localStorage:", orderData);
     } catch (storageError) {
         console.error("Error saving mock order to localStorage:", storageError);
         alert("Could not save mock order to local storage. It will only appear temporarily.");
     }
     
     setQuotes(prevQuotes => prevQuotes.map(q => 
       q.id === quoteId ? { ...q, status: 'CONVERTED', orderId: orderData.id } : q
     ));

     alert(`Mock order created locally. Order ID: ${orderData.id}. It has been saved to local storage and should appear on the Orders page.`);

     if (window.confirm(`Would you like to go to Orders page to see your new order?`)) {
       window.location.href = '/orders';
     } else if (window.confirm(`Would you like to create a job from this order now?`)) {
       window.location.href = `/jobs/new?orderId=${orderData.id}`;
     }

   } finally {
     setLoading(false);
   }
 };
 
 const handleViewHistory = async (quoteReference: string) => {
   setHistoryLoading(true);
   setHistoryTargetRef(quoteReference);
   try {
     const token = localStorage.getItem('token');
     if (!token) throw new Error("Auth token not found.");
     
     const response = await apiClient.get(`/quotes/history/${quoteReference}`);
     const data = response.data as QuoteVersion[];
     
     if (Array.isArray(data)) {
       setQuoteHistory(data);
     } else {
       console.warn("Quote history API response is not an array:", data);
       setQuoteHistory([]);
     }
     setIsHistoryModalOpen(true);
   } catch (error) {
     console.error('Error fetching quote history:', (error as any).response?.data || (error as any).message);
     alert(`Failed to fetch quote history: ${(error as any).response?.data?.message || (error as any).message}`);
     setHistoryTargetRef(null);
   } finally {
     setHistoryLoading(false);
   }
 };
 
 const handleRefresh = () => { 
    console.log("[Quotes.tsx] Manual refresh clicked."); 
    if (!loading) { setRefreshKey(prev => prev + 1); } 
    else { console.log("[Quotes.tsx] Refresh prevented: Already loading."); } 
 };
 
 const handleUpdateStatus = async (quoteId: string, newStatus: string) => {
   console.log(`[Quotes.tsx] Attempting to update status for quote ${quoteId} to ${newStatus}`);
   const originalQuote = quotes.find(q => q.id === quoteId);
   if (!originalQuote) {
     alert("Quote not found for status update.");
     console.error(`[Quotes.tsx] Quote with ID ${quoteId} not found in local state for status update.`);
     return;
   }
   if (originalQuote.status === newStatus) {
     console.log(`[Quotes.tsx] Quote ${quoteId} is already in status ${newStatus}. No update needed.`);
     return;
   }
   if (!window.confirm(`Change status of quote "${originalQuote.title}" (v${originalQuote.versionNumber}) from ${originalQuote.status} to ${newStatus}?`)) {
     return;
   }
   setUpdatingStatusId(quoteId);
   try {
     const token = localStorage.getItem('token');
     if (!token) throw new Error("Authentication token not found.");
     
     const response = await apiClient.patch(`/quotes/${quoteId}/status`, { status: newStatus });
     
     const updatedQuoteFromServer = response.data as QuoteVersion;
     const serverStatus = ((updatedQuoteFromServer.status as string)?.toUpperCase() as QuoteStatus);
     
     setQuotes(prevQuotes => prevQuotes.map(q => 
       q.id === quoteId ? { ...q, ...updatedQuoteFromServer, status: serverStatus } : q
     ));
     
     console.log(`[Quotes.tsx] Status for quote ${quoteId} updated successfully to ${newStatus}.`);
     
   } catch (error) {
     console.error(`[Quotes.tsx] Error updating status for quote ${quoteId}:`, (error as any).response?.data || (error as any).message);
     alert(`Failed to update status: ${(error as any).response?.data?.message || (error as any).message}`);
   } finally {
     setUpdatingStatusId(null);
   }
 };

 // FIXED PDF GENERATION - CORRECT FIELD MAPPING
 const handleGeneratePDF = async (quoteId: string) => {
   const quote = quotes.find(q => q.id === quoteId);
   if (!quote) { 
     alert("Quote not found to generate PDF."); 
     return; 
   }

   try {
     const token = localStorage.getItem('token');
     if (!token) throw new Error("Auth token not found.");
     
     // Fetch full quote details from API
     const response = await apiClient.get(`/quotes/${quoteId}`);
     const quoteData = response.data as any;
     
     // FIXED: Interface matches EnhancedQuotePDF UserProfile interface exactly
     interface CleanUserProfile {
       useCompanyDetailsOnQuotes: boolean;
       companyName?: string;
       companyAddress?: string;
       companyPhone?: string;
       companyEmail?: string;
       companyWebsite?: string;
       companyVatNumber?: string;
       companyLogo?: string;
       // NEW: Quote terms fields
       standardWarranty?: string;
       standardDeliveryTerms?: string;
       defaultLeadTimeWeeks?: number;
       standardExclusions?: string;
     }
     
     let userProfile: CleanUserProfile = { 
       useCompanyDetailsOnQuotes: false 
     };
     
     try {
       const profileResponse = await apiClient.get('/auth/profile');
       const profileData = profileResponse.data;
       
       // FIXED: Correct field mapping to match UserProfile interface in EnhancedQuotePDF
       if (profileData && typeof profileData === 'object') {
         const pd = profileData as any;
         userProfile = {
           useCompanyDetailsOnQuotes: Boolean(pd.useCompanyDetailsOnQuotes),
           companyName: pd.companyName || undefined,
           companyAddress: pd.companyAddress || undefined,
           companyPhone: pd.companyPhone || undefined,
           companyEmail: pd.companyEmail || undefined,
           companyWebsite: pd.companyWebsite || undefined,
           companyVatNumber: pd.companyVatNumber || undefined,
           companyLogo: pd.companyLogo || undefined,
           // NEW: Quote terms fields
           standardWarranty: pd.standardWarranty || undefined,
           standardDeliveryTerms: pd.standardDeliveryTerms || undefined,
           defaultLeadTimeWeeks: pd.defaultLeadTimeWeeks || undefined,
           standardExclusions: pd.standardExclusions || undefined
         };
       }
       console.log('✅ User profile loaded for PDF with correct field mapping:', userProfile);
     } catch (profileError) {
       console.warn('Could not load user profile for PDF, using defaults:', profileError);
     }
     
     // CLEAN: All null converted to undefined for type safety
     const quoteForPDF = {
       id: quoteData.id,
       title: quoteData.title || '',
       customer: quoteData.customerName || quoteData.customer?.name || 'Unknown Customer',
       customerId: quoteData.customerId || '',
       contactPerson: quoteData.contactPerson || undefined,
       contactEmail: quoteData.contactEmail || undefined,
       contactPhone: quoteData.contactPhone || undefined,
       date: quoteData.createdAt || new Date().toISOString(),
       validUntil: quoteData.validUntil || undefined,
       validityDays: 30,
       terms: quoteData.terms || 'Net 30',
       notes: quoteData.notes || undefined,
       items: (quoteData.lineItems || []).map((item: any) => ({
         id: item.id,
         description: item.description || '',
         quantity: Number(item.quantity) || 0,
         unitPrice: Number(item.unitPrice) || 0,
         total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
         materialId: item.materialId || undefined
       })),
       totalAmount: Number(quoteData.totalAmount) || Number(quoteData.value) || 0,
       status: quoteData.status || 'draft',
       quoteNumber: quoteData.quoteNumber || undefined,
       quoteReference: quoteData.quoteReference || undefined,
       versionNumber: quoteData.versionNumber || undefined,
       customerReference: quoteData.customerReference || undefined
     };
     
     // Generate professional PDF
     console.log('Generating professional PDF for quote:', quoteForPDF);
     console.log('Using user profile (FULL):', JSON.stringify(userProfile, null, 2));
     const pdf = generateProfessionalQuotePDF(quoteForPDF, userProfile);
     
     // Download the PDF
     const filename = `Quote-${quoteData.quoteNumber || quoteData.quoteReference || quoteId}-v${quoteData.versionNumber || 1}.pdf`;
     pdf.download(filename);
     
     console.log('✅ Professional PDF generated successfully');
     
   } catch (error) {
     console.error('Error generating professional PDF:', error);
     
     // CLEAN: Fallback with proper types
     try {
       console.log('Falling back to local quote data for PDF generation');
       
       const fallbackQuoteData = {
         id: quote.id,
         title: quote.title || '',
         customer: quote.customerName || 'Unknown Customer',
         customerId: quote.customerId || '',
         contactPerson: quote.contactPerson || undefined,
         contactEmail: quote.contactEmail || undefined,
         contactPhone: quote.contactPhone || undefined,
         date: quote.createdAt || new Date().toISOString(),
         validUntil: quote.validUntil || undefined,
         validityDays: 30,
         terms: 'Net 30',
         notes: quote.notes || undefined,
         items: quote.lineItems.map(item => ({
           id: item.id,
           description: item.description || '',
           quantity: Number(item.quantity) || 0,
           unitPrice: Number(item.unitPrice) || 0,
           total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
           materialId: item.materialId || undefined
         })),
         totalAmount: Number(quote.totalAmount) || Number(quote.value) || 0,
         status: quote.status || 'draft',
         quoteNumber: quote.quoteNumber || undefined,
         quoteReference: quote.quoteReference || undefined,
         versionNumber: quote.versionNumber || undefined,
         customerReference: quote.customerReference || undefined
       };
       
       const defaultUserProfile = { useCompanyDetailsOnQuotes: false };
       const pdf = generateProfessionalQuotePDF(fallbackQuoteData, defaultUserProfile);
       const filename = `Quote-${quote.quoteNumber || quote.quoteReference || quote.id}.pdf`;
       pdf.download(filename);
       
     } catch (fallbackError) {
       console.error('Fallback PDF generation also failed:', fallbackError);
       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
       alert(`Failed to generate PDF: ${errorMessage}`);
     }
   }
 };

 // Fixed: Convert QuoteVersion to QuoteData for modal compatibility
 const convertQuoteVersionToQuoteData = (quote: QuoteVersion): QuoteData => ({
    id: quote.id,
    title: quote.title,
    customer: quote.customerName || '',
    customerId: quote.customerId ?? undefined,
    contactPerson: quote.contactPerson ?? undefined,
    contactEmail: quote.contactEmail ?? undefined,
    contactPhone: quote.contactPhone ?? undefined,
    jobId: quote.jobId ?? undefined,
    validityDays: 30,
    terms: '',
    notes: quote.notes ?? undefined,
    customerReference: quote.customerReference ?? undefined,
    status: quote.status, // Fixed: Use status directly from QuoteStatus union
    quoteNumber: quote.quoteNumber ?? undefined,
    quoteReference: quote.quoteReference ?? undefined,
    versionNumber: quote.versionNumber ?? undefined,
    items: quote.lineItems.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
        materialId: item.materialId
    })),
    totalAmount: quote.totalAmount,
    parentQuoteId: quote.parentQuoteId ?? undefined,
    changeReason: quote.changeReason ?? undefined,
    validUntil: quote.validUntil ?? undefined
 });

 console.log(`%c[Quotes.tsx] Component Render. Loading: ${loading}, Modal Open: ${isNewQuoteModalOpen}. Filtered Quotes: ${filteredQuotes.length}`, 'color: blue; font-weight: bold;');

 return (
  <div className="p-6 sm:p-8 max-w-full mx-auto bg-gray-50 min-h-screen dark:bg-gray-900">
    {/* Header Section */}
    <div className="flex flex-wrap justify-between items-center mb-6 sm:mb-8 gap-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Quotes Management</h1>
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button onClick={handleRefresh} title="Refresh quote list" className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" disabled={loading}>
           <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
           <span className="text-sm hidden sm:inline">Refresh</span>
         </button>
        <button onClick={handleOpenNewQuoteModal} className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" disabled={loading && !isNewQuoteModalOpen} >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm">New Quote</span>
         </button>
       </div>
     </div>

    {/* Filter Section */}
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-grow min-w-[200px] sm:min-w-[250px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input type="text" placeholder="Search Ref, Ver ID, Title, Customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div className="flex flex-wrap items-center gap-4">
                <select value={selectedStatusFilter} onChange={(e) => setSelectedStatusFilter(e.target.value as QuoteStatus | 'all')} className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                    <option value="all">All Statuses</option>
                    {QUOTE_STATUSES.map((statusVal) => (
                        <option key={statusVal} value={statusVal}>{QUOTE_STATUSES_DISPLAY[statusVal] || statusVal}</option>
                    ))}
                </select>
                <div className="flex items-center space-x-2">
                    <input type="checkbox" id="hideConvertedCheckbox" checked={hideConverted} onChange={(e) => setHideConverted(e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"/>
                    <label htmlFor="hideConvertedCheckbox" className="text-sm text-gray-700 dark:text-gray-300 select-none">Hide Converted</label>
                </div>
            </div>
        </div>
    </div>

   
    {/* Quotes List Section */}
    <div className="space-y-4">
       {loading && quotes.length === 0 ? ( 
         <div className="py-10 text-center text-gray-500 dark:text-gray-400">Loading quotes...</div>
       ) : filteredQuotes.length === 0 ? (
         <div className="py-10 px-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center text-gray-500 dark:text-gray-400">
            No quotes match your current filters or no quotes found.
         </div>
       ) : (
         filteredQuotes.map((quote) => {
            const currentStatusKey = quote.status || 'UNKNOWN';
            const style = statusStyles[currentStatusKey as QuoteStatus] || statusStyles.UNKNOWN;
            const isDraftEditable = quote.status === 'DRAFT';
            const isEditableForNewVersion = ['SENT', 'PENDING'].includes(quote.status);
            const canConvertToOrder = quote.status === 'APPROVED';
            const isTerminalStatus = ['CONVERTED', 'EXPIRED', 'DECLINED'].includes(quote.status);

            return (
             <div key={quote.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 ease-in-out">
                <div className="p-5 sm:p-6">
                     <div className="flex flex-wrap justify-between items-start gap-4">
                        {/* Quote Title and Info */}
                        <div className="flex-grow min-w-0">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate" title={quote.title}> {quote.title} </h2>
                                <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 whitespace-nowrap" title={`Ref: ${quote.quoteReference}, Ver: ${quote.versionNumber}`}> {quote.quoteReference} v{quote.versionNumber} </span>
                                {quote.jobId && ( <span className="flex-shrink-0 flex items-center text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full whitespace-nowrap"> <LinkIcon className="h-3 w-3 mr-1" /> Job Linked </span> )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate"> <span title={quote.id}>ID: {quote.id.substring(0,8)}...</span> • {quote.quoteNumber || '(No Quote #)'} • {quote.customerName || 'No Customer'} </p>
                            {quote.changeReason && ( <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic" title="Reason for this version"> Reason: {quote.changeReason} </p> )}
                        </div>
                        {/* Status Dropdown */}
                        <div className="flex-shrink-0 flex flex-col items-end sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <div className="relative">
                                <select
                                    value={quote.status}
                                    onChange={(e) => handleUpdateStatus(quote.id, e.target.value)}
                                    disabled={updatingStatusId === quote.id || isTerminalStatus}
                                    className={`text-xs font-semibold appearance-none py-1 pl-2 pr-7 border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 ${style.bg} ${style.text} ${style.border} ${(updatingStatusId === quote.id || isTerminalStatus) ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-80'}`}
                                    title={isTerminalStatus ? `Status is final: ${QUOTE_STATUSES_DISPLAY[quote.status] || quote.status}` : "Change Status"}
                                >
                                    {QUOTE_STATUSES.map(s => (
                                        <option 
                                            key={s} 
                                            value={s} 
                                            disabled={
                                                (isTerminalStatus && s !== quote.status) ||
                                                (s === 'CONVERTED' && quote.status !== 'CONVERTED')
                                            }
                                        >
                                            {QUOTE_STATUSES_DISPLAY[s]}
                                        </option>
                                    ))}
                                </select>
                                <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 ${style.text}`}>
                                    {updatingStatusId === quote.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <MoreVertical className="h-3 w-3" />}
                                </div>
                            </div>
                             {quote.status === 'SENT' && quote.sentDate && (
                                <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text} bg-opacity-0 border-none`} title={`Sent on ${formatDate(quote.sentDate)}`}>
                                    <span className="ml-1 flex items-center opacity-80"> <Calendar className="h-3 w-3 mr-0.5" /> {formatDate(quote.sentDate)} </span>
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Quote Details */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-3 text-sm">
                        <div> <p className="text-gray-500 dark:text-gray-400 font-medium">Total Value</p> <p className="mt-1 text-gray-900 dark:text-white font-semibold">£{(quote.totalAmount || quote.value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p> </div>
                        <div> <p className="text-gray-500 dark:text-gray-400 font-medium">Version Created</p> <p className="mt-1 text-gray-900 dark:text-white">{formatDate(quote.createdAt)}</p> </div>
                        {quote.sentDate && ( <div> <p className="text-gray-500 dark:text-gray-400 font-medium">Date Sent</p> <p className="mt-1 text-gray-900 dark:text-white flex items-center"><Calendar className="h-3 w-3 mr-1 text-orange-500" />{formatDate(quote.sentDate)}</p> </div> )}
                        <div> <p className="text-gray-500 dark:text-gray-400 font-medium">Valid Until</p> <p className="mt-1 text-gray-900 dark:text-white">{formatDate(quote.validUntil)}</p> </div>
                        <div className="col-span-2 sm:col-span-1"> <p className="text-gray-500 dark:text-gray-400 font-medium">Contact Person</p> <p className="mt-1 text-gray-900 dark:text-white truncate">{quote.contactPerson || 'N/A'}</p> </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                        <button onClick={() => handleViewHistory(quote.quoteReference)} disabled={historyLoading && historyTargetRef === quote.quoteReference} className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" title={`View history for ${quote.quoteReference}`}> <HistoryIcon className="h-4 w-4" /> <span className="hidden sm:inline">History</span> </button>
                        <button onClick={() => handleEditQuote(quote.id)} disabled={!(isDraftEditable || isEditableForNewVersion)} className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed" title={isDraftEditable ? "Edit Draft" : (isEditableForNewVersion ? "Create New Version" : "Cannot edit/version this quote...")}> <Edit3 className="h-3 w-3 mr-1" /> {quote.status === 'DRAFT' ? "Edit" : "New Ver."} </button>
                        <button onClick={() => handleCloneQuote(quote.id)} className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" title={`Clone v${quote.versionNumber} as new Draft`}> <Copy className="h-4 w-4" /> <span className="hidden sm:inline">Clone</span> </button>
                        <button onClick={() => handleGeneratePDF(quote.id)} className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"> <FileText className="h-4 w-4" /> <span className="hidden sm:inline">PDF</span> </button>
                        {canConvertToOrder && ( <button onClick={() => handleConvertToOrder(quote.id)} className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"> <ArrowRight className="h-4 w-4" /> <span>Convert to Order</span> </button> )}
                    </div>
                </div>
             </div>
            );
         })
       )}
     </div>

    {/* New Quote Modal */}
    {isNewQuoteModalOpen && (
        <>
            {console.log("%c--- [Quotes.tsx] Rendering NewQuoteModal ---", 'color: green; font-weight: bold;', { isOpen: isNewQuoteModalOpen, editQuoteId: quoteToEdit?.id, customersLength: customers?.length })}
            <NewQuoteModal
                isOpen={isNewQuoteModalOpen}
                onClose={() => { 
                    console.log("[Quotes.tsx] NewQuoteModal onClose triggered. Setting modal open to false."); 
                    setIsNewQuoteModalOpen(false); 
                    setQuoteToEdit(null); 
                }}
                onSubmit={handleModalSaveSuccess}
                editQuote={quoteToEdit ? convertQuoteVersionToQuoteData(quoteToEdit) : null}
                customers={customers || []}
            />
        </>
     )}

    {/* History Modal */}
    {isHistoryModalOpen && ( 
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300"> 
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[80vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-modal-scale-in"> 
          <div className="flex justify-between items-center mb-4 border-b pb-3 dark:border-gray-700"> 
            <h3 className="text-xl font-bold text-gray-900 dark:text-white"> History for {historyTargetRef || 'Quote'} </h3> 
            <button onClick={() => setIsHistoryModalOpen(false)} className="p-1 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"> 
              <X className="h-5 w-5" /> 
            </button> 
          </div> 
          <div className="flex-grow overflow-y-auto pr-2 space-y-3"> 
            {historyLoading ? ( 
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">Loading history...</p> 
            ) : quoteHistory.length > 0 ? ( 
              <ul className="space-y-3"> 
                {quoteHistory.sort((a, b) => (b.versionNumber || 0) - (a.versionNumber || 0)).map(version => {
                   const style = statusStyles[version.status as QuoteStatus] || statusStyles.UNKNOWN; 
                   return ( 
                    <li key={version.id} className="border dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-700/50 shadow-sm"> 
                      <div className="flex justify-between items-center mb-1"> 
                        <span className="font-semibold text-gray-800 dark:text-gray-100">Version {version.versionNumber}</span> 
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>{QUOTE_STATUSES_DISPLAY[version.status] || version.status}</span> 
                      </div> 
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{version.title}</p> 
                      <p className="text-xs text-gray-500 dark:text-gray-400"> {formatDate(version.createdAt)} {version.changeReason && `- ${version.changeReason}`} </p> 
                    </li> 
                   ); 
                 })} 
              </ul> 
            ) : ( 
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">No history found...</p> 
            )} 
          </div> 
          <div className="mt-4 pt-4 border-t flex justify-end dark:border-gray-700"> 
            <button onClick={() => setIsHistoryModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"> 
              Close 
            </button> 
          </div> 
        </div> 
      </div> 
    )}

    {/* Animation Style */}
    <style>{` @keyframes modal-scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-modal-scale-in { animation: modal-scale-in 0.2s ease-out forwards; } `}</style>
  </div>
 );
}