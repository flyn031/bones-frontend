// src/components/audit/AuditTimeline.tsx
import React, { useState } from 'react'; // Added useState
import { AuditHistory } from '../../utils/auditApi'; // Assuming AuditHistory type is correct

interface AuditTimelineProps {
  history: AuditHistory[];
  entityTitle?: string; // Added from the second version
}

const AuditTimeline: React.FC<AuditTimelineProps> = ({ history, entityTitle }) => {
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null); // Added from the second version

  // Sort history by createdAt date
  const sortedHistory = [...history].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const formatChangeType = (changeType: string) => {
    return changeType.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getChangeTypeColor = (changeType: string) => {
    // Icons and colors for different change types
    const colors: Record<string, { bg: string, text: string, icon: string }> = {
      'CREATE': { bg: 'bg-green-100', text: 'text-green-800', icon: '✏️' },
      'UPDATE': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🔄' },
      'DELETE': { bg: 'bg-red-100', text: 'text-red-800', icon: '🗑️' },
      'STATUS_CHANGE': { bg: 'bg-purple-100', text: 'text-purple-800', icon: '📊' },
      'APPROVED': { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '✅' },
      'REJECTED': { bg: 'bg-orange-100', text: 'text-orange-800', icon: '❌' },
      'CLONE': { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: '🧬' },
      'CONVERT': { bg: 'bg-cyan-100', text: 'text-cyan-800', icon: '🔄' }, // Assuming CONVERT might use same icon as UPDATE
      'MATERIAL_ADDED': { bg: 'bg-teal-100', text: 'text-teal-800', icon: '➕' },
      'MATERIAL_REMOVED': { bg: 'bg-red-100', text: 'text-red-800', icon: '➖' },
      'MATERIAL_UPDATED': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '📝' }
      // Add other change types if needed
    };

    return colors[changeType] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📄' };
  };

  // Try to extract entity title from entry data or use IDs - Added from the second version
  const getEntityTitle = (entry: AuditHistory) => {
    // Check common fields in the 'data' payload first
    try {
      // Assuming 'data' might contain various title-like properties
      if ('data' in entry && typeof entry.data === 'object' && entry.data !== null) {
        const data = entry.data as any; // Use 'any' or a more specific type if you know the structure
        if (data.title) return data.title;
        if (data.projectTitle) return data.projectTitle;
        if (data.quoteReference) return data.quoteReference;
        if (data.quoteNumber) return data.quoteNumber;
        if (data.name) return data.name; // Common for materials/items
        // Add other potential title fields from your audit data structure if needed
      }
    } catch (e) {
      // Ignore parsing errors or unexpected data structures
       console.warn("Error extracting entity title from audit entry data:", e); // Use warn as it might be expected for some entries
    }

    // Fallback: Use known ID fields if available and slice for brevity
    // Adjust substring length as needed
    if ('quoteId' in entry && entry.quoteId) return `Quote #${String(entry.quoteId).substring(0, 8)}`;
    if ('orderId' in entry && entry.orderId) return `Order #${String(entry.orderId).substring(0, 8)}`;
    if ('jobId' in entry && entry.jobId) return `Job #${String(entry.jobId).substring(0, 8)}`;
     if ('materialId' in entry && entry.materialId) return `Material #${String(entry.materialId).substring(0, 8)}`; // Added materialId check

    // Final fallback: Use the prop or a default generic title
    return entityTitle || 'Unknown Entity';
  };


  // Toggle detail visibility - Added from the second version
  const toggleEntryDetails = (entryId: string) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId);
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

      {/* Timeline items */}
      <ul className="space-y-6">
        {sortedHistory.map((entry, index) => {
          const { bg, text, icon } = getChangeTypeColor(entry.changeType);
          const entryTitle = getEntityTitle(entry); // Use the dynamic title

          return (
            <li key={entry.id} className="relative pl-14">
              {/* Timeline marker */}
              <div className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center ${bg} ${text}`}>
                <span className="text-lg" role="img" aria-label={entry.changeType}>
                  {icon}
                </span>
              </div>

              {/* Content */}
              <div className="border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${bg} ${text} mb-2`}>
                      {formatChangeType(entry.changeType)}
                    </span>
                    <h4 className="text-sm font-medium text-gray-900">
                       {entryTitle} - Version {entry.version} {/* Using dynamic title */}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>

                <p className="text-sm text-gray-700 mt-2">
                  {entry.changedByUser.name} {entry.changeType === 'CREATE' ? `created ${entryTitle}` : `made changes to ${entryTitle}`} {/* Updated text for clarity */}
                </p>

                {entry.changeReason && (
                  <p className="text-xs text-gray-600 mt-1">
                    <span className="font-medium">Reason:</span> {entry.changeReason}
                  </p>
                )}

                {entry.customerApproved && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                    <span>✓ Customer Approved</span>
                    {entry.approvalTimestamp && (
                      <span className="text-gray-500">
                        at {new Date(entry.approvalTimestamp).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Additional information for specific change types */}
                {/* Display material changes if present and is an array with content */}
                {'materialChanges' in entry && Array.isArray(entry.materialChanges) && entry.materialChanges.length > 0 && (
                   <div className="mt-2 text-xs text-gray-700">
                     <span className="font-medium">Material Changes:</span>
                     <pre className="mt-1 bg-gray-50 p-2 rounded text-xs overflow-auto max-h-24">
                       {JSON.stringify(entry.materialChanges, null, 2)}
                     </pre>
                   </div>
                 )}

                {/* Display progress notes if present and is a string */}
                {'progressNotes' in entry && entry.progressNotes && typeof entry.progressNotes === 'string' && (
                  <div className="mt-2 text-xs text-gray-700">
                    <span className="font-medium">Progress Notes:</span>
                    <p className="mt-1 bg-gray-50 p-2 rounded">{entry.progressNotes}</p>
                  </div>
                )}

                {/* Expandable details button - Added from the second version */}
                <button
                   onClick={() => toggleEntryDetails(entry.id)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                >
                  {expandedEntry === entry.id ? 'Hide Details' : 'View Details'}
                  {/* Simple Chevron Icon */}
                  <svg className={`ml-1 h-4 w-4 transition-transform ${expandedEntry === entry.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded details content - Added from the second version */}
                {expandedEntry === entry.id && (
                  <div className="mt-3 text-xs border-t pt-3">
                    <h5 className="font-medium text-gray-700 mb-1">Data Snapshot:</h5>
                    {/* Check if entry.data is an object or array before stringifying */}
                    {typeof entry.data === 'object' && entry.data !== null ? (
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64">
                        {JSON.stringify(entry.data, null, 2)}
                      </pre>
                    ) : (
                       <p className="bg-gray-50 p-2 rounded text-xs">No detailed data available.</p>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AuditTimeline;