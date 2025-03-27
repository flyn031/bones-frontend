import axios from 'axios';
import { API_URL } from '../config/constants';

export interface JobCost {
  id: string;
  jobId: string;
  description: string;
  amount: number;
  category: 'MATERIALS' | 'LABOR' | 'EQUIPMENT' | 'SUBCONTRACTOR' | 'ADMINISTRATIVE' | 'TRAVEL' | 'OTHER';
  date: string;
  materialId?: string;
  material?: {
    id: string;
    name: string;
    code: string;
  };
  supplierId?: string;
  supplier?: {
    id: string;
    name: string;
  };
  notes?: string;
  attachmentUrl?: string;
  invoiced: boolean;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CostSummary {
  totalCosts: number;
  byCategoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

// Job costs API methods
export const jobCostApi = {
  // Get all costs for a job
  getJobCosts: async (jobId: string) => {
    try {
      const response = await axios.get(`${API_URL}/jobs/${jobId}/costs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return {
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching costs for job ${jobId}:`, error);
      throw error;
    }
  },
  
  // Get cost summary for a job
  getJobCostSummary: async (jobId: string) => {
    try {
      const response = await axios.get(`${API_URL}/jobs/${jobId}/costs/summary`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return {
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching cost summary for job ${jobId}:`, error);
      throw error;
    }
  },
  
  // Add a new cost to a job
  addJobCost: async (jobId: string, costData: {
    description: string;
    amount: number;
    category: 'MATERIALS' | 'LABOR' | 'EQUIPMENT' | 'SUBCONTRACTOR' | 'ADMINISTRATIVE' | 'TRAVEL' | 'OTHER';
    date?: string;
    materialId?: string;
    supplierId?: string;
    notes?: string;
    attachmentUrl?: string;
  }) => {
    try {
      const response = await axios.post(`${API_URL}/jobs/${jobId}/costs`, costData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return {
        data: response.data
      };
    } catch (error) {
      console.error(`Error adding cost to job ${jobId}:`, error);
      throw error;
    }
  },
  
  // Update an existing cost
  updateJobCost: async (jobId: string, costId: string, costData: {
    description?: string;
    amount?: number;
    category?: 'MATERIALS' | 'LABOR' | 'EQUIPMENT' | 'SUBCONTRACTOR' | 'ADMINISTRATIVE' | 'TRAVEL' | 'OTHER';
    date?: string;
    materialId?: string;
    supplierId?: string;
    notes?: string;
    attachmentUrl?: string;
    invoiced?: boolean;
  }) => {
    try {
      const response = await axios.put(`${API_URL}/jobs/${jobId}/costs/${costId}`, costData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return {
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating cost ${costId}:`, error);
      throw error;
    }
  },
  
  // Delete a cost
  deleteJobCost: async (jobId: string, costId: string) => {
    try {
      await axios.delete(`${API_URL}/jobs/${jobId}/costs/${costId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return { success: true };
    } catch (error) {
      console.error(`Error deleting cost ${costId}:`, error);
      throw error;
    }
  },
  
  // Mark a cost as invoiced (convenience method)
  markCostAsInvoiced: async (jobId: string, costId: string, invoiced: boolean = true) => {
    try {
      const response = await axios.put(`${API_URL}/jobs/${jobId}/costs/${costId}`, { invoiced }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return {
        data: response.data
      };
    } catch (error) {
      console.error(`Error marking cost ${costId} as invoiced:`, error);
      throw error;
    }
  }
};

export default jobCostApi;