import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/dashboard/Dashboard';
import Suppliers from './components/suppliers/Suppliers';
import Orders from './components/orders/Orders';

function App() {
 return (
   <Router>
     <div className="min-h-screen bg-gray-100">
       {/* Navigation */}
       <nav className="bg-white shadow">
         <div className="max-w-7xl mx-auto px-4">
           <div className="flex justify-between h-16">
             <div className="flex">
               <div className="flex-shrink-0 flex items-center">
                 <span className="text-2xl font-bold text-gray-900">BONES CRM</span>
               </div>
               <div className="ml-6 flex space-x-8">
                 <Link to="/" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1">
                   Dashboard
                 </Link>
                 <Link to="/suppliers" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1">
                   Suppliers
                 </Link>
                 <Link to="/orders" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1">
                   Orders
                 </Link>
                 <Link to="/inventory" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1">
                   Inventory
                 </Link>
               </div>
             </div>
           </div>
         </div>
       </nav>

       {/* Main Content */}
       <main>
         <Routes>
           <Route path="/" element={<Dashboard />} />
           <Route path="/suppliers" element={<Suppliers />} />
           <Route path="/orders" element={<Orders />} />
           <Route path="/inventory" element={<div className="p-8">Inventory Page Coming Soon</div>} />
         </Routes>
       </main>
     </div>
   </Router>
 );
}

export default App;
