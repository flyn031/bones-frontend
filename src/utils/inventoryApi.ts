import { apiClient } from './api';

export interface InventoryAlert {
  id: string;
  materialId: string;
  materialName: string;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'REORDER_POINT';
  currentLevel: number;
  thresholdLevel: number;
  unit: string;
  createdAt: string;
}

// Local interface to avoid conflicts
interface InventoryAlertsResponse {
  alerts: InventoryAlert[];
  totalAlerts: number;
}

export const fetchInventoryAlerts = async () => {
  const response = await apiClient.get('/inventory/alerts');
  return response.data as InventoryAlertsResponse;
};