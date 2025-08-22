import React from 'react';
import { XCircle } from 'lucide-react';

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'xl' | string;  // ADDED: Missing size property
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
  size = 'medium'  // ADDED: Default size
}) => {
  if (!isOpen) return null;

  // ADDED: Size classes mapping
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'small':
        return 'max-w-md';
      case 'large':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      case 'medium':
      default:
        return 'max-w-lg';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-neutral-900 bg-opacity-50 transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        className={`
          relative w-full ${getSizeClasses(size)} mx-auto my-6 
          transform transition-all duration-300 ease-in-out
          ${className}
        `}
      >
        <div 
          className="
            relative flex flex-col w-full 
            bg-white rounded-xl shadow-medium 
            outline-none focus:outline-none
          "
        >
          {/* Header */}
          <div 
            className="
              flex items-start justify-between 
              p-6 border-b border-neutral-200 
              rounded-t-xl
            "
          >
            <h3 className="text-xl font-semibold text-neutral-900">
              {title}
            </h3>
            <button
              className="
                text-neutral-400 hover:text-neutral-600 
                transition-colors focus:outline-none
              "
              onClick={onClose}
              aria-label="Close"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          
          {/* Body */}
          <div className="relative p-6 flex-auto">
            {children}
          </div>
          
          {/* Footer */}
          {footer && (
            <div 
              className="
                flex items-center justify-end 
                p-6 border-t border-neutral-200 
                rounded-b-xl
              "
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;