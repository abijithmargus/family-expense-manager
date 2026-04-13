import React, { useState } from 'react';
import { Plus, ReceiptText, PiggyBank, HandCoins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActionFAB = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const actions = [
        { label: 'Add Expense', icon: ReceiptText, color: 'bg-rose-500', onClick: () => navigate('/transactions?add=expense') },
        { label: 'Add Savings', icon: PiggyBank, color: 'bg-emerald-500', onClick: () => navigate('/savings?add=true') },
        { label: 'New Loan', icon: HandCoins, color: 'bg-primary-500', onClick: () => navigate('/loans?add=true') },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50 md:hidden">
            {/* Action Menu */}
            <div className={`flex flex-col gap-3 mb-4 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                {actions.map((action, i) => (
                    <div key={i} className="flex items-center justify-end gap-3 group">
                        <span className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {action.label}
                        </span>
                        <button
                            onClick={() => {
                                action.onClick();
                                setIsOpen(false);
                            }}
                            className={`${action.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-${action.color}/20 active:scale-90 transition-transform`}
                        >
                            <action.icon size={20} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Main Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-2xl shadow-primary-600/40 transition-all duration-300 ${isOpen ? 'rotate-45 bg-slate-800' : 'rotate-0'}`}
            >
                <Plus size={28} />
            </button>
        </div>
    );
};
