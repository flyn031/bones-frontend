import React, { useState } from 'react';
import { X, Plus, Search } from 'lucide-react';

interface NewQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const mockJobs = [
  { id: "J2024-001", title: "Acme Factory Installation" },
  { id: "J2024-002", title: "BuildCo Maintenance" }
];

const mockInventory = [
  {
    id: "MAT001",
    name: "Steel Plates 10mm",
    code: "SP-10MM",
    unitPrice: 89.99,
    unit: "pieces"
  },
  {
    id: "CNV001",
    name: "Conveyor Belt PVC",
    code: "CB-PVC-001",
    unitPrice: 45.99,
    unit: "meters"
  }
];

export default function NewQuoteModal({ isOpen, onClose, onSubmit }: NewQuoteModalProps) {
  const [quoteData, setQuoteData] = useState({
    title: '',
    customer: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    jobId: '',
    validityDays: 30,
    terms: 'Net 30',
    notes: '',
    items: []
  });

  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredItems = mockInventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = (item) => {
    setSelectedItems([...selectedItems, {
      ...item,
      quantity: 1,
      total: item.unitPrice
    }]);
  };

  const updateItemQuantity = (index, quantity) => {
    const newItems = [...selectedItems];
    newItems[index].quantity = quantity;
    newItems[index].total = quantity * newItems[index].unitPrice;
    setSelectedItems(newItems);
  };

  const removeItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => 
    selectedItems.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...quoteData,
      items: selectedItems,
      total: calculateTotal(),
      date: new Date().toISOString(),
      validUntil: new Date(Date.now() + quoteData.validityDays * 24 * 60 * 60 * 1000).toISOString()
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Create New Quote</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quote Title*
              </label>
              <input
                type="text"
                required
                value={quoteData.title}
                onChange={(e) => setQuoteData({...quoteData, title: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name*
              </label>
              <input
                type="text"
                required
                value={quoteData.customer}
                onChange={(e) => setQuoteData({...quoteData, customer: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={quoteData.contactPerson}
                onChange={(e) => setQuoteData({...quoteData, contactPerson: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={quoteData.contactEmail}
                onChange={(e) => setQuoteData({...quoteData, contactEmail: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={quoteData.contactPhone}
                onChange={(e) => setQuoteData({...quoteData, contactPhone: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Job Linking and Terms */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link to Job
              </label>
              <select
                value={quoteData.jobId}
                onChange={(e) => setQuoteData({...quoteData, jobId: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Job</option>
                {mockJobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid For (Days)
              </label>
              <input
                type="number"
                value={quoteData.validityDays}
                onChange={(e) => setQuoteData({...quoteData, validityDays: parseInt(e.target.value)})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <select
                value={quoteData.terms}
                onChange={(e) => setQuoteData({...quoteData, terms: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
                <option value="50% Deposit">50% Deposit</option>
                <option value="100% Advance">100% Advance</option>
              </select>
            </div>
          </div>

          {/* Items Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Items
              </label>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Available Items */}
            <div className="mb-4 max-h-40 overflow-y-auto border rounded-lg">
              {filteredItems.map(item => (
                <div 
                  key={item.id}
                  className="p-2 hover:bg-gray-50 flex justify-between items-center border-b"
                >
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.code}</div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div>${item.unitPrice}/{item.unit}</div>
                    <button
                      type="button"
                      onClick={() => addItem(item)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Items */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.code}</div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(index, parseInt(e.target.value))}
                        className="w-20 p-1 border rounded"
                      />
                      {item.unit}
                    </td>
                    <td className="px-4 py-2">${item.unitPrice}</td>
                    <td className="px-4 py-2">${item.total.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right font-medium">Total:</td>
                  <td className="px-4 py-2 font-medium">${calculateTotal().toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={quoteData.notes}
              onChange={(e) => setQuoteData({...quoteData, notes: e.target.value})}
              rows={3}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Quote
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}