import React from 'react';
import { AlertTriangle, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface OrdersTableViewProps {
  orders: any[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (order: any) => void;
  onUpdateStatus: (order: any) => void;
}

const ITEMS_PER_PAGE = 10;

export default function OrdersTableView({ 
  orders, 
  currentPage, 
  totalPages, 
  onPageChange,
  onEdit,
  onUpdateStatus
}: OrdersTableViewProps) {
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
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deadline
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
                  <div className="text-sm font-medium text-gray-900">{order.projectTitle}</div>
                  <div className="text-sm text-gray-500">{order.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{order.customer}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium 
                    ${order.status === 'IN_PRODUCTION' ? 'bg-blue-100 text-blue-800' : 
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      order.status === 'ON_HOLD' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                    <div 
                      className="bg-blue-600 rounded-full h-2" 
                      style={{ width: `${order.progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{order.progress}%</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${order.value.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.deadline}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => onEdit(order)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => onUpdateStatus(order)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Update Status
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Showing page {currentPage} of {totalPages}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}