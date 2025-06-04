import axios from 'axios';
import { API_URL } from '../config/constants'; // Adjust this import based on your project structure
import { JobsResponse } from '../types/api';

// Define the job types
export interface Job {
  id: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  customer: {
    id: string;
    name: string;
  };
  order?: {
    id: string;
    projectTitle: string;
  };
  assignedUsers: Array<{
    id: string;
    name: string;
  }>;
  startDate?: Date;
  expectedEndDate?: Date;
  actualEndDate?: Date;
  totalCosts?: number;
}

export interface JobPerformanceMetrics {
  jobId: string;
  status: string;
  duration: {
    estimated: number;
    actual: number;
    variance: number;
  };
  performance: {
    durationVariancePercentage: number;
    isBehindSchedule: boolean;
  };
}

export interface AtRiskJob {
  id: string;
  title: string;
  status: string;
  expectedEndDate: Date;
  customer: string;
  assignedUsers: string[];
  projectTitle: string;
}

export interface JobStats {
  draft: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

// Fetch job statistics for dashboard
export const fetchJobStats = async (): Promise<JobStats> => {
  try {
    console.log("Calling job stats API endpoint...");
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.get(`${API_URL}/jobs/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log("Job stats response data:", response.data);
    return response.data as JobStats;
  } catch (error) {
    console.error('Error fetching job stats:', error);
    throw error;
  }
};

// Define the Job API methods
export const jobApi = {
  // Get all jobs with optional filter
  getJobs: async ({ status }: { status?: string } = {}) => {
    try {
      const params = status && status !== 'ALL' ? { status } : {};
      const response = await axios.get(`${API_URL}/jobs`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Type assertion and transform the response to match what the component expects
      const jobsData = response.data as JobsResponse;
      return {
        data: jobsData.jobs || jobsData.data || [],
        pagination: jobsData.pagination
      };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  },

  // Get job statistics for dashboard
  getJobStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return {
        data: response.data as JobStats
      };
    } catch (error) {
      console.error('Error fetching job stats:', error);
      throw error;
    }
  },

  // Get at-risk jobs
  getAtRiskJobs: async (daysThreshold: number = 7) => {
    try {
      const response = await axios.get(`${API_URL}/jobs/at-risk`, {
        params: { days: daysThreshold },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return {
        data: response.data as AtRiskJob[] || []
      };
    } catch (error) {
      console.error('Error fetching at-risk jobs:', error);
      throw error;
    }
  },

  // Get job by ID
  getJobById: async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/jobs/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return {
        data: response.data as Job
      };
    } catch (error) {
      console.error(`Error fetching job ${id}:`, error);
      throw error;
    }
  },

  // Create new job
  createJob: async (jobData: {
    title: string;
    description?: string;
    customerId: string;
    orderId?: string;
    status?: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    startDate?: string;
    expectedEndDate?: string;
    assignedUserIds?: string[];
  }) => {
    try {
      const response = await axios.post(`${API_URL}/jobs`, jobData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return {
        data: response.data as Job
      };
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  // Update job
  updateJob: async (id: string, jobData: {
    title?: string;
    description?: string;
    status?: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    startDate?: string;
    expectedEndDate?: string;
  }) => {
    try {
      const response = await axios.patch(`${API_URL}/jobs/${id}`, jobData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return {
        data: response.data as Job
      };
    } catch (error) {
      console.error(`Error updating job ${id}:`, error);
      throw error;
    }
  },

  // Delete job
  deleteJob: async (id: string) => {
    try {
      await axios.delete(`${API_URL}/jobs/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return { success: true };
    } catch (error) {
      console.error(`Error deleting job ${id}:`, error);
      throw error;
    }
  },

  // Get performance metrics for a job
  getJobPerformanceMetrics: async (jobId: string) => {
    try {
      const response = await axios.get(`${API_URL}/jobs/${jobId}/performance-metrics`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return {
        data: response.data as JobPerformanceMetrics
      };
    } catch (error) {
      console.error(`Error fetching metrics for job ${jobId}:`, error);
      throw error;
    }
  },

  // Get available orders for job creation
  getAvailableOrders: async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs/available-orders`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return {
        data: response.data as any[]
      };
    } catch (error) {
      console.error('Error fetching available orders:', error);
      throw error;
    }
  },

  // Get available users for job assignment
  getAvailableUsers: async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs/available-users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return {
        data: response.data as any[]
      };
    } catch (error) {
      console.error('Error fetching available users:', error);
      throw error;
    }
  },

  // Add note to job
  addJobNote: async (jobId: string, content: string) => {
    try {
      const response = await axios.post(`${API_URL}/jobs/${jobId}/notes`, { content }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return {
        data: response.data as any
      };
    } catch (error) {
      console.error(`Error adding note to job ${jobId}:`, error);
      throw error;
    }
  },

  // Generate comprehensive job progress report
  getJobProgressReport: async (jobId: string) => {
    try {
      const response = await axios.get(`${API_URL}/jobs/${jobId}/progress-report`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return {
        data: response.data as any
      };
    } catch (error) {
      console.error(`Error fetching progress report for job ${jobId}:`, error);
      throw error;
    }
  },

  // Get resource allocation recommendations for a specific job
  getResourceRecommendations: async (jobId: string) => {
    try {
      const response = await axios.get(`${API_URL}/jobs/${jobId}/resource-recommendations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return {
        data: response.data as any
      };
    } catch (error) {
      console.error(`Error fetching resource recommendations for job ${jobId}:`, error);
      throw error;
    }
  },

  // Add job material
  addJobMaterial: async (jobId: string, materialData: {
    materialId: string;
    quantity: number;
    estimatedCost?: number;
  }) => {
    try {
      const response = await axios.post(`${API_URL}/jobs/${jobId}/materials`, materialData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return {
        data: response.data as any
      };
    } catch (error) {
      console.error(`Error adding material to job ${jobId}:`, error);
      throw error;
    }
  },

  // Track job status changes
  updateJobStatus: async (jobId: string, status: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') => {
    try {
      const response = await axios.patch(`${API_URL}/jobs/${jobId}`, { status }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return {
        data: response.data as Job
      };
    } catch (error) {
      console.error(`Error updating status for job ${jobId}:`, error);
      throw error;
    }
  }
};

export default jobApi;