import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { useTransactions, useCreateTransaction, useDeleteTransaction, useUsers, useLoans, useCategories } from '../hooks/useApi';
import { Plus, Filter, X, Trash2 } from 'lucide-react';

export const Transactions = () => {
  const deleteTx = useDeleteTransaction();
  // Master Filter State
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    users: [], // array of ids
    type: '',
    purpose: '',
    loan_id: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);

  // Queries passing the filters array
  const { data: transactions = [], isLoading } = useTransactions({
    ...filters,
    users: filters.users.join(',')
  });
  
  const { data: familyUsers = [] } = useUsers();
  const { data: activeLoans = [] } = useLoans();
  const { data: categories = [] } = useCategories();

  const { mutate: createTx, isPending } = useCreateTransaction();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => {
    setFormData({
      type: 'expense',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      purpose: 'normal',
      category_id: null,
      loan_id: null,
      savings_pool_id: null,
      from_user_id: null,
      to_user_id: null,
      from_account_type: null,
      to_account_type: null,
    });
    setIsModalOpen(true);
  };
  
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    purpose: 'normal',
    category_id: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createTx({
      type: formData.type,
      amount: Number(formData.amount),
      date: formData.date,
      notes: formData.notes || null,
      purpose: formData.purpose || 'normal',
      category_id: formData.category_id ? Number(formData.category_id) : null,
      loan_id: formData.loan_id ? Number(formData.loan_id) : null,
      savings_pool_id: formData.savings_pool_id ? Number(formData.savings_pool_id) : null,
      from_user_id: formData.from_user_id ? Number(formData.from_user_id) : null,
      to_user_id: formData.to_user_id ? Number(formData.to_user_id) : null,
      from_account_type: formData.from_account_type || null,
      to_account_type: formData.to_account_type || null,
      idempotency_key: Date.now().toString() + '_manualtx'
    });
    setIsModalOpen(false);
  };

  const getBadgeVariant = (type) => {
    if (type === 'income') return 'success';
    if (type === 'expense') return 'danger';
    return 'info';
  };

  const toggleUserFilter = (id) => {
    setFilters(prev => ({
      ...prev,
      users: prev.users.includes(id) 
        ? prev.users.filter(u => u !== id)
        : [...prev.users, id]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-heading font-semibold text-white">Transactions</h2>
        <Button onClick={openModal} className="w-full sm:w-auto">
          <Plus size={18} className="mr-2" /> Add Transaction
        </Button>
      </div>

      <Card className="flex flex-col z-10 relative">
        <div className="flex justify-between mb-4">
            <h3 className="text-lg text-white font-medium">Activity Ledger</h3>
            <Button variant="secondary" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                <Filter size={18} /> Advanced Filters
            </Button>
        </div>

        {showFilters && (
          <div className="bg-slate-900 border border-white/10 rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Type" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </Select>
            <Input label="Start Date" type="date" value={filters.start_date} onChange={e => setFilters({...filters, start_date: e.target.value})} />
            <Input label="End Date" type="date" value={filters.end_date} onChange={e => setFilters({...filters, end_date: e.target.value})} />
            <Select label="Category" value={filters.category_id || ""} onChange={e => setFilters({...filters, category_id: e.target.value})}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
        )}        {isLoading ? (
          <div className="text-center py-10 text-slate-400 animate-pulse">Running complex database queries...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-black/20 rounded-xl border border-white/5">
             No activity matches your advanced filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-sm font-medium">
                  <th className="pb-3 px-4">Date</th>
                  <th className="pb-3 px-4">Type</th>
                  <th className="pb-3 px-4">Amount</th>
                  <th className="pb-3 px-4">Notes</th>
                  <th className="pb-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 text-slate-300">{tx.date}</td>
                    <td className="py-4 px-4">
                      <Badge variant={getBadgeVariant(tx.type)} className="uppercase tracking-wide">{tx.type}</Badge>
                    </td>
                    <td className={`py-4 px-4 font-medium ${tx.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {tx.type === 'expense' ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-slate-300">{tx.notes}</td>
                    <td className="py-4 px-4">
                        <button 
                            title="Delete"
                            disabled={deleteTx.isPending}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-2"
                            onClick={() => {
                                if(window.confirm("Permanently delete this transaction and reverse its effects?")) {
                                    deleteTx.mutate(tx.id);
                                }
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Transaction">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select 
            label="Transaction Type" 
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
          >
            <option value="expense" className="bg-slate-800">Expense</option>
            <option value="income" className="bg-slate-800">Income</option>
            <option value="transfer" className="bg-slate-800">Transfer</option>
          </Select>

          <Input 
            label="Amount (₹)" 
            type="number" 
            required 
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
          />
          
          <Input 
            label="Date" 
            type="date" 
            required 
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
          />

          {formData.type === 'expense' && (
            <Select 
              label="Standard Category" 
              value={formData.category_id || ""}
              onChange={(e) => setFormData({...formData, category_id: e.target.value ? parseInt(e.target.value) : null})}
            >
              <option value="" className="bg-slate-800">Assign Category...</option>
              {categories.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-800">{c.name}</option>
              ))}
            </Select>
          )}

          {formData.type === 'expense' && (
            <Select 
              label="Specific Purpose Flag" 
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
            >
              <option value="normal" className="bg-slate-800">Normal</option>
              <option value="loan_payment" className="bg-slate-800">Loan Payment</option>
              <option value="savings_contribution" className="bg-slate-800">Savings Contribution</option>
            </Select>
          )}

          {formData.type === 'transfer' && (
             <div className="grid grid-cols-2 gap-4 border border-white/5 p-3 rounded-lg bg-white/[0.02]">
                <Select
                  label="From Entity"
                  value={formData.from_user_id || formData.savings_pool_id || ""}
                  onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith('pool_')) {
                          setFormData({...formData, savings_pool_id: parseInt(val.split('_')[1]), from_user_id: null, from_account_type: 'savings'});
                      } else {
                          setFormData({...formData, from_user_id: parseInt(val), savings_pool_id: null, from_account_type: 'user'});
                      }
                  }}
                >
                  <option value="" className="bg-slate-800">Select Origin</option>
                  <optgroup label="Family Members" className="bg-slate-900 border-none">
                      {familyUsers.map(u => <option key={`from_user_${u.id}`} value={u.id} className="bg-slate-800">{u.name}</option>)}
                  </optgroup>
                  <optgroup label="Savings Goals" className="bg-slate-900 border-none">
                      {/* Note: Fetch pools via useSavingsPools if needed in this modal context, for MVP omit or fetch generic */}
                      <option value="pool_1" className="bg-slate-800">General Savings Fund</option>
                  </optgroup>
                </Select>
                
                <Select
                  label="To Entity"
                  value={formData.to_user_id || ""}
                  onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith('pool_')) {
                           setFormData({...formData, savings_pool_id: parseInt(val.split('_')[1]), to_user_id: null, to_account_type: 'savings'});
                      } else {
                           setFormData({...formData, to_user_id: parseInt(val), savings_pool_id: null, to_account_type: 'user'});
                      }
                  }}
                >
                  <option value="" className="bg-slate-800">Select Destination</option>
                  <optgroup label="Family Members" className="bg-slate-900 border-none">
                      {familyUsers.map(u => <option key={`to_user_${u.id}`} value={u.id} className="bg-slate-800">{u.name}</option>)}
                  </optgroup>
                  <optgroup label="Savings Goals" className="bg-slate-900 border-none">
                      <option value="pool_1" className="bg-slate-800">General Savings Fund</option>
                  </optgroup>
                </Select>
             </div>
          )}

          <Input 
            label="Notes" 
            placeholder="Detailed Context..." 
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
          />

          <div className="pt-4 border-t border-white/10 flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Deploy Transfer / Transaction'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
