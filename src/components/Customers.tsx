import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AddCustomerModal from './AddCustomerModal';
import CustomerImport from './CustomerImport';
import dayjs from 'dayjs';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  lastOrderDate: Date | null;
  totalOrders: number;
  totalSpent: number;
  createdAt: Date;
  status?: 'ACTIVE' | 'INACTIVE' | 'AT_RISK' | 'NEW';
}

interface CustomerResponse {
  customers: Customer[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);

  const getCustomerStatus = (customer: Customer) => {
    if (!customer.lastOrderDate) return {
      label: 'NEW',
      color: 'bg-blue-100 text-blue-800'
    };

    const daysSinceLastOrder = dayjs().diff(customer.lastOrderDate, 'days');
    const averageOrderValue = customer.totalSpent / customer.totalOrders;

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
    try {
      const response = await axios.get<CustomerResponse>(
        `http://localhost:4000/api/customers?page=${page}&limit=${pageSize}&search=${searchTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      console.log('API response:', response.data);

      if (response.data && Array.isArray(response.data.customers)) {
        setCustomers(response.data.customers);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to fetch customers');
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, searchTerm]);

  const handleViewDetails = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  const handleAddCustomer = async (data: any) => {
    try {
      await axios.post('http://localhost:4000/api/customers', data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setIsModalOpen(false);
      setPage(1); // Reset to first page
      fetchCustomers(); // Refresh the list
    } catch (error) {
      console.error('Error adding customer:', error);
      setError('Failed to add customer');
    }
  };

  // Retrieve company name from localStorage
  const companyName = localStorage.getItem('companyName') || 'Your Company';

  if (isLoading && customers.length === 0) {
    return <div className="p-8 flex justify-center">Loading customers...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">{companyName} - Customer Management</h2>
        
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 
                       px-3 py-1.5 
                       bg-blue-600 text-white 
                       rounded-md 
                       text-sm 
                       hover:bg-blue-700 
                       transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </button>
          
          <CustomerImport />
          
          <div className="flex border rounded-lg">
            <button 
              onClick={() => setViewType('grid')}
              className={`px-3 py-2 ${viewType === 'grid' ? 'bg-gray-100' : ''}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewType('list')}
              className={`px-3 py-2 ${viewType === 'list' ? 'bg-gray-100' : ''}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {customers.length === 0 && !isLoading ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'No customers found matching your search' : 'No customers yet'}
        </div>
      ) : (
        <>
          {viewType === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customers.map((customer) => {
                const status = getCustomerStatus(customer);
                return (
                  <div key={customer.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{customer.name}</h3>
                          <div className="mt-1 text-sm text-gray-500">{customer.email}</div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-4 text-sm text-gray-500">
                        <div>Phone: {customer.phone}</div>
                        <div>Orders: {customer.totalOrders}</div>
                        <div>Total Spent: ${customer.totalSpent?.toLocaleString()}</div>
                        {customer.lastOrderDate && (
                          <div>Last Order: {dayjs(customer.lastOrderDate).format('MMM D, YYYY')}</div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(customer.id)}
                          className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => {
                    const status = getCustomerStatus(customer);
                    return (
                      <tr key={customer.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {customer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.totalOrders}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewDetails(customer.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Details
                          </button>
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

      <div className="mt-8 flex justify-between items-center">
        <button
          disabled={page === 1}
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>

        <button
          disabled={page === totalPages}
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddCustomer}
      />
    </div>
  );
}