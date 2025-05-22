// src/__mocks__/components/ui/index.ts
import React from 'react';

// Mock UI components
export const Button = ({ children, ...props }: any) => (
  <button {...props}>{children}</button>
);

export const Input = ({ ...props }: any) => <input {...props} />;

export const Alert = ({ message, ...props }: any) => (
  <div role="alert" {...props}>
    {message}
  </div>
);