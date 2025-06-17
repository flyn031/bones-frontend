import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddCustomerModal from './AddCustomerModal';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext'; // <-- CORRECT (Only one level up)

// Define the ContactPerson interface
interface ContactPerson {
  id?: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  notes: string | null;
  isPrimary: boolean;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string; // Assuming 'notes' might still be part of fetched data structure? Or remove if unused.
  address?: string; // Add new fields potentially returned by API
  shippingAddress?: string;
  billingAddress?: string;
  paymentTerms?: string;
  creditLimit?: number | null;
  specialTermsNotes?: string; // Add new fields potentially returned by API
  discountPercentage?: number | null;
  lastOrderDate: Date | null;
  totalOrders: number;
  totalSpent: number;
  createdAt: Date;
  status?: 'ACTIVE' | 'INACTIVE' | 'AT_RISK' | 'NEW' | 'VIP'; // Added VIP based on getCustomerStatus
  contactPersons?: ContactPerson[]; // Add contactPersons to the interface
}

// Update response interface if backend sends different structure
interface CustomerResponse {
  customers: Customer[];
  totalPages: number;
  currentPage: number;
  totalCustomers: number; // Match backend naming convention if needed
}

// Define the CustomerFormData interface
interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  shippingAddress: string;
  billingAddress: string;
  paymentTerms: string;
  creditLimit: string;
  specialTermsNotes: string;
  discountPercentage: string;
  status: string;
  notes: string;
  contacts: ContactPerson[]; // Include contacts array
}

