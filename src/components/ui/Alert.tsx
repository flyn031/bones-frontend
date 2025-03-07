import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  XCircle 
} from 'lucide-react';

// Alert Component
interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  message,
  className = ''
}) => {
  const alertConfig = {
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-500'
    },
    success: {
      icon: CheckCircle2,
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      iconColor: 'text-green-500'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-500'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      iconColor: 'text-red-500'
    }
  };

  const { icon: Icon, bgColor, textColor, borderColor, iconColor } = alertConfig[type];

  return (
    <div 
      className={`
        flex items-start p-4 rounded-lg border 
        ${bgColor} ${textColor} ${borderColor} 
        ${className}
      `}
      role="alert"
    >
      <Icon className={`w-5 h-5 mr-3 ${iconColor} flex-shrink-0`} />
      <div>
        {title && <div className="font-medium mb-1">{title}</div>}
        <div className="text-sm">{message}</div>
      </div>
    </div>
  );
};

export default Alert;