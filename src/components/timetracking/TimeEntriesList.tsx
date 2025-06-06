// src/components/timetracking/TimeEntriesList.tsx

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Edit2, Trash2, Filter, Download, AlertTriangle } from 'lucide-react';

interface TimeEntry {
  id: string;
  employeeId: string;
  employee: {
    name: string;
    jobTitle: string;
  };
  jobId: string;
  job: {
    title: string;
    customer: {
      name: string;
    };
  };
  date: string;
  hours: number;
  isRdActivity: boolean;
  rdDescription?: string;
  createdAt: string;
  updatedAt: string;
}

interface TimeEntriesListProps {
  currentEmployeeId?: string; // If provided, only show entries for this employee
  showAllEmployees?: boolean; // For managers to see all entries
}

export const TimeEntriesList: React.FC<TimeEntriesListProps> = ({ 
  currentEmployeeId, 
  showAllEmployees = false 
}) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    jobId: '',
    rdOnly: false,
  });

  useEffect(() => {
    fetchTimeEntries();
  }, [filters, currentEmployeeId]);

  const fetchTimeEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (currentEmployeeId && !showAllEmployees) {
        params.append('employeeId', currentEmployeeId);
      }
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.jobId) params.append('jobId', filters.jobId);
      if (filters.rdOnly) params.append('rdOnly', 'true');

      const response = await fetch(`/api/time-entries?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTimeEntries(data);
      } else {
        console.error('Failed to fetch time entries');
      }
    } catch (error) {
      console.error('Error fetching time entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return;

    try {
      const response = await fetch(`/api/time-entries/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setTimeEntries(entries => entries.filter(entry => entry.id !== entryId));
      } else {
        alert('Failed to delete time entry');
      }
    } catch (error) {
      console.error('Error deleting time entry:', error);
      alert('Error deleting time entry');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Employee',
      'Job Title',
      'Project',
      'Customer',
      'Hours',
      'Is R&D',
      'R&D Description'
    ];

    const csvData = timeEntries.map(entry => [
      entry.date,
      entry.employee.name,
      entry.employee.jobTitle,
      entry.job.title,
      entry.job.customer.name,
      entry.hours.toString(),
      entry.isRdActivity ? 'Yes' : 'No',
      entry.rdDescription || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-entries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const rdHours = timeEntries.filter(entry => entry.isRdActivity).reduce((sum, entry) => sum + entry.hours, 0);
  const rdPercentage = totalHours > 0 ? ((rdHours / totalHours) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Time Entries</h2>
          </div>
          <button
            onClick={exportToCSV}
            disabled={timeEntries.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-600">Total Hours</p>
            <p className="text-2xl font-bold text-blue-900">{totalHours}</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-md">
            <p className="text-sm text-orange-600">R&D Hours</p>
            <p className="text-2xl font-bold text-orange-900">{rdHours}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-sm text-green-600">R&D Percentage</p>
            <p className="text-2xl font-bold text-green-900">{rdPercentage}%</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full p-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full p-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">R&D Only</label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.rdOnly}
                onChange={(e) => setFilters({ ...filters, rdOnly: e.target.checked })}
                className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Show R&D activities only</span>
            </label>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ startDate: '', endDate: '', jobId: '', rdOnly: false })}
              className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Time Entries List */}
      <div className="p-6">
        {timeEntries.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No time entries found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters or add some time entries</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timeEntries.map((entry) => (
              <div
                key={entry.id}
                className={`p-4 border rounded-lg transition-colors ${
                  entry.isRdActivity 
                    ? 'border-orange-200 bg-orange-50' 
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{new Date(entry.date).toLocaleDateString()}</span>
                      </div>
                      {showAllEmployees && (
                        <div>
                          <span className="text-sm text-gray-600">{entry.employee.name}</span>
                          <span className="text-xs text-gray-500 ml-1">({entry.employee.jobTitle})</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{entry.hours}h</span>
                      </div>
                      {entry.isRdActivity && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          R&D Activity
                        </span>
                      )}
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-sm text-gray-900">
                        <strong>{entry.job.title}</strong> - {entry.job.customer.name}
                      </p>
                    </div>

                    {entry.isRdActivity && entry.rdDescription && (
                      <div className="mt-2 p-2 bg-orange-100 rounded">
                        <p className="text-xs text-orange-600 font-medium mb-1">R&D Description:</p>
                        <p className="text-sm text-gray-700">{entry.rdDescription}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => {/* TODO: Implement edit functionality */}}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit entry"
>
                  <Edit2 className="h-4 w-4" />
                  </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Add default export
export default TimeEntriesList;