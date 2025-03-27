import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from './components/dashboard/Dashboard';
import Suppliers from './components/suppliers/Suppliers';
import Orders from './components/orders/Orders';
import Inventory from './components/inventory/Inventory';
import Quotes from './components/quotes/Quotes';
import Customers from './components/Customers';
import CustomerDetails from './components/CustomerDetails';
import Login from './components/Login';
import Jobs from './components/jobs/Jobs';
import { FinancialPage } from './components/dashboard/FinancialPage';
import UserProfile from './components/user/UserProfile'; // Add this import
import { useAuth } from './context/AuthContext';

function Navigation() {
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                BONES CRM
              </Link>
            </div>
            <div className="ml-6 flex space-x-8">
              <Link to="/" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1">
                Dashboard
              </Link>
              <Link to="/customers" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1">
                Customers
              </Link>
              <Link to="/quotes" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1">
                Quotes
              </Link>
              <Link to="/orders" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1">
                Orders
              </Link>
              <Link to="/jobs" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1">
                Jobs
              </Link>
              <Link to="/suppliers" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1">
                Suppliers
              </Link>
              <Link to="/inventory" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1">
                Inventory
              </Link>
              <Link to="/financial" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1">
                Financial
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {/* Replace the logout button with UserProfile component */}
            <UserProfile />
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <main>
          <Routes>
            <Route 
              path="/login" 
              element={!isAuthenticated ? <Login /> : <Navigate to="/" />} 
            />
            <Route 
              path="/" 
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/suppliers" 
              element={isAuthenticated ? <Suppliers /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/orders" 
              element={isAuthenticated ? <Orders /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/inventory" 
              element={isAuthenticated ? <Inventory /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/quotes" 
              element={isAuthenticated ? <Quotes /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/jobs" 
              element={isAuthenticated ? <Jobs /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/customers" 
              element={isAuthenticated ? <Customers /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/customers/:id" 
              element={isAuthenticated ? <CustomerDetails /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/financial" 
              element={isAuthenticated ? <FinancialPage /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;