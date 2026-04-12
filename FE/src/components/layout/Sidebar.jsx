import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, PiggyBank, HandCoins, CalendarClock, Target, LogOut, Wallet, Landmark } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/transactions', icon: ReceiptText, label: 'Transactions' },
    { to: '/savings', icon: PiggyBank, label: 'Savings' },
    { to: '/debts', icon: Landmark, label: 'Debts' },
    { to: '/loans', icon: HandCoins, label: 'Loans (Admin)' },
    { to: '/recurring', icon: CalendarClock, label: 'Recurring' },
    { to: '/budgets', icon: Target, label: 'Budgets' },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 w-64 bg-white/[0.02] backdrop-blur-xl border-r border-white/5 flex flex-col z-50 pointer-events-auto transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-16 shrink-0 items-center px-6 gap-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
          <Wallet size={18} className="text-primary-400" />
        </div>
        <span className="font-heading font-semibold text-lg text-white tracking-wide">Family Fin</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => {
              if (onClose) onClose();
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-primary-500/10 text-primary-400 shadow-sm border border-primary-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </div>
      <div className="p-4 border-t border-white/5">
        <button 
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
