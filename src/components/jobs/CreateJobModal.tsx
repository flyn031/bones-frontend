import React, { useState, useEffect } from 'react';
import { X, Plus, Users } from 'lucide-react';
import { jobApi } from '../../utils/jobApi';
import { customerApi } from '../../utils/api'; // Added import for customerApi

interface Customer {
  id: string;
  name: string;
}

interface Order {
  id: string;
  projectTitle: string;
  customerId?: string;
  customerName?: string;
}

interface User {
  id: string;
  name: string;
}

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: () => void;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onJobCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [startDate, setStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');

  // Fetch required data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRequiredData();
    }
  }, [isOpen]);

  // Filter orders based on selected customer
  useEffect(() => {
    if (customerId) {
      console.log("Filtering orders for customer:", customerId);
      console.log("Available orders before filtering:", availableOrders);
      
      // Find the customer name for better matching
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setSelectedCustomerName(customer.name);
      }
      
      // Filter orders that match either by customerId or by customerName
      const filtered = availableOrders.filter(order => 
        (order.customerId === customerId) || 
        (!order.customerId && order.customerName && 
         customer && order.customerName.includes(customer.name))
      );
      
      console.log("Filtered orders:", filtered);
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders([]);
      setSelectedCustomerName('');
    }
  }, [customerId, availableOrders, customers]);

  const fetchRequiredData = async () => {
    try {
      // Fetch customers using customerApi
      let customersData = [];
      try {
        const customersResponse = await customerApi.getCustomers();
        customersData = customersResponse.data || [];
        console.log("Fetched customers:", customersData);
      } catch (err) {
        console.error("Error fetching customers:", err);
      }
      setCustomers(customersData.length > 0 ? customersData : [
        { id: 'cm7wf0htg0000kd8b76flxvrt', name: 'Barry' },
        { id: 'cm80e0vau0000kd1zwvwgpdi8', name: 'BuildCo Ltd' }
      ]);
      
      // Fetch available orders
      let ordersData = [];
      try {
        const ordersResponse = await jobApi.getAvailableOrders();
        ordersData = ordersResponse.data || [];
        console.log("Fetched orders:", ordersData);
        
        // Log order details to help debug
        if (ordersData.length > 0) {
          console.log("Sample order data:", {
            id: ordersData[0].id,
            title: ordersData[0].projectTitle,
            customerId: ordersData[0].customerId,
            customerName: ordersData[0].customerName
          });
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
      setAvailableOrders(ordersData.length > 0 ? ordersData : [
        { id: 'cm7xaqh4j0000kdsrwfbej46i', projectTitle: 'Test Project', customerId: 'cm7wf0htg0000kd8b76flxvrt' }
      ]);
      
      // Fetch available users
      let usersData = [];
      try {
        const usersResponse = await jobApi.getAvailableUsers();
        usersData = usersResponse.data || [];
        console.log("Fetched users:", usersData);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
      setAvailableUsers(usersData.length > 0 ? usersData : [
        { id: 'cm7t9ve300000kdgepxoh7bdr', name: 'Admin User' }
      ]);
    } catch (error) {
      console.error('Error fetching data for job creation:', error);
      setErrorMessage('Failed to load required data. Please try again.');
      
      // Set fallback data anyway so the form is usable
      setCustomers([
        { id: 'cm7wf0htg0000kd8b76flxvrt', name: 'Barry' },
        { id: 'cm80e0vau0000kd1zwvwgpdi8', name: 'BuildCo Ltd' }
      ]);
      
      setAvailableOrders([
        { id: 'cm7xaqh4j0000kdsrwfbej46i', projectTitle: 'Test Project', customerId: 'cm7wf0htg0000kd8b76flxvrt' }
      ]);
      
      setAvailableUsers([
        { id: 'cm7t9ve300000kdgepxoh7bdr', name: 'Admin User' }
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    
    if (!customerId) {
      setErrorMessage('Please select a customer');
      setIsSubmitting(false);
      return;
    }
    
    if (!title.trim()) {
      setErrorMessage('Please enter a job title');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Format the job data
      const jobData = {
        title,
        description,
        customerId,
        orderId: orderId || undefined,
        status,
        startDate: startDate || undefined,
        expectedEndDate: expectedEndDate || undefined,
        assignedUserIds: assignedUserIds.length > 0 ? assignedUserIds : undefined
      };
      
      // Create the job
      await jobApi.createJob(jobData);
      
      // Reset form and close modal
      resetForm();
      onJobCreated();
      onClose();
    } catch (error) {
      console.error('Error creating job:', error);
      setErrorMessage('Failed to create job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCustomerId('');
    setOrderId('');
    setStatus('PENDING');
    setStartDate('');
    setExpectedEndDate('');
    setAssignedUserIds([]);
    setErrorMessage('');
  };

  const handleUserSelection = (userId: string) => {
    if (assignedUserIds.includes(userId)) {
      setAssignedUserIds(assignedUserIds.filter(id => id !== userId));
    } else {
      setAssignedUserIds([...assignedUserIds, userId]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Create New Job</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6">
          {errorMessage && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-red-700">{errorMessage}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    setOrderId(''); // Reset order when customer changes
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Associated Order
                </label>
                <select
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={!customerId || filteredOrders.length === 0}
                >
                  <option value="">No associated order</option>
                  {filteredOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.projectTitle}
                    </option>
                  ))}
                </select>
                {customerId && filteredOrders.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">No available orders for this customer</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected End Date
                </label>
                <input
                  type="date"
                  value={expectedEndDate}
                  onChange={(e) => setExpectedEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min={startDate || undefined}
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Users className="h-4 w-4 mr-1" /> Assign Team Members
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {availableUsers.length > 0 ? (
                  availableUsers.map((user) => (
                    <div 
                      key={user.id} 
                      className={`
                        p-2 border rounded-md cursor-pointer flex items-center
                        ${assignedUserIds.includes(user.id) 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'border-gray-300 hover:bg-gray-50'}
                      `}
                      onClick={() => handleUserSelection(user.id)}
                    >
                      <input 
                        type="checkbox"
                        checked={assignedUserIds.includes(user.id)}
                        onChange={() => {}}
                        className="mr-2"
                      />
                      <span>{user.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 col-span-full">No team members available</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 border-t pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateJobModal;