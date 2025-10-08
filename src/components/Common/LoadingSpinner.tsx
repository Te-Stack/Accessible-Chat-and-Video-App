// components/Common/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'medium' 
}) => {
  return (
    <div className={`loading-container loading-${size}`} role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true"></div>
      <span className="loading-message">{message}</span>
    </div>
  );
};