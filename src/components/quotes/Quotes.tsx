import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Plus, FileText, Mail, ArrowRight, LinkIcon, Check, X, Copy } from "lucide-react";
import NewQuoteModal from './NewQuoteModal';
import CloneQuoteModal from './CloneQuoteModal';
import { generateQuotePDF } from './pdf/QuotePDF';
import { apiClient, quoteApi } from '../../utils/api';

// Initial quotes data - in a real app, this would come from an API
const initialQuotes = [
 {
   id: "Q2024-001",
   title: "Conveyor System Installation",
   customer: "Acme Manufacturing Ltd",
   status: "PENDING",
   value: 24500.00,
   date: "2024-01-30",
   validUntil: "2024-02-28",
   jobId: "J2024-001",
   customerId: "cust001",
   items: [
     {
       id: "CNV001",
       description: "Belt Conveyor System 10m",
       quantity: 1,
       unitPrice: 15000.00,
       total: 15000.00
     },
     {
       id: "SRV001",
       description: "Installation Service",
       quantity: 1,
       unitPrice: 8000.00,
       total: 8000.00
     },
     {
       id: "CNT001",
       description: "Control System",
       quantity: 1,
       unitPrice: 1500.00,
       total: 1500.00
     }
   ],
   notes: "Includes installation and commissioning",
   terms: "50% deposit required",
   contactPerson: "John Smith",
   contactEmail: "john.smith@acme.com",
   contactPhone: "01234 567890"
 },
 {
   id: "Q2024-002",
   title: "Steel Supply Agreement",
   customer: "BuildCo Ltd",
   status: "APPROVED",
   value: 18750.00,
   date: "2024-01-28",
   validUntil: "2024-02-27",
   jobId: null,
   customerId: "cust002",
   items: [
     {
       id: "MAT001",
       description: "Steel Plates 10mm",
       quantity: 50,
       unitPrice: 250.00,
       total: 12500.00
     },
     {
       id: "MAT002",
       description: "Steel Beams IPE 200",
       quantity: 25,
       unitPrice: 250.00,
       total: 6250.00
     }
   ],
   notes: "Bulk order discount applied",
   terms: "Net 30",
   contactPerson: "Sarah Jones",
   contactEmail: "sarah.jones@buildco.com",
   contactPhone: "01234 987654"
 }
];

const statusColors = {
 DRAFT: "bg-gray-100 text-gray-800",
 PENDING: "bg-yellow-100 text-yellow-800",
 APPROVED: "bg-green-100 text-green-800",
 DECLINED: "bg-red-100 text-red-800",
 CONVERTED: "bg-blue-100 text-blue-800"
};

