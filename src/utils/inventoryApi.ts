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
  // Additional properties that component expects
  name: string;
  alertMessage: string;
  currentStockLevel: number;
  minStockLevel: number;
  daysToRestock: number;
}

// Export the interface and update structure to match component expectations
export interface InventoryAlertsResponse {
  alerts: InventoryAlert[];
  alertsByCategory: {
    critical: InventoryAlert[];
    lowStock: InventoryAlert[];
    reorder: InventoryAlert[];
  };
  summary: {
    totalAlerts: number;
    criticalCount: number;
    lowStockCount: number;
  };
}

export const fetchInventoryAlerts = async () => {
  const response = await apiClient.get('/inventory/alerts');
  return response.data as InventoryAlertsResponse;
};