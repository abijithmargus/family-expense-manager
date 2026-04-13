import React from 'react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-background)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-500/30 focus:ring-primary-500",
    secondary: "bg-white/10 text-white hover:bg-white/20 border border-white/5 focus:ring-white/20",
    danger: "bg-danger-500 text-white hover:bg-danger-400 shadow-lg shadow-danger-500/30 focus:ring-danger-500",
    ghost: "text-slate-300 hover:text-white hover:bg-white/10 focus:ring-white/20",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
