// frontend/src/components/orders/OrdersTableView.tsx

import React from 'react';
import { ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';

interface OrdersTableViewProps {
  orders: any[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (order: any) => void;
  onUpdateStatus: (order: any) => void;
  statusColors: Record<string, string>;
  priorityIcons: Record<string, JSX.Element>;
  formatDate: (date: string | Date | null | undefined) => string;
}

export default function OrdersTableView({ 
  orders, 
  isLoading,
  error,
  currentPage, 
  totalPages, 
  onPageChange,
  onEdit,
  onUpdateStatus,
  statusColors,
  priorityIcons,
  formatDate
}: OrdersTableViewProps) {

  if (isLoading && orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-500">Loading orders...</div>
      </div>
    );
  }

  if (!isLoading && orders.length === 0 && !error) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-500">No orders found matching your criteria.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 max-w-[200px] truncate" title={order.projectTitle}>
                    {order.projectTitle || `Order ${order.id}`}
                  </div>
                  <div className="text-sm text-gray-500">
                    Ref: {order.quoteRef}
                    {order.id?.startsWith('mock-') && (
                      <span className="text-orange-500 ml-1">(Local)</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 max-w-[150px] truncate" title={order.customerName}>
                    {order.customerName || 'N/A'}
                  </div>
                  {order.contactPerson && (
                    <div className="text-xs text-gray-500 max-w-[150px] truncate" title={order.contactPerson}>
                      {order.contactPerson}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* ✅ CLEAN: Use Order status colors from props */}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || statusColors.DRAFT}`}>
                    {order.status?.replace(/_/g, ' ') || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* ✅ NEW: Show job status if order has linked job */}
                  {order.jobId || order.job ? (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3 text-blue-500" />
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {order.job?.status?.replace(/_/g, ' ') || 'Created'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No Job</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {/* ✅ FIXED: Use correct field name and currency formatting */}
                  {order.projectValue?.toLocaleString('en-GB', { 
                    style: 'currency', 
                    currency: order.currency || 'GBP' 
                  }) || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {/* ✅ FIXED: Show lead time instead of deadline */}
                  {order.leadTimeWeeks ? `${order.leadTimeWeeks} weeks` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => onEdit(order)}
                      className="text-blue-600 hover:text-blue-900 px-2 py-1 text-xs border border-blue-200 rounded hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => onUpdateStatus(order)}
                      className="text-indigo-600 hover:text-indigo-900 px-2 py-1 text-xs border border-indigo-200 rounded hover:bg-indigo-50"
                    >
                      Status
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages} ({orders.length} orders on this page)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}