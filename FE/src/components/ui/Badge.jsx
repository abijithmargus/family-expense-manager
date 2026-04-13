import React from 'react';

export const Badge = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    default: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
