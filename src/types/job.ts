// src/types/job.ts

// Base job status types
export type BaseJobStatus = 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ACTIVE' | 'CANCELED';

// Extended job status types (includes order statuses)
export type ExtendedJobStatus = BaseJobStatus | 'PENDING_APPROVAL' | 'APPROVED' | 'DECLINED' | 'IN_PRODUCTION' | 'ON_HOLD' | 'READY_FOR_DELIVERY' | 'DELIVERED';

// Job interface for components that expect base statuses only
export interface BaseJob {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  expectedEndDate: string;
  estimatedCost: number;
  status: BaseJobStatus;
  customer: {
    id: string;
    name: string;
  };
  // Optional fields for enhanced functionality
  isFromOrder?: boolean;
  originalOrderId?: string;
  quoteRef?: string;
}

// Extended job interface for components that handle both jobs and orders
export interface ExtendedJob {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  expectedEndDate: string;
  estimatedCost: number;
  status: ExtendedJobStatus;
  customer: {
    id: string;
    name: string;
  };
  // Optional fields for enhanced functionality
  isFromOrder?: boolean;
  originalOrderId?: string;
  quoteRef?: string;
}

// At Risk Job interface
export interface AtRiskJob {
  id: string;
  title: string;
  status: ExtendedJobStatus;
  expectedEndDate: string;
  customer: string; // Customer Name (string)
  assignedUsers: string[]; // Array of user names (strings)
  projectTitle: string | null; // Can be null if no linked order
}

// Combined type for rendering flexibility
export type DisplayJob = ExtendedJob | AtRiskJob;

// Helper function to convert ExtendedJob to BaseJob for components that need it
export const toBaseJob = (job: ExtendedJob): BaseJob => {
  // Map extended statuses to base statuses
  const statusMapping: Record<ExtendedJobStatus, BaseJobStatus> = {
    'DRAFT': 'DRAFT',
    'PENDING': 'PENDING', 
    'IN_PROGRESS': 'IN_PROGRESS',
    'COMPLETED': 'COMPLETED',
    'ACTIVE': 'ACTIVE',
    'CANCELED': 'CANCELED',
    // Map extended statuses to appropriate base statuses
    'PENDING_APPROVAL': 'PENDING',
    'APPROVED': 'ACTIVE',
    'DECLINED': 'CANCELED',
    'IN_PRODUCTION': 'IN_PROGRESS',
    'ON_HOLD': 'PENDING',
    'READY_FOR_DELIVERY': 'IN_PROGRESS',
    'DELIVERED': 'COMPLETED'
  };

  return {
    ...job,
    status: statusMapping[job.status] || 'PENDING'
  };
};