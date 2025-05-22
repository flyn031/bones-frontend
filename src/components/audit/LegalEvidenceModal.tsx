// src/components/audit/LegalEvidenceModal.tsx
import React, { useState } from 'react';
import { auditApi, LegalEvidencePackage } from '../../utils/auditApi';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface LegalEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'QUOTE' | 'ORDER' | 'JOB';
  entityId: string;
  entityTitle?: string;
}

const LegalEvidenceModal: React.FC<LegalEvidenceModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityTitle
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<LegalEvidencePackage | null>(null);
  const [format, setFormat] = useState<'JSON' | 'PDF'>('PDF');
  const [includeDocuments, setIncludeDocuments] = useState(true);

  const generateEvidence = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await auditApi.getLegalEvidencePackage({
        entityType,
        entityId,
        includeDocuments,
        format
      });
      
      setEvidence(response.data);
      
      // If PDF format, open in new tab immediately after generation
      if (format === 'PDF' && response.data.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
      }
    } catch (err) {
      setError('Failed to generate legal evidence package');
      console.error('Error generating legal evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadEvidence = () => {
    if (!evidence || !evidence.downloadUrl) return;
    
    // Simple download approach - always open in new tab
    window.open(evidence.downloadUrl, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Legal Evidence Package</h2>
        
        <p className="text-gray-600 mb-6">
          Generate a legally admissible evidence package for {entityType.toLowerCase()} 
          {entityTitle ? ` - ${entityTitle}` : ''}
        </p>
        
        {!evidence && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="PDF"
                      checked={format === 'PDF'}
                      onChange={() => setFormat('PDF')}
                      className="h-4 w-4 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="ml-2 text-gray-700">PDF (Court-Ready)</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="JSON"
                      checked={format === 'JSON'}
                      onChange={() => setFormat('JSON')}
                      className="h-4 w-4 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="ml-2 text-gray-700">JSON (Technical)</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={includeDocuments}
                    onChange={() => setIncludeDocuments(!includeDocuments)}
                    className="h-4 w-4 text-brand-500 focus:ring-brand-500 rounded"
                  />
                  <span className="ml-2 text-gray-700">Include supporting documents</span>
                </label>
                <p className="text-xs text-gray-500 ml-6 mt-1">
                  Includes all attachments, signatures, and related files
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={generateEvidence} 
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Package'}
              </Button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
            <p className="text-red-800">{error}</p>
            <div className="mt-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setError(null)}>
                Try Again
              </Button>
            </div>
          </div>
        )}
        
        {evidence && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800 font-medium">
                Evidence package generated successfully!
              </p>
              <p className="text-sm text-green-700 mt-1">
                Generated at: {new Date(evidence.generatedAt).toLocaleString()}
              </p>
              <p className="text-sm text-green-700 mt-2">
                Your PDF has been opened in a new tab. If you don't see it, check your browser's popup settings.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Package Contents</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Timeline Events</p>
                  <p className="text-sm text-gray-600">{evidence.timeline?.length || 0} tracked changes</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Supporting Documents</p>
                  <p className="text-sm text-gray-600">{evidence.documents?.length || 0} documents included</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Digital Signatures</p>
                  <p className="text-sm text-gray-600">{evidence.signatures?.length || 0} verified signatures</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-3">
              <Button 
                onClick={downloadEvidence}
                className="w-full md:w-auto"
              >
                Open PDF Again
              </Button>
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LegalEvidenceModal;