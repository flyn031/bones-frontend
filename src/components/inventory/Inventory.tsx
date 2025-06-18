import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Grid, List, Filter, ChevronLeft, ChevronRight, X, Briefcase } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/constants'; // ✅ FIXED: Added API_URL import
import CreateItemModal from './CreateItemModal';
import MaterialDetailModal from './MaterialDetailModal';

// ✅ FIXED - Custom error detection instead of axios.isAxiosError
const isAxiosError = (error: any): error is { response?: { data?: any; status?: number } } => {
  return error && error.response && typeof error.response.status === 'number';
};

// Enums for categories
enum MaterialCategory {
  CONVEYOR_COMPONENT = 'CONVEYOR_COMPONENT',
  ELECTRICAL = 'ELECTRICAL',
  MECHANICAL = 'MECHANICAL',
  STRUCTURAL = 'STRUCTURAL',
  CONSUMABLE = 'CONSUMABLE',
  TOOL = 'TOOL',
  OTHER = 'OTHER'
}

// Enhanced interfaces to match backend schema
interface InventoryItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  unitPrice: number;
  currentStockLevel: number;
  minStockLevel: number;
  maxStockLevel?: number;
  leadTimeDays?: number;
  supplierId?: string;
  supplier?: {
    id: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
  } | null;
  inventoryPurpose: 'CUSTOMER' | 'INTERNAL' | 'DUAL';
  isQuotable: boolean;
  isOrderable: boolean;
  createdAt: string;
  updatedAt: string;
  supplierPartNumber?: string;
  storageLocation?: string;
  notes?: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Job {
  id: string;
  title: string;
  status: string;
  customer: {
    name: string;
  };
}

interface JobAssignmentItem {
  materialId: string;
  material: InventoryItem; // Store the full material object here for easy access in the modal
  quantity: number;
  unitCost: number;
  totalCost: number;
  hasError: boolean;
  errorMessage?: string;
}

// ✅ ADDED - API response interfaces
interface SuppliersResponse {
  suppliers?: Supplier[];
  data?: Supplier[];
}

interface MaterialsResponse {
  items?: InventoryItem[];
  materials?: InventoryItem[];
  data?: InventoryItem[] | any;
  totalPages?: number;
  total?: number;
}

interface JobsResponse {
  jobs?: Job[];
  data?: Job[] | any;
}

