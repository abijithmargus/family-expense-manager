import React, { forwardRef } from 'react';

export const Select = forwardRef(({ label, error, className = '', children, ...props }, ref) => {
  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
      <select
        ref={ref}
        className={`bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all appearance-none ${
          error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''
        }`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-danger-400 mt-1">{error}</span>}
    </div>
  );
});

Select.displayName = 'Select';
