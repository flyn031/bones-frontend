import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';

interface JobCost {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  invoiced: boolean;
  material?: {
    id: string;
    name: string;
  };
  supplier?: {
    id: string;
    name: string;
  };
  attachmentUrl?: string;
  notes?: string;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface EditJobCostModalProps {
  cost: JobCost;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const EditJobCostModal: React.FC<EditJobCostModalProps> = ({ cost, onClose, onSubmit }) => {
  const [description, setDescription] = useState(cost.description);
  const [amount, setAmount] = useState(cost.amount.toString());
  const [date, setDate] = useState(new Date(cost.date).toISOString().split('T')[0]);
  const [category, setCategory] = useState(cost.category);
  const [invoiced, setInvoiced] = useState(cost.invoiced);
  const [materialId, setMaterialId] = useState(cost.material?.id || '');
  const [supplierId, setSupplierId] = useState(cost.supplier?.id || '');
  const [notes, setNotes] = useState(cost.notes || '');
  const [attachment, setAttachment] = useState<File | null>(null);
  
  const [materials, setMaterials] = useState<Array<{id: string, name: string}>>([]);
  const [suppliers, setSuppliers] = useState<Array<{id: string, name: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch materials and suppliers
  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, these would be API calls
        // For now, we'll use mock data
        setMaterials([
          { id: 'mat1', name: 'Lumber' },
          { id: 'mat2', name: 'Concrete' },
          { id: 'mat3', name: 'Paint' }
        ]);
        
        setSuppliers([
          { id: 'sup1', name: 'ABC Suppliers' },
          { id: 'sup2', name: 'XYZ Materials' },
          { id: 'sup3', name: 'Build Co.' }
        ]);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data');
      }
    };
    
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    if (!description.trim()) {
      setError('Description is required');
      setIsSubmitting(false);
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Format the cost data
      const costData = {
        description,
        amount: parseFloat(amount),
        date,
        category,
        invoiced,
        materialId: materialId || undefined,
        supplierId: supplierId || undefined,
        notes: notes || undefined,
        // In a real app, you'd handle file upload separately
        attachmentFile: attachment
      };
      
      // Submit the data
      await onSubmit(costData);
    } catch (error) {
      console.error('Error updating cost:', error);
      setError('Failed to update cost. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Edit Job Cost</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (£) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="MATERIALS">Materials</option>
                  <option value="LABOR">Labor</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="SUBCONTRACTOR">Subcontractor</option>
                  <option value="ADMINISTRATIVE">Administrative</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material
                </label>
                <select
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a material</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attachment
                </label>
                <div className="flex items-center mt-1">
                  <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    {cost.attachmentUrl ? 'Replace File' : 'Upload File'}
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  {attachment ? (
                    <span className="ml-3 text-sm text-gray-500">
                      {attachment.name}
                    </span>
                  ) : cost.attachmentUrl ? (
                    <a 
                      href={cost.attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-3 text-sm text-blue-500 hover:underline"
                    >
                      Current attachment
                    </a>
                  ) : null}
                </div>
              </div>
              
              <div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="invoiced"
                    checked={invoiced}
                    onChange={(e) => setInvoiced(e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  <label htmlFor="invoiced" className="ml-2 text-sm text-gray-700">
                    Already Invoiced
                  </label>
                </div>
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditJobCostModal;