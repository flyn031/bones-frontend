// SupplierDetailModal.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Star, Package, TrendingUp, Mail, Phone, MapPin, Edit, Save, XCircle } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  status: string;
  rating: number;
  materials: any[];
  totalOrders: number;
  completedOrders: number;
  averageDeliveryTime: number;
}

interface SupplierDetailModalProps {
  supplierId: string | null;
  onClose: () => void;
  onUpdate: () => void; // New prop to refresh supplier list
}

const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({ 
  supplierId, 
  onClose, 
  onUpdate 
}) => {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [editedSupplier, setEditedSupplier] = useState<Partial<Supplier>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchSupplierDetails = async () => {
      if (!supplierId) return;

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:4000/api/suppliers/${supplierId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSupplier(response.data);
        setEditedSupplier(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching supplier details:', err);
        setError('Failed to load supplier details');
        setIsLoading(false);
      }
    };

    fetchSupplierDetails();
  }, [supplierId]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Validate required fields
      if (!editedSupplier.name || !editedSupplier.email || !editedSupplier.phone) {
        setError('Name, email, and phone are required');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editedSupplier.email)) {
        setError('Invalid email format');
        return;
      }

      // Phone validation (adjust regex as needed for your region)
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(editedSupplier.phone.replace(/\s+/g, ''))) {
        setError('Invalid phone number');
        return;
      }

      const response = await axios.put(
        `http://localhost:4000/api/suppliers/${supplierId}`, 
        editedSupplier, 
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update successful
      setSupplier(response.data);
      setIsEditing(false);
      onUpdate(); // Refresh the supplier list
      setError(null);
    } catch (err) {
      console.error('Error updating supplier:', err);
      setError('Failed to update supplier details');
    }
  };

  const handleInputChange = (field: keyof Supplier, value: string) => {
    setEditedSupplier(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Rendering logic remains similar to previous implementation
  // Add conditional rendering for edit mode

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            {isEditing ? (
              <input
                type="text"
                value={editedSupplier.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="text-2xl font-bold w-full p-2 border rounded"
                placeholder="Supplier Name"
              />
            ) : (
              <h2 className="text-2xl font-bold">{supplier?.name}</h2>
            )}
            
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSave}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Save className="h-6 w-6" />
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setEditedSupplier(supplier || {});
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit className="h-6 w-6" />
                </button>
              )}
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="space-y-3">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editedSupplier.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={editedSupplier.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        value={editedSupplier.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-500 mr-3" />
                      <span>{supplier?.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-500 mr-3" />
                      <span>{supplier?.phone}</span>
                    </div>
                    {supplier?.address && (
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-gray-500 mr-3" />
                        <span>{supplier?.address}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Performance Metrics section remains the same */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              <div className="space-y-3">
                {/* Existing performance metrics rendering */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetailModal;