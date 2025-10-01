import { useState, useEffect, useCallback } from 'react';
import { Plus, LayoutGrid, Table, Search, Filter, AlertTriangle, Clock, CheckCircle, Edit, MoreVertical, Briefcase } from "lucide-react";
import OrderModal from './OrderModal';
import OrdersTableView from './OrdersTableView';
import { apiClient } from '../../utils/api';

const statusColors: Record<string, string> = {
  IN_PRODUCTION: "bg-blue-100 text-blue-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800", 
  READY_FOR_DELIVERY: "bg-green-100 text-green-800",
  DELIVERED: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-gray-100 text-gray-700",
};

const priorityIconsMap: Record<string, JSX.Element> = {
  HIGH: <AlertTriangle className="h-4 w-4 text-red-500" />,
  MEDIUM: <Clock className="h-4 w-4 text-yellow-500" />,
  LOW: <CheckCircle className="h-4 w-4 text-green-500" />
};

export interface OrderItem {
  id: string;
  name: string;
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  category: string;
  total: number;
  materialId?: string | null;
  materialCode?: string | null;
}

export interface Order {
  id: string;
  projectTitle: string;
  customerReference?: string;  // ADDED: Customer's own reference number
  customerName: string;
  status: string;
  priority?: string | null;
  projectValue: number;
  leadTimeWeeks?: number | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[] | any; 
  notes?: string | null;
  currency?: string;
  vatRate?: number | null;
  paymentTerms?: string | null;
  quoteRef: string;
  customerId?: string | null;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  marginPercent?: number | null;
  progress?: number | null;
  deadline?: string | null;
  sourceQuoteId?: string | null;
  jobId?: string | null;
  projectOwnerId?: string;
  createdById?: string;
  job?: {
    id: string;
    status: string;
    title: string;
  } | null;
}

interface OrderData {
  id?: string;
  projectTitle: string;
  customerReference?: string;  // ADDED: Customer's own reference number
  customerName: string;
  status: string;
  priority?: string;
  projectValue: number;
  leadTimeWeeks?: number;
  createdAt?: string;
  updatedAt?: string;
  items: OrderItem[];
  notes?: string;
  currency?: string;
  vatRate?: number;
  paymentTerms?: string;
  quoteRef: string;
  customerId?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  marginPercent?: number;
  progress?: number;
  deadline?: string;
  sourceQuoteId?: string;
  jobId?: string;
  projectOwnerId?: string;
  createdById?: string;
}

export default function Orders() {
  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [minValue, setMinValue] = useState('');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedOrderForStatusUpdate, setSelectedOrderForStatusUpdate] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = viewMode === 'grid' ? 9 : 10; 
  const availableOrderStatuses = ['IN_PRODUCTION', 'ON_HOLD', 'READY_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'];

  const fetchOrders = useCallback(async () => {
    console.log("[Orders.tsx] fetchOrders starting...");
    setIsLoading(true);
    setError(null);
    let apiOrders: Order[] = [];
    
    try {
      const response = await apiClient.get('/orders'); 
      console.log('[Orders.tsx] Fetched orders from API:', response.data);
      
      const data = response.data as any;
      if (Array.isArray(data)) {
        apiOrders = data;
      } else if (data && Array.isArray(data.orders)) {
        apiOrders = data.orders;
      } else {
        console.warn('[Orders.tsx] API response for orders was not an array or expected object.');
        apiOrders = [];
      }

    } catch (apiErr: any) {
      console.error('[Orders.tsx] Error fetching orders from API:', apiErr.response?.data || apiErr.message);
      setError(`Failed to fetch orders: ${apiErr.response?.data?.message || apiErr.message}. Displaying local data if available.`);
    }
    
    let mockOrders: Order[] = [];
    try {
      const storedMockOrders = localStorage.getItem('mockOrders');
      if (storedMockOrders) {
          mockOrders = JSON.parse(storedMockOrders);
          if (!Array.isArray(mockOrders)) mockOrders = [];
      }
    } catch (localStorageErr: any) {
      console.error('[Orders.tsx] Error parsing mock orders from localStorage:', localStorageErr);
    }
    
    const combinedOrdersMap = new Map<string, Order>();
    apiOrders.forEach(order => { if (order && order.id) combinedOrdersMap.set(order.id, order); });
    mockOrders.forEach(mockOrder => { if (mockOrder && mockOrder.id && !combinedOrdersMap.has(mockOrder.id)) combinedOrdersMap.set(mockOrder.id, mockOrder); });
    
    const combinedOrders = Array.from(combinedOrdersMap.values())
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    
    setOrders(combinedOrders);
    setIsLoading(false);
    console.log("[Orders.tsx] fetchOrders finished. Total orders:", combinedOrders.length);
  }, []); 

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOrderSubmit = async (orderData: Omit<OrderData, 'id' | 'createdAt' | 'updatedAt'> | Partial<OrderData>) => {
    setIsLoading(true);
    try {
      let response: any;
      if (editingOrder && editingOrder.id) {
        console.log('[Orders.tsx] Updating order:', editingOrder.id, orderData);
        const { id, createdAt, updatedAt, ...updatePayload } = orderData as OrderData;
        response = await apiClient.patch(`/orders/${editingOrder.id}`, updatePayload);
        setOrders(prevOrders => prevOrders.map(o => o.id === editingOrder.id ? response.data : o));
      } else {
        console.log('[Orders.tsx] Creating order:', orderData);
        response = await apiClient.post('/orders', orderData);
        setOrders(prevOrders => [response.data, ...prevOrders]
          .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()));
      }
      setIsOrderModalOpen(false);
      setEditingOrder(null);
    } catch (err: any) {
      console.error('[Orders.tsx] Error submitting order:', err.response?.data || err.message);
      setError(`Failed to submit order: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const openStatusUpdateModal = (order: Order) => {
    setSelectedOrderForStatusUpdate(order);
    setIsStatusModalOpen(true);
  };

  const confirmStatusUpdate = async (newStatus: string) => { 
    if (!selectedOrderForStatusUpdate || !selectedOrderForStatusUpdate.id) return;
    const orderIdToUpdate = selectedOrderForStatusUpdate.id;
    setIsLoading(true);
    try {
      const response = await apiClient.patch(`/orders/${orderIdToUpdate}/status`, { status: newStatus });
      
      const data = response.data as any;
      if (data.order) {
        setOrders(prevOrders => prevOrders.map(order => 
            order.id === orderIdToUpdate ? data.order : order
        ));
        
        if (data.jobCreated && data.jobId) {
          alert(`Order ready for delivery!\nJob automatically created: ${data.jobId}\n\nThe job is now ACTIVE and ready for work to begin.`);
        }
        
        console.log(`[Orders.tsx] Status updated for order ${orderIdToUpdate} to ${newStatus}. Job created: ${data.jobCreated}`);
      } else {
        setOrders(prevOrders => prevOrders.map(order => 
            order.id === orderIdToUpdate ? { ...order, status: newStatus } : order
        ));
      }
    } catch (err: any) {
      console.error('[Orders.tsx] Error updating order status:', err.response?.data || err.message);
      setError(`Failed to update status: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsStatusModalOpen(false);
      setSelectedOrderForStatusUpdate(null);
      setIsLoading(false);
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setIsOrderModalOpen(true);
  };

  const handlePageChange = (newPage: number) => { 
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const convertOrderToOrderData = (order: Order): Partial<OrderData> => {
    return {
      ...order,
      contactPerson: order.contactPerson ?? undefined,
      contactEmail: order.contactEmail ?? undefined,
      contactPhone: order.contactPhone ?? undefined,
      notes: order.notes ?? undefined,
      currency: order.currency ?? undefined,
      vatRate: order.vatRate ?? undefined,
      paymentTerms: order.paymentTerms ?? undefined,
      customerId: order.customerId ?? undefined,
      leadTimeWeeks: order.leadTimeWeeks ?? undefined,
      marginPercent: order.marginPercent ?? undefined,
      progress: order.progress ?? undefined,
      deadline: order.deadline ?? undefined,
      sourceQuoteId: order.sourceQuoteId ?? undefined,
      jobId: order.jobId ?? undefined,
      priority: order.priority ?? undefined,
      customerReference: order.customerReference ?? undefined,
    };
  };

  const filteredOrders = orders.filter(order => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (order.projectTitle?.toLowerCase().includes(lowerSearchTerm)) ||
      (order.customerName?.toLowerCase().includes(lowerSearchTerm)) ||
      (order.customerReference?.toLowerCase().includes(lowerSearchTerm)) ||
      (order.id?.toLowerCase().includes(lowerSearchTerm)) ||
      (order.quoteRef?.toLowerCase().includes(lowerSearchTerm));

    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const priorityString = order.priority || 'all';
    const matchesPriority = selectedPriority === 'all' || priorityString.toLowerCase() === selectedPriority.toLowerCase();
    const matchesValue = !minValue || (order.projectValue !== undefined && order.projectValue >= Number(minValue));

    return matchesSearch && matchesStatus && matchesPriority && matchesValue;
  });

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (isLoading && orders.length === 0 && !error) {
    return <div className="p-8 flex justify-center items-center text-gray-500 min-h-[300px]">Loading orders...</div>;
  }
  
  return (
    <div className="p-4 sm:p-8 max-w-full mx-auto bg-gray-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-center mb-6 sm:mb-8 gap-4"> 
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Order Management</h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button onClick={() => { setEditingOrder(null); setIsOrderModalOpen(true); }} className="flex items-center space-x-2 px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Plus className="h-4 w-4" /> <span>New Order</span>
          </button>
          <div className="flex border rounded-lg overflow-hidden shadow-sm">
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'bg-white hover:bg-gray-50'}`} title="Grid View"><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setViewMode('table')} className={`p-2 ${viewMode === 'table' ? 'bg-indigo-100 text-indigo-700' : 'bg-white hover:bg-gray-50'}`} title="Table View"><Table className="h-4 w-4" /></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input type="text" placeholder="Search by Title, Customer, Ref..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          </div>
          <button onClick={() => setFilterOpen(!filterOpen)} className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500">
            <Filter className="h-4 w-4 text-gray-500" /> <span>Filter</span>
          </button>
        </div>
      </div> 

      {filterOpen && (
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 mb-6 border border-gray-200 transition-all duration-300 ease-in-out">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select className="w-full border-gray-300 rounded-lg p-2 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                {availableOrderStatuses.map(status => (<option key={status} value={status}>{status.replace(/_/g, ' ')}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
              <select className="w-full border-gray-300 rounded-lg p-2 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
                <option value="all">All Priorities</option> <option value="HIGH">High</option> <option value="MEDIUM">Medium</option> <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Min. Value</label>
              <input type="number" className="w-full border-gray-300 rounded-lg p-2 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500" value={minValue} onChange={(e) => setMinValue(e.target.value)} placeholder="e.g., 1000"/>
            </div>
            <div className="flex items-end"><button onClick={() => setFilterOpen(false)} className="px-3 py-2 text-xs border rounded-lg hover:bg-gray-100 w-full sm:w-auto bg-gray-50">Close Filters</button></div>
          </div>
        </div>
      )}

      {error && (
        <div className="my-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
          <p><strong className="font-bold">Error:</strong> {error}</p>
          {orders.length > 0 && <p className="text-sm mt-1">Displaying currently available data.</p>}
          <button onClick={fetchOrders} className="mt-2 text-sm text-red-600 hover:text-red-800 underline font-semibold">Retry Fetching Orders</button>
        </div>
      )}

      {viewMode === 'table' ? (
        <OrdersTableView
          orders={paginatedOrders}
          isLoading={isLoading}
          error={error}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onUpdateStatus={openStatusUpdateModal}
          statusColors={statusColors}
          formatDate={formatDate}
        />
      ) : (
        <>
          {(isLoading && paginatedOrders.length === 0) ? (
             <div className="text-center py-10 text-gray-500">Loading orders...</div>
          ) : (!isLoading && paginatedOrders.length === 0 && !error) ? (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-lg shadow">
              No orders found matching your criteria.
              {orders.length === 0 ? ' Create a new order or convert an approved quote.' : ' Try adjusting your search or filters.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-5 flex flex-col justify-between border border-gray-200">
                  <div>
                    {/* NEW: Show customer reference prominently if exists */}
                    {order.customerReference && (
                      <div className="mb-2">
                        <span className="inline-block text-sm font-bold text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-200">
                          {order.customerReference}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-md font-semibold text-indigo-700 truncate mr-2" title={order.projectTitle}>{order.projectTitle || `Order ${order.id}`}</h3>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${statusColors[order.status] || statusColors.IN_PRODUCTION}`}>
                          {order.status?.replace(/_/g, ' ') || 'Unknown'}
                        </span>
                        {order.jobId && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                            <Briefcase className="h-3 w-3" />
                            <span>Job Created</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-1" title={order.customerName}>{order.customerName || 'N/A'}</p>
                    <p className="text-xs text-gray-400 mb-3">Ref: {order.quoteRef} {order.id?.startsWith('mock-') && <span className="text-orange-500">(Local)</span>}</p>
                    
                    <div className="text-sm space-y-1.5 text-gray-700 border-t border-gray-200 pt-3 mt-3">
                      <p><strong>Value:</strong> {order.projectValue?.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' }) ?? 'N/A'}</p>
                      <p><strong>Lead Time:</strong> {order.leadTimeWeeks ?? 'N/A'} weeks</p>
                      <div className="flex items-center"><strong>Priority:</strong> <span className="ml-2 flex items-center">{priorityIconsMap[order.priority?.toUpperCase() as keyof typeof priorityIconsMap] || order.priority || 'N/A'}</span></div>
                      <p><strong>Created:</strong> {formatDate(order.createdAt)}</p>
                      <p><strong>Deadline:</strong> {formatDate(order.deadline)}</p>
                      {order.job && (
                        <p><strong>Job Status:</strong> <span className="text-blue-600 font-medium">{order.job.status.replace(/_/g, ' ')}</span></p>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-200 flex flex-wrap gap-2 justify-end items-center">
                    <button onClick={() => handleEdit(order)} className="text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100 shadow-sm flex items-center"><Edit size={14} className="mr-1"/>Edit</button>
                    <button onClick={() => openStatusUpdateModal(order)} className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 shadow-sm flex items-center"><MoreVertical size={14} className="mr-1"/>Status</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {totalPages > 1 && !isLoading && paginatedOrders.length > 0 && (
            <div className="mt-8 px-4 py-3 flex items-center justify-between border-t bg-white rounded-b-lg shadow-md">
              <div className="text-sm text-gray-700">Page {currentPage} of {totalPages} ({filteredOrders.length} total orders)</div>
              <div className="flex space-x-1">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 text-sm bg-white">Previous</button>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 text-sm bg-white">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {isStatusModalOpen && selectedOrderForStatusUpdate && ( 
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Update Status for: <span className="font-normal text-indigo-600">{selectedOrderForStatusUpdate.projectTitle || `Order ${selectedOrderForStatusUpdate.id}`}</span></h2>
            <div className="grid grid-cols-2 gap-3">
              {availableOrderStatuses.map((status) => (
                <button key={status} onClick={() => confirmStatusUpdate(status)}
                  className={`py-2.5 px-3 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500
                    ${selectedOrderForStatusUpdate.status === status 
                      ? `${statusColors[status] || 'bg-indigo-600 text-white'} ring-2 ring-indigo-400` 
                      : `${statusColors[status]?.split(' ')[0] || 'bg-gray-100'} ${statusColors[status]?.split(' ')[1] || 'text-gray-700'} hover:opacity-80`}`}
                >
                  {status.replace(/_/g, ' ')}
                  {status === 'READY_FOR_DELIVERY' && (
                    <div className="text-xs text-gray-500 mt-1">→ Auto-creates Job</div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-6"><button onClick={() => {setIsStatusModalOpen(false); setSelectedOrderForStatusUpdate(null);}} className="px-4 py-2 border rounded-md text-sm hover:bg-gray-100">Cancel</button></div>
          </div>
        </div>
      )}

      {isOrderModalOpen && (
        <OrderModal
          isOpen={isOrderModalOpen}
          onClose={() => { setIsOrderModalOpen(false); setEditingOrder(null); }}
          onSubmit={handleOrderSubmit}
          orderToEdit={editingOrder ? convertOrderToOrderData(editingOrder) : undefined}
        />
      )}
    </div>
  );
}