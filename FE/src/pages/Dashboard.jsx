import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { useDashboardSummary, useUsers, useLoans } from '../hooks/useApi';
import { IndianRupee, TrendingUp, TrendingDown, PiggyBank, HandCoins, Filter, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Button } from '../components/ui/Button';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ title, amount, icon: Icon, trend }) => (
  <Card className="flex flex-col gap-4">
    <div className="flex justify-between items-start">
      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
        <Icon size={24} className="text-primary-400" />
      </div>
      {trend && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div>
      <p className="text-sm text-slate-400 font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-white flex items-center">
        <IndianRupee size={20} className="mr-1" />
        {amount.toLocaleString('en-IN')}
      </h3>
    </div>
  </Card>
);

export const Dashboard = () => {
  const [filters, setFilters] = useState({ 
      month: '', 
      user_id: '',
      start_date: '',
      end_date: '',
      users: [], 
      type: '',
      purpose: '',
      loan_id: ''
  });

  const [activeFilters, setActiveFilters] = useState({ ...filters });
  const [error, setError] = useState(null);
  
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useDashboardSummary({
      ...activeFilters,
      users: activeFilters.users.join(',')
  });
  
  const { data: familyUsers = [] } = useUsers();
  const { data: activeLoans = [] } = useLoans();

  if (isLoading) {
    return <div className="text-white animate-pulse flex flex-col items-center justify-center py-20">Loading advanced dashboard charts natively from Postgres...</div>;
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }
  
  const toggleUserFilter = (id) => {
    setFilters(prev => ({
      ...prev,
      users: prev.users.includes(id) 
        ? prev.users.filter(u => u !== id)
        : [...prev.users, id]
    }));
  };

  const applyFilters = () => {
    // Validation
    if (filters.start_date && filters.end_date) {
        if (new Date(filters.start_date) > new Date(filters.end_date)) {
            setError("End date cannot be earlier than start date.");
            return;
        }
    }
    setError(null);
    setActiveFilters({ ...filters });
  };

  const clearFilters = () => {
    const reset = { month: '', user_id: '', start_date: '', end_date: '', users: [], type: '', purpose: '', loan_id: '' };
    setFilters(reset);
    setActiveFilters(reset);
    setError(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-white">Finance Pulse</h2>
          <p className="text-slate-400 text-sm hidden md:block">Real-time health of your family's capital.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
            <Button 
              variant="ghost" 
              onClick={() => setShowFilters(!showFilters)} 
              className={`flex-1 md:flex-none h-10 gap-2 ${showFilters ? 'bg-primary-500/20 text-primary-400' : 'text-slate-400 border border-white/5'}`}
            >
                <Filter size={18} /> <span className="text-sm">Deep Filters</span>
            </Button>
            
            <div className="relative flex-1 md:flex-none">
              <select 
                name="month"
                value={filters.month}
                onChange={handleFilterChange}
                className="w-full bg-white/5 border border-white/5 text-slate-200 text-sm rounded-xl h-10 px-3 outline-none appearance-none cursor-pointer hover:bg-white/10 transition-colors"
              >
                <option value="">All Time</option>
                <option value="2025-01">Jan 2025</option>
                <option value="2025-02">Feb 2025</option>
                <option value="2025-03">Mar 2025</option>
                <option value="2025-04">Apr 2025</option>
                <option value="2025-05">May 2025</option>
              </select>
            </div>
        </div>
      </div>
      
      {/* Collapsible Advanced Filters */}
      {showFilters && (
        <Card className="z-20 relative bg-[#0f172a]/95 backdrop-blur-xl border border-primary-500/20 rounded-2xl mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
            <div>
                <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-3 block">Timeline Isolation</label>
                <div className="grid grid-cols-2 gap-3">
                    <input type="date" className="bg-white/5 border border-white/5 rounded-xl p-3 text-white w-full text-xs outline-none focus:border-primary-500/50 transition-colors" value={filters.start_date} onChange={e => setFilters({...filters, start_date: e.target.value})} title="Start Date" />
                    <input type="date" className="bg-white/5 border border-white/5 rounded-xl p-3 text-white w-full text-xs outline-none focus:border-primary-500/50 transition-colors" value={filters.end_date} onChange={e => setFilters({...filters, end_date: e.target.value})} title="End Date" />
                </div>
            </div>

            <div>
                <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-3 block">Modalities</label>
                <div className="grid grid-cols-2 gap-3">
                    <select className="bg-white/5 border border-white/5 rounded-xl p-3 text-white w-full text-xs outline-none" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
                        <option value="">Global Array</option>
                        <option value="income">Inflow</option>
                        <option value="expense">Outflow</option>
                        <option value="transfer">P2P</option>
                    </select>
                    <select className="bg-white/5 border border-white/5 rounded-xl p-3 text-white w-full text-xs outline-none capitalize" value={filters.purpose} onChange={e => setFilters({...filters, purpose: e.target.value})}>
                        <option value="">Any Purpose</option>
                        <option value="normal">Normal</option>
                        <option value="loan_payment">Loan Sub</option>
                        <option value="savings_contribution">Savings</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-3 block">Targeted Debt</label>
                <select className="bg-white/5 border border-white/5 rounded-xl p-3 text-white w-full text-xs outline-none" value={filters.loan_id} onChange={e => setFilters({...filters, loan_id: e.target.value})}>
                    <option value="">All Streams</option>
                    {activeLoans.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                </select>
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-3 border-t border-white/5 pt-4">
                <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-4 block">Identity Isolation (Family Layer)</label>
                <div className="flex flex-wrap gap-2">
                    {familyUsers.map(user => (
                        <button
                            key={user.id}
                            onClick={() => toggleUserFilter(user.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border ${filters.users.includes(user.id) ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/40' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'}`}
                        >
                            {user.name}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                    <X size={14} /> {error}
                </div>
            )}

            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-between items-center mt-2 border-t border-white/5 pt-6">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-white text-xs">
                    Clear Workspace
                </Button>
                <Button onClick={applyFilters} className="bg-primary-500 hover:bg-primary-400 text-white px-8 rounded-xl h-11 text-sm font-bold shadow-xl shadow-primary-500/20">
                    Apply Filter Array
                </Button>
            </div>
        </Card>
      )}
      
      {/* Wealth Ribbon - Horizontal Scroller on Mobile, Grid on Desktop */}
      <div className="-mx-4 px-4 pb-4 overflow-x-auto no-scrollbar scroll-smooth flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 snap-x snap-mandatory">
        <div className="min-w-[280px] md:min-w-0 snap-center">
          <StatCard title="Income Flow" amount={data.totalIncome} icon={TrendingUp} padding="p-5" />
        </div>
        <div className="min-w-[280px] md:min-w-0 snap-center">
          <StatCard title="Expense Flow" amount={data.totalExpense} icon={TrendingDown} padding="p-5" />
        </div>
        <div className="min-w-[280px] md:min-w-0 snap-center">
          <StatCard title="Net Balance" amount={data.netBalance} icon={IndianRupee} padding="p-5" />
        </div>
        <div className="min-w-[280px] md:min-w-0 snap-center">
          <StatCard title="Total Savings" amount={data.totalSavingsBalance} icon={PiggyBank} padding="p-5" />
        </div>
        <div className="min-w-[280px] md:min-w-0 snap-center">
          <StatCard title="Lent Capital" amount={data.totalDebtLent} icon={TrendingUp} padding="p-5" />
        </div>
        <div className="min-w-[280px] md:min-w-0 snap-center">
          <StatCard title="Borrowed Debt" amount={data.totalDebtBorrowed} icon={TrendingDown} padding="p-5" />
        </div>
        <div className="min-w-[280px] md:min-w-0 snap-center lg:col-span-2">
          <StatCard title="Active Loans Balance" amount={data.totalLoanRemaining} icon={HandCoins} padding="p-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <Card padding="p-4 md:p-6" className="h-80 md:h-[450px] flex flex-col border border-white/5 bg-[var(--color-surface)] shadow-2xl">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Velocity Distro</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {data.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="p-4 md:p-6" className="h-80 md:h-[450px] flex flex-col border border-white/5 bg-[var(--color-surface)] shadow-2xl">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Capital Drift Analysis</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyTrend} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="income" name="Income" fill="#60a5fa" radius={[6, 6, 0, 0]} barSize={12} />
                <Bar dataKey="expense" name="Expense" fill="#f87171" radius={[6, 6, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
