// src/routes/routes.tsx (amended with audit routes + HMRC R&D routes)
import { Routes, Route, Navigate, useLocation, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import useAuth

// Import your components
import Customers from "../components/Customers";
import CustomerDetails from "../components/CustomerDetails";
import Dashboard from "../components/dashboard/Dashboard";
import Inventory from "../components/inventory/Inventory";
import Orders from "../components/orders/Orders";
import Quotes from "../components/quotes/Quotes";
import Suppliers from "../components/suppliers/Suppliers";
import Jobs from "../components/jobs/Jobs"; // Import Jobs component
import Login from "../components/Login";
import Signup from "../components/Signup";
import NotFound from "../components/ui/NotFound";
import JobDetails from "../components/jobs/JobDetails";
import AuditDashboard from "../components/audit/AuditDashboard"; // Import AuditDashboard

// Import HMRC R&D components
import HmrcDashboard from "../components/hmrc/HmrcDashboard";
import TimeTracker from "../components/timetracking/TimeTracker";
import TimeEntriesList from "../components/timetracking/TimeEntriesList";

// Create a Protected Route wrapper component
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Optional: Show a loading spinner or skeleton screen while checking auth
    // Or return null, or a minimal layout
    return <div>Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them back after login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Optional: Create a Public Route wrapper component (for Login/Signup)
function PublicRoute({ children }: { children: JSX.Element }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        // Optional: Show loading indicator
        return <div>Loading authentication...</div>;
    }

    if (isAuthenticated) {
        // If user is logged in, redirect them from login/signup page to dashboard
        return <Navigate to="/" replace />;
    }

    return children;
}

// JobDetails Route Wrapper
function JobDetailsRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const handleClose = () => {
    navigate('/jobs');
  };
  
  const handleUpdate = () => {
    // Refresh will be handled by the component itself
    window.location.reload();
  };

  if (!id) {
    return <Navigate to="/jobs" replace />;
  }

  return (
    <JobDetails 
      job={{ id }} 
      onClose={handleClose}
      onUpdate={handleUpdate}
    />
  );
}

// TimeTracker Route Wrapper  
function TimeTrackerRoute() {
  const { user } = useAuth();
  
  // Create a default employee from user data
  const currentEmployee = {
    id: user?.id || '',
    name: user?.name || 'Current User',
    email: user?.email || '',
    role: user?.role || 'Employee',
    hourlyRate: 25.00 // Default rate
  };

  return (
    <TimeTracker currentEmployee={currentEmployee} />
  );
}

// --- Main AppRoutes Component ---
const AppRoutes = () => {
  // No need to check localStorage here anymore!

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers/:id"
        element={
          <ProtectedRoute>
            <CustomerDetails />
          </ProtectedRoute>
        }
      />
       <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        }
      />
       <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        }
      />
       <Route
        path="/orders/:id" // Assuming Orders component handles ID or separate component
        element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        }
      />
       <Route
        path="/quotes"
        element={
          <ProtectedRoute>
            <Quotes />
          </ProtectedRoute>
        }
      />
       <Route
        path="/quotes/:id" // Assuming Quotes component handles ID or separate component
        element={
          <ProtectedRoute>
            <Quotes />
          </ProtectedRoute>
        }
      />
       <Route
        path="/suppliers"
        element={
          <ProtectedRoute>
            <Suppliers />
          </ProtectedRoute>
        }
      />
       <Route
        path="/suppliers/:id" // Assuming Suppliers component handles ID or separate component
        element={
          <ProtectedRoute>
            <Suppliers />
          </ProtectedRoute>
        }
      />
       <Route
        path="/jobs" // Fixed: Using Jobs component instead of Orders
        element={
          <ProtectedRoute>
            <Jobs />
          </ProtectedRoute>
        }
      />
       <Route
        path="/jobs/:id"
        element={
          <ProtectedRoute>
            <JobDetailsRoute />
          </ProtectedRoute>
        }
      />
      
      {/* Audit Routes */}
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <AuditDashboard />
          </ProtectedRoute>
        }
      />

      {/* HMRC R&D Routes */}
      <Route
        path="/hmrc"
        element={
          <ProtectedRoute>
            <HmrcDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hmrc/dashboard"
        element={
          <ProtectedRoute>
            <HmrcDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/time-tracking"
        element={
          <ProtectedRoute>
            <TimeTrackerRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/time-entries"
        element={
          <ProtectedRoute>
            <TimeEntriesList />
          </ProtectedRoute>
        }
      />

      {/* Catch-all Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;