export default function Quotes() {
 const [quotes, setQuotes] = useState(initialQuotes);
 const [searchTerm, setSearchTerm] = useState('');
 const [filterOpen, setFilterOpen] = useState(false);
 const [selectedStatus, setSelectedStatus] = useState('all');
 const [hideConverted, setHideConverted] = useState(true);
 const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = useState(false);
 const [quoteToEdit, setQuoteToEdit] = useState(null);
 const [emailModalOpen, setEmailModalOpen] = useState(false);
 const [emailQuote, setEmailQuote] = useState(null);
 const [emailAddress, setEmailAddress] = useState('');
 const [emailSubject, setEmailSubject] = useState('');
 const [emailBody, setEmailBody] = useState('');
 const [sendingEmail, setSendingEmail] = useState(false);
 const [emailSuccess, setEmailSuccess] = useState(false);
 const [customers, setCustomers] = useState([]);
 
 // New state for clone functionality
 const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
 const [quoteToClone, setQuoteToClone] = useState(null);

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
       const updatedQuotes = quotes.map(quote => {
         if (convertedQuoteRefs.includes(quote.id)) {
           return { 
             ...quote, 
             orderId: `order-${quote.id.replace('Q', '')}`, // Generate a placeholder order ID
             status: 'CONVERTED' 
           };
         }
         return quote;
       });
       
       setQuotes(updatedQuotes);
     } catch (error) {
       console.error('Error checking converted quotes:', error);
     }
   };

   const fetchCustomers = async () => {
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
   };
   
   checkConvertedQuotes();
   fetchCustomers();
 }, []);
 
 // Filter quotes based on search term and status filter
 const filteredQuotes = quotes.filter(quote => {
   // Hide quotes that have been converted to orders if the option is selected
   if (hideConverted && quote.orderId) return false;
   
   return (
     (quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
     (selectedStatus === 'all' || quote.status === selectedStatus)
   );
 });

 // Generate PDF for a quote
 const handleGeneratePDF = (quoteId) => {
   const quote = quotes.find(q => q.id === quoteId);
   if (quote) {
     const pdfDoc = generateQuotePDF(quote);
     pdfDoc.download(`Quote-${quote.id}.pdf`);
   }
 };

 // Create or update a quote
 const handleSaveQuote = (quoteData) => {
   if (quoteToEdit) {
     // Update existing quote
     const updatedQuotes = quotes.map(q => 
       q.id === quoteToEdit.id ? { ...quoteData, id: quoteToEdit.id, status: quoteToEdit.status, orderId: quoteToEdit.orderId } : q
     );
     setQuotes(updatedQuotes);
     setQuoteToEdit(null);
   } else {
     // Create new quote
     const newQuote = {
       ...quoteData,
       id: `Q${new Date().getFullYear()}-${String(quotes.length + 1).padStart(3, '0')}`,
       status: 'PENDING'
     };
     setQuotes([...quotes, newQuote]);
   }
   setIsNewQuoteModalOpen(false);
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
   setQuotes([...quotes, newQuote]);
   setIsCloneModalOpen(false);
   setQuoteToClone(null);
   
   // Optionally show a success message
   alert(`Quote cloned successfully: ${newQuote.id}`);
 };

 // Prepare email sending UI
 const handleSendEmail = (quoteId) => {
   const quote = quotes.find(q => q.id === quoteId);
   if (quote) {
     setEmailQuote(quote);
     setEmailAddress(quote.contactEmail || '');
     setEmailSubject(`Quote ${quote.id} for ${quote.title}`);
     setEmailBody(`Dear ${quote.contactPerson},\n\nPlease find attached our quote ${quote.id} for "${quote.title}".\n\nThe quote is valid until ${new Date(quote.validUntil).toLocaleDateString()}.\n\nPlease let us know if you have any questions.\n\nRegards,\nBones CRM Team`);
     setEmailModalOpen(true);
   }
 };

 // Handle sending the email
 const sendEmail = async () => {
   if (!emailQuote) return;
   
   setSendingEmail(true);
   
   try {
     // In a real app, this would be an API call to your email service
     // For demo purposes, we'll simulate success after a delay
     await new Promise(resolve => setTimeout(resolve, 1500));
     
     console.log('Sending email with quote:', emailQuote.id);
     console.log('To:', emailAddress);
     console.log('Subject:', emailSubject);
     console.log('Body:', emailBody);
     
     setEmailSuccess(true);
     
     // Reset after a few seconds
     setTimeout(() => {
       setEmailModalOpen(false);
       setEmailSuccess(false);
       setEmailQuote(null);
     }, 2000);
   } catch (error) {
     console.error('Error sending email:', error);
   } finally {
     setSendingEmail(false);
   }
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
       items: quote.items.map(item => ({
         materialId: item.id,
         description: item.description || 'No Description',
         quantity: item.quantity || 1,
         price: item.unitPrice || 0
       })),
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
     
     // Update quote in the backend
     /* 
     // Uncomment when API endpoint is available
     await axios.patch(`http://localhost:4000/api/quotes/${quoteId}`, 
       { status: 'CONVERTED', orderId: createdOrderId }, 
       { headers: { 'Authorization': `Bearer ${token}` }}
     );
     */
     
     // Update local state
     const updatedQuotes = quotes.map(q => 
       q.id === quoteId ? updatedQuote : q
     );
     
     setQuotes(updatedQuotes);
     
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
       const updatedQuotes = quotes.map(q => 
         q.id === quoteId ? {...q, status: 'CONVERTED', orderId: `order-${quoteId.replace('Q', '')}`} : q
       );
       setQuotes(updatedQuotes);
       
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
   const updatedQuotes = quotes.map(q => 
     q.id === quoteId ? {...q, status: newStatus} : q
   );
   setQuotes(updatedQuotes);
 };

 // Debug function to see what customers are available
 const debugCustomers = () => {
   console.log("Available customers:", customers);
 };

 return (
   <div className="p-8 max-w-7xl mx-auto">
     {/* Header */}
     <div className="flex justify-between items-center mb-8">
       <h2 className="text-3xl font-bold">Quotes Management</h2>
       <div className="flex space-x-2">
         <button
           onClick={debugCustomers}
           className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
         >
           Debug Customers
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
       {filteredQuotes.length === 0 ? (
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
                     <h3 className="text-lg font-medium text-gray-900">{quote.title}</h3>
                     {quote.jobId && (
                       <div className="flex items-center text-sm text-blue-600">
                         <LinkIcon className="h-4 w-4 mr-1" />
                         Job: {quote.jobId}
                       </div>
                     )}
                   </div>
                   <div className="mt-1 text-sm text-gray-500">
                     {quote.id} - {quote.customer}
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
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[quote.status]}`}>
                         {quote.status}
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
                   <div className="mt-1 text-sm text-gray-900">£{quote.value.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                 </div>
                 <div>
                   <div className="text-sm font-medium text-gray-500">Date Created</div>
                   <div className="mt-1 text-sm text-gray-900">{new Date(quote.date).toLocaleDateString('en-GB')}</div>
                 </div>
                 <div>
                   <div className="text-sm font-medium text-gray-500">Valid Until</div>
                   <div className="mt-1 text-sm text-gray-900">{new Date(quote.validUntil).toLocaleDateString('en-GB')}</div>
                 </div>
               </div>

               <div className="mt-4 flex items-center justify-between">
                 <div className="text-sm text-gray-500">
                   Contact: {quote.contactPerson} ({quote.contactEmail})
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
                     <Copy className="h-4 w-4" />
                     <span>Clone</span>
                   </button>
                   <button
                     onClick={() => handleGeneratePDF(quote.id)}
                     className="flex items-center space-x-1 px-3 py-1 text-sm border rounded hover:bg-gray-50"
                   >
                     <FileText className="h-4 w-4" />
                     <span>PDF</span>
                   </button>
                   <button
                     onClick={() => handleSendEmail(quote.id)}
                     className="flex items-center space-x-1 px-3 py-1 text-sm border rounded hover:bg-gray-50"
                   >
                     <Mail className="h-4 w-4" />
                     <span>Email</span>
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
                 defaultValue={`${quoteToClone.title} (Copy)`}
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
                     {customer.name}
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

     {/* Email Modal */}
     {emailModalOpen && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 w-full max-w-lg">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-bold">Send Quote via Email</h3>
             <button onClick={() => setEmailModalOpen(false)} className="text-gray-500 hover:text-gray-700">
               <X className="h-5 w-5" />
             </button>
           </div>

           {emailSuccess ? (
             <div className="p-4 bg-green-100 text-green-800 rounded-lg mb-4 flex items-center">
               <Check className="h-5 w-5 mr-2" />
               Email sent successfully!
             </div>
           ) : (
             <form onSubmit={(e) => { e.preventDefault(); sendEmail(); }} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
                 <input
                   type="email"
                   value={emailAddress}
                   onChange={(e) => setEmailAddress(e.target.value)}
                   required
                   className="w-full p-2 border rounded-lg"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
                 <input
                   type="text"
                   value={emailSubject}
                   onChange={(e) => setEmailSubject(e.target.value)}
                   required
                   className="w-full p-2 border rounded-lg"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
                 <textarea
                   value={emailBody}
                   onChange={(e) => setEmailBody(e.target.value)}
                   rows={6}
                   required
                   className="w-full p-2 border rounded-lg"
                 />
               </div>
               <div className="flex justify-between items-center">
                 <div className="text-sm text-gray-500">
                   PDF will be attached automatically.
                 </div>
                 <div className="flex space-x-2">
                   <button
                     type="button"
                     onClick={() => setEmailModalOpen(false)}
                     className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     disabled={sendingEmail}
                     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                   >
                     {sendingEmail ? 'Sending...' : 'Send Email'}
                   </button>
                 </div>
               </div>
             </form>
           )}
         </div>
       </div>
     )}
   </div>
 );
}