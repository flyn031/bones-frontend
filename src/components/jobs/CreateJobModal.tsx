import React, { useState, useEffect } from 'react';
import { X, Briefcase, UserPlus, Calendar, FileText } from 'lucide-react';
import { jobApi } from '../../utils/api';

// Interfaces for form data and component props
interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: () => void;
}

interface Order {
  id: string;
  projectTitle: string;
  customer?: {
    id: string;
    name: string;
  };
}

interface User {
  id: string;
  name: string;
}

export default function CreateJobModal({ 
  isOpen, 
  onClose, 
  onJobCreated 
}: CreateJobModalProps) {
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    orderId: '',
    assignedUserIds: [] as string[]
  });

  // Dropdown data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders and users on component mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [ordersResponse, usersResponse] = await Promise.all([
          jobApi.getAvailableOrders(),
          jobApi.getAvailableUsers()
        ]);

        console.log('Available orders:', ordersResponse.data);
        console.log('Available users:', usersResponse.data);

        setOrders(ordersResponse.data || []);
        setUsers(usersResponse.data || []);
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
        setError('Failed to load dropdown data');
      }
    };

    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle user assignment
  const handleUserAssignment = (userId: string) => {
    setFormData(prev => {
      const currentUserIds = prev.assignedUserIds;
      const updatedUserIds = currentUserIds.includes(userId)
        ? currentUserIds.filter(id => id !== userId)
        : [...currentUserIds, userId];
      
      return { ...prev, assignedUserIds: updatedUserIds };
    });
  };

  // Submit job creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title || !formData.orderId) {
        throw new Error('Title and Order are required');
      }

      // Create job
      const response = await jobApi.createJob(formData);
      console.log('Job created successfully:', response);
      
      // Reset form and close modal
      onJobCreated();
      onClose();
    } catch (err) {
      console.error('Job creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setIsLoading(false);
    }
  };

  // If modal is not open, return null
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center">
            <Briefcase className="mr-3 text-blue-600" />
            Create New Job
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-600 hover:text-gray-900"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          {/* Job Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Job Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter job title"
            />
          </div>

          {/* Job Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Job Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the job details"
            />
          </div>

          {/* Select Order */}
          <div>
            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700">
              Select Order
            </label>
            <select
              id="orderId"
              name="orderId"
              value={formData.orderId}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an order</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.projectTitle} - {order.customer?.name || 'No customer'}
                </option>
              ))}
            </select>
          </div>

          {/* Assign Users */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Users
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {users.map((user) => (
                <label 
                  key={user.id} 
                  className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer ${
                    formData.assignedUserIds.includes(user.id) 
                      ? 'bg-blue-100 border border-blue-500' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.assignedUserIds.includes(user.id)}
                    onChange={() => handleUserAssignment(user.id)}
                    className="hidden"
                  />
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  <span>{user?.name || 'Unnamed User'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}