// src/components/timetracking/TimeTracker.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../../config/constants';

interface Job {
  id: string;
  title: string;
  customer: {
    name: string;
  };
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  jobTitle?: string; // Optional for backward compatibility
  department?: string;
}

interface TimeEntry {
  id?: string;
  employeeId: string;
  jobId: string;
  date: string;
  hours: number;
  isRdActivity: boolean;
  rdDescription?: string;
}

interface TimeTrackerProps {
  currentEmployee: Employee;
  onTimeEntrySaved?: (timeEntry: TimeEntry) => void;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({ 
  currentEmployee, 
  onTimeEntrySaved 
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [timeEntry, setTimeEntry] = useState<TimeEntry>({
    employeeId: currentEmployee.id,
    jobId: '',
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    isRdActivity: false,
    rdDescription: '',
  });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch available jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/jobs`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }

        const data = await response.json();
        setJobs(data.jobs || data || []);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setError('Failed to load available jobs');
      }
    };

    fetchJobs();
  }, []);

  // Update employee ID when currentEmployee changes
  useEffect(() => {
    setTimeEntry(prev => ({
      ...prev,
      employeeId: currentEmployee.id
    }));
  }, [currentEmployee.id]);

  const handleJobChange = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    setSelectedJob(job || null);
    setTimeEntry({ ...timeEntry, jobId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!timeEntry.jobId || timeEntry.hours <= 0) {
      setError('Please select a job and enter valid hours');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/time-entries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timeEntry),
      });

      if (!response.ok) {
        throw new Error('Failed to save time entry');
      }

      const savedEntry = await response.json();
      setSuccess(true);
      
      // Reset form
      setTimeEntry({
        employeeId: currentEmployee.id,
        jobId: '',
        date: new Date().toISOString().split('T')[0],
        hours: 0,
        isRdActivity: false,
        rdDescription: '',
      });
      setSelectedJob(null);

      // Call callback if provided
      if (onTimeEntrySaved) {
        onTimeEntrySaved(savedEntry);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);

    } catch (error: any) {
      setError(error.message || 'Failed to save time entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
          <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-700">Time entry saved successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Employee Info - FIXED */}
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-600">Logging time for:</p>
          <p className="font-medium">
            {currentEmployee.name}
            <span className="text-gray-500 font-normal">
              {' '}({currentEmployee.role})
            </span>
          </p>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="inline h-4 w-4 mr-1" />
            Date
          </label>
          <input
            type="date"
            value={timeEntry.date}
            onChange={(e) => setTimeEntry({ ...timeEntry, date: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Job Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project/Job
          </label>
          <select
            value={timeEntry.jobId}
            onChange={(e) => handleJobChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a project...</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} - {job.customer.name}
              </option>
            ))}
          </select>
        </div>

        {/* Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Clock className="inline h-4 w-4 mr-1" />
            Hours
          </label>
          <input
            type="number"
            step="0.25"
            min="0"
            max="24"
            value={timeEntry.hours}
            onChange={(e) => setTimeEntry({ ...timeEntry, hours: parseFloat(e.target.value) || 0 })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 8 or 4.5"
            required
          />
        </div>

        {/* R&D Activity */}
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRdActivity"
              checked={timeEntry.isRdActivity}
              onChange={(e) => setTimeEntry({ ...timeEntry, isRdActivity: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isRdActivity" className="ml-2 text-sm text-gray-700">
              This is an R&D activity (eligible for HMRC R&D tax relief)
            </label>
          </div>

          {/* R&D Description */}
          {timeEntry.isRdActivity && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                R&D Activity Description
              </label>
              <textarea
                value={timeEntry.rdDescription || ''}
                onChange={(e) => setTimeEntry({ ...timeEntry, rdDescription: e.target.value })}
                placeholder="Describe the technological advancement or uncertainty being addressed..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                required={timeEntry.isRdActivity}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Include details about technical challenges, new processes, or innovative solutions for HMRC compliance
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Time Entry
            </>
          )}
        </button>

        {/* Job Details */}
        {selectedJob && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-600">
              <strong>Selected Project:</strong> {selectedJob.title} for {selectedJob.customer.name}
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

// Add default export
export default TimeTracker;