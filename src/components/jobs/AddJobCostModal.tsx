import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { materialApi, supplierApi } from '../../utils/api'; // Corrected import path

interface AddJobCostModalProps {
  jobId: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const AddJobCostModal: React.FC<AddJobCostModalProps> = ({ onClose, onSubmit }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('MATERIALS'); // Changed to uppercase
  const [invoiced, setInvoiced] = useState(false);
  const [materialId, setMaterialId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  
  const [materials, setMaterials] = useState<Array<{id: string, name: string}>>([]);
  const [suppliers, setSuppliers] = useState<Array<{id: string, name: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch materials and suppliers
  useEffect(() => {
    console.log("AddJobCostModal useEffect running");
    const fetchData = async () => {
      console.log("Starting to fetch materials and suppliers");
      setIsLoading(true);
      try {
        // Fetch real materials using the materialApi
        try {
          console.log("Fetching materials using materialApi");
          const materialsResponse = await materialApi.getMaterials();
          const materialsData = materialsResponse.data as any[];
          console.log("Materials data:", materialsData);
          if (Array.isArray(materialsData) && materialsData.length > 0) {
            setMaterials(materialsData.map((m: any) => ({
              id: m.id,
              name: m.name
            })));
            console.log("Fetched materials:", materialsData);
          } else {
            // Fallback to empty array if no materials found
            console.log("No materials found or empty response");
            setMaterials([]);
          }
        } catch (err) {
          console.error("Error fetching materials:", err);
          setMaterials([]);
        }
        
        // Fetch real suppliers using the supplierApi
        try {
          console.log("Fetching suppliers using supplierApi");
          const suppliersResponse = await supplierApi.getSuppliers();
          const suppliersData = suppliersResponse.data as any[];
          console.log("Suppliers data:", suppliersData);
          if (Array.isArray(suppliersData) && suppliersData.length > 0) {
            setSuppliers(suppliersData.map((s: any) => ({
              id: s.id,
              name: s.name
            })));
            console.log("Fetched suppliers:", suppliersData);
          } else {
            // Fallback to empty array if no suppliers found
            console.log("No suppliers found or empty response");
            setSuppliers([]);
          }
        } catch (err) {
          console.error("Error fetching suppliers:", err);
          setSuppliers([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data');
      } finally {
        setIsLoading(false);
        console.log("Finished loading data");
      }
    };
    
    fetchData().catch(err => console.error("fetchData error:", err));
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
      // Format the cost data - FIXED: Include materialId and supplierId conditionally in the initial object
      const costData = {
        description,
        amount: parseFloat(amount),
        date,
        category,
        invoiced,
        notes: notes || undefined,
        attachmentFile: attachment,
        // Include materialId and supplierId conditionally in the initial object
        ...(materialId && materials.length > 0 && { materialId }),
        ...(supplierId && suppliers.length > 0 && { supplierId })
      };
      
      // Submit the data
      await onSubmit(costData);
      
      // Reset form (though the modal will likely close)
      resetForm();
    } catch (error) {
      console.error('Error creating cost:', error);
      setError('Failed to create cost. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('MATERIALS'); // Changed to uppercase
    setInvoiced(false);
    setMaterialId('');
    setSupplierId('');
    setNotes('');
    setAttachment(null);
    setError('');
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
          <h2 className="text-xl font-semibold">Add Job Cost</h2>
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
                  Material {materials.length === 0 && "(No materials available)"}
                </label>
                <select
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  className={`w-full p-2 border border-gray-300 rounded-md ${materials.length === 0 ? 'bg-gray-100 text-gray-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                  disabled={materials.length === 0 || isLoading}
                >
                  <option value="">Select a material</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </select>
                {materials.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    This feature requires real material IDs from your database
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier {suppliers.length === 0 && "(No suppliers available)"}
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className={`w-full p-2 border border-gray-300 rounded-md ${suppliers.length === 0 ? 'bg-gray-100 text-gray-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                  disabled={suppliers.length === 0 || isLoading}
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {suppliers.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    This feature requires real supplier IDs from your database
                  </p>
                )}
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
                    Upload File
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  {attachment && (
                    <span className="ml-3 text-sm text-gray-500">
                      {attachment.name}
                    </span>
                  )}
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
                {isSubmitting ? 'Adding...' : 'Add Cost'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddJobCostModal;