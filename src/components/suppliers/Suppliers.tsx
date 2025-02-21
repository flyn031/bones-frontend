import React, { useState, useEffect } from 'react';
import { Search, Plus, Star, Package, TrendingUp, Filter, Grid, List } from "lucide-react";
import AddSupplierModal from './AddSupplierModal';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  rating: number;
  materials: any[];
  totalOrders: number;
  completedOrders: number;
  averageDeliveryTime: number;
}

export default function Suppliers() {
  const navigate = useNavigate();
  const [viewType, setViewType] = useState('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:4000/api/suppliers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setError('Failed to fetch suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSupplier = async (data: any) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      await axios.post('http://localhost:4000/api/suppliers', data, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchSuppliers(); // Refresh the list
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding supplier:', error);
      // Handle error (you might want to show an error message to the user)
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center">Loading suppliers...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Supplier Management</h2>
        
        <div className="flex space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Add Supplier Button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Supplier</span>
          </button>
          
          {/* View Toggle */}
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

      {/* Grid View */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${viewType === 'list' ? 'hidden' : ''}`}>
        {filteredSuppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{supplier.name}</h3>
                  <div className="flex items-center mt-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm text-gray-600">{supplier.rating}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs 
                  ${supplier.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {supplier.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="ml-2 text-sm text-gray-600">{supplier.materials.length} Materials</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="ml-2 text-sm text-gray-600">
                    {supplier.completedOrders > 0 
                      ? Math.round((supplier.completedOrders / supplier.totalOrders) * 100)
                      : 0}% Performance
                  </span>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                <div>{supplier.email}</div>
                <div>{supplier.phone}</div>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
                <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                  View Details
                </button>
                <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                  Contact
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* List View */}
      <div className={`${viewType === 'grid' ? 'hidden' : ''}`}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Materials
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                    <div className="text-sm text-gray-500">{supplier.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-600">{supplier.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs 
                      ${supplier.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {supplier.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {supplier.materials.length} Materials
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {supplier.completedOrders > 0 
                      ? Math.round((supplier.completedOrders / supplier.totalOrders) * 100)
                      : 0}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button className="text-blue-600 hover:text-blue-900">Contact</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AddSupplierModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddSupplier}
      />
    </div>
  );
}