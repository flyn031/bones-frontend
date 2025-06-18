// src/components/audit/AuditDashboard.tsx
import React, { useState, useEffect } from 'react';
import { auditApi, AuditHistory, AuditStatistics } from '../../utils/auditApi';
import { AuditEntityType } from '../../types/audit';
import { Calendar, Search, Filter, Download, AlertTriangle, FileText, Briefcase, ShoppingCart, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import AuditTimeline from './AuditTimeline';
import LegalEvidenceModal from './LegalEvidenceModal';

const AuditDashboard: React.FC = () => {
  const [auditHistory, setAuditHistory] = useState<AuditHistory[]>([]);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLegalEvidence, setShowLegalEvidence] = useState(false);
  const [searchParams, setSearchParams] = useState({
    entityType: '',
    entityId: '',
    changeType: '',
    changedBy: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 50
  });
  const [selectedEntity, setSelectedEntity] = useState<{
    type: AuditEntityType;
    id: string;
    title?: string;
  } | null>(null);

  useEffect(() => {
    fetchAuditHistory();
    fetchStatistics();
  }, [searchParams.page]);

  const fetchAuditHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert string to proper enum type, filtering out empty strings
      const apiParams = {
        ...searchParams,
        entityType: searchParams.entityType ? (searchParams.entityType as AuditEntityType) : undefined
      };
      
      const response = await auditApi.searchAuditHistory(apiParams);
      
      console.log('Audit history fetched:', response.data);
      
      // Handle the complex response structure - same pattern as materials
      let auditArray: any[] = [];
      
      if (response.data) {
        const responseData = response.data as any;
        // Try different possible array locations in the response
        if (Array.isArray(responseData.auditHistory)) {
          auditArray = responseData.auditHistory;
        } else if (Array.isArray(responseData.items)) {
          auditArray = responseData.items;
        } else if (Array.isArray(responseData.data)) {
          auditArray = responseData.data;
        } else if (Array.isArray(responseData.results)) {
          auditArray = responseData.results;
        } else if (Array.isArray(responseData)) {
          auditArray = responseData;
        }
        
        console.log('Using audit array:', auditArray);
        setAuditHistory(auditArray);
      } else {
        setAuditHistory([]);
      }
    } catch (err) {
      setError('Failed to load audit history');
      console.error('Error fetching audit history:', err);
      setAuditHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const params = {
        entityType: searchParams.entityType ? (searchParams.entityType as AuditEntityType) : undefined,
        dateFrom: searchParams.dateFrom,
        dateTo: searchParams.dateTo
      };
      
      const response = await auditApi.getAuditStatistics(params);
      setStatistics(response.data);
    } catch (err) {
      console.error('Error fetching audit statistics:', err);
      // Don't set error state for statistics, as it's not critical
    }
  };

  const handleSearch = () => {
    setSearchParams({ ...searchParams, page: 1 }); // Reset to page 1 on new search
    fetchAuditHistory();
    fetchStatistics();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setSearchParams({
      entityType: '',
      entityId: '',
      changeType: '',
      changedBy: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
      limit: 50
    });
    
    fetchAuditHistory();
    fetchStatistics();
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => ({ ...prev, page: newPage }));
  };

  const formatChangeType = (changeType: string) => {
    return changeType.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'QUOTE':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'ORDER':
        return <ShoppingCart className="h-4 w-4 text-purple-500" />;
      case 'JOB':
        return <Briefcase className="h-4 w-4 text-green-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    const colors: Record<string, string> = {
      'CREATE': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800',
      'STATUS_CHANGE': 'bg-purple-100 text-purple-800',
      'APPROVED': 'bg-emerald-100 text-emerald-800',
      'REJECTED': 'bg-orange-100 text-orange-800',
      'CLONE': 'bg-indigo-100 text-indigo-800',
      'CONVERT': 'bg-cyan-100 text-cyan-800',
      'MATERIAL_ADDED': 'bg-teal-100 text-teal-800',
      'MATERIAL_REMOVED': 'bg-red-100 text-red-800',
      'MATERIAL_UPDATED': 'bg-yellow-100 text-yellow-800'
    };
    
    return colors[changeType] || 'bg-gray-100 text-gray-800';
  };

  const handleLegalEvidenceClick = (entity: { type: AuditEntityType, id: string, title?: string }) => {
    setSelectedEntity(entity);
    setShowLegalEvidence(true);
  };

  // Group by entity for timeline view - work with existing API structure
  const groupedByEntity = auditHistory.reduce((groups: Record<string, AuditHistory[]>, item) => {
    // Try to extract entity info from the data property or use a generic approach
    let entityId = '';
    let entityType = 'UNKNOWN';
    
    // Check if data contains entity-specific information
    if (item.data && typeof item.data === 'object') {
      entityId = item.data.quoteId || item.data.orderId || item.data.jobId || item.data.id || item.id;
      if (item.data.quoteId) entityType = 'QUOTE';
      else if (item.data.orderId) entityType = 'ORDER';
      else if (item.data.jobId) entityType = 'JOB';
    }
    
    // Fallback to item ID if no specific entity ID found
    if (!entityId) entityId = item.id;
    
    const key = `${entityId}-${entityType}`;
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});

  return (
    <div className="p-6 max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Audit History Dashboard</h1>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowLegalEvidence(true)}
            className="flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Generate Legal Evidence
          </Button>
          <Button
            variant="outline"
            onClick={handleSearch}
            className="flex items-center"
          >
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </div>

      {/* Statistics Section */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Total Changes</p>
                <p className="text-2xl font-bold">{statistics.totalChanges}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Quotes</p>
                <p className="text-2xl font-bold">{statistics.changesByType?.QUOTE || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Orders</p>
                <p className="text-2xl font-bold">{statistics.changesByType?.ORDER || 0}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Jobs</p>
                <p className="text-2xl font-bold">{statistics.changesByType?.JOB || 0}</p>
              </div>
              <Briefcase className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 border mb-6">
        <div className="flex items-center mb-2">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-medium">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              name="entityType"
              value={searchParams.entityType}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Entities</option>
              <option value="QUOTE">Quotes</option>
              <option value="ORDER">Orders</option>
              <option value="JOB">Jobs</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity ID
            </label>
            <input
              type="text"
              name="entityId"
              value={searchParams.entityId}
              onChange={handleInputChange}
              placeholder="Enter entity ID"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Change Type
            </label>
            <select
              name="changeType"
              value={searchParams.changeType}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Changes</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="STATUS_CHANGE">Status Change</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CLONE">Clone</option>
              <option value="CONVERT">Convert</option>
              <option value="MATERIAL_ADDED">Material Added</option>
              <option value="MATERIAL_UPDATED">Material Updated</option>
              <option value="MATERIAL_REMOVED">Material Removed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Changed By
            </label>
            <input
              type="text"
              name="changedBy"
              value={searchParams.changedBy}
              onChange={handleInputChange}
              placeholder="Enter user name or ID"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="date"
                name="dateFrom"
                value={searchParams.dateFrom}
                onChange={handleInputChange}
                className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="date"
                name="dateTo"
                value={searchParams.dateTo}
                onChange={handleInputChange}
                className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-4 space-x-3">
          <Button
            variant="outline"
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
          <Button
            onClick={handleSearch}
            className="flex items-center"
          >
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 border">
        <h2 className="text-lg font-medium mb-4">Audit History Results</h2>
        
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {!loading && !error && auditHistory.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No audit history found with the selected filters</p>
          </div>
        )}
        
        {!loading && !error && auditHistory.length > 0 && (
          <div className="space-y-6">
            {/* Table View */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change Type
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Version
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Changed By
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditHistory.map((entry) => {
                    // Determine entity type and ID with existing API structure
                    let entityType: AuditEntityType = 'JOB';
                    let entityId: string = entry.id;
                    
                    // Try to extract from data property
                    if (entry.data && typeof entry.data === 'object') {
                      if (entry.data.quoteId) {
                        entityType = 'QUOTE';
                        entityId = String(entry.data.quoteId);
                      } else if (entry.data.orderId) {
                        entityType = 'ORDER';
                        entityId = String(entry.data.orderId);
                      } else if (entry.data.jobId) {
                        entityType = 'JOB';
                        entityId = String(entry.data.jobId);
                      }
                    }
                    
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {getEntityIcon(entityType)}
                            <span className="ml-2 text-sm text-gray-900">
                              {entityType} #{entityId.substring(0, 8)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getChangeTypeColor(entry.changeType)}`}>
                            {formatChangeType(entry.changeType)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {entry.version}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{entry.changedByUser.name}</div>
                          <div className="text-xs text-gray-500">{entry.changedByUser.email}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLegalEvidenceClick({
                              type: entityType,
                              id: entityId,
                              title: `${entityType} #${entityId.substring(0, 8)}`
                            })}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Evidence
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing {auditHistory.length} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(searchParams.page - 1)}
                  disabled={searchParams.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(searchParams.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
            
            {/* Timeline View by Entity */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Timeline View by Entity</h3>
              
              {Object.entries(groupedByEntity).map(([key, historyItems]) => {
                const [entityId, entityType] = key.split('-');
                return (
                  <div key={key} className="mb-8 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        {getEntityIcon(entityType)}
                        <h4 className="ml-2 text-md font-medium">
                          {entityType} #{entityId.substring(0, 8)}
                        </h4>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLegalEvidenceClick({
                          type: entityType as AuditEntityType,
                          id: entityId,
                          title: `${entityType} #${entityId.substring(0, 8)}`
                        })}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Evidence Package
                      </Button>
                    </div>
                    <AuditTimeline history={historyItems} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legal Evidence Modal */}
      {showLegalEvidence && selectedEntity && (
        <LegalEvidenceModal
          isOpen={showLegalEvidence}
          onClose={() => setShowLegalEvidence(false)}
          entityType={selectedEntity.type}
          entityId={selectedEntity.id}
          entityTitle={selectedEntity.title}
        />
      )}
    </div>
  );
};

export default AuditDashboard;