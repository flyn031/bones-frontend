// Suppliers.tsx

import React, { useState, useEffect } from 'react';
import { Search, Plus, Star, Package, TrendingUp, Grid, List } from "lucide-react";
import AddSupplierModal from './AddSupplierModal';
import SupplierDetailModal from './SupplierDetailModal';
import { supplierApi } from "../../utils/api";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchSuppliers();
  }, [searchTerm, statusFilter]);

  const fetchSuppliers = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      const response = await supplierApi.getSuppliers({
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      console.log('Suppliers Response:', response.data);
      setSuppliers(response.data);
      console.log('Updated Suppliers State:', response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setError('Failed to fetch suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSupplier = async (data: any) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      await supplierApi.createSupplier(data);
      
      fetchSuppliers(); // Refresh the list
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error adding supplier:', error);

      // Handle specific error scenarios
      if (error.response) {
        switch (error.response.status) {
          case 409: // Conflict - Supplier with email already exists
            alert(`A supplier with the email ${data.email} already exists. 
              Existing supplier name: ${error.response.data.supplierName}`);
            break;
          case 400: // Bad Request
            alert(error.response.data.error || 'Invalid supplier data');
            break;
          default:
            alert('Failed to add supplier. Please try again.');
        }
      } else if (error.request) {
        alert('No response from server. Please check your connection.');
      } else {
        alert('Error setting up the request. Please try again.');
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    console.log('Search term:', value);
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
              onChange={handleSearchChange}
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
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          
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
        {suppliers.map((supplier) => (
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
                  ${supplier.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                  supplier.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' : 
                  'bg-red-100 text-red-800'}`}>
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
                <button 
                  onClick={() => setSelectedSupplierId(supplier.id)}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
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
              {suppliers.map((supplier) => (
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
                      ${supplier.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                      supplier.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' : 
                      'bg-red-100 text-red-800'}`}>
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
                    <button 
                      onClick={() => setSelectedSupplierId(supplier.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </button>
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

      {/* Supplier Detail Modal */}
      {selectedSupplierId && (
        <SupplierDetailModal
          supplierId={selectedSupplierId}
          onClose={() => setSelectedSupplierId(null)}
          onUpdate={fetchSuppliers}
        />
      )}
    </div>
  );
}