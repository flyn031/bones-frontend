import React, { useEffect, useState } from 'react';
import { AlertTriangle, Package, ArrowRight } from 'lucide-react';
import { fetchInventoryAlerts, InventoryAlert, InventoryAlertsResponse } from '../../utils/inventoryApi';
import { Link } from 'react-router-dom';

interface InventoryAlertsProps {
  maxAlerts?: number;
}

const InventoryAlerts: React.FC<InventoryAlertsProps> = ({ maxAlerts = 5 }) => {
  const [alertsData, setAlertsData] = useState<InventoryAlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchInventoryAlerts();
        setAlertsData(data);
      } catch (err) {
        console.error('Failed to load inventory alerts:', err);
        setError('Failed to load inventory alerts');
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, []);

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case 'CRITICAL':
        return 'bg-red-50 border-red-500 text-red-700';
      case 'LOW_STOCK':
        return 'bg-amber-50 border-amber-500 text-amber-700';
      case 'REORDER':
        return 'bg-blue-50 border-blue-500 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-500 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
          <h2 className="text-lg font-semibold">Inventory Alerts</h2>
        </div>
        <div className="p-4 text-center text-gray-500">Loading inventory alerts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
          <h2 className="text-lg font-semibold">Inventory Alerts</h2>
        </div>
        <div className="p-4 text-center text-red-500">{error}</div>
      </div>
    );
  }

  // If no alerts data or empty arrays
  if (!alertsData || alertsData.alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Package className="h-5 w-5 mr-2 text-green-500" />
          <h2 className="text-lg font-semibold">Inventory Status</h2>
        </div>
        <div className="p-4 text-center text-green-600">
          No inventory alerts at this time. All stock levels are normal.
        </div>
      </div>
    );
  }

  // Get the prioritized alerts for display
  const allAlerts = [
    ...alertsData.alertsByCategory.critical,
    ...alertsData.alertsByCategory.lowStock,
    ...alertsData.alertsByCategory.reorder
  ].slice(0, maxAlerts);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
          <h2 className="text-lg font-semibold">Inventory Alerts</h2>
        </div>
        
        {/* Alert summary badges */}
        <div className="flex space-x-2">
          {alertsData.summary.criticalCount > 0 && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
              {alertsData.summary.criticalCount} critical
            </span>
          )}
          {alertsData.summary.lowStockCount > 0 && (
            <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
              {alertsData.summary.lowStockCount} low stock
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {allAlerts.map(alert => (
          <div 
            key={alert.id}
            className={`p-3 rounded-md border-l-4 ${getAlertColor(alert.alertType)}`}
          >
            <div className="flex justify-between">
              <div>
                <span className="font-medium block">{alert.name}</span>
                <span className="text-sm block">{alert.alertMessage}</span>
              </div>
              <div className="text-right">
                <span className="font-bold block">
                  {alert.currentStockLevel} / {alert.minStockLevel}
                </span>
                <span className="text-sm block">
                  Lead time: {alert.daysToRestock} days
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {alertsData.summary.totalAlerts > maxAlerts && (
        <div className="mt-4 text-right">
          <Link 
            to="/inventory"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View {alertsData.summary.totalAlerts - maxAlerts} more alerts
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default InventoryAlerts;