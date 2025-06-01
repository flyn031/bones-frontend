// frontend/src/utils/api.ts (or your file path)

import axios from 'axios';

// ✅ FIXED - Import from constants:
import { API_URL } from '../config/constants';

const BASE_URL = API_URL; // Now uses environment-aware URL

// Create an axios instance with default configuration
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true  // Important for CORS with credentials
});

// --- Request Interceptor ---
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const requestInfo = `${config.method?.toUpperCase()} ${config.url}`;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
     // Optional verbose logging:
     // console.log(`[API Interceptor] Requesting: ${requestInfo}`, `Token attached: ${token.substring(0, 10)}...`);
    } else {
      console.warn(`[API Interceptor] Requesting: ${requestInfo}`, 'No token found in localStorage.');
      if (config.headers) {
        delete config.headers['Authorization'];
      }
    }
    return config;
  },
  (error) => {
    console.error('[API Interceptor] Request Setup Error:', error);
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
apiClient.interceptors.response.use(
  (response) => {
    // Return the whole response object
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API Interceptor] Response Error Status: ${error.response.status} for ${error.config?.url}`, 'Data:', error.response.data);
      if (error.response.status === 401) {
        console.error("[API Interceptor] Received 401 Unauthorized! Token may be invalid or missing.");
        // Handle redirect/logout in AuthContext or calling code
      }
    } else if (error.request) {
      console.error('[API Interceptor] No response received:', error.request);
    } else {
      console.error('[API Interceptor] Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);


// --- Customer-related API methods ---
export const customerApi = {
  // Existing methods
  getCustomers: (params?: { search?: string, status?: string, page?: number, limit?: number }) => apiClient.get('/customers', { params }),
  getCustomerById: (id: string) => apiClient.get(`/customers/${id}`),
  createCustomer: (customerData: any) => apiClient.post('/customers', customerData),
  updateCustomer: (id: string, customerData: any) => apiClient.put(`/customers/${id}`, customerData),
  deleteCustomer: (id: string) => apiClient.delete(`/customers/${id}`),
  getCustomerOrders: (customerId: string) => apiClient.get(`/customers/${customerId}/orders`), // Added based on routes file

  // --- Contact Person Methods (Complete Set) ---
  getContactPersonsForCustomer: (customerId: string) => apiClient.get(`/customers/${customerId}/contacts`),
  
  // Define a type for contact creation/update data for better safety
  createContactPerson: (customerId: string, contactData: { 
    name: string; 
    email?: string | null; 
    phone?: string | null; 
    role?: string | null; 
    notes?: string | null; 
    isPrimary?: boolean 
  }) => apiClient.post(`/customers/${customerId}/contacts`, contactData),
  
  // Update an existing contact
  updateContactPerson: (customerId: string, contactId: string, contactData: { 
    name: string; 
    email?: string | null; 
    phone?: string | null; 
    role?: string | null; 
    notes?: string | null; 
    isPrimary?: boolean 
  }) => apiClient.put(`/customers/${customerId}/contacts/${contactId}`, contactData),
  
  // Delete a contact
  deleteContactPerson: (customerId: string, contactId: string) => 
    apiClient.delete(`/customers/${customerId}/contacts/${contactId}`),
  
  // Set a contact as primary
  setPrimaryContactPerson: (customerId: string, contactId: string) =>
    apiClient.put(`/customers/${customerId}/contacts/${contactId}/set-primary`)
};

// --- Material-related API methods ---
export const materialApi = {
  getMaterials: (params?: { search?: string, category?: string }) => apiClient.get('/materials', { params }),
  getMaterialById: (id: string) => apiClient.get(`/materials/${id}`),
  createMaterial: (materialData: any) => apiClient.post('/materials', materialData),
  updateMaterial: (id: string, materialData: any) => apiClient.put(`/materials/${id}`, materialData),
  updateStock: (id: string, stockData: { quantity: number }) => apiClient.put(`/materials/${id}/stock`, stockData),
  deleteMaterial: (id: string) => apiClient.delete(`/materials/${id}`),
  getMaterialCategories: () => apiClient.get('/materials/categories')
};

// --- Supplier-related API methods ---
export const supplierApi = {
  getSuppliers: (params?: { search?: string, status?: string }) => apiClient.get('/suppliers', { params }),
  getSupplierById: (id: string) => apiClient.get(`/suppliers/${id}`),
  createSupplier: (supplierData: any) => apiClient.post('/suppliers', supplierData),
  updateSupplier: (id: string, supplierData: any) => apiClient.put(`/suppliers/${id}`, supplierData),
  deleteSupplier: (id: string) => apiClient.delete(`/suppliers/${id}`),
  getSupplierPerformanceReport: (id: string) => apiClient.get(`/suppliers/${id}/performance`),
  getAllSuppliersPerformance: () => apiClient.get('/suppliers/performance')
};

// --- Authentication-related API methods ---
export const authApi = {
  login: (email: string, password: string) => apiClient.post('/auth/login', { email, password }),
  register: (userData: any) => apiClient.post('/auth/register', userData),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (profileData: any) => apiClient.put('/auth/profile', profileData)
};

// --- Quote-related API methods ---
export const quoteApi = {
  getQuotes: (params?: { status?: string, customerId?: string, page?: number, limit?: number }) => apiClient.get('/quotes', { params }),
  getQuoteById: (quoteId: string) => apiClient.get(`/quotes/${quoteId}`),
  createQuote: (quoteData: any) => apiClient.post('/quotes', quoteData),
  updateQuote: (quoteId: string, quoteData: any) => apiClient.put(`/quotes/${quoteId}`, quoteData),
  deleteQuote: (quoteId: string) => apiClient.delete(`/quotes/${quoteId}`),
  cloneQuote: (quoteId: string, data: { customerId: string; title?: string; }) => apiClient.post(`/quotes/${quoteId}/clone`, data),
   convertToOrder: (quoteId: string) => apiClient.post(`/quotes/${quoteId}/convert-to-order`, {}),
   updateQuoteStatus: (quoteId: string, status: string) => apiClient.patch(`/quotes/${quoteId}/status`, { status })
};

// --- Jobs-related API methods ---
export const jobApi = {
  getJobs: (params?: { status?: string; page?: number; limit?: number; sortBy?: string; order?: 'asc' | 'desc' }) => apiClient.get('/jobs', { params }),
  getJobById: (jobId: string) => apiClient.get(`/jobs/${jobId}`),
  createJob: (jobData: any) => apiClient.post('/jobs', jobData),
  updateJob: (jobId: string, jobData: any) => apiClient.patch(`/jobs/${jobId}`, jobData),
  deleteJob: (jobId: string) => apiClient.delete(`/jobs/${jobId}`),
  addJobMaterial: (jobId: string, materialData: any) => apiClient.post(`/jobs/${jobId}/materials`, materialData),
  addJobNote: (jobId: string, noteData: { content: string }) => apiClient.post(`/jobs/${jobId}/notes`, noteData),
  getAvailableOrders: () => apiClient.get('/jobs/available-orders'),
  getAvailableUsers: () => apiClient.get('/jobs/available-users'),
  getJobStats: () => apiClient.get('/jobs/stats'),
  getJobPerformanceMetrics: (jobId: string) => apiClient.get(`/jobs/${jobId}/performance-metrics`),
  getAtRiskJobs: (daysThreshold: number = 7) => apiClient.get('/jobs/at-risk', { params: { days: daysThreshold } }),
};

// --- Financial API methods ---
export const financialApi = {
    fetchFinancialMetrics: () => apiClient.get('/financial/metrics'),
};

// --- Dashboard specific API calls ---
export const dashboardApi = {
    getStats: () => apiClient.get('/dashboard/stats'),
    getOrderTrendsChartData: () => apiClient.get('/dashboard/trends'),
    getRecentActivity: () => apiClient.get('/dashboard/activity'),
    getCustomerHealth: () => apiClient.get('/dashboard/customer-health'),
    getOrderTrendKPI: () => apiClient.get('/dashboard/order-trend-kpi')
};