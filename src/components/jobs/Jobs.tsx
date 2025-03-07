import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Filter, 
  Eye, 
  MoreHorizontal,
  AlertTriangle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { jobApi } from '../../utils/api';
import CreateJobModal from './CreateJobModal';
import JobDetails from './JobDetails';

// Define interfaces for various job-related data
interface Job {
  id: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  customer: {
    id: string;
    name: string;
  };
  order?: {
    id: string;
    projectTitle: string;
  };
  assignedUsers: Array<{
    id: string;
    name: string;
  }>;
  startDate?: Date;
  expectedEndDate?: Date;
  actualEndDate?: Date;
}

interface JobPerformanceMetrics {
  jobId: string;
  status: string;
  duration: {
    estimated: number;
    actual: number;
    variance: number;
  };
  performance: {
    durationVariancePercentage: number;
    isBehindSchedule: boolean;
  };
}

interface AtRiskJob {
  id: string;
  title: string;
  status: string;
  expectedEndDate: Date;
  customer: string;
  assignedUsers: string[];
  projectTitle: string;
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [atRiskJobs, setAtRiskJobs] = useState<AtRiskJob[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<{[jobId: string]: JobPerformanceMetrics}>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'atRisk'>('list');

  // Debug logs for selectedJob state changes
  useEffect(() => {
    console.log("Selected job changed:", selectedJob);
  }, [selectedJob]);

  // Fetch jobs and related data
  const fetchJobsData = async () => {
    try {
      setIsLoading(true);
      const [jobsResponse, atRiskResponse] = await Promise.all([
        jobApi.getJobs({ status: filter === 'ALL' ? undefined : filter }),
        jobApi.getAtRiskJobs()
      ]);

      // Fixed: accessing the jobs property from the response
      const jobsData = jobsResponse.data.jobs || [];
      console.log("Fetched jobs data:", jobsData);
      setJobs(jobsData);
      
      // Using the correct property for at-risk jobs as well
      setAtRiskJobs(atRiskResponse.data || []);

      // Fetch performance metrics for each job
      if (jobsData.length > 0) {
        const metricsPromises = jobsData.map(async (job: Job) => {
          try {
            const metricsResponse = await jobApi.getJobPerformanceMetrics(job.id);
            return { [job.id]: metricsResponse.data };
          } catch (metricError) {
            console.error(`Failed to fetch metrics for job ${job.id}`, metricError);
            return { [job.id]: null };
          }
        });

        const metricsResults = await Promise.all(metricsPromises);
        const metricsMap = metricsResults.reduce((acc, result) => ({ ...acc, ...result }), {});
        setPerformanceMetrics(metricsMap);
      }
    } catch (err) {
      console.error('Error fetching jobs data:', err);
      setError('Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch jobs on component mount and filter change
  useEffect(() => {
    fetchJobsData();
  }, [filter]);

  // Safely handle selecting a job
  const handleSelectJob = (job: Job) => {
    console.log("Selecting job:", job);
    if (job && job.id) {
      setSelectedJob(job);
    } else {
      console.error("Attempted to select invalid job:", job);
    }
  };

  // Render job status badge
  const renderStatusBadge = (status: Job['status']) => {
    const statusStyles = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusStyles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  // Render performance indicator
  const renderPerformanceIndicator = (jobId: string) => {
    const metrics = performanceMetrics[jobId];
    if (!metrics) return null;

    return (
      <div className="flex items-center space-x-2">
        {metrics.performance.isBehindSchedule ? (
          <AlertTriangle className="h-4 w-4 text-red-600" />
        ) : (
          <TrendingUp className="h-4 w-4 text-green-600" />
        )}
        <span className={`text-xs ${metrics.performance.isBehindSchedule ? 'text-red-600' : 'text-green-600'}`}>
          {Math.abs(metrics.performance.durationVariancePercentage).toFixed(1)}% 
          {metrics.performance.isBehindSchedule ? ' Behind' : ' Ahead'}
        </span>
      </div>
    );
  };

  // Render main content based on active view
  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center py-8">Loading jobs...</div>;
    }

    if (error) {
      return <div className="text-red-600 text-center py-8">{error}</div>;
    }

    const displayJobs = activeView === 'atRisk' ? atRiskJobs : jobs;

    if (displayJobs.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {activeView === 'atRisk' 
            ? 'No jobs at risk' 
            : 'No jobs found. Create your first job!'}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayJobs.map((job) => (
          <div 
            key={job.id} 
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{job.title}</h3>
              {renderStatusBadge(job.status as Job['status'])}
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              <p>Project: {job.order?.projectTitle || 'N/A'}</p>
              <p>Customer: {job.customer?.name || 'N/A'}</p>
            </div>
            
            {/* Performance Metrics */}
            {renderPerformanceIndicator(job.id)}
            
            <div className="flex justify-between items-center mt-4">
              <button 
                onClick={() => handleSelectJob(job)}
                className="text-blue-600 hover:text-blue-800 flex items-center"
                aria-label="View job details"
              >
                <Eye className="h-5 w-5 mr-1" />
                <span className="text-sm">View</span>
              </button>
              <button className="text-gray-500 hover:text-gray-700">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <Briefcase className="mr-3 text-blue-600" /> 
          Jobs Management
        </h1>
        
        <div className="flex space-x-4">
          {/* View Toggle */}
          <div className="flex border rounded-lg">
            <button 
              onClick={() => setActiveView('list')}
              className={`px-4 py-2 ${activeView === 'list' ? 'bg-blue-100 text-blue-800' : 'text-gray-600'}`}
            >
              All Jobs
            </button>
            <button 
              onClick={() => setActiveView('atRisk')}
              className={`px-4 py-2 flex items-center ${activeView === 'atRisk' ? 'bg-red-100 text-red-800' : 'text-gray-600'}`}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              At Risk
            </button>
          </div>

          {/* Status Filter */}
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="ALL">All Jobs</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Create Job Button */}
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="mr-2" /> Create Job
          </button>
        </div>
      </div>

      {/* Jobs Content */}
      {renderContent()}

      {/* Create Job Modal */}
      {isCreateModalOpen && (
        <CreateJobModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onJobCreated={fetchJobsData}
        />
      )}

      {/* Job Details Modal with safety check */}
      {selectedJob && selectedJob.id && selectedJob.title ? (
        <JobDetails 
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdate={fetchJobsData}
        />
      ) : null}
    </div>
  );
}