// FIX: Remove unused React import (React 17+ doesn't need it for JSX)
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, Outlet } from 'react-router-dom';
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
import UserProfile from './components/user/UserProfile';
import AuditDashboard from './components/audit/AuditDashboard'; // Import AuditDashboard
import { useAuth } from './context/AuthContext';

// Import HMRC R&D components
import { HmrcDashboard } from './components/hmrc';
import { TimeEntriesList } from './components/timetracking';
import { TimeTrackerWrapper } from './components/timetracking/TimeTrackerWrapper';

// Navigation component (remains mostly the same)
function Navigation() {
  // Removed useAuth from here, as it's rendered only when authenticated

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30"> {/* Added sticky and z-index */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                BONES CRM
              </Link>
            </div>
            {/* --- Navigation Links --- */}
            <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
              {/* Example using a common style */}
              {[
                { path: "/", label: "Dashboard" },
                { path: "/customers", label: "Customers" },
                { path: "/quotes", label: "Quotes" },
                { path: "/orders", label: "Orders" },
                { path: "/jobs", label: "Jobs" },
                { path: "/suppliers", label: "Suppliers" },
                { path: "/inventory", label: "Stock" },
                { path: "/financial", label: "Finance" },
                { path: "/hmrc", label: "R&D Tax" },
                { path: "/time-tracking", label: "Time" },
                { path: "/audit", label: "Audit" },
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  // Add active styling based on current route if desired using NavLink from react-router-dom
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700 inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          {/* --- User Profile --- */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* UserProfile component handles its own state/dropdown */}
            <UserProfile />
          </div>
           {/* Add Mobile Menu Button Here if needed */}
        </div>
      </div>
      {/* Add Mobile Menu Panel Here if needed */}
    </nav>
  );
}

// Layout component for authenticated users (includes Navigation)
function ProtectedLayout() {
  // You could add sidebar logic here too if needed
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navigation />
      <main className="py-6 px-4 sm:px-6 lg:px-8"> {/* Added padding to main */}
        {/* The nested routes will render here */}
        <Outlet />
      </main>
    </div>
  );
}

// Main App component with routing logic
function App() {
  // Get auth state and loading status
  const { isAuthenticated, loading } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);
  
  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (!loading) {
      setLocalLoading(false);
    } else {
      // Force loading to end after 5 seconds maximum
      const timer = setTimeout(() => {
        setLocalLoading(false);
        console.log("App: Force-ending loading state after timeout");
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // --- Show loading indicator while checking auth status ---
  if (localLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Loading Application...
          {/* You can add a spinner here */}
        </div>
      </div>
    );
  }

  // --- Define Routes once loading is complete ---
  return (
    <Router>
      <Routes>
        {/* Public Route: Login Page */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace /> // If logged in, redirect to dashboard
            ) : (
              <Login /> // Otherwise, show login page
            )
          }
        />

        {/* Protected Routes: Routes requiring authentication */}
        <Route
          path="/*" // Match all routes intended to be protected
          element={
            isAuthenticated ? (
              <ProtectedLayout /> // Show layout (Nav + Outlet) if authenticated
            ) : (
              <Navigate to="/login" replace /> // Otherwise, redirect to login
            )
          }
        >
          {/* Define child routes relative to the layout */}
          <Route index element={<Dashboard />} /> {/* index route for "/" */}
          <Route path="dashboard" element={<Dashboard />} /> {/* Optional explicit dashboard route */}
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="orders" element={<Orders />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetails />} /> {/* Dynamic route */}
          <Route path="financial" element={<FinancialPage />} />
          <Route path="audit" element={<AuditDashboard />} /> {/* Added Audit route */}
          
          {/* HMRC R&D Routes */}
          <Route path="hmrc" element={<HmrcDashboard />} />
          <Route path="time-tracking" element={<TimeTrackerWrapper />} />
          <Route path="time-entries" element={<TimeEntriesList />} />

          {/* Add a catch-all for unknown protected routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;