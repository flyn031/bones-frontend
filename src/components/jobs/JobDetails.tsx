import React, { useState, useEffect } from 'react';
import { 
  X, 
  Briefcase, 
  ShoppingCart,
  User, 
  UserCircle,
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Edit,
  Save
} from 'lucide-react';
import { jobApi } from '../../utils/api';

// Interfaces
interface JobDetailsProps {
  job: {
    id: string;
    title: string;
    description?: string;
    status: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    customer?: {
      id: string;
      name: string;
    };
    order?: {
      id: string;
      projectTitle: string;
    };
    orders?: Array<{
      id: string;
      projectTitle: string;
    }>;
    assignedUsers?: Array<{
      id: string;
      name: string;
    }>;
    startDate?: Date | string;
    expectedEndDate?: Date | string;
    actualEndDate?: Date | string;
  };
  onClose: () => void;
  onUpdate: () => void;
}

// Helper function to format date to YYYY-MM-DD for input[type="date"]
const formatDateForInput = (date: Date | string | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

export default function JobDetails({ job, onClose, onUpdate }: JobDetailsProps) {
  // Safety check to prevent rendering with undefined job
  if (!job || !job.id) {
    console.error("JobDetails received undefined or invalid job:", job);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p>Unable to load job details. The job data is missing or invalid.</p>
          <button 
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Debug log - add this to see the job structure
  useEffect(() => {
    console.log("Job details:", job);
  }, [job]);

  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState({
    title: job.title,
    description: job.description || '',
    status: job.status,
    startDate: formatDateForInput(job.startDate),
    expectedEndDate: formatDateForInput(job.expectedEndDate)
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status color mapping
  const statusColors = {
    'DRAFT': 'bg-gray-100 text-gray-800',
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'IN_PROGRESS': 'bg-blue-100 text-blue-800',
    'COMPLETED': 'bg-green-100 text-green-800',
    'CANCELLED': 'bg-red-100 text-red-800'
  };

  // Status options for dropdown
  const statusOptions = [
    'DRAFT', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
  ];

  // Get order info - handle both order and orders properties
  const getOrderTitle = () => {
    if (job.order && job.order.projectTitle) {
      return job.order.projectTitle;
    } else if (job.orders && job.orders.length > 0 && job.orders[0].projectTitle) {
      return job.orders[0].projectTitle;
    }
    return 'No order information';
  };

  // Handle input changes during editing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedJob(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save job updates with improved date handling and status validation
  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create the update object with only changed fields
      const formattedJob: any = {};
      
      // Only include fields that have actually changed
      if (editedJob.title !== job.title) {
        formattedJob.title = editedJob.title;
      }
      
      if (editedJob.description !== (job.description || '')) {
        formattedJob.description = editedJob.description;
      }
      
      // Only include status if it changed
      if (editedJob.status !== job.status) {
        formattedJob.status = editedJob.status;
      }
      
      // Always format dates for API request if they exist
      if (editedJob.startDate) {
        formattedJob.startDate = new Date(editedJob.startDate).toISOString();
      }
      
      if (editedJob.expectedEndDate) {
        formattedJob.expectedEndDate = new Date(editedJob.expectedEndDate).toISOString();
      }

      console.log("Sending update with formatted data:", formattedJob);
      
      // Only proceed with update if there are changes
      if (Object.keys(formattedJob).length === 0) {
        console.log("No changes detected, skipping update");
        setIsEditing(false);
        return;
      }
      
      await jobApi.updateJob(job.id, formattedJob);
      onUpdate();
      setIsEditing(false);
    } catch (err) {
      console.error('Job update error:', err);
      
      // Enhanced error handling to show more specific error message
      if (err.response && err.response.data && err.response.data.error) {
        setError(`Failed to update job: ${err.response.data.error}`);
      } else {
        setError('Failed to update job. Please check all fields and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center">
            <Briefcase className="mr-3 text-blue-600" />
            Job Details
          </h2>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <button 
                onClick={handleSave}
                disabled={isLoading}
                className="text-green-600 hover:text-green-800 disabled:opacity-50"
              >
                <Save className="h-6 w-6" />
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Edit className="h-6 w-6" />
              </button>
            )}
            <button 
              onClick={onClose} 
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4">
            {error}
          </div>
        )}

        {/* Job Details Content */}
        <div className="p-6 space-y-6">
          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Job Title</label>
            {isEditing ? (
              <input
                type="text"
                name="title"
                value={editedJob.title}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            ) : (
              <p className="mt-1 text-lg font-semibold">{job.title}</p>
            )}
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            {isEditing ? (
              <textarea
                name="description"
                value={editedJob.description}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            ) : (
              <p className="mt-1 text-gray-600">{job.description || 'No description provided'}</p>
            )}
          </div>

          {/* Job Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            {isEditing ? (
              <select
                name="status"
                value={editedJob.status}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs ${statusColors[job.status]}`}>
                {job.status.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Start Date - Added editing capability */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            {isEditing ? (
              <input
                type="date"
                name="startDate"
                value={editedJob.startDate}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            ) : job.startDate ? (
              <div className="flex items-center mt-1 space-x-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                <span className="text-gray-600">
                  {new Date(job.startDate).toLocaleDateString()}
                </span>
              </div>
            ) : (
              <p className="mt-1 text-gray-500">Not specified</p>
            )}
          </div>

          {/* Expected End Date - Added editing capability */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Expected End Date</label>
            {isEditing ? (
              <input
                type="date"
                name="expectedEndDate"
                value={editedJob.expectedEndDate}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            ) : job.expectedEndDate ? (
              <div className="flex items-center mt-1 space-x-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <span className="text-gray-600">
                  {new Date(job.expectedEndDate).toLocaleDateString()}
                </span>
              </div>
            ) : (
              <p className="mt-1 text-gray-500">Not specified</p>
            )}
          </div>

          {/* Additional Job Information */}
          <div className="grid grid-cols-2 gap-4">
            {/* Order Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related Order
              </label>
              <div className="flex items-center space-x-2 bg-gray-100 p-3 rounded-md">
                <ShoppingCart className="h-5 w-5 text-gray-600" />
                <span className="text-sm">{getOrderTitle()}</span>
              </div>
            </div>

            {/* Customer Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer
              </label>
              <div className="flex items-center space-x-2 bg-gray-100 p-3 rounded-md">
                <UserCircle className="h-5 w-5 text-gray-600" />
                <span className="text-sm">{job.customer?.name || 'No customer'}</span>
              </div>
            </div>
          </div>

          {/* Assigned Users */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Users
            </label>
            <div className="flex flex-wrap gap-2">
              {job.assignedUsers && job.assignedUsers.length > 0 ? (
                job.assignedUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    <User className="h-4 w-4" />
                    <span>{user.name}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm">No users assigned</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}