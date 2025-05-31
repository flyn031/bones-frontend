// src/components/hmrc/TimeTrackerWrapper.tsx
import React, { useState, useEffect } from 'react';
import { UserPlus, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TimeTracker } from './TimeTracker';
import { AddEmployeeModal } from './AddEmployeeModal';

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
 * PRODUCTION READY: Real employee management for HMRC R&D testing
 */
export const TimeTrackerWrapper: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch employees list
  const fetchEmployees = async () => {
    try {
      setRefreshing(true);
      
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
      
      console.log('✅ Loaded employees:', employeeList.length);
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
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('❌ Error fetching employees:', err);
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEmployees();
    }
  }, [user]);

  // Handle new employee added
  const handleEmployeeAdded = (newEmployee: Employee) => {
    console.log('✅ New employee added:', newEmployee.name);
    
    // Add to employee list
    setEmployees(prev => [newEmployee, ...prev]);
    
    // Optionally select the new employee
    setSelectedEmployee(newEmployee);
    
    // Refresh the full list to ensure consistency
    setTimeout(() => {
      fetchEmployees();
    }, 1000);
  };

  // Handle time entry saved callback
  const handleTimeEntrySaved = (timeEntry: any) => {
    console.log('✅ Time entry saved:', timeEntry);
    // You can add toast notifications or other feedback here
  };

  // Check if user can select other employees (admin permissions)
  const canSelectOtherEmployees = user?.role === 'ADMIN';
  const canAddEmployees = user?.role === 'ADMIN';

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Time Tracking</h1>
          
          {/* Admin Controls */}
          {canAddEmployees && (
            <div className="flex gap-2">
              <button
                onClick={() => fetchEmployees()}
                disabled={refreshing}
                className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh employee list"
              >
                <RotateCcw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <button
                onClick={() => setShowAddEmployeeModal(true)}
                className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Add new team member"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Add Team Member
              </button>
            </div>
          )}
        </div>
        
        {/* Employee Selection */}
        {canSelectOtherEmployees && employees.length > 0 && (
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
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-blue-600">
                💡 As admin, you can track time for any team member
              </p>
              <p className="text-xs text-gray-500">
                {employees.length} team member{employees.length !== 1 ? 's' : ''} available
              </p>
            </div>
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-yellow-700">
                ⚠️ {error}
              </p>
              <button
                onClick={() => fetchEmployees()}
                className="text-xs text-yellow-600 underline hover:text-yellow-800"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* No Employees Warning */}
        {!loading && employees.length === 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <h3 className="text-orange-800 font-medium">No Team Members Found</h3>
            <p className="text-orange-700 text-sm mt-1">
              To get started with HMRC R&D time tracking, add team members who will be logging their work hours.
            </p>
            {canAddEmployees && (
              <button
                onClick={() => setShowAddEmployeeModal(true)}
                className="mt-2 px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Add Your First Team Member
              </button>
            )}
          </div>
        )}

        {/* Success Info for New Users */}
        {employees.length > 0 && !error && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-green-700">
              ✅ <strong>System Ready!</strong> You can now track R&D time for {employees.length} team member{employees.length !== 1 ? 's' : ''}. 
              Time entries will be included in your HMRC R&D tax relief calculations.
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
          <h3 className="text-gray-700 font-medium mb-2">Ready to Track Time</h3>
          <p className="text-gray-600 mb-4">
            {canSelectOtherEmployees 
              ? 'Select an employee above to start tracking time for HMRC R&D activities.' 
              : 'Start tracking your time for R&D activities and generate tax-compliant reports.'
            }
          </p>
          {canAddEmployees && employees.length === 0 && (
            <button
              onClick={() => setShowAddEmployeeModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Team Members to Get Started
            </button>
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <AddEmployeeModal
          isOpen={showAddEmployeeModal}
          onClose={() => setShowAddEmployeeModal(false)}
          onEmployeeAdded={handleEmployeeAdded}
        />
      )}
    </div>
  );
};