export default function Inventory() {
  const { user, loading: authLoading } = useAuth();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
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
  const [purposeFilter, setPurposeFilter] = useState('ALL');

  // Multi-select state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [assignmentItems, setAssignmentItems] = useState<JobAssignmentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ FIXED - Extract fetchSuppliers to be callable from anywhere
  const fetchSuppliers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<SuppliersResponse>(`${API_URL}/suppliers`, { // ✅ FIXED: Use API_URL
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // ✅ FIXED - Proper type checking for suppliers response
      const responseData = response.data;
      if (Array.isArray(responseData)) {
        setSuppliers(responseData);
      } else if (responseData && Array.isArray(responseData.suppliers)) {
        setSuppliers(responseData.suppliers);
      } else if (responseData && Array.isArray(responseData.data)) {
        setSuppliers(responseData.data);
      } else {
        console.warn("Unexpected format for suppliers response:", responseData);
        setSuppliers([]);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSuppliers([]);
    }
  }, []);

  // Load suppliers on mount
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // ✅ FIXED - Refresh suppliers when modal opens
  useEffect(() => {
    if (isModalOpen) {
      console.log('Modal opened, refreshing suppliers...');
      fetchSuppliers();
    }
  }, [isModalOpen, fetchSuppliers]);

  const fetchInventory = async () => {
    setInventoryLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get<MaterialsResponse>(
        `${API_URL}/materials`, // ✅ FIXED: Use API_URL
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
            purpose: purposeFilter !== 'ALL' ? purposeFilter : undefined,
          }
        }
      );

      // ✅ FIXED - Proper type checking for materials response
      const data = response.data;
      const items = data.items || data.materials || (Array.isArray(data.data) ? data.data : []) || (Array.isArray(data) ? data : []);

      setInventory(Array.isArray(items) ? items : []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || (Array.isArray(items) ? items.length : 0));

    } catch (error) {
      console.error('Error fetching inventory:', error);

      // ✅ FIXED - Use custom isAxiosError function
      if (isAxiosError(error)) {
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
      setInventoryLoading(false);
    }
  };

  // Fetch active jobs
  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<JobsResponse>(`${API_URL}/jobs`, { // ✅ FIXED: Use API_URL
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          status: 'PENDING,IN_PROGRESS' // Only active jobs
        }
      });

      // ✅ FIXED - Proper type checking for jobs response
      const responseData = response.data;
      const jobData = responseData.jobs || responseData.data || responseData;
      
      if (Array.isArray(jobData)) {
        // Filter out COMPLETED and CANCELED jobs explicitly just in case the API param isn't perfect
        const activeJobs = jobData.filter((job: Job) => job.status !== 'COMPLETED' && job.status !== 'CANCELED');
        setJobs(activeJobs);
      } else {
        console.warn("Unexpected format for jobs response:", responseData);
        setJobs([]);
      }

    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page, searchTerm, categoryFilter, minStockFilter, maxPriceFilter, purposeFilter]);

  // Multi-select handlers
  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === inventory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(inventory.map(item => item.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedItems(new Set());
  };

  // Job assignment handlers
  const handleAddToJob = async () => {
    if (selectedItems.size === 0) return;

    // Fetch jobs and prepare assignment items
    await fetchJobs(); // Fetch jobs when modal is opened

    const items: JobAssignmentItem[] = Array.from(selectedItems).map(itemId => {
      const material = inventory.find(item => item.id === itemId);
      // Add a check here in case an item is selected but not found in the current inventory state (e.g., pagination issue)
      if (!material) {
          console.warn(`Selected material ID ${itemId} not found in current inventory. Skipping.`);
          return null;
      }
      return {
        materialId: itemId,
        material, // Store the full material object
        quantity: 1, // Default quantity
        unitCost: material.unitPrice, // Use the current unit price from inventory
        totalCost: material.unitPrice,
        hasError: false,
        errorMessage: undefined // Initialize error message
      };
    }).filter(item => item !== null) as JobAssignmentItem[]; // Filter out any null items and cast back

     if (items.length === 0) {
         alert('No valid selected materials found in the current inventory.');
         setSelectedItems(new Set()); // Clear selection if items couldn't be found
         return;
     }

    setAssignmentItems(items);
    setIsJobModalOpen(true);
  };

  const handleQuantityChange = (materialId: string, quantity: number) => {
    setAssignmentItems(prev => prev.map(item => {
      if (item.materialId === materialId) {
        const newQuantity = Math.max(0, quantity); // Ensure quantity is not negative
        const totalCost = newQuantity * item.unitCost;
        // Check for stock error only if quantity > 0 and > currentStockLevel
        const hasError = newQuantity > 0 && newQuantity > item.material.currentStockLevel;
        const errorMessage = hasError ? `Only ${item.material.currentStockLevel} ${item.material.unit} available` : undefined;

        return {
          ...item,
          quantity: newQuantity,
          totalCost,
          hasError,
          errorMessage
        };
      }
      return item;
    }));
  };

  const handleSubmitJobAssignment = async () => {
    if (!selectedJobId || assignmentItems.length === 0) return;

    // Prevent submission if any item has quantity <= 0 or has a stock error
    const itemsToSubmit = assignmentItems.filter(item => item.quantity > 0 && !item.hasError);
    if (itemsToSubmit.length === 0) {
        alert('Please ensure selected materials have a quantity greater than zero and no stock errors before submitting.');
        return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
      };

      // Use Promise.all for concurrent requests
      const results = await Promise.allSettled(itemsToSubmit.map(item =>
        axios.post(
          `${API_URL}/jobs/${selectedJobId}/materials`, // ✅ FIXED: Use API_URL
          {
            materialId: item.materialId,
            quantityNeeded: item.quantity,
            unitCost: item.unitCost, // Use the cost recorded when opening modal
            notes: item.errorMessage || `Added from inventory` // Use error message as note if there was one, or a default
          },
          { headers }
        )
      ));

      const successfulCount = results.filter(result => result.status === 'fulfilled').length;
      const failedResults = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');

      if (successfulCount > 0) {
         alert(`Successfully added ${successfulCount} material${successfulCount !== 1 ? 's' : ''} to job!`);
         setSelectedItems(new Set());
         setIsJobModalOpen(false);
         setSelectedJobId('');
         setAssignmentItems([]); // Clear assignment items
         fetchInventory(); // Refresh inventory to update stock levels
      }

       if (failedResults.length > 0) {
            console.error('Failed to add some materials:', failedResults);
             // Provide user feedback about failed items
             const failedMaterialNames = failedResults.map(failedResult => {
                  // Attempt to find the material name from assignmentItems
                  const assignmentItem = assignmentItems.find(item =>
                      // Need to parse the request body string to find the materialId
                      isAxiosError(failedResult.reason) &&
                      failedResult.reason.response &&
                      item.materialId
                  );
                  return assignmentItem?.material.name || 'Unknown Material';
             });
             alert(`Failed to add material(s): ${failedMaterialNames.join(', ')}. Check console for details.`);

             // ✅ FIXED - Simplified error logging without .config references
             failedResults.forEach(failedResult => {
                 console.error("Failure reason:", failedResult.reason);
                 if (isAxiosError(failedResult.reason)) {
                     console.error("Failed request backend response data:", failedResult.reason.response?.data);
                     console.error("Failed request backend response status:", failedResult.reason.response?.status);
                 }
             });
       }

    } catch (error) {
      console.error('An unexpected error occurred during submission:', error);
      alert('An unexpected error occurred while adding materials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      console.log('Creating inventory item with data:', data);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/materials`, data, { // ✅ FIXED: Use API_URL
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Successfully created inventory item:', response.data);
      setIsModalOpen(false);
      setPage(1);
      fetchInventory();
    } catch (error) {
      console.error('Error adding item:', error);
      // ✅ FIXED - Use custom isAxiosError function
      if (isAxiosError(error)) {
        console.error("Error status:", error.response?.status);
        console.error("Error details:", error.response?.data);
        if (error.response?.status === 400 && error.response?.data?.errors) {
          console.error("Validation errors:", error.response.data.errors);
          const errorFields = Object.keys(error.response.data.errors).join(', ');
          alert(`Validation failed for fields: ${errorFields}`);
        } else {
          const errorMsg = error.response?.data?.message ||
                          error.response?.data?.error ||
                          'Failed to add item';
          alert(`Error: ${errorMsg}`);
        }
      } else if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Failed to add item due to an unknown error');
        setError('Failed to add item');
      }
    }
  };

  const totalCost = assignmentItems.reduce((sum, item) => sum + item.totalCost, 0);
  const hasErrors = assignmentItems.some(item => item.hasError || item.quantity <= 0); // Also check for quantity <= 0

  if (authLoading || inventoryLoading) {
    return <div className="p-8 flex justify-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-red-500">
        <p>Error loading inventory: {error}</p>
        <button
          onClick={fetchInventory}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  // --- Start of Main Render JSX ---
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">
          {user?.companyName || 'Your Company'} - Inventory Management
        </h2>

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
              className={`px-3 py-2 ${viewType === 'grid' ? 'bg-gray-100' : ''} rounded-l-lg`}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`px-3 py-2 ${viewType === 'list' ? 'bg-gray-100' : ''} rounded-r-lg`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              aria-expanded={filterOpen}
            >
              <Filter className="h-4 w-4" />
              <span>Advanced Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selection Controls */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-blue-800 font-medium">
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
              {/* Toggle between Select All and Deselect All based on current selection */}
              <button
                onClick={selectedItems.size === inventory.length ? handleClearSelection : handleSelectAll}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {selectedItems.size === inventory.length ? 'Deselect All' : 'Select All'} ({inventory.length})
              </button>
              <button
                onClick={handleClearSelection}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear Selection
              </button>
            </div>
            <button
              onClick={handleAddToJob}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={selectedItems.size === 0}
            >
               <Briefcase className="h-4 w-4 mr-2" />
              Add to Job
            </button>
          </div>
        </div>
      )}

      {/* Purpose filter buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => { setPurposeFilter('ALL'); setPage(1); }}
          className={`px-4 py-2 rounded-lg ${purposeFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          All Items
        </button>
        <button
          onClick={() => { setPurposeFilter('CUSTOMER'); setPage(1); }}
          className={`px-4 py-2 rounded-lg ${purposeFilter === 'CUSTOMER' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Customer Items
        </button>
        <button
          onClick={() => { setPurposeFilter('INTERNAL'); setPage(1); }}
          className={`px-4 py-2 rounded-lg ${purposeFilter === 'INTERNAL' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Internal Materials
        </button>
        <button
          onClick={() => { setPurposeFilter('DUAL'); setPage(1); }}
          className={`px-4 py-2 rounded-lg ${purposeFilter === 'DUAL' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Dual-Purpose Items
        </button>
      </div>

      {/* Advanced Filter section */}
      {filterOpen && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-medium mb-4">Filter Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                id="category-filter"
                className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
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
              <label htmlFor="min-stock-filter" className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
              <input
                id="min-stock-filter"
                type="number"
                placeholder="Minimum stock level"
                className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={minStockFilter}
                onChange={(e) => { setMinStockFilter(e.target.value); setPage(1); }}
                min="0"
              />
            </div>
            <div>
              <label htmlFor="max-price-filter" className="block text-sm font-medium text-gray-700 mb-1">Maximum Price</label>
              <input
                id="max-price-filter"
                type="number"
                placeholder="Maximum unit price"
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                value={maxPriceFilter}
                onChange={(e) => { setMaxPriceFilter(e.target.value); setPage(1); }}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
      )}

      {/* Inventory display */}
      {inventory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || categoryFilter !== 'all' || minStockFilter || maxPriceFilter || purposeFilter !== 'ALL'
            ? 'No items found matching your criteria.'
            : 'No inventory items have been added yet.'}
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewType === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {inventory.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 flex flex-col">
                  <div className="p-4 flex-grow">
                    <div className="flex items-start gap-3 mb-2">
                      {/* Checkbox in Grid View */}
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium text-gray-900 truncate" title={item.name}>{item.name}</h3>
                        <div className="text-xs text-gray-500 mb-2" title={item.code}>{item.code}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                        item.inventoryPurpose === 'CUSTOMER' ? 'bg-blue-100 text-blue-800' :
                        item.inventoryPurpose === 'INTERNAL' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {item.inventoryPurpose === 'CUSTOMER' ? 'Cust' : item.inventoryPurpose === 'INTERNAL' ? 'Internal' : 'Dual'}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div><span className="font-medium text-gray-700">Category:</span> {item.category}</div>
                      <div><span className="font-medium text-gray-700">Stock:</span> {item.currentStockLevel} {item.unit}</div>
                       <div><span className="font-medium text-gray-700">Min Stock:</span> {item.minStockLevel} {item.unit}</div>
                      <div><span className="font-medium text-gray-700">Price:</span> £{item.unitPrice.toFixed(2)} / {item.unit}</div>
                      {item.supplier?.name && (
                        <div><span className="font-medium text-gray-700">Supplier:</span> {item.supplier.name}</div>
                      )}
                       {(item.inventoryPurpose === 'CUSTOMER' || item.inventoryPurpose === 'DUAL') && (
                        <div><span className="font-medium text-gray-700">Quotable:</span> {item.isQuotable ? 'Yes' : 'No'}</div>
                      )}
                      {(item.inventoryPurpose === 'INTERNAL' || item.inventoryPurpose === 'DUAL') && (
                        <div><span className="font-medium text-gray-700">Orderable:</span> {item.isOrderable ? 'Yes' : 'No'}</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto pt-3 px-4 pb-3 border-t flex justify-end">
                    <button
                      onClick={() => handleViewDetails(item.id)}
                      className="px-3 py-1 text-xs border rounded hover:bg-gray-50"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full table-auto divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === inventory.length && inventory.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Stock</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.code}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          item.inventoryPurpose === 'CUSTOMER' ? 'bg-blue-100 text-blue-800' :
                          item.inventoryPurpose === 'INTERNAL' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                           {item.inventoryPurpose === 'CUSTOMER' ? 'Cust' : item.inventoryPurpose === 'INTERNAL' ? 'Internal' : 'Dual'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.currentStockLevel} {item.unit}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.minStockLevel} {item.unit}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">£{item.unitPrice.toFixed(2)} / {item.unit}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {item.supplier?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(item.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Details
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

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Inventory pagination" className="mt-8 flex justify-between items-center">
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            className={`px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
          >
            <ChevronLeft className="h-5 w-5 mr-1" aria-hidden="true" /> Previous
          </button>

          <div className="text-sm text-gray-600" aria-live="polite">
            Page {page} of {totalPages} ({total} items)
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            className={`px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
          >
            Next <ChevronRight className="h-5 w-5 ml-1" aria-hidden="true" />
          </button>
        </nav>
      )}

      {/* Add Item Modal - ✅ FIXED - Removed onRefreshSuppliers prop */}
      <CreateItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddItem}
        categories={Object.values(MaterialCategory)}
        suppliers={suppliers}
      />

      {/* Material Detail Modal */}
      {isDetailModalOpen && selectedMaterialId && (
        <MaterialDetailModal
          materialId={selectedMaterialId}
          onClose={handleCloseDetailModal}
          onUpdate={fetchInventory}
        />
      )}

      {/* Job Assignment Modal */}
      {isJobModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Add Materials to Job</h2>
              <button
                onClick={() => setIsJobModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Job Selection */}
            <div className="mb-6">
              <label htmlFor="job-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Job <span className="text-red-500">*</span>
              </label>
              <select
                 id="job-select"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a job...</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.customer.name} ({job.status})
                  </option>
                ))}
              </select>
               {jobs.length === 0 && (
                    <p className="mt-2 text-sm text-gray-600">No active jobs found.</p>
                )}
            </div>

            {/* Materials List */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Materials to Add ({assignmentItems.length})</h3>
              {assignmentItems.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No materials selected for this job yet.</div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {assignmentItems.map(item => (
                    <div key={item.materialId} className={`border rounded-lg p-4 ${item.hasError ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="font-medium text-gray-900">{item.material.name}</h4>
                          <p className="text-sm text-gray-500 truncate" title={`Code: ${item.material.code}`}>
                            Code: {item.material.code} | Available: {item.material.currentStockLevel} {item.material.unit}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Unit Price: £{item.unitCost.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3 shrink-0">
                          <div>
                            <label htmlFor={`quantity-${item.materialId}`} className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity
                            </label>
                            <input
                              id={`quantity-${item.materialId}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.materialId, parseFloat(e.target.value) || 0)}
                              className={`w-24 p-2 border rounded-lg focus:outline-none focus:ring-2 text-center ${
                                item.hasError
                                  ? 'border-red-500 focus:ring-red-500'
                                  : 'border-gray-300 focus:ring-blue-500'
                              }`}
                              aria-describedby={`error-${item.materialId}`}
                              aria-invalid={item.hasError}
                            />
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-700">Total</div>
                            <div className={`text-lg font-semibold ${item.hasError || item.quantity <= 0 ? 'text-red-600' : 'text-gray-900'}`}>
                              £{item.totalCost.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                      {(item.hasError || item.quantity <= 0) && (
                        <div id={`error-${item.materialId}`} className="mt-2 text-sm text-red-600 flex items-center">
                          <span className="mr-1">⚠️</span>
                           {item.quantity <= 0 ? 'Quantity must be greater than zero.' : item.errorMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total Cost:</span>
                <span className="text-2xl font-bold text-blue-600">£{totalCost.toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {assignmentItems.length} material{assignmentItems.length !== 1 ? 's' : ''} selected for job
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsJobModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitJobAssignment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !selectedJobId || assignmentItems.length === 0 || hasErrors || assignmentItems.some(item => item.quantity <= 0)}
              >
                {isSubmitting ? 'Adding...' : 'Add to Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}