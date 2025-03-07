import { Routes, Route, Navigate } from "react-router-dom";
import Customers from "../components/Customers";
import CustomerDetails from "../components/CustomerDetails";
import Dashboard from "../components/dashboard/Dashboard";
import Inventory from "../components/inventory/Inventory";
import Orders from "../components/orders/Orders";
import Quotes from "../components/quotes/Quotes";
import Suppliers from "../components/suppliers/Suppliers";
import Login from "../components/Login";
import Signup from "../components/Signup";
import NotFound from "../components/ui/NotFound";
import JobDetails from "../components/jobs/JobDetails";

const AppRoutes = () => {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/" />} />
      
      <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
      
      <Route path="/customers" element={isAuthenticated ? <Customers /> : <Navigate to="/login" />} />
      <Route path="/customers/:id" element={isAuthenticated ? <CustomerDetails /> : <Navigate to="/login" />} />
      
      <Route path="/inventory" element={isAuthenticated ? <Inventory /> : <Navigate to="/login" />} />
      
      <Route path="/orders" element={isAuthenticated ? <Orders /> : <Navigate to="/login" />} />
      <Route path="/orders/:id" element={isAuthenticated ? <Orders /> : <Navigate to="/login" />} />
      
      <Route path="/quotes" element={isAuthenticated ? <Quotes /> : <Navigate to="/login" />} />
      <Route path="/quotes/:id" element={isAuthenticated ? <Quotes /> : <Navigate to="/login" />} />
      
      <Route path="/suppliers" element={isAuthenticated ? <Suppliers /> : <Navigate to="/login" />} />
      <Route path="/suppliers/:id" element={isAuthenticated ? <Suppliers /> : <Navigate to="/login" />} />
      
      <Route path="/jobs" element={isAuthenticated ? <Orders /> : <Navigate to="/login" />} />
      <Route path="/jobs/:id" element={isAuthenticated ? <JobDetails /> : <Navigate to="/login" />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;