export default function Customers() {
  const navigate = useNavigate();
  const { user } = useAuth(); // <-- Get user data from context
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0); // Use totalCustomers if backend returns that
  const [pageSize] = useState(20);

  const getCustomerStatus = (customer: Customer) => {
    // Use customer.status if available from backend first
    if (customer.status && ['ACTIVE', 'INACTIVE', 'AT_RISK', 'NEW', 'VIP'].includes(customer.status)) {
         switch (customer.status) {
             case 'ACTIVE': return { label: 'ACTIVE', color: 'bg-green-100 text-green-800' };
             case 'INACTIVE': return { label: 'INACTIVE', color: 'bg-red-100 text-red-800' };
             case 'AT_RISK': return { label: 'AT RISK', color: 'bg-yellow-100 text-yellow-800' };
             case 'NEW': return { label: 'NEW', color: 'bg-blue-100 text-blue-800' };
             case 'VIP': return { label: 'VIP', color: 'bg-purple-100 text-purple-800' };
             default: return { label: 'UNKNOWN', color: 'bg-gray-100 text-gray-800'}; // Fallback
         }
     }

    // Fallback logic if status field is missing
    if (!customer.lastOrderDate) return {
      label: 'NEW',
      color: 'bg-blue-100 text-blue-800'
    };

    const daysSinceLastOrder = dayjs().diff(customer.lastOrderDate, 'days');
    const averageOrderValue = customer.totalOrders ? customer.totalSpent / customer.totalOrders : 0; // Handle division by zero

    if (daysSinceLastOrder <= 90 && averageOrderValue > 5000) return {
      label: 'VIP',
      color: 'bg-purple-100 text-purple-800'
    };

    if (daysSinceLastOrder <= 90) return {
      label: 'ACTIVE',
      color: 'bg-green-100 text-green-800'
    };

    if (daysSinceLastOrder <= 180) return {
      label: 'AT RISK',
      color: 'bg-yellow-100 text-yellow-800'
    };

    return {
      label: 'INACTIVE',
      color: 'bg-red-100 text-red-800'
    };
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null); // Clear previous errors
    try {
      const token = localStorage.getItem('token'); // Get token
      if (!token) {
        setError("Authentication token not found. Please log in.");
        setIsLoading(false);
        // Optionally redirect to login: navigate('/login');
        return;
      }

      // FIXED: Update to use Vite environment variable
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const response = await axios.get<CustomerResponse>(
        `${apiUrl}/customers?page=${page}&limit=${pageSize}&search=${searchTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${token}` // Use token
          }
        }
      );

      console.log('API response for fetching customers:', response.data);

      // Expecting { customers: [], totalPages: X, currentPage: Y, totalCustomers: Z }
      if (response.data && Array.isArray(response.data.customers)) {
        setCustomers(response.data.customers);
        setTotalPages(response.data.totalPages || 1); // Use default if missing
        // Use totalCustomers if available, otherwise calculate based on what's returned
        setTotal(response.data.totalCustomers || response.data.customers.length);
        // Ensure currentPage matches response if backend sends it reliably
        if (response.data.currentPage && response.data.currentPage !== page) {
          setPage(response.data.currentPage);
        }

      } else {
        console.warn("Received unexpected data format while fetching customers:", response.data);
        throw new Error('Invalid response format received from server.');
      }
    } catch (error: any) { // Type error for better checking
      console.error('Error fetching customers:', error);
       // More specific error handling
       if (error.response) {
           // The request was made and the server responded with a status code
           // that falls out of the range of 2xx
           console.error("Server Response Error Data:", error.response.data);
           console.error("Server Response Error Status:", error.response.status);
           setError(`Error ${error.response.status}: ${error.response.data?.error || error.response.data?.message || 'Failed to fetch customers'}`);
           if (error.response.status === 401 || error.response.status === 403) {
               // Handle auth errors, maybe redirect to login
               setError("Authentication failed. Please log in again.");
               // navigate('/login');
           }
       } else if (error.request) {
           // The request was made but no response was received
           console.error("No response received:", error.request);
           setError('Network Error: Could not connect to the server. Is it running?');
       } else {
           // Something happened in setting up the request that triggered an Error
           console.error('Error setting up request:', error.message);
           setError(`Request Setup Error: ${error.message}`);
       }
      setCustomers([]); // Clear customers on error
      setTotalPages(1);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, searchTerm]); // Dependencies remain the same

  const handleViewDetails = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  // The 'data' parameter here comes from the AddCustomerModal's onSubmit
  // Update to use CustomerFormData interface
  const handleAddCustomer = async (data: CustomerFormData) => {
     setError(null); // Clear previous errors
    try {
      const token = localStorage.getItem('token'); // Get token
       if (!token) {
         setError("Authentication token not found. Please log in.");
         return; // Stop if no token
       }

      // --- <<< ADDED LOGGING HERE >>> ---
      console.log('>>> Frontend sending this data to POST /api/customers:', JSON.stringify(data, null, 2));
      // --- <<< END ADDED LOGGING >>> ---

      // FIXED: Update to use Vite environment variable
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      await axios.post(`${apiUrl}/customers`, data, {
        headers: {
          'Authorization': `Bearer ${token}` // Use token
          // Content-Type is usually set automatically by Axios for JSON
        }
      });

      setIsModalOpen(false); // Close modal on success
      setPage(1); // Reset to first page to see the new customer
      fetchCustomers(); // Refresh the list

    } catch (error: any) { // Type error
      console.error('Error adding customer:', error);
      // Provide more detailed error feedback to the user
      if (error.response) {
           console.error("Server Response Error Data:", error.response.data);
           console.error("Server Response Error Status:", error.response.status);
           // Use the specific error from the backend if available
           setError(`Error ${error.response.status}: ${error.response.data?.error || error.response.data?.details || 'Failed to add customer'}`);
      } else if (error.request) {
           setError('Network Error: Could not connect to the server while adding customer.');
      } else {
           setError(`Request Setup Error: ${error.message}`);
      }
    }
  };


  if (isLoading && customers.length === 0) {
    return <div className="p-8 flex justify-center">Loading customers...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        {/* --- UPDATED TITLE --- */}
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            {user?.companyName || 'Company'} - Customer Management
        </h2>
        {/* --- END UPDATED TITLE --- */}

        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reset page on new search
              }}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2
                       px-3 py-1.5
                       bg-blue-600 text-white
                       rounded-md
                       text-sm
                       font-medium
                       hover:bg-blue-700
                       transition-colors
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" // Added focus styles
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </button>

          {/* Removed CustomerImport assuming AddCustomerModal handles adding */}
          {/* <CustomerImport onImportSuccess={fetchCustomers} /> Pass refresh function */}

          <div className="flex border rounded-lg dark:border-gray-600">
            <button
              onClick={() => setViewType('grid')}
              className={`px-3 py-2 ${viewType === 'grid' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} text-gray-600 dark:text-gray-300 rounded-l-lg focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500`} // Added focus styles
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`-ml-px px-3 py-2 ${viewType === 'list' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} text-gray-600 dark:text-gray-300 rounded-r-lg border-l dark:border-gray-600 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500`} // Added focus styles
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {/* Display error prominently if it exists */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg dark:bg-red-900/30 dark:text-red-300">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {customers.length === 0 && !isLoading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchTerm ? 'No customers found matching your search' : 'No customers added yet. Click "Add Customer" to start.'}
        </div>
      ) : (
        <>
          {viewType === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customers.map((customer) => {
                const statusInfo = getCustomerStatus(customer); // Renamed variable
                // Get primary contact if available
                const primaryContact = customer.contactPersons?.find(contact => contact.isPrimary);
                
                return (
                  <div key={customer.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border dark:border-gray-700 flex flex-col"> {/* Added flex flex-col */}
                    <div className="p-6 flex-grow"> {/* Added flex-grow */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{customer.name}</h3>
                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{customer.email || 'No email'}</div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <div>Phone: {customer.phone || 'N/A'}</div>
                        {/* Display primary contact if available */}
                        {primaryContact && (
                          <div className="py-1 px-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800 mt-2 mb-2">
                            <div className="font-medium text-blue-800 dark:text-blue-300">Primary Contact:</div>
                            <div>{primaryContact.name}</div>
                            {primaryContact.role && <div className="text-xs text-gray-500">{primaryContact.role.replace(/_/g, ' ')}</div>}
                            {primaryContact.email && <div className="text-xs">{primaryContact.email}</div>}
                          </div>
                        )}
                        <div>Orders: {customer.totalOrders || 0}</div>
                        <div>Total Spent: £{(customer.totalSpent || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div> {/* Format currency */}
                        {customer.lastOrderDate && (
                          <div>Last Order: {dayjs(customer.lastOrderDate).format('DD MMM YYYY')}</div> // Corrected format
                        )}
                         {/* Add CreatedAt if needed */}
                         <div>Added: {dayjs(customer.createdAt).format('DD MMM YYYY')}</div>
                      </div>
                    </div>

                    <div className="mt-auto p-4 pt-4 border-t dark:border-gray-700 flex justify-end space-x-2 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg"> {/* Added mt-auto */}
                      <button
                        onClick={() => handleViewDetails(customer.id)}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        View Details
                      </button>
                      {/* Add Edit/Delete buttons here if applicable */}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // List View
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto border dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Primary Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"> {/* Centered */}
                      Orders
                    </th>
                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Spent
                    </th>
                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Last Order
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {customers.map((customer) => {
                    const statusInfo = getCustomerStatus(customer); // Renamed variable
                    // Get primary contact if available
                    const primaryContact = customer.contactPersons?.find(contact => contact.isPrimary);
                    
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Added: {dayjs(customer.createdAt).format('DD MMM YYYY')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                             <div className="text-sm text-gray-900 dark:text-gray-300">{customer.email || 'N/A'}</div>
                             <div className="text-sm text-gray-500 dark:text-gray-400">{customer.phone || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {primaryContact ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{primaryContact.name}</div>
                              {primaryContact.role && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">{primaryContact.role.replace(/_/g, ' ')}</div>
                              )}
                              {primaryContact.email && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">{primaryContact.email}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">{customer.totalOrders || 0}</td> {/* Centered */}
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                           £{(customer.totalSpent || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                           {customer.lastOrderDate ? dayjs(customer.lastOrderDate).format('DD MMM YYYY') : 'N/A'}
                         </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewDetails(customer.id)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            View Details
                          </button>
                          {/* Add Edit/Delete links here if applicable */}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
             <span className="text-sm text-gray-700 dark:text-gray-400">
               Showing <span className="font-semibold">{((page - 1) * pageSize) + 1}</span> to <span className="font-semibold">{Math.min(page * pageSize, total)}</span> of <span className="font-semibold">{total}</span> Customers
             </span>
             <div className="inline-flex items-center rounded-md shadow-sm -space-x-px">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-5 w-5" />
                 </button>

                 {/* Page indicator can be added here if needed */}
                 <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
                   Page {page} of {totalPages}
                 </span>

                 <button
                  disabled={page === totalPages}
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                   className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                   aria-label="Next page"
                 >
                   <ChevronRight className="h-5 w-5" />
                 </button>
            </div>
          </div>
       )}

      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddCustomer} // This passes the data from the modal form here
      />
    </div>
  );
}