import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Box, Users, AlertTriangle, TrendingUp } from "lucide-react";

const mockData = {
  orders: [
    { month: 'Jan', value: 24 },
    { month: 'Feb', value: 32 },
    { month: 'Mar', value: 28 },
    { month: 'Apr', value: 45 },
    { month: 'May', value: 38 },
    { month: 'Jun', value: 52 }
  ],
  stats: {
    activeOrders: 42,
    totalSuppliers: 18,
    lowStock: 3,
    monthlyRevenue: 156750
  }
};

export default function Dashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">BONES CRM Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Active Orders Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Active Orders</h3>
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold">{mockData.stats.activeOrders}</div>
          <p className="text-sm text-gray-500">Orders in progress</p>
        </div>

        {/* Suppliers Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Total Suppliers</h3>
            <Users className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold">{mockData.stats.totalSuppliers}</div>
          <p className="text-sm text-gray-500">Active partnerships</p>
        </div>

        {/* Low Stock Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Low Stock Items</h3>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold">{mockData.stats.lowStock}</div>
          <p className="text-sm text-gray-500">Need attention</p>
        </div>

        {/* Revenue Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Monthly Revenue</h3>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold">${mockData.stats.monthlyRevenue.toLocaleString()}</div>
          <p className="text-sm text-gray-500">This month</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        {/* Order Trends Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Order Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData.orders}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis 
                  dataKey="month" 
                  stroke="#6B7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { title: "New order received", time: "5 minutes ago", status: "Order #1234 from Acme Corp" },
            { title: "Low stock alert", time: "1 hour ago", status: "Steel Pipes below minimum threshold" },
            { title: "Payment received", time: "2 hours ago", status: "Invoice #5678 - $12,350" },
          ].map((activity, index) => (
            <div key={index} className="flex items-start space-x-4">
              <Box className="h-4 w-4 mt-1 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">{activity.title}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span>{activity.time}</span>
                  <span className="mx-2">•</span>
                  <span>{activity.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
