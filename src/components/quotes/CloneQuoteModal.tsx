import React, { useState, useEffect } from 'react';
import { quoteApi } from '../../utils/api';

// Interface definitions
interface Customer {
  id: string;
  name: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  materialId?: string;
}

interface Quote {
  id: string;
  title: string;
  description: string;
  customerId: string;
  customer: Customer;
  lineItems: LineItem[];
}

interface CloneQuoteModalProps {
  quote: Quote | null;
  onClose: () => void;
  onSuccess: () => void;
  customers: Customer[];
}

const CloneQuoteModal: React.FC<CloneQuoteModalProps> = ({ 
  quote, 
  onClose, 
  onSuccess,
  customers 
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [newTitle, setNewTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Set default values when quote changes
    if (quote) {
      setNewTitle(`${quote.title} (Copy)`);
      setSelectedCustomerId(quote.customerId);
    }
  }, [quote]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quote || !selectedCustomerId) {
      setError('Please select a customer');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await quoteApi.cloneQuote(quote.id, {
        customerId: selectedCustomerId,
        title: newTitle
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error cloning quote:', err);
      setError(err.response?.data?.message || 'Failed to clone quote');
    } finally {
      setIsLoading(false);
    }
  };

  if (!quote) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Clone Quote</h2>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full p-2 border rounded"
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
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Cloning...' : 'Clone Quote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CloneQuoteModal;