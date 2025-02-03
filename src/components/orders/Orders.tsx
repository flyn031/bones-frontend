import React, { useState } from 'react';
import { Package, Search, Filter, ArrowUpDown, Clock, AlertTriangle, CheckCircle } from "lucide-react";

const mockOrders = [
 {
   id: "ORD-2024-001",
   projectTitle: "Industrial Equipment Supply",
   customer: "Acme Corp",
   status: "IN_PRODUCTION",
   priority: "HIGH",
   value: 24500.00,
   deadline: "2024-02-15",
   lastUpdated: "2024-01-30",
   progress: 65
 },
 {
   id: "ORD-2024-002", 
   projectTitle: "Construction Materials",
   customer: "BuildCo Ltd",
   status: "PENDING_APPROVAL",
   priority: "MEDIUM",
   value: 18750.00,
   deadline: "2024-02-20",
   lastUpdated: "2024-01-29",
   progress: 25
 }
];

const statusColors = {
 DRAFT: "bg-gray-100 text-gray-800",
 PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
 IN_PRODUCTION: "bg-blue-100 text-blue-800",
 ON_HOLD: "bg-orange-100 text-orange-800",
 COMPLETED: "bg-green-100 text-green-800",
 CANCELLED: "bg-red-100 text-red-800"
};

const priorityIcons = {
 HIGH: <AlertTriangle className="h-4 w-4 text-red-500" />,
 MEDIUM: <Clock className="h-4 w-4 text-yellow-500" />,
 LOW: <CheckCircle className="h-4 w-4 text-green-500" />
};

export default function Orders() {
 const [searchTerm, setSearchTerm] = useState('');
 const [filterOpen, setFilterOpen] = useState(false);

 const filteredOrders = mockOrders.filter(order =>
   order.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
   order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
   order.id.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
   <div className="p-8 max-w-7xl mx-auto">
     {/* Header */}
     <div className="flex justify-between items-center mb-8">
       <h2 className="text-3xl font-bold">Order Management</h2>
       
       <div className="flex space-x-4">
         {/* Search */}
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

         {/* Filter Button */}
         <button 
           onClick={() => setFilterOpen(!filterOpen)}
           className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
         >
           <Filter className="h-4 w-4" />
           <span>Filter</span>
         </button>
       </div>
     </div>

     {/* Filter Panel */}
     {filterOpen && (
       <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
             <select className="w-full border rounded-lg p-2">
               <option>All Statuses</option>
               <option>In Production</option>
               <option>Pending Approval</option>
               <option>Completed</option>
             </select>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
             <select className="w-full border rounded-lg p-2">
               <option>All Priorities</option>
               <option>High</option>
               <option>Medium</option>
               <option>Low</option>
             </select>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
             <input type="date" className="w-full border rounded-lg p-2" />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Value Range</label>
             <input type="number" placeholder="Minimum value" className="w-full border rounded-lg p-2" />
           </div>
         </div>
       </div>
     )}

     {/* Orders List */}
     <div className="bg-white rounded-lg shadow overflow-hidden">
       <div className="grid grid-cols-1 gap-4">
         {filteredOrders.map((order) => (
           <div key={order.id} className="p-6 hover:bg-gray-50 border-b">
             <div className="flex justify-between items-start">
               <div>
                 <h3 className="text-lg font-medium text-gray-900">{order.projectTitle}</h3>
                 <div className="mt-1 text-sm text-gray-500">{order.id} - {order.customer}</div>
               </div>
               <div className="flex items-center space-x-4">
                 {priorityIcons[order.priority]}
                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                   {order.status.replace(/_/g, ' ')}
                 </span>
               </div>
             </div>

             {/* Progress Bar */}
             <div className="mt-4">
               <div className="flex justify-between text-sm text-gray-600 mb-1">
                 <span>Progress</span>
                 <span>{order.progress}%</span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-2">
                 <div 
                   className="bg-blue-600 rounded-full h-2" 
                   style={{ width: `${order.progress}%` }}
                 />
               </div>
             </div>

             <div className="mt-4 flex justify-between items-center">
               <div className="text-sm text-gray-500">
                 <div>Deadline: {order.deadline}</div>
                 <div>Value: ${order.value.toLocaleString()}</div>
               </div>
               <div className="flex space-x-2">
                 <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                   View Details
                 </button>
                 <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                   Update Status
                 </button>
               </div>
             </div>
           </div>
         ))}
       </div>
     </div>
   </div>
 );
}
