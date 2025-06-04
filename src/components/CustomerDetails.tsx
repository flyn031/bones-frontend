import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Using customerApi from central api.ts is preferred for consistency
import { customerApi } from "../utils/api";
import {
    ArrowLeft, Phone, Mail, Calendar, DollarSign, Package, Clock, AlertCircle,
    Users, Plus, Star, Edit, Trash2 // <<< Added necessary icons
} from 'lucide-react';
import dayjs from 'dayjs';
import EditCustomerModal from './EditCustomerModal';
// Import the contact modal
import AddEditContactModal from './AddEditContactModal';


// --- Interfaces ---

// Existing interfaces (kept as they were)
interface CustomerFormData { name: string; email: string; phone: string; address: string; shippingAddress: string; billingAddress: string; paymentTerms: string; creditLimit: string; specialTermsNotes: string; discountPercentage: string; status: string; notes: string; }
interface CustomerDetailsData { id: string; name: string; email: string; phone: string; address?: string; shippingAddress?: string; billingAddress?: string; paymentTerms?: string; creditLimit?: number | null; specialTermsNotes?: string; discountPercentage?: number | null; status?: string; notes?: string; lastOrderDate: string | null; totalOrders: number; totalSpent: number; createdAt: string; }
interface Order { id: string; orderNumber: string; date: string; total: number; status: string; }
interface Activity { id: string; type: string; description: string; date: string; }

// --- NEW: Contact Person Interface & Enum ---
// Match Prisma Schema
export enum ContactRole { // Export enum if needed by AddEditContactModal
  ACCOUNTS = 'ACCOUNTS', DELIVERIES = 'DELIVERIES', PRIMARY_BUYER = 'PRIMARY_BUYER',
  TECHNICAL_CONTACT = 'TECHNICAL_CONTACT', SITE_CONTACT = 'SITE_CONTACT',
  PROJECT_MANAGER = 'PROJECT_MANAGER', GENERAL_INQUIRY = 'GENERAL_INQUIRY', OTHER = 'OTHER'
}
export interface ContactPerson { // Export interface if needed by AddEditContactModal
  id: string; name: string; email?: string | null; phone?: string | null;
  role?: ContactRole | null; notes?: string | null; isPrimary: boolean;
  customerId: string; createdAt: string; updatedAt: string;
}
// --- END NEW INTERFACE ---


