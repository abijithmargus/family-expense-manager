import React from 'react';
import { Menu, Bell } from 'lucide-react';

export const Header = ({ onMenuClick }) => {
  return (
    <header className="h-16 lg:pl-64 border-b border-white/5 bg-white/[0.01] backdrop-blur-xl fixed top-0 w-full z-30 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
        {/* Page Title could go here based on route */}
        <h1 className="text-xl font-heading font-semibold text-white">Dashboard</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger-500"></span>
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 sm:flex hidden items-center justify-center text-white text-sm font-medium ring-2 ring-white/10 cursor-pointer">
          A
        </div>
      </div>
    </header>
  );
};
