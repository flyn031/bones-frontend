import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Grid, List, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateItemModal, { MaterialCategory } from './CreateItemModal';
import MaterialDetailModal from './MaterialDetailModal';

interface InventoryItem {
  id: string;
  name: string;
  code: string;
  category: string;
  currentStockLevel: number;
  minStockLevel: number;
  unit: string;
  unitPrice: number;
  supplier?: {
    id?: string;
    name?: string;
  };
}

interface Supplier {
  id: string;
  name: string;
}

export default function Inventory() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]); // New suppliers state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);

  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minStockFilter, setMinStockFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');

  // New effect to fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:4000/api/suppliers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setSuppliers(response.data);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      }
    };

    fetchSuppliers();
  }, []);

  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching inventory with params:', {
        page,
        limit: pageSize,
        search: searchTerm,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        minStock: minStockFilter || undefined,
        maxPrice: maxPriceFilter || undefined,
      });

      const response = await axios.get(
        `http://localhost:4000/api/materials`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            page,
            limit: pageSize,
            search: searchTerm,
            category: categoryFilter !== 'all' ? categoryFilter : undefined,
            minStock: minStockFilter || undefined,
            maxPrice: maxPriceFilter || undefined,
          }
        }
      );

      console.log('Inventory data received:', response.data);

      // Flexible parsing of response
      const data = response.data;
      const items = data.items || data.materials || data.data || data;

      setInventory(items);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || items.length);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || 
                         error.response?.data?.error || 
                         'Failed to fetch inventory';
        setError(errorMsg);
        console.error('Detailed error:', error.response?.data);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
      
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page, searchTerm, categoryFilter, minStockFilter, maxPriceFilter]);

  const handleViewDetails = (itemId: string) => {
    setSelectedMaterialId(itemId);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedMaterialId(null);
  };

  const handleAddItem = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:4000/api/materials', data, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setIsModalOpen(false);
      setPage(1);
      fetchInventory();
    } catch (error) {
      console.error('Error adding item:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || 
                         error.response?.data?.error || 
                         'Failed to add item';
        setError(errorMsg);
      } else {
        setError('Failed to add item');
      }
    }
  };

  const companyName = localStorage.getItem('companyName') || 'Your Company';

  if (isLoading) {
    return <div className="p-8 flex justify-center">Loading inventory...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-red-500">
        <p>Error: {error}</p>
        <button 
          onClick={fetchInventory} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">{companyName} - Inventory Management</h2>
        
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Item</span>
          </button>
          
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

          <div className="flex space-x-2">
            <button 
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              <span>Advanced Filter</span>
            </button>
          </div>
        </div>
      </div>

      {filterOpen && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                className="w-full border rounded-lg p-2"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {Object.values(MaterialCategory).map(category => (
                  <option key={category} value={category}>
                    {category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
              <input 
                type="number" 
                placeholder="Minimum stock level" 
                className="w-full border rounded-lg p-2"
                value={minStockFilter}
                onChange={(e) => setMinStockFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Price</label>
              <input 
                type="number" 
                placeholder="Maximum unit price" 
                className="w-full border rounded-lg p-2"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {inventory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'No items found matching your search' : 'No inventory items yet'}
        </div>
      ) : (
        <>
          {viewType === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                    <div className="mt-1 text-sm text-gray-500">{item.code}</div>
                    <div className="mt-4 text-sm text-gray-500">
                      <div>Category: {item.category}</div>
                      <div>Stock: {item.currentStockLevel} {item.unit}</div>
                      <div>Price: £{item.unitPrice.toFixed(2)} / {item.unit}</div>
                      {item.supplier?.name && (
                        <div>Supplier: {item.supplier.name}</div>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-end">
                      <button
                        onClick={() => handleViewDetails(item.id)}
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.currentStockLevel} {item.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£{item.unitPrice.toFixed(2)} / {item.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.supplier?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(item.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <div className="mt-8 flex justify-between items-center">
        <button
          disabled={page === 1}
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>

        <button
          disabled={page === totalPages}
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Add Item Modal - Updated to pass suppliers */}
      <CreateItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddItem}
        categories={Object.values(MaterialCategory)}
        suppliers={suppliers} // Added suppliers prop
      />

      {/* Material Detail Modal */}
      {isDetailModalOpen && (
        <MaterialDetailModal
          materialId={selectedMaterialId}
          onClose={handleCloseDetailModal}
          onUpdate={fetchInventory}
        />
      )}
    </div>
  );
}