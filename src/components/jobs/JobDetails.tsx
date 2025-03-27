import React, { useState, useEffect } from 'react';
import { 
  X, Edit, Save, ArrowLeft, 
  FileText, DollarSign, BarChart2, 
  Calendar, User, Clock 
} from 'lucide-react';
import { jobApi } from '../../utils/jobApi';
import JobCosts from './JobCosts';

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
  startDate?: Date | string;
  expectedEndDate?: Date | string;
  actualEndDate?: Date | string;
  totalCosts?: number;
}

interface JobDetailsProps {
  job: Job;
  onClose: () => void;
  onUpdate: () => void;
}

const JobDetails: React.FC<JobDetailsProps> = ({ job, onClose, onUpdate }) => {
  const [currentJob, setCurrentJob] = useState<Job>(job);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'costs' | 'performance'>('details');
  
  const [editForm, setEditForm] = useState({
    title: job.title,
    description: job.description || '',
    status: job.status,
    startDate: job.startDate ? new Date(job.startDate).toISOString().split('T')[0] : '',
    expectedEndDate: job.expectedEndDate ? new Date(job.expectedEndDate).toISOString().split('T')[0] : ''
  });

  // Fetch full job details
  useEffect(() => {
    fetchJobDetails();
  }, [job.id]);

  const fetchJobDetails = async () => {
    setIsLoading(true);
    try {
      const response = await jobApi.getJobById(job.id);
      setCurrentJob(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching job details:', err);
      setError('Failed to load job details');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  // Save job changes
  const handleSaveChanges = async () => {
    try {
      await jobApi.updateJob(job.id, editForm);
      setIsEditing(false);
      fetchJobDetails();
      onUpdate(); // Update parent component
    } catch (err) {
      console.error('Error updating job:', err);
      setError('Failed to update job');
    }
  };

  // Handle cost changes
  const handleCostChange = () => {
    fetchJobDetails();
    onUpdate(); // Update parent component with new cost totals
  };

  // Format date for display
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return 'Not available';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  // Get status badge styles
  const getStatusBadgeClass = (status: string) => {
    const styles = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    } as const;
    
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            {isEditing ? 'Edit Job' : currentJob.title}
          </h2>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 rounded hover:bg-gray-100"
                  title="Cancel"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="p-2 rounded hover:bg-gray-100"
                  title="Save changes"
                >
                  <Save className="h-5 w-5 text-blue-600" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded hover:bg-gray-100"
                  title="Edit job"
                >
                  <Edit className="h-5 w-5 text-blue-600" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded hover:bg-gray-100"
                  title="Close"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="px-6 pt-4 border-b">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 flex items-center ${
                activeTab === 'details' 
                  ? 'border-b-2 border-blue-600 text-blue-600 font-medium' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Details
            </button>
            
            <button
              onClick={() => setActiveTab('costs')}
              className={`pb-3 flex items-center ${
                activeTab === 'costs' 
                  ? 'border-b-2 border-blue-600 text-blue-600 font-medium' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Costs
            </button>
            
            <button
              onClick={() => setActiveTab('performance')}
              className={`pb-3 flex items-center ${
                activeTab === 'performance' 
                  ? 'border-b-2 border-blue-600 text-blue-600 font-medium' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Performance
            </button>
          </div>
        </div>
        
        {/* Content area */}
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading job details...</p>
            </div>
          ) : (
            <>
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {isEditing ? (
                    // Edit mode
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Job Title
                          </label>
                          <input
                            type="text"
                            name="title"
                            value={editForm.title}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            name="status"
                            value={editForm.status}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="DRAFT">Draft</option>
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={editForm.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                          </label>
                          <input
                            type="date"
                            name="startDate"
                            value={editForm.startDate}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expected End Date
                          </label>
                          <input
                            type="date"
                            name="expectedEndDate"
                            value={editForm.expectedEndDate}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Job Details</h3>
                          <div className="mt-2 space-y-3">
                            <div>
                              <span className="text-sm text-gray-500">Status:</span>
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(currentJob.status)}`}>
                                {currentJob.status.replace('_', ' ')}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Customer:</span>
                              <span className="ml-2 text-gray-900">{currentJob.customer?.name}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Associated Order:</span>
                              <span className="ml-2 text-gray-900">
                                {currentJob.order?.projectTitle || 'None'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Schedule & Cost</h3>
                          <div className="mt-2 space-y-3">
                            <div>
                              <span className="text-sm text-gray-500">Start Date:</span>
                              <span className="ml-2 text-gray-900">
                                {formatDate(currentJob.startDate)}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Expected End Date:</span>
                              <span className="ml-2 text-gray-900">
                                {formatDate(currentJob.expectedEndDate)}
                              </span>
                            </div>
                            {currentJob.actualEndDate && (
                              <div>
                                <span className="text-sm text-gray-500">Actual End Date:</span>
                                <span className="ml-2 text-gray-900">
                                  {formatDate(currentJob.actualEndDate)}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-sm text-gray-500">Total Costs:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {formatCurrency(currentJob.totalCosts)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Description</h3>
                        <p className="mt-2 text-gray-900 whitespace-pre-line">
                          {currentJob.description || 'No description provided.'}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Assigned Team Members</h3>
                        {currentJob.assignedUsers && currentJob.assignedUsers.length > 0 ? (
                          <div className="mt-2 flex flex-wrap">
                            {currentJob.assignedUsers.map(user => (
                              <div 
                                key={user.id} 
                                className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full flex items-center mr-2 mb-2"
                              >
                                <User className="h-4 w-4 mr-1" />
                                <span>{user.name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-gray-500 italic">No team members assigned.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'costs' && (
                <JobCosts jobId={job.id} onCostChange={handleCostChange} />
              )}
              
              {activeTab === 'performance' && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Job Performance</h3>
                  <p className="text-gray-500 mb-6">
                    Performance analytics and reporting functionality is coming soon.
                  </p>
                  <div className="flex justify-center">
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      onClick={() => setActiveTab('costs')}
                    >
                      View Job Costs Instead
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetails;