// src/components/jobs/JobDetails.tsx (amended with audit trail)
import React, { useState, useEffect } from 'react';
import {
  X, Edit, Save, ArrowLeft,
  FileText, DollarSign, BarChart2,
  Calendar, User, Clock, Link as LinkIcon, Package, History // Added History icon
} from 'lucide-react';
// Corrected: Ensure jobApi import is from your central api file
import { jobApi } from '../../utils/api'; // <<< Verify/Correct this path
import JobCosts from './JobCosts';        // Verify path
import JobMaterials from './JobMaterials'; // Add new import
import { AuditButton } from '../audit'; // Import AuditButton

// --- CORRECTED Job Type Definition ---
// (Consider moving this to a central types/job.ts file)
interface OrderInJob { // Define structure for Order within Job details
    id: string;
    projectTitle: string;
    quoteRef: string; // Added quoteRef
    status: string; // Added status (optional, but useful)
    // Add other Order fields you might want to display (e.g., totalAmount)
}

interface Job {
  id: string;
  title: string;
  description?: string | null; // Allow null
  status: 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'ACTIVE'; // Match backend enum
  customer: {
    id: string;
    name: string;
  };
  // Corrected: 'orders' is an array of OrderInJob objects
  orders: OrderInJob[]; // Expecting an array now
  assignedUsers: Array<{
    user: { // User object might be nested under 'user' based on backend include
        id: string;
        name: string;
    }
  }>;
  createdBy: { // Added createdBy based on backend include
    id: string;
    name: string;
    email: string;
  };
  costs: any[]; // Define costs structure if needed, using any for now
  materialUsed: any[]; // Define material structure if needed
  materials?: any[]; // Add materials array from updated job controller
  materialTotals?: { // Add material totals from updated job controller
    totalMaterials: number;
    totalMaterialCost: number;
    totalQuantityNeeded: number;
    totalQuantityUsed: number;
  };
  totals?: { // Add financial totals including materials
    orderTotal: number;
    costTotal: number;
    materialCostTotal: number;
    totalCosts: number;
    estimatedProfit: number;
  };
  notes: any[]; // Define notes structure if needed
  startDate?: Date | string | null; // Allow null
  expectedEndDate?: Date | string | null; // Allow null
  actualEndDate?: Date | string | null; // Allow null
  totalCosts?: number; // This is calculated in the backend controller
}
// --- END CORRECTION ---


interface JobDetailsProps {
  // The initial job prop might have fewer fields than the full Job type
  // fetched by getJobById. Use Partial or a specific 'JobListJob' type if needed.
  job: Partial<Job> & { id: string }; // Expect at least an ID initially
  onClose: () => void;
  onUpdate: () => void;
}

