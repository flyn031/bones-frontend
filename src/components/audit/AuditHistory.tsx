// src/components/audit/AuditHistory.tsx
import React, { useState, useEffect } from 'react';
import { auditApi, AuditHistory as AuditHistoryType } from '../../utils/auditApi';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import AuditTimeline from './AuditTimeline';
import LegalEvidenceModal from './LegalEvidenceModal';

interface AuditHistoryProps {
  entityType: 'QUOTE' | 'ORDER' | 'JOB';
  entityId: string;
  entityTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

const AuditHistory: React.FC<AuditHistoryProps> = ({
  entityType,
  entityId,
  entityTitle,
  isOpen,
  onClose
}) => {
  const [history, setHistory] = useState<AuditHistoryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLegalEvidence, setShowLegalEvidence] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AuditHistoryType | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, entityType, entityId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      switch (entityType) {
        case 'QUOTE':
          response = await auditApi.getQuoteHistory(entityId);
          break;
        case 'ORDER':
          response = await auditApi.getOrderHistory(entityId);
          break;
        case 'JOB':
          response = await auditApi.getJobHistory(entityId);
          break;
        default:
          throw new Error('Invalid entity type');
      }
      
      setHistory(response.data);
    } catch (err) {
      setError('Failed to load audit history');
      console.error('Error fetching audit history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEntryClick = (entry: AuditHistoryType) => {
    setSelectedEntry(entry);
  };

  const formatChangeType = (changeType: string) => {
    return changeType.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
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

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Audit History
              </h2>
              <p className="text-gray-600">
                {entityType} {entityTitle && `- ${entityTitle}`}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLegalEvidence(true)}
              >
                Generate Legal Evidence
              </Button>
              <Button variant="outline" onClick={fetchHistory}>
                Refresh
              </Button>
            </div>
          </div>

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

          {!loading && !error && history.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No audit history found</p>
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleEntryClick(entry)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(entry.changeType)}`}>
                          {formatChangeType(entry.changeType)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Version {entry.version}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-900 mb-1">
                        Changed by: <span className="font-medium">{entry.changedByUser.name}</span>
                      </p>
                      
                      {entry.changeReason && (
                        <p className="text-sm text-gray-600 mb-2">
                          Reason: {entry.changeReason}
                        </p>
                      )}
                      
                      {entry.customerApproved && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-green-600 text-sm">✓ Customer Approved</span>
                          {entry.approvalTimestamp && (
                            <span className="text-gray-500 text-xs">
                              at {new Date(entry.approvalTimestamp).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                      {entry.ipAddress && (
                        <p className="text-xs text-gray-400">
                          IP: {entry.ipAddress}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Timeline View Option */}
          {!loading && !error && history.length > 0 && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Timeline View</h3>
              <AuditTimeline history={history} />
            </div>
          )}
        </div>
      </Modal>

      {/* Legal Evidence Modal */}
      {showLegalEvidence && (
        <LegalEvidenceModal
          isOpen={showLegalEvidence}
          onClose={() => setShowLegalEvidence(false)}
          entityType={entityType}
          entityId={entityId}
          entityTitle={entityTitle}
        />
      )}

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <Modal 
          isOpen={!!selectedEntry} 
          onClose={() => setSelectedEntry(null)}
          size="lg"
        >
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">
              Change Details - Version {selectedEntry.version}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Change Type
                </label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getChangeTypeColor(selectedEntry.changeType)}`}>
                  {formatChangeType(selectedEntry.changeType)}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Changed By
                </label>
                <p className="text-sm text-gray-900">
                  {selectedEntry.changedByUser.name} ({selectedEntry.changedByUser.email})
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedEntry.createdAt).toLocaleString()}
                </p>
              </div>
              
              {selectedEntry.changeReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <p className="text-sm text-gray-900">{selectedEntry.changeReason}</p>
                </div>
              )}
              
              {selectedEntry.customerApproved && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Approval
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓ Approved</span>
                    {selectedEntry.approvalTimestamp && (
                      <span className="text-gray-500 text-sm">
                        at {new Date(selectedEntry.approvalTimestamp).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Snapshot
                </label>
                <pre className="text-xs bg-gray-100 p-3 rounded-md overflow-auto max-h-64">
                  {JSON.stringify(selectedEntry.data, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setSelectedEntry(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default AuditHistory;