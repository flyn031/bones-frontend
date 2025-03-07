import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Trash2 } from 'lucide-react';

interface MaterialDetailModalProps {
  materialId: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

interface Material {
  id: string;
  name: string;
  description: string;
  category: string;
  unitPrice: number;
  unit: string;
  currentStockLevel: number;
  minStockLevel: number;
  reorderPoint: number;
  supplierId: string | null;
  supplierName?: string;
}

const MaterialDetailModal: React.FC<MaterialDetailModalProps> = ({ materialId, onClose, onUpdate }) => {
  const [material, setMaterial] = useState<Material | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!materialId) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const [materialRes, suppliersRes] = await Promise.all([
          axios.get(`http://localhost:4000/api/materials/${materialId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:4000/api/suppliers', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setMaterial(materialRes.data);
        setSuppliers(suppliersRes.data);
      } catch (err) {
        console.error('Error fetching material details:', err);
        setError('Failed to load material details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [materialId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setMaterial(prev => {
      if (!prev) return prev;
      
      // Handle number inputs
      if (['unitPrice', 'currentStockLevel', 'minStockLevel', 'reorderPoint'].includes(name)) {
        return { ...prev, [name]: Number(value) };
      }
      
      return { ...prev, [name]: value };
    });
  };

  const handleSave = async () => {
    if (!material) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:4000/api/materials/${material.id}`, material, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsEditing(false);
      onUpdate(); // Refresh parent component
    } catch (err) {
      console.error('Error updating material:', err);
      setError('Failed to update material');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!material || !confirmDelete) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:4000/api/materials/${material.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onUpdate(); // Refresh parent component
      onClose(); // Close modal
    } catch (err) {
      console.error('Error deleting material:', err);
      setError('Failed to delete material');
      setConfirmDelete(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Material Details</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading material details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Error</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          <div className="py-4 text-center text-red-600">
            {error}
          </div>
          <div className="flex justify-end mt-4">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!material) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl my-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {isEditing ? 'Edit Material' : 'Material Details'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            {isEditing ? (
              <input 
                type="text" 
                name="name" 
                value={material.name} 
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded">{material.name}</p>
            )}
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            {isEditing ? (
              <input 
                type="text" 
                name="category" 
                value={material.category} 
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded">{material.category}</p>
            )}
          </div>

          <div className="form-group md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            {isEditing ? (
              <textarea 
                name="description" 
                value={material.description || ''} 
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                disabled={isSubmitting}
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded">{material.description || 'No description'}</p>
            )}
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
            {isEditing ? (
              <input 
                type="number" 
                name="unitPrice" 
                value={material.unitPrice} 
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
                min="0"
                disabled={isSubmitting}
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded">£{material.unitPrice.toFixed(2)}</p>
            )}
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
            {isEditing ? (
              <input 
                type="text" 
                name="unit" 
                value={material.unit || ''} 
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded">{material.unit || 'N/A'}</p>
            )}
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
            {isEditing ? (
              <input 
                type="number" 
                name="currentStockLevel" 
                value={material.currentStockLevel} 
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                min="0"
                disabled={isSubmitting}
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded">{material.currentStockLevel}</p>
            )}
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Level</label>
            {isEditing ? (
              <input 
                type="number" 
                name="minStockLevel" 
                value={material.minStockLevel} 
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                min="0"
                disabled={isSubmitting}
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded">{material.minStockLevel}</p>
            )}
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
            {isEditing ? (
              <input 
                type="number" 
                name="reorderPoint" 
                value={material.reorderPoint} 
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                min="0"
                disabled={isSubmitting}
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded">{material.reorderPoint}</p>
            )}
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            {isEditing ? (
              <select
                name="supplierId"
                value={material.supplierId || ''}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              >
                <option value="">None</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="p-2 bg-gray-50 rounded">
                {material.supplierName || 'No supplier assigned'}
              </p>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-between mt-6">
          <div>
            {isEditing && !confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                disabled={isSubmitting}
              >
                <Trash2 size={18} className="mr-1" />
                Delete
              </button>
            ) : confirmDelete ? (
              <div className="flex items-center space-x-2">
                <span className="text-red-600 font-medium">Confirm delete?</span>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  disabled={isSubmitting}
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            ) : null}
          </div>
          
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    // Reset to original data
                    fetchData();
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                      Saving...
                    </span>
                  ) : (
                    <>
                      <Save size={18} className="mr-1" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit Material
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialDetailModal;