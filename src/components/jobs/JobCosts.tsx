import { useState, useEffect } from 'react';
import { jobCostApi } from '../../utils/jobCostApi';
import { Plus, Edit, Trash2, FileText, Filter } from 'lucide-react';
import AddJobCostModal from './AddJobCostModal';
import EditJobCostModal from './EditJobCostModal';

interface JobCost {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  invoiced: boolean;
  material?: {
    id: string;
    name: string;
    code: string;
  };
  supplier?: {
    id: string;
    name: string;
  };
  attachmentUrl?: string;
  notes?: string;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface JobCostsProps {
  jobId: string;
  onCostChange?: () => void;
}

const JobCosts: React.FC<JobCostsProps> = ({ jobId, onCostChange }) => {
  const [costs, setCosts] = useState<JobCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCost, setEditingCost] = useState<JobCost | null>(null);
  const [error, setError] = useState('');
  
  // Filtering state
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchCosts = async () => {
    try {
      setLoading(true);
      const response = await jobCostApi.getJobCosts(jobId);
      setCosts(response.data as JobCost[]);
      setError('');
    } catch (err) {
      console.error('Error fetching job costs:', err);
      setError('Failed to load job costs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCosts();
  }, [jobId]);

  const handleAddCost = async (costData: any) => {
    try {
      await jobCostApi.addJobCost(jobId, costData);
      setShowAddModal(false);
      fetchCosts();
      if (onCostChange) onCostChange();
    } catch (err) {
      console.error('Error adding cost:', err);
      setError('Failed to add cost');
    }
  };

  const handleUpdateCost = async (costId: string, costData: any) => {
    try {
      await jobCostApi.updateJobCost(jobId, costId, costData);
      setEditingCost(null);
      fetchCosts();
      if (onCostChange) onCostChange();
    } catch (err) {
      console.error('Error updating cost:', err);
      setError('Failed to update cost');
    }
  };

  const handleDeleteCost = async (costId: string) => {
    if (window.confirm('Are you sure you want to delete this cost?')) {
      try {
        await jobCostApi.deleteJobCost(jobId, costId);
        fetchCosts();
        if (onCostChange) onCostChange();
      } catch (err) {
        console.error('Error deleting cost:', err);
        setError('Failed to delete cost');
      }
    }
  };

  const handleToggleInvoiced = async (costId: string, currentStatus: boolean) => {
    try {
      await jobCostApi.markCostAsInvoiced(jobId, costId, !currentStatus);
      fetchCosts();
    } catch (err) {
      console.error('Error updating invoiced status:', err);
      setError('Failed to update invoice status');
    }
  };

  const getTotalCosts = () => {
    return costs.reduce((sum, cost) => sum + cost.amount, 0);
  };

  const getCategoryTotals = () => {
    const totals: Record<string, number> = {};
    costs.forEach(cost => {
      if (!totals[cost.category]) totals[cost.category] = 0;
      totals[cost.category] += cost.amount;
    });
    return totals;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  // Filter costs based on category and search term
  const filteredCosts = costs.filter(cost => {
    const matchesCategory = categoryFilter === 'all' || cost.category === categoryFilter;
    const matchesSearch = searchTerm === '' || 
                          cost.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (cost.material?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (cost.supplier?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(costs.map(cost => cost.category)));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Job Costs</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Cost
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded border">
          <div className="font-medium mb-2">Total Costs</div>
          <div className="text-2xl font-bold">{formatCurrency(getTotalCosts())}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded border">
          <div className="font-medium mb-2">Cost Breakdown</div>
          <div className="space-y-1">
            {Object.entries(getCategoryTotals()).map(([category, total]) => (
              <div key={category} className="flex justify-between">
                <span>{category}</span>
                <span className="font-semibold">{formatCurrency(total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2 text-gray-500" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded p-2"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search costs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading costs...</div>
      ) : costs.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No costs have been added to this job yet.
        </div>
      ) : filteredCosts.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No costs match your filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoiced
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCosts.map((cost) => (
                <tr key={cost.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{cost.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100">{cost.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(cost.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(cost.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {cost.material && (
                        <div>Item: {cost.material.name}</div>
                      )}
                      {cost.supplier && (
                        <div>Supplier: {cost.supplier.name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={cost.invoiced}
                      onChange={() => handleToggleInvoiced(cost.id, cost.invoiced)}
                      className="h-4 w-4 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {cost.attachmentUrl && (
                        <a 
                          href={cost.attachmentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-gray-700"
                          title="View Attachment"
                        >
                          <FileText className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => setEditingCost(cost)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Cost"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCost(cost.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Cost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddJobCostModal
          jobId={jobId}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddCost}
        />
      )}

      {editingCost && (
        <EditJobCostModal
          cost={editingCost}
          onClose={() => setEditingCost(null)}
          onSubmit={(costData) => handleUpdateCost(editingCost.id, costData)}
        />
      )}
    </div>
  );
};

export default JobCosts;