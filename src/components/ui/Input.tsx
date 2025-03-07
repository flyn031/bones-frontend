import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ElementType;
  rightIcon?: React.ElementType;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  type = 'text',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordInput = type === 'password';

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const adjustedType = isPasswordInput 
    ? (showPassword ? 'text' : 'password') 
    : type;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={props.id} 
          className="block text-sm font-medium text-neutral-700 mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIcon className="h-5 w-5 text-neutral-400" />
          </div>
        )}
        <input
          type={adjustedType}
          className={`
            block w-full rounded-md 
            ${LeftIcon ? 'pl-10' : 'pl-3'} 
            ${isPasswordInput || RightIcon ? 'pr-10' : 'pr-3'} 
            py-2 
            border 
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:border-brand-500 focus:ring-brand-500'}
            text-sm
            ${className}
          `}
          {...props}
        />
        {(isPasswordInput || RightIcon) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isPasswordInput ? (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="text-neutral-400 hover:text-neutral-600 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            ) : RightIcon ? (
              <RightIcon className="h-5 w-5 text-neutral-400" />
            ) : null}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" id={`${props.id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;