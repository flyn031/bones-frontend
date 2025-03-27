import { apiClient } from './api';

export interface InventoryAlert {
  id: string;
  materialName: string;
  currentStock: number;
  minStockLevel: number;
  status: 'Low' | 'Critical' | 'Backorder';
  supplier?: {
    name: string;
  };
  alertType: string;
  alertMessage: string;
  severity: number;
  daysToRestock: number;
}

export interface InventoryAlertsResponse {
  alerts: Array<any>;
  alertsByCategory: {
    critical: Array<any>;
    lowStock: Array<any>;
    reorder: Array<any>;
  };
  summary: {
    totalAlerts: number;
    criticalCount: number;
    lowStockCount: number;
    reorderCount: number;
    categoryCounts: Record<string, number>;
  };
}

export const fetchInventoryAlerts = async (): Promise<InventoryAlert[]> => {
  try {
    const response = await apiClient.get('/inventory/alerts');
    
    // Map the backend response to match what the frontend expects
    return response.data.alerts.map((alert: any) => ({
      id: alert.id,
      materialName: alert.name,
      currentStock: alert.currentStockLevel,
      minStockLevel: alert.minStockLevel,
      status: alert.alertType === 'CRITICAL' ? 'Critical' : 
              alert.alertType === 'LOW_STOCK' ? 'Low' : 'Backorder',
      supplier: alert.supplier,
      alertType: alert.alertType,
      alertMessage: alert.alertMessage,
      severity: alert.severity,
      daysToRestock: alert.daysToRestock
    }));
  } catch (error) {
    console.error("Error fetching inventory alerts:", error);
    return [];
  }
};

export const markAlertAsAddressed = async (alertId: string): Promise<boolean> => {
  try {
    await apiClient.post(`/inventory/alerts/${alertId}/address`);
    return true;
  } catch (error) {
    console.error("Error marking alert as addressed:", error);
    return false;
  }
};
