// src/components/timetracking/TimeTrackerWrapper.tsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { TimeTracker } from './TimeTracker';

/**
 * Wrapper component for TimeTracker that provides current user context
 * This makes TimeTracker route-compatible by getting user from auth context
 */
export const TimeTrackerWrapper: React.FC = () => {
  const { user } = useAuth();

  // Show loading state while user data is being fetched
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading time tracker...</p>
        </div>
      </div>
    );
  }

  // Convert user object to employee format expected by TimeTracker
  const currentEmployee = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  // Handle time entry saved callback
  const handleTimeEntrySaved = (timeEntry: any) => {
    console.log('Time entry saved:', timeEntry);
    // You can add toast notifications or other feedback here
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Time Tracking</h1>
      <TimeTracker 
        currentEmployee={currentEmployee}
        onTimeEntrySaved={handleTimeEntrySaved}
      />
    </div>
  );
};