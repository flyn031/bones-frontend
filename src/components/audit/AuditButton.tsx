// src/components/audit/AuditButton.tsx
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import AuditHistory from './AuditHistory';

interface AuditButtonProps {
  entityType: 'QUOTE' | 'ORDER' | 'JOB';
  entityId: string;
  entityTitle?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  buttonText?: string;
  showIcon?: boolean;
  className?: string;
}

const AuditButton: React.FC<AuditButtonProps> = ({
  entityType,
  entityId,
  entityTitle,
  variant = 'outline',
  size = 'sm',
  buttonText = 'View History',
  showIcon = true,
  className = ''
}) => {
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsAuditModalOpen(true)}
        className={className}
      >
        {showIcon && (
          <svg 
            className="w-4 h-4 mr-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        )}
        {buttonText}
      </Button>

      <AuditHistory
        entityType={entityType}
        entityId={entityId}
        entityTitle={entityTitle}
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </>
  );
};

export default AuditButton;