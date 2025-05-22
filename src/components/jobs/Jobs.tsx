// src/components/jobs/Jobs.tsx (amended with audit trail)
import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Filter,
  Eye,
  MoreHorizontal,
  AlertTriangle,
  ArrowUpDown,
  Edit,
  Trash2,
  Copy,
  Download,
  Play,
  CheckCircle,
  History
} from 'lucide-react';
import { jobApi } from '../../utils/api'; // Verify path
import CreateJobModal from './CreateJobModal'; // Verify path
import JobDetails from './JobDetails';       // Verify path
import { format } from 'date-fns';         // Or your date library
import { AuditButton } from '../audit';    // Import audit button

// --- Type Definitions ---
// Main Job structure (from GET /jobs)
interface Job {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  expectedEndDate: string;
  estimatedCost: number;
  status: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'ACTIVE'; // Match backend enum
  customer: {
    id: string;
    name: string;
  };
}

// At Risk Job structure (from GET /jobs/at-risk) - match backend service response
interface AtRiskJob {
    id: string;
    title: string;
    status: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'ACTIVE'; // Should match JobStatus enum
    expectedEndDate: string; // Comes as Date, format needed
    customer: string; // Customer Name (string)
    assignedUsers: string[]; // Array of user names (strings)
    projectTitle: string | null; // Can be null if no linked order
    // Add other fields if your backend returns them (e.g., totalCosts placeholder?)
}

// Combined type for rendering flexibility
type DisplayJob = Job | AtRiskJob;


// --- Utility Functions (Keep formatDate, formatCurrency) ---
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'dd MMM yyyy');
  } catch (error) {
    return 'Invalid Date';
  }
};

