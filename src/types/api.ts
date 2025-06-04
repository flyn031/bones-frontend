// src/types/api.ts - Comprehensive API Response Types

// Base types
export interface User {
    id: string;
    name: string;
    email: string;
    role?: string;
    jobTitle?: string;
    department?: string;
    phone?: string;
    address?: string;
    contactPerson?: string;
  }
  
  export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    contactPerson: string;
  }
  
  export interface Job {
    id: string;
    title: string;
    projectTitle?: string;
    customer: {
      name: string;
    };
    description?: string;
    status?: string;
  }
  
  export interface Order {
    id: string;
    title?: string;
    status?: string;
    customer?: Customer;
    total?: number;
    date?: string;
  }
  
  export interface Supplier {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    contactPerson?: string;
    rating?: number;
  }
  
  export interface QuoteVersion {
    id: string;
    version: number;
    status?: string;
    total?: number;
    customer?: Customer;
    items?: any[];
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface QuoteData {
    id?: string;
    customer?: Customer;
    items: any[];
    terms: string;
    validityDays: number;
    date: string;
    total?: number;
  }
  
  export interface TimeEntry {
    id?: string;
    employeeId: string;
    jobId: string;
    date: string;
    hours: number;
    isRdActivity: boolean;
    rdDescription?: string;
  }
  
  export interface PriceHistoryPoint {
    date: string;
    price: number;
    supplier?: string;
  }
  
  export interface FinancialMetricsResponse {
    revenue: number;
    profit: number;
    expenses: number;
    growth: number;
  }
  
  export interface JobStats {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  }
  
  export interface Material {
    id: string;
    name: string;
    code?: string;
    unitPrice: number;
    unit?: string;
    category?: string;
    description?: string;
    stock?: number;
  }
  
  export interface JobCost {
    id: string;
    description: string;
    amount: number;
    date: string;
    category: string;
    invoiced: boolean;
    notes?: string;
    materialId?: string;
    supplierId?: string;
  }
  
  export interface InventoryAlertsResponse {
    alerts: Array<{
      id: string;
      type: string;
      message: string;
      severity: string;
      materialId?: string;
      materialName?: string;
    }>;
  }
  
  // API Response Types
  export interface LoginResponse {
    token: string;
    user: User;
  }
  
  export interface RegisterResponse {
    token?: string;
    user?: User;
    message?: string;
  }
  
  export interface CustomersResponse {
    customers: Customer[];
  }
  
  export interface JobsResponse {
    jobs: Job[];
    data?: Job[]; // Some endpoints use 'data' wrapper
    pagination?: {
      page: number;
      total: number;
      pages: number;
    };
  }
  
  export interface OrdersResponse {
    orders?: Order[];
    data?: Order[];
    order?: Order; // For single order responses
  }
  
  export interface SuppliersResponse {
    suppliers?: Supplier[];
    data?: Supplier[];
  }
  
  export interface QuotesResponse {
    quotes?: QuoteVersion[];
    data?: QuoteVersion[];
  }
  
  export interface PriceHistoryResponse {
    priceHistory: PriceHistoryPoint[];
    materialName?: string;
  }
  
  export interface MaterialPriceResponse {
    unitPrice: number;
  }
  
  export interface CreateCustomerResponse {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    contactPerson: string;
  }
  
  export interface CreateOrderResponse {
    id: string;
    order?: {
      id: string;
    };
  }
  
  export interface GenericApiResponse<T = any> {
    data?: T;
    message?: string;
    error?: string;
    success?: boolean;
  }
  
  // Error Response Type
  export interface ApiErrorResponse {
    error?: string;
    message?: string;
    details?: any;
  }
  
  // Utility type for handling various response structures
  export type ApiResponse<T> = T | GenericApiResponse<T>;