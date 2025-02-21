import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Phone, Mail, Calendar, DollarSign, Package, Clock } from 'lucide-react';
import dayjs from 'dayjs';

interface CustomerDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  lastOrderDate: string | null;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  date: string;
}

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomerData = async () => {
      setIsLoading(true);
      try {
        const [customerResponse, ordersResponse] = await Promise.all([
          axios.get(`http://localhost:4000/api/customers/${id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }),
          axios.get(`http://localhost:4000/api/customers/${id}/orders`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
        ]);
        
        setCustomer(customerResponse.data);
        setRecentOrders(ordersResponse.data);
        
        // Mock activities data (replace with real API call when available)
        setActivities([
          {
            id: '1',
            type: 'order',
            description: 'Placed new order #12345',
            date: new Date().toISOString()
          },
          {
            id: '2',
            type: 'contact',
            description: 'Customer support call regarding delivery',
            date: new Date(Date.now() - 86400000).toISOString()
          }
        ]);
      } catch (error) {
        console.error('Error fetching customer data:', error);
        setError('Failed to load customer information');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCustomerData();
    }
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading customer details...</div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || 'Customer not found'}</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customers
        </button>
        
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
          <button
            onClick={() => {/* Add edit functionality */}}
            className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
          >
            Edit Customer
          </button>
        </div>
      </div>

      {/* Customer Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
          <div className="space-y-3">
            <div className="flex items-center text-gray-600">
              <Mail className="h-5 w-5 mr-2" />
              <a href={`mailto:${customer.email}`} className="hover:text-blue-600">
                {customer.email}
              </a>
            </div>
            <div className="flex items-center text-gray-600">
              <Phone className="h-5 w-5 mr-2" />
              <a href={`tel:${customer.phone}`} className="hover:text-blue-600">
                {customer.phone}
              </a>
            </div>
          </div>
        </div>

        {/* Customer Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Customer Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Orders</div>
              <div className="text-xl font-semibold flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue-500" />
                {customer.totalOrders}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Spent</div>
              <div className="text-xl font-semibold flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                ${customer.totalSpent?.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Last Order</div>
              <div className="text-base flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-500" />
                {customer.lastOrderDate 
                  ? dayjs(customer.lastOrderDate).format('MMM D, YYYY')
                  : 'No orders yet'
                }
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Customer Since</div>
              <div className="text-base flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-500" />
                {dayjs(customer.createdAt).format('MMM D, YYYY')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {customer.notes && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{customer.notes}</p>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <button
              onClick={() => {/* Add new order functionality */}}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              New Order
            </button>
          </div>

          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dayjs(order.date).format('MMM D, YYYY')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${order.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">
                          View Order
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No orders found for this customer
            </div>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {dayjs(activity.date).format('MMM D, YYYY [at] h:mm A')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
}