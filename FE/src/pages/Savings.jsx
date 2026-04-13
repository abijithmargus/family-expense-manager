import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PiggyBank, ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useSavingsPool, useWithdrawSavings, useCreateTransaction, useCreateSavingsPool, useDeleteSavingsPool } from '../hooks/useApi';

export const Savings = () => {
  const { data: pools = [], isLoading } = useSavingsPool();
  const createTx = useCreateTransaction();
  const withdraw = useWithdrawSavings();
  const createPool = useCreateSavingsPool();
  const deletePool = useDeleteSavingsPool();

  const [activeModal, setActiveModal] = useState(null); // 'add' | 'withdraw' | 'new_pool' | null
  const [selectedPoolId, setSelectedPoolId] = useState(null);
  
  // Forms
  const [amount, setAmount] = useState('');
  const [poolForm, setPoolForm] = useState({ name: '', initial_amount: '' });

  const handleAction = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    try {
      if (activeModal === 'add') {
        await createTx.mutateAsync({
          amount: numAmount,
          type: 'expense',
          purpose: 'savings_contribution',
          date: new Date().toISOString().split('T')[0],
          notes: 'Manual savings contribution',
          savings_pool_id: selectedPoolId,
          idempotency_key: Date.now().toString() + '_savings'
        });
      } else if (activeModal === 'withdraw') {
        await withdraw.mutateAsync({
          amount: numAmount,
          savings_pool_id: selectedPoolId
        });
      }
      setActiveModal(null);
      setAmount('');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCreatePool = async (e) => {
    e.preventDefault();
    await createPool.mutateAsync({
        name: poolForm.name,
        initial_amount: poolForm.initial_amount ? parseFloat(poolForm.initial_amount) : 0
    });
    setActiveModal(null);
    setPoolForm({ name: '', initial_amount: '' });
  }

  if (isLoading) return <div className="text-white animate-pulse">Loading generic savings funds from Postgres...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-white">Savings Accounts</h2>
          <p className="text-slate-400 text-sm mt-1">Manage all named savings pools natively.</p>
        </div>
        <Button onClick={() => setActiveModal('new_pool')} className="w-full sm:w-auto text-emerald-50 bg-emerald-600 hover:bg-emerald-500">
          <Plus size={18} className="mr-2" /> New Goal
        </Button>
      </div>

      {pools.length === 0 ? (
        <Card className="text-center py-10 text-slate-400 border border-emerald-500/10">
          No savings pools found. Create one.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pools.map(pool => (
                <Card key={pool.id} className="text-center rounded-xl bg-[var(--color-surface)] border-emerald-500/20 relative shadow-lg">
                    <div className="absolute top-3 right-3">
                        <button 
                            onClick={() => {
                                if(window.confirm("Are you sure you want to completely delete this savings goal?")) {
                                    deletePool.mutate(pool.id, {
                                        onError: (err) => alert("Failed: " + err.response?.data?.detail)
                                    });
                                }
                            }}
                            className="bg-black/20 hover:bg-rose-500/80 p-2 rounded-full text-slate-400 hover:text-white transition-colors"
                            title="Delete Pool"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 mb-4 shadow-lg shadow-emerald-500/20 mt-4">
                        <PiggyBank size={24} className="text-emerald-400" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-1">{pool.name}</h3>
                    <p className="text-emerald-400 font-semibold mt-2 text-2xl mb-4">
                        ₹{pool.current_balance?.toLocaleString('en-IN')}
                    </p>
                    
                    <div className="flex justify-center gap-4 text-xs text-slate-400 mb-6">
                        <span className="text-emerald-500/70">In: ₹{pool.total_contributions?.toLocaleString('en-IN')}</span>
                        <span className="text-rose-500/70">Out: ₹{pool.total_withdrawals?.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-center gap-3 pt-6 border-t border-white/5">
                        <Button 
                            variant="secondary" 
                            className="flex-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:-translate-y-1 transition-transform"
                            onClick={() => { setSelectedPoolId(pool.id); setActiveModal('add'); }}
                        >
                        <ArrowDown size={14} className="mr-1" /> Add
                        </Button>
                        <Button 
                            variant="secondary" 
                            className="flex-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:-translate-y-1 transition-transform"
                            onClick={() => { setSelectedPoolId(pool.id); setActiveModal('withdraw'); }}
                        >
                        <ArrowUp size={14} className="mr-1" /> Withdraw
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
      )}

      {/* Inline Modal Overlays */}
      {(activeModal === 'add' || activeModal === 'withdraw') && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm bg-slate-900 border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {activeModal === 'add' ? 'Fund Goal' : 'Withdraw Savings'}
            </h3>
            <form onSubmit={handleAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Amount (₹)</label>
                <input 
                  type="number" required autoFocus
                  className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white text-lg font-bold outline-none"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="₹ 0"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setActiveModal(null)}>Cancel</Button>
                <Button 
                    type="submit" 
                    variant="primary" 
                    className={`flex-1 ${activeModal === 'add' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}
                    disabled={createTx.isLoading || withdraw.isLoading}
                >Confirm
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      
      {activeModal === 'new_pool' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm bg-slate-900 border border-emerald-500/20 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <PiggyBank size={20} className="text-emerald-400 mr-2" />
              Create Savings Goal
            </h3>
            <form onSubmit={handleCreatePool} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Goal Name</label>
                <input 
                  type="text" required autoFocus
                  className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white outline-none"
                  value={poolForm.name}
                  onChange={e => setPoolForm({...poolForm, name: e.target.value})}
                  placeholder="e.g., Vacation Fund, Honda Civic"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Initial Starting Amount (₹) [Optional]</label>
                <input 
                  type="number"
                  className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white text-lg font-bold outline-none"
                  value={poolForm.initial_amount}
                  onChange={e => setPoolForm({...poolForm, initial_amount: e.target.value})}
                  placeholder="₹ 0"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setActiveModal(null)}>Cancel</Button>
                <Button 
                    type="submit" 
                    variant="primary" 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                    disabled={createPool.isLoading}
                >Create Fund
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      
    </div>
  );
};
