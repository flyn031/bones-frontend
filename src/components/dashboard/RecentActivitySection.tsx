import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, UserCircle, FileText, ShoppingCart, Briefcase, 
  Users, ExternalLink 
} from "lucide-react";
import { Button } from '@/components/ui';

// Updated interface to match your actual data structure
interface RecentActivity {
  id: string;
  title?: string;
  time?: string;
  status?: string;
  type?: 'quote' | 'order' | 'job' | 'customer' | 'supplier' | 'inventory';
  entityId?: string;
  description?: string;
  // Additional fields from your actual data
  projectTitle?: string;
  quoteRef?: string;
  customerName?: string;
  // Date fields
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface RecentActivitySectionProps {
  activities: RecentActivity[];
  isLoading: boolean;
}

const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({ 
  activities, 
  isLoading 
}) => {
  const navigate = useNavigate();

  // Debug logging of all activities when component mounts
  useEffect(() => {
    console.log("All activities:", activities);
    
    if (Array.isArray(activities)) {
      activities.forEach(activity => {
        console.log(`Activity title: "${activity.title}", has customer in title: ${activity.title?.toLowerCase().includes('customer')}`);
      });
    }
  }, [activities]);

  // Helper to force activity type based on title content
  const getActivityType = (activity: RecentActivity): string => {
    // Debug log for this specific activity
    console.log("Determining type for activity:", activity);
    
    // Force customer type if title contains "Customer"
    if (activity.title && activity.title.toLowerCase().includes('customer')) {
      console.log(`Activity "${activity.title}" contains "customer" - forcing customer type`);
      return 'customer';
    }
    
    // Force quote type if title contains "Quote"
    if (activity.title && activity.title.toLowerCase().includes('quote')) {
      console.log(`Activity "${activity.title}" contains "quote" - forcing quote type`);
      return 'quote';
    }
    
    // Use explicit type if available
    if (activity.type) {
      console.log(`Using explicit type: ${activity.type}`);
      return activity.type;
    }
    
    // Try to infer type from available data
    if (activity.quoteRef) {
      console.log(`Has quoteRef: ${activity.quoteRef} - setting type to quote`);
      return 'quote';
    }
    
    if (activity.customerName && !activity.projectTitle) {
      console.log(`Has customerName without projectTitle - setting type to customer`);
      return 'customer';
    }
    
    // Default to order
    console.log("No specific type indicators - defaulting to order");
    return 'order';
  };

  const getActivityIcon = (activity: RecentActivity) => {
    const type = getActivityType(activity)

  const navigateToActivity = (activity: RecentActivity) => {
    const type = getActivityType(activity);
    console.log(`Activity type determined as: ${type}`, activity);
    
    // Just navigate to the main section
    const routes = {
      'quote': '/quotes',
      'order': '/orders',
      'job': '/jobs',
      'customer': '/customers',
      'supplier': '/suppliers',
      'inventory': '/inventory'
    };
    
    // @ts-ignore
    const route = routes[type] || '/';
    console.log(`Navigating to: ${route}`);
    navigate(route);
  };

  const getActivityTitle = (activity: RecentActivity): string => {
    return activity.title || activity.projectTitle || 'Activity';
  };

  const getActivityStatus = (activity: RecentActivity): string => {
    return activity.status || 'Active';
  };

  const formatDate = (activity: RecentActivity): string => {
    if (activity.time && activity.time !== 'Invalid Date') {
      return activity.time;
    }
    
    const date = activity.createdAt || activity.updatedAt;
    if (!date) return 'Recent';
    
    try {
      // Format the date safely
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Recent';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium mb-4 flex justify-between items-center">
        Recent Activity
        <Button 
          variant="ghost"
          onClick={() => navigate('/')}
          className="text-sm flex items-center"
        >
          View All <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </h3>
      {isLoading ? (
        <p>Loading recent activity...</p>
      ) : Array.isArray(activities) && activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => {
            // Force evaluation of type here to ensure consistency in display
            const activityType = getActivityType(activity);
            const ActivityIcon = 
              activityType === 'customer' ? UserCircle :
              activityType === 'quote' ? FileText :
              activityType === 'job' ? Briefcase :
              activityType === 'supplier' ? Users :
              activityType === 'inventory' ? Box :
              ShoppingCart; // Default to order icon
            
            return (
              <div 
                key={activity.id} 
                onClick={() => navigateToActivity(activity)}
                className="flex items-start space-x-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors group"
              >
                <ActivityIcon className="h-5 w-5 mt-1 text-gray-500 group-hover:text-blue-600" />
                <div className="flex-grow">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-900 group-hover:text-blue-700">
                      {getActivityTitle(activity)}
                    </p>
                    <span className="text-xs text-gray-500">{formatDate(activity)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="capitalize">{activityType}</span>
                    <span className="mx-2">•</span>
                    <span>{getActivityStatus(activity)}</span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })}
        </div>
      ) : (
        <p>No recent activity to display.</p>
      )}
    </div>
  );
};

export default RecentActivitySection;