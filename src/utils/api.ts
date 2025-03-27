import axios from 'axios';

// Base URL for API calls
const BASE_URL = 'http://localhost:4000/api';

// Create an axios instance with default configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Customer-related API methods
export const customerApi = {
  // Fetch all customers
  getCustomers: (params?: { search?: string, status?: string }) => {
    return apiClient.get('/customers', { params });
  },

  // Fetch a single customer by ID
  getCustomerById: (id: string) => {
    return apiClient.get(`/customers/${id}`);
  },

  // Create a new customer
  createCustomer: (customerData: any) => {
    return apiClient.post('/customers', customerData);
  },

  // Update an existing customer
  updateCustomer: (id: string, customerData: any) => {
    return apiClient.put(`/customers/${id}`, customerData);
  },

  // Delete a customer
  deleteCustomer: (id: string) => {
    return apiClient.delete(`/customers/${id}`);
  }
};

// Material-related API methods
export const materialApi = {
  // Fetch all materials
  getMaterials: (params?: { search?: string, category?: string }) => {
    return apiClient.get('/materials', { params });
  },

  // Fetch a single material by ID
  getMaterialById: (id: string) => {
    return apiClient.get(`/materials/${id}`);
  },

  // Create a new material
  createMaterial: (materialData: any) => {
    return apiClient.post('/materials', materialData);
  },

  // Update an existing material
  updateMaterial: (id: string, materialData: any) => {
    return apiClient.put(`/materials/${id}`, materialData);
  },

  // Update material stock
  updateStock: (id: string, stockData: { quantity: number }) => {
    return apiClient.put(`/materials/${id}/stock`, stockData);
  },

  // Delete a material
  deleteMaterial: (id: string) => {
    return apiClient.delete(`/materials/${id}`);
  },

  // Get material categories
  getMaterialCategories: () => {
    return apiClient.get('/materials/categories');
  }
};

// Supplier-related API methods
export const supplierApi = {
  // Fetch all suppliers
  getSuppliers: (params?: { search?: string, status?: string }) => {
    return apiClient.get('/suppliers', { params });
  },

  // Fetch a single supplier by ID
  getSupplierById: (id: string) => {
    return apiClient.get(`/suppliers/${id}`);
  },

  // Create a new supplier
  createSupplier: (supplierData: any) => {
    return apiClient.post('/suppliers', supplierData);
  },

  // Update an existing supplier
  updateSupplier: (id: string, supplierData: any) => {
    return apiClient.put(`/suppliers/${id}`, supplierData);
  },

  // Delete a supplier
  deleteSupplier: (id: string) => {
    return apiClient.delete(`/suppliers/${id}`);
  },

  // Get supplier performance report
  getSupplierPerformanceReport: (id: string) => {
    return apiClient.get(`/suppliers/${id}/performance`);
  },

  // Get all suppliers performance
  getAllSuppliersPerformance: () => {
    return apiClient.get('/suppliers/performance');
  }
};

// Authentication-related API methods
export const authApi = {
  login: (email: string, password: string) => {
    return apiClient.post('/auth/login', { email, password });
  },

  register: (userData: any) => {
    return apiClient.post('/auth/register', userData);
  }
};

// Quote-related API methods
export const quoteApi = {
  // Fetch all quotes
  getQuotes: (params?: { 
    status?: string,
    customerId?: string, 
    page?: number, 
    limit?: number 
  }) => {
    return apiClient.get('/quotes', { params });
  },

  // Get a specific quote by ID
  getQuoteById: (quoteId: string) => {
    return apiClient.get(`/quotes/${quoteId}`);
  },

  // Create a new quote
  createQuote: (quoteData: {
    customerId: string;
    title: string;
    description?: string;
    lineItems?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      materialId?: string;
    }>;
    validUntil?: Date;
  }) => {
    return apiClient.post('/quotes', quoteData);
  },

  // Update an existing quote
  updateQuote: (
    quoteId: string, 
    quoteData: {
      customerId?: string;
      title?: string;
      description?: string;
      status?: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
      lineItems?: Array<{
        id?: string;
        description: string;
        quantity: number;
        unitPrice: number;
        materialId?: string;
      }>;
      validUntil?: Date;
    }
  ) => {
    return apiClient.put(`/quotes/${quoteId}`, quoteData);
  },

  // Delete a quote
  deleteQuote: (quoteId: string) => {
    return apiClient.delete(`/quotes/${quoteId}`);
  },
  
  // Clone an existing quote
  cloneQuote: (quoteId: string, data: { 
    customerId: string; 
    title?: string;
    adjustments?: Record<string, any>;
  }) => {
    return apiClient.post(`/quotes/${quoteId}/clone`, data);
  }
};

// Jobs-related API methods
export const jobApi = {
  // Fetch all jobs
  getJobs: (params?: { 
    status?: string, 
    page?: number, 
    limit?: number 
  }) => {
    return apiClient.get('/jobs', { params });
  },

  // Get a specific job by ID
  getJobById: (jobId: string) => {
    return apiClient.get(`/jobs/${jobId}`);
  },

  // Create a new job
  createJob: (jobData: {
    title: string;
    description?: string;
    orderId?: string;
    customerId?: string;
    status?: string;
    startDate?: string;
    assignedUserIds?: string[];
  }) => {
    return apiClient.post('/jobs', jobData);
  },

  // Update an existing job
  updateJob: (
    jobId: string, 
    jobData: {
      title?: string;
      description?: string;
      status?: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    }
  ) => {
    return apiClient.patch(`/jobs/${jobId}`, jobData);
  },

  // Get available orders for job creation
  getAvailableOrders: () => {
    return apiClient.get('/jobs/available-orders');
  },

  // Get available users for job assignment
  getAvailableUsers: () => {
    return apiClient.get('/jobs/available-users');
  },

  // Get job performance metrics
  getJobPerformanceMetrics: (jobId: string) => {
    return apiClient.get(`/jobs/${jobId}/performance-metrics`);
  },

  // Generate comprehensive job progress report
  getJobProgressReport: (jobId: string) => {
    return apiClient.get(`/jobs/${jobId}/progress-report`);
  },

  // Find jobs at risk of delay
  getAtRiskJobs: (daysThreshold?: number) => {
    return apiClient.get('/jobs/at-risk', {
      params: { days: daysThreshold }
    });
  },

  // Get resource allocation recommendations for a specific job
  getResourceRecommendations: (jobId: string) => {
    return apiClient.get(`/jobs/${jobId}/resource-recommendations`);
  },

  // Add job material
  addJobMaterial: (
    jobId: string, 
    materialData: {
      materialId: string;
      quantity: number;
      estimatedCost?: number;
    }
  ) => {
    return apiClient.post(`/jobs/${jobId}/materials`, materialData);
  },

  // Track job status changes
  updateJobStatus: (
    jobId: string, 
    status: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  ) => {
    return apiClient.patch(`/jobs/${jobId}`, { status });
  },

  // Add a note to a job
  addJobNote: (jobId: string, noteData: { content: string }) => {
    return apiClient.post(`/jobs/${jobId}/notes`, noteData);
  },

  // Delete a job
  deleteJob: (jobId: string) => {
    return apiClient.delete(`/jobs/${jobId}`);
  }
};

// Export the configured axios instance
export { apiClient };