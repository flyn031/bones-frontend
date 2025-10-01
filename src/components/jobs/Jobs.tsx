// src/components/jobs/Jobs.tsx (amended with audit trail + orders as jobs + status fixes + customerReference)
import React, { useState, useEffect } from 'react';
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
  History,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { jobApi } from '../../utils/api';
import { API_URL } from '../../config/constants';
import CreateJobModal from './CreateJobModal';
import JobDetails from './JobDetails';
import { format } from 'date-fns';
import { AuditButton } from '../audit';
import { JobsResponse } from '../../types/api';
import { ExtendedJob, AtRiskJob, DisplayJob, toBaseJob } from '../../types/job';

// --- Utility Functions ---
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
  const [jobs, setJobs] = useState<ExtendedJob[]>([]);
  const [atRiskJobs, setAtRiskJobs] = useState<AtRiskJob[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobData, setSelectedJobData] = useState<ExtendedJob | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'atRisk'>('list');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalJobs: 0, pageSize: 10 });
  const [sortConfig, setSortConfig] = useState<{ key: keyof ExtendedJob | 'customer.name'; direction: 'asc' | 'desc' }>({ key: 'expectedEndDate', direction: 'asc' });
  const [refreshing, setRefreshing] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // --- Enhanced Data Fetching Logic ---
  const fetchListData = async (showRefreshing = false) => {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      try {
          const params: any = {
              page: pagination.currentPage,
              limit: pagination.pageSize,
              sortBy: sortConfig.key,
              order: sortConfig.direction,
          };
          if (filter !== 'ALL') {
              params.status = filter;
          }
          
          const [jobsResponse, ordersResponse] = await Promise.all([
              jobApi.getJobs(params),
              fetch(`${API_URL}/orders`, {
                  headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`,
                      'Content-Type': 'application/json',
                  },
              })
          ]);

          const jobsData = jobsResponse.data as JobsResponse;
          const jobs = jobsData.jobs || jobsData.data || [];
          
          let ordersData = [];
          if (ordersResponse.ok) {
              const allOrders = await ordersResponse.json();
              ordersData = allOrders
                  .filter((order: any) => order.status === 'IN_PRODUCTION')
                  .map((order: any): ExtendedJob => ({
                      id: order.id,
                      title: order.projectTitle + ' (Order)',
                      description: `Order converted to job: ${order.quoteRef || order.id}`,
                      createdAt: order.createdAt,
                      expectedEndDate: order.expectedEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                      estimatedCost: order.totalAmount || 0,
                      status: 'IN_PRODUCTION' as const,
                      customer: {
                          id: order.customerId || 'unknown',
                          name: order.customerName || order.customer?.name || 'Unknown Customer'
                      },
                      customerReference: order.customerReference, // ADDED: Customer reference
                      isFromOrder: true,
                      originalOrderId: order.id,
                      quoteRef: order.quoteRef
                  }));
          }

          const combinedData = [...jobs, ...ordersData];
          
          console.log(`✅ Loaded ${jobs.length} jobs + ${ordersData.length} orders = ${combinedData.length} total items`);
          
          setJobs(combinedData);
          
          const apiPagination = jobsData.pagination;
          if (apiPagination && 'page' in apiPagination) {
            setPagination({
              currentPage: apiPagination.page,
              totalPages: apiPagination.pages,
              totalJobs: apiPagination.total,
              pageSize: pagination.pageSize
            });
          } else {
            setPagination(apiPagination || { currentPage: 1, totalPages: 1, totalJobs: combinedData.length, pageSize: pagination.pageSize });
          }
          
      } catch (err: any) {
          console.error('Error fetching job list:', err);
          setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch jobs');
          setJobs([]);
          setPagination({ currentPage: 1, totalPages: 1, totalJobs: 0, pageSize: pagination.pageSize });
      } finally {
          setIsLoading(false);
          setRefreshing(false);
      }
  };

  const fetchAtRiskData = async () => {
      setIsLoading(true);
      setError(null);
      try {
          const response = await jobApi.getAtRiskJobs();
          const atRiskData = response.data as AtRiskJob[] | { data: AtRiskJob[] };
          const atRiskJobs = Array.isArray(atRiskData) ? atRiskData : (atRiskData.data || []);
          setAtRiskJobs(atRiskJobs);
      } catch (err: any) {
          console.error('Error fetching at-risk jobs:', err);
          setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch at-risk jobs');
          setAtRiskJobs([]);
      } finally {
          setIsLoading(false);
      }
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    if (activeView === 'list') {
      fetchListData(true);
    } else {
      fetchAtRiskData();
    }
  };

  useEffect(() => {
    if (activeView === 'list') {
      fetchListData();
    } else {
      fetchAtRiskData();
    }
    setSelectedJobId(null);
    setSelectedJobData(null);
  }, [activeView, filter, sortConfig, pagination.currentPage]);

  useEffect(() => {
    if (activeView === 'list') {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refresh triggered');
        fetchListData(true);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [activeView]);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!selectedJobId) {
        setSelectedJobData(null);
        return;
      }
      setIsDetailsLoading(true);
      try {
        const response = await jobApi.getJobById(selectedJobId);
        const jobData = response.data as ExtendedJob;
        setSelectedJobData(jobData);
      } catch (err) {
        console.error("Failed to fetch job details:", err);
        setSelectedJobData(null);
      } finally {
        setIsDetailsLoading(false);
      }
    };
    fetchJobDetails();
  }, [selectedJobId]);

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
    setSelectedJobId(job?.id || null);
  };

  const handleCloseDetails = () => {
      setSelectedJobId(null);
      setSelectedJobData(null);
  }

  const handleJobCreated = () => {
      setIsCreateModalOpen(false);
      setActiveView('list');
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      setFilter('ALL');
      setSortConfig({ key: 'expectedEndDate', direction: 'asc' });
  };

  const handleJobUpdated = () => {
      handleCloseDetails();
      handleRefresh();
  }

  const handlePageChange = (newPage: number) => {
      if (activeView === 'list' && newPage >= 1 && newPage <= pagination.totalPages) {
          setPagination(prev => ({ ...prev, currentPage: newPage }));
      }
  };

  const handleSort = (key: keyof ExtendedJob | 'customer.name') => {
       if (activeView !== 'list') return;
       let direction: 'asc' | 'desc' = 'asc';
       if (sortConfig.key === key && sortConfig.direction === 'asc') {
           direction = 'desc';
       }
       setPagination(prev => ({ ...prev, currentPage: 1 }));
       setSortConfig({ key, direction });
   };

   const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (activeView !== 'list') return;
        setFilter(e.target.value);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
   }

   const toggleDropdown = (jobId: string, event: React.MouseEvent) => {
     event.preventDefault();
     event.stopPropagation();
     setOpenDropdown(openDropdown === jobId ? null : jobId);
   };

   const handleQuickEdit = (job: DisplayJob) => {
     setSelectedJobId(job.id);
     setOpenDropdown(null);
   };

   const handleDeleteJob = async (_jobId: string) => {
     if (!confirm('Are you sure you want to delete this job?')) return;
     try {
       alert('Delete functionality to be implemented');
       setOpenDropdown(null);
       handleRefresh();
     } catch (error) {
       console.error('Error deleting job:', error);
       alert('Failed to delete job');
     }
   };

   const handleStatusChange = async (_jobId: string, newStatus: string) => {
     try {
       alert(`Status change to ${newStatus} to be implemented`);
       setOpenDropdown(null);
       handleRefresh();
     } catch (error) {
       console.error('Error updating job status:', error);
       alert('Failed to update job status');
     }
   };

  // --- Enhanced Status Badge Rendering ---
  const renderStatusBadge = (status: ExtendedJob['status'] | AtRiskJob['status'] | undefined) => {
    if (!status) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium inline-block bg-gray-200 text-gray-700">
          Loading...
        </span>
      );
    }

    const statusStyles: Record<string, string> = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'ACTIVE': 'bg-purple-100 text-purple-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELED': 'bg-red-100 text-red-800',
      'PENDING_APPROVAL': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'DECLINED': 'bg-red-200 text-red-800',
      'IN_PRODUCTION': 'bg-blue-100 text-blue-800',
      'ON_HOLD': 'bg-orange-100 text-orange-800',
      'READY_FOR_DELIVERY': 'bg-indigo-100 text-indigo-800',
      'DELIVERED': 'bg-purple-100 text-purple-800',
    };

    const style = statusStyles[status] || 'bg-gray-200 text-gray-900';
    const displayText = status.replace(/_/g, ' ');
    
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block ${style}`}>
        {displayText}
      </span>
    );
  };

  const renderContent = () => {
    const displayData: DisplayJob[] = activeView === 'list' ? jobs : atRiskJobs;

    if (isLoading && displayData.length === 0) {
      return <div className="text-center py-10 text-gray-500">Loading...</div>;
    }
    if (error) {
      return (
        <div className="text-red-600 text-center py-10 bg-red-50 p-4 rounded border border-red-200">
          {error}
          <button 
            onClick={handleRefresh}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      );
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

    const headers = [
        { key: 'title', label: 'Reference', sortable: activeView === 'list' },
        { key: 'customer.name', label: 'Customer', sortable: activeView === 'list'},
        { key: 'expectedEndDate', label: 'Due Date', sortable: activeView === 'list' },
        { key: 'estimatedCost', label: 'Value', sortable: activeView === 'list' },
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
                  onClick={() => header.sortable && header.key && handleSort(header.key as keyof ExtendedJob | 'customer.name')}
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
               const isAtRiskView = activeView === 'atRisk';
               const customerName = isAtRiskView ? (job as AtRiskJob).customer : (job as ExtendedJob).customer?.name;
               const value = isAtRiskView ? 'N/A' : formatCurrency((job as ExtendedJob).estimatedCost);

               return (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {/* ADDED: Show customer reference prominently if exists */}
                      {(job as ExtendedJob).customerReference && (
                        <div className="mb-1">
                          <span className="inline-block text-xs font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {(job as ExtendedJob).customerReference}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        {job.title}
                        {(job as ExtendedJob).isFromOrder && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                            From Order
                          </span>
                        )}
                      </div>
                      {(job as ExtendedJob).quoteRef && (
                        <div className="text-xs text-gray-500 mt-1">
                          Quote: {(job as ExtendedJob).quoteRef}
                        </div>
                      )}
                    </td>
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
                        
                        {(job as ExtendedJob).isFromOrder ? (
                          <button
                            onClick={() => {
                              window.location.href = `/orders`;
                            }}
                            className="text-green-600 hover:text-green-800"
                            title="View Original Order"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        ) : (
                          <div className="relative">
                            <button
                              onClick={(e) => toggleDropdown(job.id, e)}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded"
                              title="More Actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            
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
                        )}
                      </div>
                    </td>
                  </tr>
               );
            })}
          </tbody>
        </table>
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
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center text-gray-800">
          <Briefcase className="mr-2 h-6 w-6 md:h-7 md:w-7 text-blue-600" />
          Jobs Management
        </h1>

        <div className="flex flex-wrap items-center space-x-2 md:space-x-4">
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

          <div className="flex items-center space-x-2">
             <Filter className={`h-4 w-4 ${activeView === 'list' ? 'text-gray-500' : 'text-gray-300'}`} />
              <select
                value={filter}
                onChange={handleFilterChange}
                disabled={activeView === 'atRisk'}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_PRODUCTION">In Production</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELED">Cancelled</option>
              </select>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 text-sm font-medium disabled:opacity-50"
            title="Refresh jobs and orders"
          >
            <RefreshCw className={`mr-1 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="mr-1 h-4 w-4" /> Create Job
          </button>
        </div>
      </div>

       {(isLoading || refreshing) && (
           <div className="text-center py-2 text-sm text-gray-500">
             {refreshing ? '🔄 Refreshing...' : 'Loading...'}
           </div>
       )}

      {renderContent()}

      {isCreateModalOpen && (
        <CreateJobModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onJobCreated={handleJobCreated}
        />
      )}

      {selectedJobData && !isDetailsLoading && (
        <JobDetails
          job={toBaseJob(selectedJobData)}
          onClose={handleCloseDetails}
          onUpdate={handleJobUpdated}
        />
      )}
       {isDetailsLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded shadow-lg">Loading details...</div>
          </div>
       )}
    </div>
  );
}