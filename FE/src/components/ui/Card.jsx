import React from 'react';

export const Card = ({ children, className = '', padding = 'p-6', ...props }) => {
  return (
    <div className={`glass-card ${padding} ${className}`} {...props}>
      {children}
    </div>
  );
};
