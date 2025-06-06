import React, { useState, useEffect } from 'react';
import { X, Users, DollarSign } from 'lucide-react'; // Added DollarSign
// Corrected: Import BOTH from the same central api file
import { jobApi, customerApi } from '../../utils/api'; // <<< CORRECTED IMPORT PATH

// Interfaces (keep as they are)
interface Customer { id: string; name: string; }
interface Order { id: string; projectTitle: string; customerId?: string; customerName?: string; }
interface User { id: string; name: string; }

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: () => void;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onJobCreated }) => {
  // --- Form State ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState('PENDING'); // Default status
  const [startDate, setStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<string>(''); // <<< ADDED STATE (use string for input)
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);

  // --- Data for Dropdowns ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // --- UI State ---
  const [isLoadingData, setIsLoadingData] = useState(false); // For dropdown data loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // const [selectedCustomerName, setSelectedCustomerName] = useState(''); // Removed, filter logic simplified

  // Fetch required data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRequiredData();
      // Reset form fields when modal opens
      resetForm();
    }
  }, [isOpen]);

  // Filter orders based on selected customer
  useEffect(() => {
    if (customerId) {
      const filtered = availableOrders.filter(order => order.customerId === customerId);
      setFilteredOrders(filtered);
    } else {
      // If no customer selected, show no orders initially (or all available if preferred)
      setFilteredOrders([]);
    }
  }, [customerId, availableOrders]);

  const fetchRequiredData = async () => {
    setIsLoadingData(true);
    setErrorMessage(''); // Clear previous errors
    try {
        // Fetch all data concurrently
        const [customersResponse, ordersResponse, usersResponse] = await Promise.all([
            // Adjust fallback in catch to match expected structure if needed
            customerApi.getCustomers().catch(err => { console.error("Customer fetch failed:", err); return { data: { customers: [] } }; }), // <<< Adjusted fallback
            jobApi.getAvailableOrders().catch(err => { console.error("Orders fetch failed:", err); return { data: [] }; }),
            jobApi.getAvailableUsers().catch(err => { console.error("Users fetch failed:", err); return { data: [] }; })
        ]);

        console.log("Fetched customers RESPONSE OBJECT:", customersResponse);
        console.log("Fetched orders RESPONSE OBJECT:", ordersResponse);
        console.log("Fetched users RESPONSE OBJECT:", usersResponse);

        // --- CORRECTED STATE UPDATE ---
        // Access the nested 'customers' array within the response data
        setCustomers(customersResponse.data?.customers || []);
        // --- END CORRECTION ---

        // Assuming orders and users data are returned directly as arrays in response.data
        // If not, adjust these lines similarly based on their actual response structure.
        setAvailableOrders(ordersResponse.data || []);
        setAvailableUsers(usersResponse.data || []);

        // Check if any fetch failed and inform user if necessary (check based on corrected customer access)
        if (!customersResponse.data?.customers && !ordersResponse.data && !usersResponse.data) {
             setErrorMessage('Failed to load required data for dropdowns.');
        }

    } catch (error) {
        // This catch might not be reached if individual promises have catches,
        // but kept as a safeguard.
        console.error('Error fetching data for job creation:', error);
        setErrorMessage('Failed to load required data. Please try again.');
        // Ensure state is empty arrays on major failure
        setCustomers([]);
        setAvailableOrders([]);
        setAvailableUsers([]);
    } finally {
        setIsLoadingData(false);
    }
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    // --- Validation ---
    if (!customerId) {
      setErrorMessage('Please select a customer.');
      setIsSubmitting(false);
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please enter a job title.');
      setIsSubmitting(false);
      return;
    }
    if (!expectedEndDate) { // Make expectedEndDate required
        setErrorMessage('Please select an expected end date.');
        setIsSubmitting(false);
        return;
    }
    if (estimatedCost === '' || isNaN(parseFloat(estimatedCost))) { // Make estimatedCost required & numeric
        setErrorMessage('Please enter a valid estimated cost.');
        setIsSubmitting(false);
        return;
    }

    try {
      // --- Prepare Job Data (including estimatedCost) ---
      const jobData = {
        title: title.trim(),
        description: description.trim() || undefined, // Send undefined if empty
        customerId,
        orderId: orderId || undefined, // Send undefined if no order selected
        status, // Send selected status
        startDate: startDate || undefined, // Send undefined if empty
        expectedEndDate: expectedEndDate, // Already validated
        estimatedCost: parseFloat(estimatedCost), // <<< ADDED & PARSED
        assignedUserIds: assignedUserIds.length > 0 ? assignedUserIds : undefined
      };

      console.log("Submitting job data:", jobData);

      // Create the job using the corrected jobApi import
      await jobApi.createJob(jobData);

      onJobCreated(); // Callback to refresh list in parent
      onClose(); // Close modal on success

    } catch (error: any) { // Catch specific errors if possible
      console.error('Error creating job:', error);
       const backendError = error.response?.data?.message || error.response?.data?.error || 'Failed to create job. Please check details and try again.';
      setErrorMessage(backendError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form fields (including estimatedCost)
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCustomerId('');
    setOrderId('');
    setStatus('PENDING'); // Reset to default status
    setStartDate('');
    setExpectedEndDate('');
    setEstimatedCost(''); // <<< RESET ADDED FIELD
    setAssignedUserIds([]);
    setErrorMessage('');
    setIsLoadingData(false); // Reset loading indicators
    setIsSubmitting(false);
  };

  const handleUserSelection = (userId: string) => {
    setAssignedUserIds(prev =>
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  if (!isOpen) return null;

  // --- JSX Structure ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold text-gray-800">Create New Job</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
           {/* Loading Indicator for Dropdowns */}
            {isLoadingData && <p className="text-center text-gray-500">Loading options...</p>}

           {/* Error Message Area */}
          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Customer Dropdown */}
            <div>
              <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                id="customer"
                value={customerId}
                onChange={(e) => { setCustomerId(e.target.value); setOrderId(''); }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                required
                disabled={isLoadingData}
              >
                <option value="" disabled>
                    {isLoadingData ? 'Loading...' : 'Select a customer'}
                </option>
                {/* Check if customers is actually an array before mapping */}
                {Array.isArray(customers) && customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
               {/* Show message if API worked but returned no customers */}
               {!isLoadingData && customers.length === 0 && errorMessage === '' && (
                   <p className="mt-1 text-xs text-gray-500">No customers found. Create one first?</p>
               )}
            </div>

            {/* Job Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Job Title / Reference <span className="text-red-500">*</span>
              </label>
              <input
                id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

             {/* Associated Order Dropdown */}
             <div>
               <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
                 Link to Order (Optional)
               </label>
               <select
                 id="order" value={orderId} onChange={(e) => setOrderId(e.target.value)}
                 className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                 disabled={isLoadingData || !customerId || availableOrders.length === 0} // Also disable if no orders available at all
               >
                 <option value="">{customerId ? 'Do not link to order' : 'Select customer first'}</option>
                 {/* Only map if customer is selected */}
                 {customerId && Array.isArray(filteredOrders) && filteredOrders.map((order) => (
                   <option key={order.id} value={order.id}>
                     {order.projectTitle}
                   </option>
                 ))}
               </select>
               {customerId && !isLoadingData && availableOrders.length > 0 && filteredOrders.length === 0 && (
                 <p className="mt-1 text-xs text-gray-500">No available orders found for this customer.</p>
               )}
                {customerId && !isLoadingData && availableOrders.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">No available orders in the system.</p>
               )}
             </div>

             {/* Estimated Cost Input */}
             <div>
               <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-700 mb-1">
                 Estimated Cost (£) <span className="text-red-500">*</span>
               </label>
               <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                   <input
                     id="estimatedCost" type="number" value={estimatedCost}
                     onChange={(e) => setEstimatedCost(e.target.value)}
                     className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                     required min="0" step="0.01" // Allow decimals
                     placeholder="e.g., 1500.50"
                   />
               </div>
             </div>


            {/* Dates */}
             <div>
               <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
               <input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                 className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
               />
             </div>

            <div>
              <label htmlFor="expectedEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                Expected End Date <span className="text-red-500">*</span>
              </label>
              <input id="expectedEndDate" type="date" value={expectedEndDate} onChange={(e) => setExpectedEndDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min={startDate || undefined} required
              />
            </div>

            {/* Status */}
             <div className="md:col-span-2">
               <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
               <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}
                 className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
               >
                 {/* Ensure these values match backend JobStatus enum */}
                 <option value="DRAFT">Draft</option>
                 <option value="PENDING">Pending</option>
                 <option value="ACTIVE">Active</option>
                 <option value="IN_PROGRESS">In Progress</option>
                 <option value="COMPLETED">Completed</option>
                 <option value="CANCELED">Cancelled</option>
               </select>
             </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)}
                rows={3} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Assign Users */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Users className="h-4 w-4 mr-1" /> Assign Team Members (Optional)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border p-2 rounded-md">
                {!isLoadingData && Array.isArray(availableUsers) && availableUsers.length > 0 ? (
                  availableUsers.map((user) => (
                    <label key={user.id} className={`p-2 border rounded-md cursor-pointer flex items-center text-sm ${assignedUserIds.includes(user.id) ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={assignedUserIds.includes(user.id)} onChange={() => handleUserSelection(user.id)} className="mr-2 h-4 w-4 accent-blue-600" />
                      <span>{user.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm col-span-full">{isLoadingData ? 'Loading users...' : 'No team members available'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer/Actions */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-5 mt-6">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isSubmitting || isLoadingData} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJobModal;