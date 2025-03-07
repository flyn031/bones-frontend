import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Search, Filter, ArrowUpDown, Clock, AlertTriangle, CheckCircle, Plus, LayoutGrid, Table } from "lucide-react";
import OrderModal from './OrderModal';
import OrdersTableView from './OrdersTableView';

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  IN_PRODUCTION: "bg-blue-100 text-blue-800",
  ON_HOLD: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  APPROVED: "bg-green-100 text-green-800" // Added for converted quotes
};

const priorityIcons = {
  HIGH: <AlertTriangle className="h-4 w-4 text-red-500" />,
  MEDIUM: <Clock className="h-4 w-4 text-yellow-500" />,
  LOW: <CheckCircle className="h-4 w-4 text-green-500" />
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [minValue, setMinValue] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedOrderForStatusUpdate, setSelectedOrderForStatusUpdate] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;
  
  const availableStatuses = [
    'DRAFT',
    'PENDING_APPROVAL',
    'IN_PRODUCTION',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED'
  ];

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Simply set the orders as they are received, without any sorting
      console.log('Fetched orders:', response.data);
      setOrders(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreateOrder = async (orderData) => {
    try {
      console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:4000/api/orders', orderData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Order created:', response.data);
      await fetchOrders();
      setIsOrderModalOpen(false);
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Full error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.response?.data?.error);
      
      alert('Failed to create order: ' + 
        (error.response?.data?.error || 
         error.response?.data?.message || 
         error.message)
      );
    }
  };
  
  const handleUpdateOrder = async (orderData) => {
    try {
      console.log('Updating order:', orderData);
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:4000/api/orders/${editingOrder.id}`, orderData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchOrders();
      setEditingOrder(null);
      setIsOrderModalOpen(false);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order: ' + error.message);
    }
  };

  const openStatusUpdateModal = (order) => {
    setSelectedOrderForStatusUpdate(order);
    setIsStatusModalOpen(true);
  };

  const confirmStatusUpdate = async (newStatus) => {
    if (!selectedOrderForStatusUpdate) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:4000/api/orders/${selectedOrderForStatusUpdate.id}/status`, 
        { status: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      await fetchOrders();
      setIsStatusModalOpen(false);
      setSelectedOrderForStatusUpdate(null);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status: ' + error.message);
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setIsOrderModalOpen(true);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (
      order.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || order.priority === selectedPriority;
    const matchesValue = !minValue || order.projectValue >= Number(minValue);

    return matchesSearch && matchesStatus && matchesPriority && matchesValue;
  });

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (isLoading) {
    return <div className="p-8 flex justify-center">Loading orders...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
          <button 
            onClick={fetchOrders}
            className="ml-4 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Order Management</h2>
        
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setEditingOrder(null);
              setIsOrderModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Create Order</span>
          </button>

          <div className="flex border rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 ${viewMode === 'table' ? 'bg-gray-100' : ''}`}
              title="Table View"
            >
              <Table className="h-4 w-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button 
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                className="w-full border rounded-lg p-2"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                {Object.keys(statusColors).map(status => (
                  <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            {/* Other filter options remain the same */}
          </div>
        </div>
      )}

      {viewMode === 'table' ? (
        <OrdersTableView
          orders={paginatedOrders}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onUpdateStatus={openStatusUpdateModal}
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-1 gap-4">
            {paginatedOrders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-gray-50 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{order.projectTitle}</h3>
                    <div className="mt-1 text-sm text-gray-500">{order.id} - {order.customerName}</div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    <div>Lead Time: {order.leadTimeWeeks} weeks</div>
                    <div>Value: £{order.projectValue?.toLocaleString()}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEdit(order)}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      Edit Order
                    </button>
                    <button 
                      onClick={() => openStatusUpdateModal(order)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Update Status
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 flex items-center justify-between border-t">
            <div className="text-sm text-gray-700">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              Update Status for {selectedOrderForStatusUpdate?.projectTitle}
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {availableStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => confirmStatusUpdate(status)}
                  className={`py-2 px-4 rounded ${
                    selectedOrderForStatusUpdate?.status === status 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded mr-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setEditingOrder(null);
        }}
        onSubmit={editingOrder ? handleUpdateOrder : handleCreateOrder}
        editOrder={editingOrder}
      />
    </div>
  );
}