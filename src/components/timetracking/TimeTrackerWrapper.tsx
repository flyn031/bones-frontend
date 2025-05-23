// src/components/timetracking/TimeTrackerWrapper.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TimeTracker } from './TimeTracker';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

/**
 * Enhanced wrapper component for TimeTracker with employee selection
 * Allows managers/admins to log time for team members
 */
export const TimeTrackerWrapper: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch employees list
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/employees', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch employees');
        }

        const data = await response.json();
        
        // Handle both formats: direct array OR { employees: [...] }
        const employeeList = Array.isArray(data) ? data : (data.employees || []);
        
        setEmployees(employeeList);
        
        // Default to current user if they exist in employee list
        if (user) {
          const currentUserAsEmployee = employeeList.find((emp: Employee) => emp.id === user.id);
          if (currentUserAsEmployee) {
            setSelectedEmployee(currentUserAsEmployee);
          } else {
            // If current user not in employee list, create employee object from user
            const userAsEmployee: Employee = {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
            setSelectedEmployee(userAsEmployee);
            setEmployees(prev => [userAsEmployee, ...prev]);
          }
        }
      } catch (err: any) {
        console.error('Error fetching employees:', err);
        setError(err.message);
        
        // Fallback: use current user as only employee option
        if (user) {
          const userAsEmployee: Employee = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
          setSelectedEmployee(userAsEmployee);
          setEmployees([userAsEmployee]);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchEmployees();
    }
  }, [user]);

  // Handle time entry saved callback
  const handleTimeEntrySaved = (timeEntry: any) => {
    console.log('Time entry saved:', timeEntry);
    // You can add toast notifications or other feedback here
  };

  // Check if user can select other employees (admin permissions)
  const canSelectOtherEmployees = user?.role === 'ADMIN';

  // Show loading state
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading time tracker...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && employees.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error Loading Employees</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <p className="text-red-600 text-sm mt-2">You can still track time for yourself.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Time Tracking</h1>
        
        {/* Employee Selection */}
        {canSelectOtherEmployees && employees.length > 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <label className="block text-sm font-medium text-blue-900 mb-2">
              Select Employee to Track Time For:
            </label>
            <select
              value={selectedEmployee?.id || ''}
              onChange={(e) => {
                const employee = employees.find(emp => emp.id === e.target.value);
                setSelectedEmployee(employee || null);
              }}
              className="w-full md:w-96 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an employee...</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} - {employee.role} ({employee.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-blue-600 mt-1">
              💡 As admin, you can track time for team members
            </p>
          </div>
        )}

        {/* Current Employee Notice */}
        {selectedEmployee && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-600">
              📝 Logging time for: <strong>{selectedEmployee.name}</strong>
              <span className="text-xs text-gray-500 ml-2">
                ({selectedEmployee.role})
              </span>
            </p>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-yellow-700">
              ⚠️ Could not load full employee list. You may have limited options.
            </p>
          </div>
        )}
      </div>

      {/* Time Tracker Component */}
      {selectedEmployee ? (
        <TimeTracker 
          currentEmployee={selectedEmployee}
          onTimeEntrySaved={handleTimeEntrySaved}
        />
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">Please select an employee to track time for.</p>
        </div>
      )}
    </div>
  );
};