export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetailsData | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // --- NEW STATE FOR CONTACTS ---
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactPerson | null>(null);
  const [isProcessingContactAction, setIsProcessingContactAction] = useState(false);
  // --- END NEW STATE ---

  // --- Fetch Main Customer Details (and trigger other fetches) ---
  const fetchCustomerData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    setUpdateError(null);

    if (!id) { setError("Customer ID is missing."); setIsLoading(false); return; }

    // Use central customerApi
    try {
      console.log(`[CustomerDetails] Fetching customer ${id}`);
      const customerResponse = await customerApi.getCustomerById(id);
      // FIX 1: Proper typing for API response
      setCustomer(customerResponse.data as CustomerDetailsData);

      // Trigger other fetches
      fetchContacts();
      fetchOrders();

      // Mock activities
      setActivities([
        { id: '1', type: 'order', description: `Placed new order #12345`, date: new Date().toISOString() },
        { id: '2', type: 'contact', description: `Support call regarding delivery`, date: new Date(Date.now() - 86400000).toISOString() }
      ]);

    } catch (fetchError: any) {
      console.error('Error fetching customer data:', fetchError);
      const errMsg = fetchError.response?.data?.error || fetchError.message || 'Failed to load customer information.';
      if (fetchError.response && fetchError.response.status === 404) { setError('Customer not found.'); }
      else { setError(errMsg); }
      setCustomer(null);
    } finally {
       if (showLoading) setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Keep dependencies minimal if fetchContacts/fetchOrders have their own

   // --- Fetch Orders ---
   const fetchOrders = useCallback(async () => {
    if (!id) return;
    setOrderError(null);
    console.log(`[CustomerDetails] Fetching orders for ${id}`);
    try {
        // Use central customerApi
        const ordersResponse = await customerApi.getCustomerOrders(id);
        if (Array.isArray(ordersResponse.data)) {
            const formattedOrders = ordersResponse.data.map((order: any) => ({
              id: order.id,
              orderNumber: order.orderNumber || order.quoteRef || order.id.substring(0, 8),
              date: order.date || order.createdAt,
              total: order.total || order.totalAmount || order.projectValue || 0,
              status: order.status || 'UNKNOWN'
            }));
            setRecentOrders(formattedOrders);
            console.log(`[CustomerDetails] Found ${formattedOrders.length} orders`);
        } else { setRecentOrders([]); }
    } catch (err: any) {
        console.error('Error fetching customer orders:', err);
        setOrderError(`Could not load orders: ${err.response?.data?.error || err.message}`);
        setRecentOrders([]);
    }
 }, [id]);

  // --- NEW: Fetch Contacts ---
  const fetchContacts = useCallback(async () => {
    if (!id) return;
    setIsLoadingContacts(true);
    setContactError(null);
    console.log(`[CustomerDetails] Fetching contacts for ${id}`);
    try {
        // Use central customerApi
        const response = await customerApi.getContactPersonsForCustomer(id);
        // FIX 2: Proper typing and array fallback
        const contactsData = response.data as ContactPerson[];
        setContacts(Array.isArray(contactsData) ? contactsData : []);
        console.log(`[CustomerDetails] Found ${Array.isArray(contactsData) ? contactsData.length : 0} contacts`);
    } catch (err: any) {
        console.error("Error fetching contacts:", err);
        setContactError(`Failed to load contacts: ${err.response?.data?.error || err.message}`);
        // FIX 3: Set to empty array, not empty object
        setContacts([]);
    } finally {
        setIsLoadingContacts(false);
    }
  }, [id]);

  // Initial fetch effect
  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]); // Runs when fetchCustomerData reference changes (which is only on mount due to useCallback + id dependency)

  // --- Handle Customer Update ---
  const handleUpdateCustomer = async (customerId: string, updatedData: CustomerFormData) => {
    setUpdateError(null);
    if (!customerId) { setUpdateError("Customer ID missing."); return; }

    console.log(`>>> Frontend sending PUT request to update customer: ${customerId}`);
    console.log('>>> Update data:', JSON.stringify(updatedData, null, 2));
    try {
      // Use central customerApi
      await customerApi.updateCustomer(customerId, updatedData);
      setIsEditModalOpen(false);
      fetchCustomerData(false); // Refresh without main loading indicator
    } catch (error: any) {
      console.error('Error updating customer:', error);
      const errMsg = `Error ${error.response?.status}: ${error.response?.data?.error || error.response?.data?.details || 'Failed to update customer'}`;
      setUpdateError(errMsg);
    }
  };

  // --- NEW: Handle Set Primary Contact ---
  const handleSetPrimary = async (contactId: string) => {
    if (!id) return;
    setContactError(null);
    setIsProcessingContactAction(true);
    console.log(`[CustomerDetails] Setting contact ${contactId} as primary for customer ${id}`);
    try {
        // Use central customerApi
        await customerApi.setPrimaryContactPerson(id, contactId);
        fetchContacts(); // Refresh the contacts list
    } catch (err: any) {
        console.error("Error setting primary contact:", err);
        setContactError(`Failed to set primary: ${err.response?.data?.error || err.message}`);
    } finally {
        setIsProcessingContactAction(false);
    }
  };

  // --- NEW: Handle Delete Contact ---
  const handleDeleteContact = async (contactId: string) => {
    if (!id) return;
    
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }
    
    setContactError(null);
    setIsProcessingContactAction(true);
    console.log(`[CustomerDetails] Deleting contact ${contactId} for customer ${id}`);
    
    try {
      await customerApi.deleteContactPerson(id, contactId);
      fetchContacts(); // Refresh the contacts list
    } catch (err: any) {
      console.error("Error deleting contact:", err);
      setContactError(`Failed to delete contact: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsProcessingContactAction(false);
    }
  };

  // --- NEW: Handlers for Add/Edit Contact Modal ---
  const handleOpenAddContactModal = () => {
    setEditingContact(null);
    setIsContactModalOpen(true);
    console.log("[CustomerDetails] Opening Add Contact Modal");
  };

  const handleOpenEditContactModal = (contact: ContactPerson) => {
    setEditingContact(contact);
    setIsContactModalOpen(true);
     console.log("[CustomerDetails] Opening Edit Contact Modal for:", contact.id);
  };

  const handleCloseContactModal = () => {
    setIsContactModalOpen(false);
    setEditingContact(null);
    console.log("[CustomerDetails] Closing Contact Modal");
  };

  const handleContactSaved = () => {
    handleCloseContactModal();
    fetchContacts(); // Refresh contacts list
    console.log("[CustomerDetails] Contact Saved, refreshing list.");
  };
  // --- END NEW HANDLERS ---


  // Utility functions (keep getStatusColor)
  const getStatusColor = (status: string | undefined): string => { /* ... keep as is ... */
      if (!status) return 'bg-gray-100 text-gray-800';
      const statusUpper = status.toUpperCase();
      if (statusUpper.includes('COMPLETE')) return 'bg-green-100 text-green-800';
      if (statusUpper.includes('PENDING') || statusUpper === 'DRAFT') return 'bg-yellow-100 text-yellow-800';
      if (statusUpper.includes('CANCEL')) return 'bg-red-100 text-red-800';
      if (statusUpper.includes('PRODUCTION') || statusUpper.includes('PROGRESS')) return 'bg-blue-100 text-blue-800';
      return 'bg-gray-100 text-gray-800';
  };

  // Helper to format ContactRole enum for display
  const formatRole = (role: ContactRole | null | undefined): string => {
    if (!role) return 'No role specified';
    return role.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  // --- Render Logic ---

  if (isLoading) { return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-600">Loading customer details...</div></div>; }
  if (error && !customer) { return <div className="min-h-screen flex items-center justify-center"><div className="text-red-600 p-4 bg-red-100 border border-red-300 rounded">{error} <button onClick={() => navigate('/customers')} className="ml-4 text-sm text-blue-600 underline">Go Back</button></div></div>; }
  if (!customer) { return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-600">Could not load customer data.</div></div>; }


  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/customers')} className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"><ArrowLeft className="h-4 w-4 mr-1" />Back to Customers</button>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{customer.name}</h1>
          <button onClick={() => setIsEditModalOpen(true)} className="px-4 py-1.5 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">Edit Customer</button>
        </div>
        {updateError && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-300 text-sm"><strong>Update Failed:</strong> {updateError}</div>}
      </div>

      {/* --- Main Content Grid (Adjust grid columns for 3 cards) --- */}
      {/* Changed md:grid-cols-2 to lg:grid-cols-3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Column 1: Contact Info (Your Existing Card) */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
          <div className="space-y-3">
              <div className="flex items-center text-gray-600 text-sm"><Mail className="h-4 w-4 mr-2 flex-shrink-0" /><a href={`mailto:${customer.email}`} className="hover:text-blue-600 truncate">{customer.email || 'N/A'}</a></div>
              <div className="flex items-center text-gray-600 text-sm"><Phone className="h-4 w-4 mr-2 flex-shrink-0" /><a href={`tel:${customer.phone}`} className="hover:text-blue-600">{customer.phone || 'N/A'}</a></div>
              <div className="text-sm text-gray-600 pt-2"><strong className="font-medium text-gray-700">Address:</strong><p className="whitespace-pre-wrap mt-1">{customer.address || 'N/A'}</p></div>
              {customer.shippingAddress && <div className="text-sm text-gray-600 pt-2"><strong className="font-medium text-gray-700">Shipping Address:</strong><p className="whitespace-pre-wrap mt-1">{customer.shippingAddress}</p></div>}
              {customer.billingAddress && <div className="text-sm text-gray-600 pt-2"><strong className="font-medium text-gray-700">Billing Address:</strong><p className="whitespace-pre-wrap mt-1">{customer.billingAddress}</p></div>}
          </div>
        </div>

        {/* Column 2: Overview (Your Existing Card) */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Overview & Terms</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {/* Stats */}
              <div><div className="text-sm text-gray-500">Total Orders</div><div className="text-xl font-semibold flex items-center"><Package className="h-5 w-5 mr-1 text-blue-500" />{recentOrders?.length ?? customer.totalOrders ?? 0}</div></div>
              <div><div className="text-sm text-gray-500">Total Spent</div><div className="text-xl font-semibold flex items-center"><DollarSign className="h-5 w-5 mr-1 text-green-500" />£{customer.totalSpent?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</div></div>
              <div><div className="text-sm text-gray-500">Last Order</div><div className="text-sm flex items-center"><Calendar className="h-4 w-4 mr-1 text-purple-500" />{customer.lastOrderDate ? dayjs(customer.lastOrderDate).format('DD MMM YYYY') : 'N/A'}</div></div>
              <div><div className="text-sm text-gray-500">Customer Since</div><div className="text-sm flex items-center"><Clock className="h-4 w-4 mr-1 text-gray-500" />{dayjs(customer.createdAt).format('DD MMM YYYY')}</div></div>
              {/* Terms */}
              <div className="col-span-2 pt-2 border-t mt-2"><div className="text-sm text-gray-500">Payment Terms</div><div className="text-base font-medium">{customer.paymentTerms || 'N/A'}</div></div>
              <div><div className="text-sm text-gray-500">Credit Limit</div><div className="text-base font-medium">{customer.creditLimit != null ? `£${customer.creditLimit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}</div></div>
              <div><div className="text-sm text-gray-500">Discount</div><div className="text-base font-medium">{customer.discountPercentage != null ? `${customer.discountPercentage}%` : 'N/A'}</div></div>
          </div>
        </div>

        {/* --- Column 3: NEW Contacts Card --- */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-semibold flex items-center"><Users className="h-5 w-5 mr-2 text-gray-600"/>Contacts</h2>
             <button
                onClick={handleOpenAddContactModal}
                className="flex items-center px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                aria-label="Add New Contact"
             >
                 <Plus className="h-3 w-3 mr-1"/> Add
             </button>
          </div>
          {isLoadingContacts && <div className="text-center text-gray-500 text-sm py-4">Loading contacts...</div>}
          {contactError && <div className="text-center text-red-600 text-sm py-4 bg-red-50 border border-red-200 rounded p-2">{contactError}</div>}
          {!isLoadingContacts && !contactError && contacts.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-4 italic">No contacts added yet.</div>
          )}
          {!isLoadingContacts && !contactError && contacts.length > 0 && (
              // Added max-h and overflow-y-auto for potentially long lists
              <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {contacts.map(contact => (
                      <li key={contact.id} className="p-3 border rounded-md bg-gray-50 group relative hover:bg-gray-100 transition-colors duration-150">
                          <div className="flex justify-between items-start">
                              <div>
                                  <p className={`font-medium text-gray-900 text-sm ${contact.isPrimary ? 'flex items-center' : ''}`}>
                                      {contact.isPrimary && <Star className="h-4 w-4 text-yellow-400 fill-current mr-1.5 flex-shrink-0"/>}
                                      {contact.name}
                                  </p>
                                  {contact.role && <p className="text-xs text-gray-500">{formatRole(contact.role)}</p>}
                              </div>
                              {/* Action buttons */}
                              <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                 {!contact.isPrimary && (
                                      <button
                                          onClick={() => handleSetPrimary(contact.id)}
                                          disabled={isProcessingContactAction}
                                          className={`p-1 rounded ${isProcessingContactAction ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:bg-yellow-100 hover:text-yellow-600'}`}
                                          aria-label="Make Primary"
                                      >
                                          <Star className="h-4 w-4" />
                                      </button>
                                  )}
                                  {/* Edit Button */}
                                  <button onClick={() => handleOpenEditContactModal(contact)} className="p-1 rounded text-gray-400 hover:bg-blue-100 hover:text-blue-600" aria-label="Edit"><Edit className="h-4 w-4" /></button>
                                  {/* Delete Button */}
                                  <button onClick={() => handleDeleteContact(contact.id)} className="p-1 rounded text-gray-400 hover:bg-red-100 hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                              </div>
                          </div>
                          <div className="mt-2 text-xs space-y-1">
                              {contact.email && <p className="flex items-center text-gray-600"><Mail className="h-3 w-3 mr-1.5 flex-shrink-0"/> <a href={`mailto:${contact.email}`} className="hover:underline truncate">{contact.email}</a></p>}
                              {contact.phone && <p className="flex items-center text-gray-600"><Phone className="h-3 w-3 mr-1.5 flex-shrink-0"/> <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a></p>}
                              {contact.notes && <p className="text-gray-500 italic pt-1">Note: {contact.notes}</p>}
                          </div>
                      </li>
                  ))}
              </ul>
          )}
        </div>
        {/* --- END NEW CONTACTS CARD --- */}

      </div> {/* End Main 3-Column Grid */}

       {/* Special Terms/Notes Section (Your existing code) */}
       {(customer.specialTermsNotes || customer.notes) && (
         <div className="bg-white rounded-lg shadow p-6 mb-8">
           <h2 className="text-lg font-semibold mb-4">Notes & Special Terms</h2>
           {customer.specialTermsNotes && (
                <div className="mb-3">
                     <strong className="block text-sm font-medium text-gray-800">Special Terms:</strong>
                     <p className="text-gray-600 whitespace-pre-wrap mt-1">{customer.specialTermsNotes}</p>
                </div>
            )}
             {customer.notes && (
                 <div>
                     <strong className="block text-sm font-medium text-gray-800">General Notes:</strong>
                     <p className="text-gray-600 whitespace-pre-wrap mt-1">{customer.notes}</p>
                 </div>
             )}
         </div>
       )}

      {/* Recent Orders Table (Your existing code) */}
      <div className="bg-white rounded-lg shadow mb-8">
         <div className="p-6">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-semibold">Recent Orders</h2>
             <button onClick={() => {/* Add new order functionality */}} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">New Order</button>
           </div>
           {orderError && <div className="flex items-center p-4 mb-4 bg-red-50 border border-red-200 rounded-md"><AlertCircle className="h-5 w-5 text-red-500 mr-2" /> <span className="text-red-700">{orderError}</span></div>}
           {!orderError && recentOrders.length > 0 ? (
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th></tr></thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {recentOrders.map((order) => (
                     <tr key={order.id}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderNumber || order.id.substring(0, 8)}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date ? dayjs(order.date).format('MMM D, YYYY') : 'Unknown date'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£{typeof order.total === 'number' ? order.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</td><td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>{order.status}</span></td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button onClick={() => navigate(`/orders/${order.id}`)} className="text-blue-600 hover:text-blue-900">View Order</button></td></tr>
                   ))}
                 </tbody>
               </table>
             </div>
           ) : ( <div className="text-center py-8 text-gray-500">{orderError ? '' : 'No orders found for this customer'}</div>)}
         </div>
       </div>

      {/* Activity Timeline (Your existing code) */}
      <div className="bg-white rounded-lg shadow">
          <div className="p-6">
           <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
           {activities.length > 0 ? ( <div className="space-y-4">{activities.map((activity) => ( <div key={activity.id} className="flex items-start space-x-3"><div className="flex-shrink-0"><div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center"><Clock className="h-4 w-4 text-blue-600" /></div></div><div className="flex-1"><p className="text-sm font-medium text-gray-900">{activity.description}</p><p className="text-sm text-gray-500">{dayjs(activity.date).format('MMM D, YYYY [at] h:mm A')}</p></div></div>))}</div>) : ( <div className="text-center py-8 text-gray-500">No recent activity</div>)}
         </div>
       </div>

      {/* Edit Customer Modal (Your existing code) */}
      {customer && ( <EditCustomerModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} customerToEdit={customer} onUpdate={handleUpdateCustomer} /> )}

      {/* Add/Edit Contact Modal */}
      {isContactModalOpen && id && (
          <AddEditContactModal
              isOpen={isContactModalOpen}
              onClose={handleCloseContactModal}
              onSave={handleContactSaved}
              customerId={id}
              contactToEdit={editingContact}
           />
       )}

    </div>
  );
}