// --- Component ---
export default function Jobs() {
  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [atRiskJobs, setAtRiskJobs] = useState<AtRiskJob[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null); // Store ID to fetch full details
  const [selectedJobData, setSelectedJobData] = useState<Job | null>(null); // For JobDetails modal
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'atRisk'>('list'); // State for view toggle
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalJobs: 0, pageSize: 10 });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Job | 'customer.name'; direction: 'asc' | 'desc' }>({ key: 'expectedEndDate', direction: 'asc' });
  
  // Add dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // --- Data Fetching ---
  const fetchListData = async () => {
      setIsLoading(true);
      setError(null);
      try {
          // Fetch regular job list with filters/sorting/pagination
          const params: any = {
              page: pagination.currentPage,
              limit: pagination.pageSize,
              sortBy: sortConfig.key,
              order: sortConfig.direction,
          };
          if (filter !== 'ALL') {
              params.status = filter;
          }
          const response = await jobApi.getJobs(params);
          setJobs(response.data.jobs || []);
          setPagination(response.data.pagination || { currentPage: 1, totalPages: 1, totalJobs: 0, pageSize: pagination.pageSize });
      } catch (err: any) {
          console.error('Error fetching job list:', err);
          setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch jobs');
          setJobs([]);
          setPagination({ currentPage: 1, totalPages: 1, totalJobs: 0, pageSize: pagination.pageSize });
      } finally {
          setIsLoading(false);
      }
  };

  const fetchAtRiskData = async () => {
      setIsLoading(true);
      setError(null);
      try {
          // Fetch at-risk jobs (no filters/sorting/pagination assumed for this endpoint)
          const response = await jobApi.getAtRiskJobs(); // Add threshold if needed: (10)
          setAtRiskJobs(response.data || []);
      } catch (err: any) {
          console.error('Error fetching at-risk jobs:', err);
          setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch at-risk jobs');
          setAtRiskJobs([]);
      } finally {
          setIsLoading(false);
      }
  };

  // Fetch data based on the active view
  useEffect(() => {
    if (activeView === 'list') {
      fetchListData();
    } else { // activeView === 'atRisk'
      fetchAtRiskData();
    }
    // Reset selection when view changes
    setSelectedJobId(null);
    setSelectedJobData(null);
  }, [activeView, filter, sortConfig, pagination.currentPage]); // Dependencies that trigger refetch


  // Fetch full job details when an ID is selected
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!selectedJobId) {
        setSelectedJobData(null);
        return;
      }
      setIsDetailsLoading(true);
      try {
        // Use getJobById which returns the full Job structure
        const response = await jobApi.getJobById(selectedJobId);
        setSelectedJobData(response.data);
      } catch (err) {
        console.error("Failed to fetch job details:", err);
        setSelectedJobData(null); // Clear on error
        // Optionally show an error message to the user
      } finally {
        setIsDetailsLoading(false);
      }
    };
    fetchJobDetails();
  }, [selectedJobId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
    
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);


  // --- Handlers ---
  const handleSelectJob = (job: DisplayJob | null) => {
    setSelectedJobId(job?.id || null); // Store only the ID
  };

  const handleCloseDetails = () => {
      setSelectedJobId(null);
      setSelectedJobData(null);
  }

  const handleJobCreated = () => {
      setIsCreateModalOpen(false);
      setActiveView('list'); // Switch to list view to see the new job
      // Reset to page 1 of list view
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      setFilter('ALL'); // Reset filter?
      setSortConfig({ key: 'expectedEndDate', direction: 'asc' }); // Reset sort?
      // fetchListData will be triggered by state changes via useEffect
  };

  const handleJobUpdated = () => {
      handleCloseDetails(); // Close details modal
      // Refetch data for the current view
      if (activeView === 'list') {
          fetchListData();
      } else {
          fetchAtRiskData(); // Refetch at-risk list in case status changed
      }
  }

  const handlePageChange = (newPage: number) => {
      if (activeView === 'list' && newPage >= 1 && newPage <= pagination.totalPages) {
          setPagination(prev => ({ ...prev, currentPage: newPage }));
      }
  };

  const handleSort = (key: keyof Job | 'customer.name') => {
       if (activeView !== 'list') return; // Sorting only applies to list view

       let direction: 'asc' | 'desc' = 'asc';
       if (sortConfig.key === key && sortConfig.direction === 'asc') {
           direction = 'desc';
       }
       // Reset to page 1 when sorting changes
       setPagination(prev => ({ ...prev, currentPage: 1 }));
       setSortConfig({ key, direction });
   };

   const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (activeView !== 'list') return; // Filtering only applies to list view
        setFilter(e.target.value);
        // Reset to page 1 when filter changes
        setPagination(prev => ({ ...prev, currentPage: 1 }));
   }

   // Add dropdown handlers
   const toggleDropdown = (jobId: string, event: React.MouseEvent) => {
     event.preventDefault();
     event.stopPropagation();
     setOpenDropdown(openDropdown === jobId ? null : jobId);
   };

   const handleQuickEdit = (job: DisplayJob) => {
     setSelectedJobId(job.id);
     setOpenDropdown(null);
   };

   const handleDeleteJob = async (jobId: string) => {
     if (!confirm('Are you sure you want to delete this job?')) return;
     
     try {
       // await jobApi.deleteJob(jobId);
       alert('Delete functionality to be implemented');
       setOpenDropdown(null);
       // Refresh the list after delete
       if (activeView === 'list') {
         fetchListData();
       } else {
         fetchAtRiskData();
       }
     } catch (error) {
       console.error('Error deleting job:', error);
       alert('Failed to delete job');
     }
   };

   const handleStatusChange = async (jobId: string, newStatus: string) => {
     try {
       // await jobApi.updateJob(jobId, { status: newStatus });
       alert(`Status change to ${newStatus} to be implemented`);
       setOpenDropdown(null);
       // Refresh the list after status change
       if (activeView === 'list') {
         fetchListData();
       } else {
         fetchAtRiskData();
       }
     } catch (error) {
       console.error('Error updating job status:', error);
       alert('Failed to update job status');
     }
   };

  // --- Rendering ---
  const renderStatusBadge = (status: Job['status'] | AtRiskJob['status'] | undefined) => {
    if (!status) return null;
    const statusStyles: Record<string, string> = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'ACTIVE': 'bg-purple-100 text-purple-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELED': 'bg-red-100 text-red-800', // Check spelling vs backend
    };
    const style = statusStyles[status] || 'bg-gray-200 text-gray-900';
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block ${style}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const renderContent = () => {
    const displayData: DisplayJob[] = activeView === 'list' ? jobs : atRiskJobs;

    if (isLoading && displayData.length === 0) {
      return <div className="text-center py-10 text-gray-500">Loading...</div>;
    }
    if (error) {
      return <div className="text-red-600 text-center py-10 bg-red-50 p-4 rounded border border-red-200">{error}</div>;
    }
    if (displayData.length === 0 && !isLoading) {
      return (
        <div className="text-center py-10 text-gray-500">
          {activeView === 'atRisk' ? 'No jobs currently at risk.' : 'No jobs found matching the criteria.'}
          {activeView === 'list' && (
              <button onClick={() => setIsCreateModalOpen(true)} className="ml-2 text-blue-600 hover:underline">
                  Create a job?
              </button>
          )}
        </div>
      );
    }

    // --- Table Structure ---
    // Define headers - note that not all columns apply equally to both views
    const headers = [
        { key: 'title', label: 'Reference', sortable: activeView === 'list' },
        { key: 'customer.name', label: 'Customer', sortable: activeView === 'list'}, // Need special handling for AtRiskJob
        { key: 'expectedEndDate', label: 'Due Date', sortable: activeView === 'list' },
        { key: 'estimatedCost', label: 'Value', sortable: activeView === 'list' }, // Not in AtRiskJob
        { key: 'status', label: 'Status', sortable: activeView === 'list' },
        { key: null, label: 'Actions', sortable: false}
    ];


    return (
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              {headers.map(header => (
                <th
                  key={header.label}
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${header.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  onClick={() => header.sortable && header.key && handleSort(header.key as keyof Job | 'customer.name')}
                >
                  <div className="flex items-center">
                     {header.label}
                     {header.sortable && header.key && (
                        <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.key === header.key ? 'text-gray-900' : 'text-gray-400'}`} />
                     )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((job) => {
               // Adapt data access based on view/type
               const isAtRiskView = activeView === 'atRisk';
               const customerName = isAtRiskView ? (job as AtRiskJob).customer : (job as Job).customer?.name;
               // Value only exists in Job type
               const value = isAtRiskView ? 'N/A' : formatCurrency((job as Job).estimatedCost);

               return (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{job.title}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{customerName || 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(job.expectedEndDate)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{value}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{renderStatusBadge(job.status)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSelectJob(job)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => toggleDropdown(job.id, e)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded"
                            title="More Actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          
                          {/* Dropdown Content */}
                          {openDropdown === job.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => handleQuickEdit(job)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Edit className="h-4 w-4 mr-3" />
                                  Edit Job
                                </button>
                                
                                <button
                                  onClick={() => {
                                    handleSelectJob(job);
                                    setOpenDropdown(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Eye className="h-4 w-4 mr-3" />
                                  View Details
                                </button>
                                
                                {/* Audit History Button */}
                                <div
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => setOpenDropdown(null)}
                                >
                                  <History className="h-4 w-4 mr-3" />
                                  <AuditButton
                                    entityType="JOB"
                                    entityId={job.id}
                                    entityTitle={job.title}
                                    buttonText="View Audit Trail"
                                    showIcon={false}
                                    variant="ghost"
                                    className="w-full text-left justify-start p-0"
                                  />
                                </div>
                                
                                <hr className="my-1" />
                                
                                {/* Quick status updates */}
                                {job.status !== 'IN_PROGRESS' && (
                                  <button
                                    onClick={() => handleStatusChange(job.id, 'IN_PROGRESS')}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Play className="h-4 w-4 mr-3" />
                                    Start Job
                                  </button>
                                )}
                                
                                {job.status === 'IN_PROGRESS' && (
                                  <button
                                    onClick={() => handleStatusChange(job.id, 'COMPLETED')}
                                    className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-3" />
                                    Mark Complete
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => {
                                    alert('Duplicate functionality to be implemented');
                                    setOpenDropdown(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Copy className="h-4 w-4 mr-3" />
                                  Duplicate Job
                                </button>
                                
                                <button
                                  onClick={() => {
                                    alert('Export functionality to be implemented');
                                    setOpenDropdown(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Download className="h-4 w-4 mr-3" />
                                  Export PDF
                                </button>
                                
                                <hr className="my-1" />
                                
                                <button
                                  onClick={() => handleDeleteJob(job.id)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-3" />
                                  Delete Job
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
               );
            })}
          </tbody>
        </table>
        {/* Pagination Controls (Only show for list view) */}
        {activeView === 'list' && pagination.totalJobs > 0 && (
             <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 rounded-b-lg">
                 <div className="text-sm text-gray-700">
                     Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalJobs} results)
                 </div>
                 <div className="flex space-x-1">
                     <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="relative inline-flex items-center px-2 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                     <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="relative inline-flex items-center px-2 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
                 </div>
             </div>
         )}
      </div>
    );
  };


  // --- Main Component Return ---
  return (
    <div className="p-6 md:p-8 max-w-full mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center text-gray-800">
          <Briefcase className="mr-2 h-6 w-6 md:h-7 md:w-7 text-blue-600" />
          Jobs Management
        </h1>

        <div className="flex flex-wrap items-center space-x-2 md:space-x-4">
          {/* View Toggle */}
           <div className="flex border border-gray-300 rounded-md">
             <button
                 onClick={() => setActiveView('list')}
                 className={`px-3 py-1.5 text-sm font-medium rounded-l-md ${activeView === 'list' ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
             >
                 All Jobs
             </button>
             <button
                 onClick={() => setActiveView('atRisk')}
                 className={`px-3 py-1.5 text-sm font-medium rounded-r-md flex items-center ${activeView === 'atRisk' ? 'bg-red-600 text-white border-red-600' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
             >
                 <AlertTriangle className="mr-1 h-4 w-4" />
                 At Risk
             </button>
           </div>

          {/* Status Filter (Disabled for At Risk view) */}
          <div className="flex items-center space-x-2">
             <Filter className={`h-4 w-4 ${activeView === 'list' ? 'text-gray-500' : 'text-gray-300'}`} />
              <select
                value={filter}
                onChange={handleFilterChange}
                disabled={activeView === 'atRisk'} // Disable filter when viewing 'At Risk'
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="ALL">All Statuses</option>
                {/* Status options */}
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELED">Cancelled</option>
              </select>
          </div>

          {/* Create Job Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="mr-1 h-4 w-4" /> Create Job
          </button>
        </div>
      </div>

       {/* Loading Indicator */}
       {isLoading && (
           <div className="text-center py-2 text-sm text-gray-500">Loading...</div>
       )}

      {/* Jobs Content Area */}
      {renderContent()}

      {/* Create Job Modal */}
      {isCreateModalOpen && (
        <CreateJobModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onJobCreated={handleJobCreated}
        />
      )}

      {/* Job Details Modal */}
      {selectedJobData && !isDetailsLoading && (
        <JobDetails
          job={selectedJobData} // Pass the full fetched job data
          onClose={handleCloseDetails}
          onUpdate={handleJobUpdated}
        />
      )}
       {/* Optional: Show loading indicator while fetching details */}
       {isDetailsLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded shadow-lg">Loading details...</div>
          </div>
       )}
    </div>
  );
}