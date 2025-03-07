import axios from 'axios';
import { API_URL } from '../config/constants'; // Adjust this import based on your project structure

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
      
      // Transform the response to match what the component expects
      return {
        data: response.data.jobs || [],
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching jobs:', error);
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
        data: response.data || []
      };
    } catch (error) {
      console.error('Error fetching at-risk jobs:', error);
      throw error;
    }
  },

  // Get job by ID
  getJob: async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/jobs/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return {
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching job ${id}:`, error);
      throw error;
    }
  },

  // Create new job
  createJob: async (jobData: Partial<Job>) => {
    try {
      const response = await axios.post(`${API_URL}/jobs`, jobData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return {
        data: response.data
      };
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  // Update job
  updateJob: async (id: string, jobData: Partial<Job>) => {
    try {
      const response = await axios.patch(`${API_URL}/jobs/${id}`, jobData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return {
        data: response.data
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
        data: response.data
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
        data: response.data
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
        data: response.data
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
        data: response.data
      };
    } catch (error) {
      console.error(`Error adding note to job ${jobId}:`, error);
      throw error;
    }
  }
};