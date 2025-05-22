// src/components/timetracking/TimeTracker.tsx

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

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
  jobTitle: string;
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
  onTimeEntrySaved?: (entry: TimeEntry) => void;
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || data); // Handle different response formats
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validation
    if (!timeEntry.jobId || timeEntry.hours <= 0) {
      setMessage({ type: 'error', text: 'Please select a job and enter valid hours' });
      setLoading(false);
      return;
    }

    if (timeEntry.isRdActivity && !timeEntry.rdDescription?.trim()) {
      setMessage({ type: 'error', text: 'R&D activities require a description for HMRC compliance' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(timeEntry),
      });

      if (response.ok) {
        const savedEntry = await response.json();
        setMessage({ type: 'success', text: 'Time entry saved successfully!' });
        
        // Reset form
        setTimeEntry({
          employeeId: currentEmployee.id,
          jobId: '',
          date: new Date().toISOString().split('T')[0],
          hours: 0,
          isRdActivity: false,
          rdDescription: '',
        });

        // Callback to parent component
        if (onTimeEntrySaved) {
          onTimeEntrySaved(savedEntry);
        }
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to save time entry' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const selectedJob = jobs.find(job => job.id === timeEntry.jobId);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Log Time Entry</h2>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Employee Info */}
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-600">Logging time for:</p>
          <p className="font-medium">{currentEmployee.name} - {currentEmployee.jobTitle}</p>
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
            onChange={(e) => setTimeEntry({ ...timeEntry, jobId: e.target.value })}
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
            Hours Worked
          </label>
          <input
            type="number"
            min="0"
            max="24"
            step="0.25"
            value={timeEntry.hours}
            onChange={(e) => setTimeEntry({ ...timeEntry, hours: parseFloat(e.target.value) || 0 })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 8.0, 4.5"
            required
          />
        </div>

        {/* R&D Activity Checkbox */}
        <div className="border-2 border-orange-200 bg-orange-50 p-4 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="isRdActivity"
              checked={timeEntry.isRdActivity}
              onChange={(e) => setTimeEntry({ 
                ...timeEntry, 
                isRdActivity: e.target.checked,
                rdDescription: e.target.checked ? timeEntry.rdDescription : ''
              })}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="isRdActivity" className="text-sm font-medium text-gray-900">
              This is R&D Activity (for HMRC Tax Credits)
            </label>
          </div>
          
          {timeEntry.isRdActivity && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                R&D Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={timeEntry.rdDescription}
                onChange={(e) => setTimeEntry({ ...timeEntry, rdDescription: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                placeholder="Describe the technological uncertainty, innovation challenge, or research activity for HMRC compliance..."
                required={timeEntry.isRdActivity}
              />
              <p className="text-xs text-gray-500 mt-1">
                HMRC requires detailed descriptions of R&D activities including technological uncertainties and innovation objectives.
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Time Entry
            </>
          )}
        </button>
      </form>

      {/* Job Details */}
      {selectedJob && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-600">
            <strong>Selected Project:</strong> {selectedJob.title} for {selectedJob.customer.name}
          </p>
        </div>
      )}
    </div>
  );
};