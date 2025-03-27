import React, { useEffect, useState } from 'react';
import { fetchJobStats } from '../../utils/jobApi';
import { Link } from 'react-router-dom';
import { Activity, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

interface JobStats {
  draft: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

interface JobStatusOverviewProps {
  jobStats?: JobStats;
}

const JobStatusOverview: React.FC<JobStatusOverviewProps> = ({ jobStats: propJobStats }) => {
  const [stats, setStats] = useState<JobStats>({
    draft: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(!propJobStats);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If job stats were provided via props, use those
    if (propJobStats) {
      setStats(propJobStats);
      return;
    }

    // Otherwise fetch them from the API
    const loadJobStats = async () => {
      try {
        setLoading(true);
        const data = await fetchJobStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError('Failed to load job statistics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadJobStats();
  }, [propJobStats]);

  const totalJobs = stats.draft + stats.pending + stats.inProgress + stats.completed + stats.cancelled;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Activity className="h-5 w-5 mr-2 text-blue-500" />
          Job Status Overview
        </h2>
        <Link 
          to="/jobs" 
          className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
        >
          View All Jobs
        </Link>
      </div>
      
      {loading ? (
        <div className="p-4 text-center">Loading job statistics...</div>
      ) : error ? (
        <div className="p-4 text-red-500 text-center">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-5 gap-3">
            {/* Draft */}
            <div className="bg-gray-100 rounded-lg p-4 flex flex-col items-center">
              <div className="flex justify-center mb-2">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium mb-1">Draft</p>
              <p className="text-xl font-bold">{stats.draft}</p>
            </div>
            
            {/* Pending */}
            <div className="bg-yellow-100 rounded-lg p-4 flex flex-col items-center">
              <div className="flex justify-center mb-2">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-xs text-yellow-600 font-medium mb-1">Pending</p>
              <p className="text-xl font-bold">{stats.pending}</p>
            </div>
            
            {/* In Progress */}
            <div className="bg-blue-100 rounded-lg p-4 flex flex-col items-center">
              <div className="flex justify-center mb-2">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-xs text-blue-600 font-medium mb-1">In Progress</p>
              <p className="text-xl font-bold">{stats.inProgress}</p>
            </div>
            
            {/* Completed */}
            <div className="bg-green-100 rounded-lg p-4 flex flex-col items-center">
              <div className="flex justify-center mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-xs text-green-600 font-medium mb-1">Completed</p>
              <p className="text-xl font-bold">{stats.completed}</p>
            </div>
            
            {/* Cancelled */}
            <div className="bg-red-100 rounded-lg p-4 flex flex-col items-center">
              <div className="flex justify-center mb-2">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-xs text-red-600 font-medium mb-1">Cancelled</p>
              <p className="text-xl font-bold">{stats.cancelled}</p>
            </div>
          </div>
          
          {/* Progress Bar and Summary */}
          <div className="mt-4">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="flex h-full">
                <div className="bg-gray-500" style={{ width: `${totalJobs > 0 ? (stats.draft / totalJobs) * 100 : 0}%` }}></div>
                <div className="bg-yellow-500" style={{ width: `${totalJobs > 0 ? (stats.pending / totalJobs) * 100 : 0}%` }}></div>
                <div className="bg-blue-500" style={{ width: `${totalJobs > 0 ? (stats.inProgress / totalJobs) * 100 : 0}%` }}></div>
                <div className="bg-green-500" style={{ width: `${totalJobs > 0 ? (stats.completed / totalJobs) * 100 : 0}%` }}></div>
                <div className="bg-red-500" style={{ width: `${totalJobs > 0 ? (stats.cancelled / totalJobs) * 100 : 0}%` }}></div>
              </div>
            </div>
            
            <div className="mt-3 flex justify-between text-sm text-gray-600">
              <span>Total Jobs: {totalJobs}</span>
              <span>Completion Rate: {totalJobs > 0 ? ((stats.completed / totalJobs) * 100).toFixed(1) : 0}%</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default JobStatusOverview;