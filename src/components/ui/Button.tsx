import React from 'react';

// Base Button Component - FIXED with missing variants
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link' | 'default';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500',
    secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500',
    outline: 'border border-neutral-300 text-neutral-900 hover:bg-neutral-100 focus:ring-brand-500',
    ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus:ring-brand-500',
    destructive: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    // ADDED missing variants:
    link: 'text-blue-600 hover:text-blue-800 underline-offset-4 hover:underline focus:ring-blue-500 bg-transparent',
    default: 'bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50 focus:ring-brand-500'
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${widthClass} 
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;