const JobDetails: React.FC<JobDetailsProps> = ({ job, onClose, onUpdate }) => {
  // Initialize with null or partial job, full data is fetched
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start loading true
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'costs' | 'materials' | 'performance' | 'audit'>('details'); // Added audit tab

  // Initialize editForm state AFTER currentJob is loaded
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: '',
    startDate: '',
    expectedEndDate: ''
  });

  // Fetch full job details when the component mounts or job.id changes
  useEffect(() => {
    fetchJobDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]); // Depend only on job.id

  // Update editForm when currentJob data is loaded or editing starts/stops
  useEffect(() => {
    if (currentJob) {
      setEditForm({
        title: currentJob.title || '',
        description: currentJob.description || '',
        status: currentJob.status || '',
        startDate: currentJob.startDate ? new Date(currentJob.startDate).toISOString().split('T')[0] : '',
        expectedEndDate: currentJob.expectedEndDate ? new Date(currentJob.expectedEndDate).toISOString().split('T')[0] : ''
      });
    }
     // If not editing, ensure form reflects current data (handles cancel)
     if (!isEditing && currentJob) {
        setEditForm({
            title: currentJob.title || '',
            description: currentJob.description || '',
            status: currentJob.status || '',
            startDate: currentJob.startDate ? new Date(currentJob.startDate).toISOString().split('T')[0] : '',
            expectedEndDate: currentJob.expectedEndDate ? new Date(currentJob.expectedEndDate).toISOString().split('T')[0] : ''
        });
     }
  }, [currentJob, isEditing]);


  const fetchJobDetails = async () => {
    if (!job.id) return; // Don't fetch if no ID
    setIsLoading(true);
    setError(null);
    try {
      // Use the correct jobApi import
      const response = await jobApi.getJobById(job.id);
      setCurrentJob(response.data as Job); // Assert type based on backend include
    } catch (err: any) {
      console.error('Error fetching job details:', err);
      setError(err.response?.data?.error || 'Failed to load job details');
      setCurrentJob(null); // Clear job data on error
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Save job changes
  const handleSaveChanges = async () => {
    if (!currentJob) return;
    setIsLoading(true); // Indicate saving
    setError(null);
    try {
      // Use the correct jobApi import
      await jobApi.updateJob(currentJob.id, editForm);
      setIsEditing(false);
      await fetchJobDetails(); // Refetch details after successful update
      onUpdate(); // Notify parent to refresh list
    } catch (err: any) {
      console.error('Error updating job:', err);
      setError(err.response?.data?.error ||'Failed to update job');
    } finally {
        setIsLoading(false);
    }
  };

  // Handle cost changes (called from JobCosts component)
  const handleCostChange = () => {
    fetchJobDetails(); // Refetch job details to update totalCosts display
    onUpdate();
  };

  // Handle material changes (called from JobMaterials component)
  const handleMaterialChange = () => {
    fetchJobDetails(); // Refetch job details to update material totals
    onUpdate();
  };

  // Utility functions (keep formatDate, formatCurrency)
    const formatDate = (dateString?: string | Date | null) => {
        if (!dateString) return 'Not set';
        try {
            return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) { return "Invalid Date"; }
    };
    const formatCurrency = (amount?: number | null) => {
        if (amount === undefined || amount === null) return 'N/A';
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
    };
    const getStatusBadgeClass = (status: string | undefined) => {
        if (!status) return 'bg-gray-100 text-gray-800';
        const styles: Record<string, string> = {
          'DRAFT': 'bg-gray-100 text-gray-800',
          'PENDING': 'bg-yellow-100 text-yellow-800',
          'IN_PROGRESS': 'bg-blue-100 text-blue-800',
          'ACTIVE': 'bg-purple-100 text-purple-800',
          'COMPLETED': 'bg-green-100 text-green-800',
          'CANCELED': 'bg-red-100 text-red-800'
        };
        return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
    };

  // --- Render Logic ---

  // Display loading state
  if (isLoading) {
     return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-xl text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading job details...</p>
            </div>
        </div>
     );
  }

  // Display error state
  if (error || !currentJob) {
     return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-center">
                 <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><X/></button>
                 <h3 className="text-lg font-medium text-red-700">Error</h3>
                 <p className="mt-2 text-sm text-red-600">{error || 'Job data could not be loaded.'}</p>
                 <button onClick={onClose} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Close</button>
            </div>
        </div>
     );
  }

  // Get the first linked order (if any) - based on corrected structure
  const linkedOrder = (currentJob.orders && currentJob.orders.length > 0) ? currentJob.orders[0] : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-white px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold flex items-center text-gray-800">
              {isEditing ? 'Edit Job' : currentJob.title}
            </h2>
            {/* Add material summary in header if available */}
            {currentJob.materialTotals && (
              <p className="text-sm text-gray-500 mt-1">
                {currentJob.materialTotals.totalMaterials} materials • 
                Cost: {formatCurrency(currentJob.materialTotals.totalMaterialCost)}
              </p>
            )}
          </div>
          {/* Header Actions */}
          <div className="flex items-center space-x-2">
             {/* Audit Trail Button */}
             {!isEditing && (
               <AuditButton
                 entityType="JOB"
                 entityId={currentJob.id}
                 entityTitle={currentJob.title}
                 variant="outline"
                 size="sm"
                 buttonText="Audit Trail"
               />
             )}
             
             {/* ... Edit/Save/Cancel buttons ... */}
             {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="p-2 rounded hover:bg-gray-100" title="Cancel"><X className="h-5 w-5 text-gray-500" /></button>
                <button onClick={handleSaveChanges} className="p-2 rounded hover:bg-gray-100" title="Save changes"><Save className="h-5 w-5 text-blue-600" /></button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="p-2 rounded hover:bg-gray-100" title="Edit job"><Edit className="h-5 w-5 text-blue-600" /></button>
                <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" title="Close"><X className="h-5 w-5 text-gray-500" /></button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 px-6 pt-4 border-b">
           {/* ... Tab buttons ... */}
           <div className="flex space-x-6">
             <button 
               onClick={() => setActiveTab('details')} 
               className={`pb-3 flex items-center ${activeTab === 'details' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
             >
               <FileText className="h-4 w-4 mr-2" />Details
             </button>
             <button 
               onClick={() => setActiveTab('materials')} 
               className={`pb-3 flex items-center ${activeTab === 'materials' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
             >
               <Package className="h-4 w-4 mr-2" />
               Materials
               {currentJob.materialTotals && currentJob.materialTotals.totalMaterials > 0 && (
                 <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                   {currentJob.materialTotals.totalMaterials}
                 </span>
               )}
             </button>
             <button 
               onClick={() => setActiveTab('costs')} 
               className={`pb-3 flex items-center ${activeTab === 'costs' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
             >
               <DollarSign className="h-4 w-4 mr-2" />Costs
             </button>
             <button 
               onClick={() => setActiveTab('performance')} 
               className={`pb-3 flex items-center ${activeTab === 'performance' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
             >
               <BarChart2 className="h-4 w-4 mr-2" />Performance
             </button>
             <button 
               onClick={() => setActiveTab('audit')} 
               className={`pb-3 flex items-center ${activeTab === 'audit' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
             >
               <History className="h-4 w-4 mr-2" />Audit Trail
             </button>
           </div>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="flex-grow overflow-y-auto p-6">
          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {isEditing ? (
                /* --- EDITING FORM --- */
                <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                           <input type="text" name="title" value={editForm.title} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                           <select name="status" value={editForm.status} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                              {/* Status options */}
                              <option value="DRAFT">Draft</option>
                              <option value="PENDING">Pending</option>
                              <option value="ACTIVE">Active</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="CANCELED">Cancelled</option>
                           </select>
                       </div>
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                       <textarea name="description" value={editForm.description} onChange={handleInputChange} rows={3} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                           <input type="date" name="startDate" value={editForm.startDate} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Expected End Date</label>
                           <input type="date" name="expectedEndDate" value={editForm.expectedEndDate} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                       </div>
                   </div>
                   {/* Add fields for estimatedCost, actualCost, actualEndDate if editable */}
                </div>
              ) : (
                /* --- VIEW MODE --- */
                <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Job Info Column */}
                      <div>
                         <h3 className="text-sm font-medium text-gray-500 mb-2">Job Details</h3>
                         <div className="space-y-2">
                           <p><span className="text-sm text-gray-500 w-28 inline-block">Status:</span> <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${getStatusBadgeClass(currentJob.status)}`}>{currentJob.status.replace('_', ' ')}</span></p>
                           <p><span className="text-sm text-gray-500 w-28 inline-block">Customer:</span> <span className="ml-1 text-gray-900">{currentJob.customer?.name}</span></p>
                           {/* --- CORRECTED ORDER DISPLAY --- */}
                           <p>
                               <span className="text-sm text-gray-500 w-28 inline-block">Linked Order:</span>
                               {linkedOrder ? (
                                   <span className="ml-1 text-gray-900">{linkedOrder.projectTitle} ({linkedOrder.quoteRef})</span>
                               ) : (
                                   <span className="ml-1 text-gray-500 italic">None</span>
                               )}
                           </p>
                           {/* --- END CORRECTION --- */}
                           <p><span className="text-sm text-gray-500 w-28 inline-block">Created By:</span> <span className="ml-1 text-gray-900">{currentJob.createdBy?.name}</span></p>
                         </div>
                      </div>
                      {/* Schedule & Cost Column */}
                      <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Schedule & Cost</h3>
                          <div className="space-y-2">
                              <p><span className="text-sm text-gray-500 w-32 inline-block">Start Date:</span><span className="ml-1 text-gray-900">{formatDate(currentJob.startDate)}</span></p>
                              <p><span className="text-sm text-gray-500 w-32 inline-block">Expected End:</span><span className="ml-1 text-gray-900">{formatDate(currentJob.expectedEndDate)}</span></p>
                              {currentJob.actualEndDate && <p><span className="text-sm text-gray-500 w-32 inline-block">Actual End:</span> <span className="ml-1 text-gray-900">{formatDate(currentJob.actualEndDate)}</span></p>}
                              {/* Enhanced cost display with breakdown */}
                              {currentJob.totals ? (
                                <div className="space-y-1">
                                  <p><span className="text-sm text-gray-500 w-32 inline-block">Order Value:</span> <span className="ml-1 text-gray-900">{formatCurrency(currentJob.totals.orderTotal)}</span></p>
                                  <p><span className="text-sm text-gray-500 w-32 inline-block">Job Costs:</span> <span className="ml-1 text-gray-900">{formatCurrency(currentJob.totals.costTotal)}</span></p>
                                  <p><span className="text-sm text-gray-500 w-32 inline-block">Material Costs:</span> <span className="ml-1 text-gray-900">{formatCurrency(currentJob.totals.materialCostTotal)}</span></p>
                                  <p className="border-t pt-1"><span className="text-sm text-gray-500 w-32 inline-block">Total Costs:</span> <span className="ml-1 font-medium text-gray-900">{formatCurrency(currentJob.totals.totalCosts)}</span></p>
                                  <p><span className="text-sm text-gray-500 w-32 inline-block">Est. Profit:</span> <span className={`ml-1 font-medium ${currentJob.totals.estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(currentJob.totals.estimatedProfit)}</span></p>
                                </div>
                              ) : (
                                <p><span className="text-sm text-gray-500 w-32 inline-block">Total Costs:</span> <span className="ml-1 font-medium text-gray-900">{formatCurrency(currentJob.totalCosts)}</span></p>
                              )}
                          </div>
                      </div>
                   </div>

                   {/* Material Summary (if available) */}
                   {currentJob.materialTotals && (
                     <div className="bg-blue-50 rounded-lg p-4">
                       <h3 className="text-sm font-medium text-gray-700 mb-2">Material Summary</h3>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                         <div>
                           <span className="text-gray-500">Total Materials:</span>
                           <span className="ml-1 font-medium">{currentJob.materialTotals.totalMaterials}</span>
                         </div>
                         <div>
                           <span className="text-gray-500">Quantity Needed:</span>
                           <span className="ml-1 font-medium">{currentJob.materialTotals.totalQuantityNeeded}</span>
                         </div>
                         <div>
                           <span className="text-gray-500">Quantity Used:</span>
                           <span className="ml-1 font-medium">{currentJob.materialTotals.totalQuantityUsed}</span>
                         </div>
                         <div>
                           <span className="text-gray-500">Material Cost:</span>
                           <span className="ml-1 font-medium">{formatCurrency(currentJob.materialTotals.totalMaterialCost)}</span>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* Description */}
                   <div>
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">{currentJob.description || 'No description provided.'}</p>
                   </div>
                    {/* Assigned Users */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Assigned Team</h3>
                        {(currentJob.assignedUsers && currentJob.assignedUsers.length > 0) ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {currentJob.assignedUsers.map(assignment => (
                              <span key={assignment.user.id} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm flex items-center"><User className="h-3 w-3 mr-1 text-gray-500"/>{assignment.user.name}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-gray-500 italic">No team members assigned.</p>
                        )}
                    </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'materials' && currentJob && (
            <JobMaterials jobId={currentJob.id} />
          )}

          {activeTab === 'costs' && currentJob && ( // Pass currentJob.id safely
            <JobCosts jobId={currentJob.id} onCostChange={handleCostChange} />
          )}

          {activeTab === 'performance' && (
             <div className="text-center py-12 bg-gray-50 rounded-lg">
               <BarChart2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
               <h3 className="text-lg font-medium text-gray-700 mb-2">Performance Analytics</h3>
               <p className="text-gray-500">Performance tracking and analytics will be available here.</p>
             </div>
          )}

          {/* Audit Trail Tab */}
          {activeTab === 'audit' && currentJob && (
            <div className="border rounded-lg p-4 bg-white">
              <iframe 
                src={`about:blank`} // The audit history will be shown via the AuditButton, this is just a placeholder
                className="w-full h-96 border-0"
                style={{ height: '500px' }}
              >
                <AuditButton
                  entityType="JOB"
                  entityId={currentJob.id}
                  entityTitle={currentJob.title}
                  variant="primary"
                  buttonText="View Complete Audit History"
                  showIcon={true}
                />
              </iframe>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetails;