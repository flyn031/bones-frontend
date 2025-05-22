// src/utils/auditApi.ts
import axios from 'axios';
import { API_URL } from '../config/constants';

// Audit history interfaces
export interface AuditHistory {
  id: string;
  version: number;
  status: string;
  data: any;
  changeType: string;
  changedBy: string;
  changedByUser: {
    id: string;
    name: string;
    email: string;
  };
  changeReason?: string;
  customerApproved?: boolean;
  customerSignature?: string;
  approvalTimestamp?: string;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface QuoteHistory extends AuditHistory {
  quoteId: string;
}

export interface OrderHistory extends AuditHistory {
  orderId: string;
}

export interface JobHistory extends AuditHistory {
  jobId: string;
  materialChanges?: any;
  progressNotes?: string;
  attachments?: any[];
}

export interface CompleteHistory {
  entity: string;
  entityId: string;
  history: AuditHistory[];
}

export interface LegalEvidencePackage {
  entityType: string;
  entityId: string;
  packageId: string;
  timeline: AuditHistory[];
  documents: any[];
  signatures: any[];
  generatedAt: string;
  downloadUrl: string;
}

export interface AuditStatistics {
  totalChanges: number;
  changesByType: Record<string, number>;
  changesByUser: Record<string, number>;
  recentActivity: AuditHistory[];
  trendData: {
    date: string;
    changes: number;
  }[];
}

export interface DigitalSignatureVerification {
  isValid: boolean;
  signedBy: string;
  signedAt: string;
  ipAddress?: string;
  details: any;
}

// Audit API methods
export const auditApi = {
  // Get quote history
  getQuoteHistory: async (quoteId: string) => {
    try {
      const response = await axios.get(`${API_URL}/audit/quotes/${quoteId}/history`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return {
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching quote history for ${quoteId}:`, error);
      throw error;
    }
  },

  // Get order history
  getOrderHistory: async (orderId: string) => {
    try {
      const response = await axios.get(`${API_URL}/audit/orders/${orderId}/history`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return {
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching order history for ${orderId}:`, error);
      throw error;
    }
  },

  // Get job history
  getJobHistory: async (jobId: string) => {
    try {
      const response = await axios.get(`${API_URL}/audit/jobs/${jobId}/history`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return {
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching job history for ${jobId}:`, error);
      throw error;
    }
  },

  // Get complete history (quote -> order -> job)
  getCompleteHistory: async (params: {
    quoteId?: string;
    orderId?: string;
    jobId?: string;
  }) => {
    try {
      const response = await axios.get(`${API_URL}/audit/complete-history`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return {
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching complete history:', error);
      throw error;
    }
  },

  // Get legal evidence package
  getLegalEvidencePackage: async (params: {
    entityType: 'QUOTE' | 'ORDER' | 'JOB';
    entityId: string;
    includeDocuments?: boolean;
    format?: 'JSON' | 'PDF';
  }) => {
    try {
      const response = await axios.post(`${API_URL}/audit/legal-evidence`, params, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return {
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching legal evidence package:', error);
      throw error;
    }
  },

  // Search audit history
  searchAuditHistory: async (params: {
    entityType?: 'QUOTE' | 'ORDER' | 'JOB';
    entityId?: string;
    changeType?: string;
    changedBy?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const response = await axios.get(`${API_URL}/audit/search`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return {
        data: response.data
      };
    } catch (error) {
      console.error('Error searching audit history:', error);
      throw error;
    }
  },

  // Get audit statistics
  getAuditStatistics: async (params: {
    entityType?: 'QUOTE' | 'ORDER' | 'JOB';
    dateFrom?: string;
    dateTo?: string;
  } = {}) => {
    try {
      const response = await axios.get(`${API_URL}/audit/statistics`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return {
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching audit statistics:', error);
      throw error;
    }
  },

  // Verify digital signature
  verifyDigitalSignature: async (signatureData: {
    entityType: 'QUOTE' | 'ORDER' | 'JOB';
    entityId: string;
    signature: string;
  }) => {
    try {
      const response = await axios.post(`${API_URL}/audit/verify-signature`, signatureData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return {
        data: response.data
      };
    } catch (error) {
      console.error('Error verifying digital signature:', error);
      throw error;
    }
  }
};

export default auditApi;