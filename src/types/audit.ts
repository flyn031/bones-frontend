// src/types/audit.ts

export type AuditEntityType = 'QUOTE' | 'ORDER' | 'JOB';

export interface AuditHistory {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  quoteId?: string;
  orderId?: string;
  jobId?: string;
  changeType: string;
  oldValue?: any;
  newValue?: any;
  version: number;
  changedBy: string;
  changedByUser: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuditStatistics {
  totalChanges: number;
  changesByType?: {
    QUOTE?: number;
    ORDER?: number;
    JOB?: number;
  };
  changesByAction?: Record<string, number>;
  recentActivity?: AuditHistory[];
}

export interface AuditSearchParams {
  entityType?: AuditEntityType;
  entityId?: string;
  changeType?: string;
  changedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AuditSearchResponse {
  results: AuditHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditStatisticsParams {
  entityType?: AuditEntityType;
  dateFrom?: string;
  dateTo?: string;
}