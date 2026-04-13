import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Plus, Trash2 } from 'lucide-react';
import { useLoans, useCreateLoan, useDeleteLoan, useCreateTransaction } from '../hooks/useApi';
import { updateLoan } from '../services/api';

export const Loans = () => {
  const { data: activeLoans = [], isLoading, refetch } = useLoans();
  const createLoan = useCreateLoan();
  const deleteLoan = useDeleteLoan();
  const payInstallment = useCreateTransaction();
  
  const [modalType, setModalType] = useState(null); // 'new' | 'pay' | 'edit' | null
  const [selectedLoan, setSelectedLoan] = useState(null);
  
  // New Loan State
  const [loanForm, setLoanForm] = useState({ name: '', total_amount: '', interest_rate: '', tenure_months: '' });
  // Pay State
  const [payAmount, setPayAmount] = useState('');

  const submitLoan = async (e) => {
    e.preventDefault();
    try {
      await createLoan.mutateAsync({
        name: loanForm.name,
        total_amount: parseFloat(loanForm.total_amount),
        interest_rate: parseFloat(loanForm.interest_rate) / 100,
        tenure_months: parseInt(loanForm.tenure_months),
        interest_type: 'flat',
        start_date: new Date().toISOString().split('T')[0]
      });
      setModalType(null);
      setLoanForm({ name: '', total_amount: '', interest_rate: '', tenure_months: '' });
    } catch (err) {
      alert('Failed to create loan: ' + (err.response?.data?.detail || err.message));
    }
  };

  const submitUpdate = async (e) => {
    e.preventDefault();
    try {
        await updateLoan(selectedLoan.id, {
            name: loanForm.name,
            total_amount: parseFloat(loanForm.total_amount),
            interest_rate: parseFloat(loanForm.interest_rate) / 100,
            tenure_months: parseInt(loanForm.tenure_months),
        });
        refetch();
        setModalType(null);
    } catch (err) {
        alert("Update failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    try {
      await payInstallment.mutateAsync({
        amount: parseFloat(payAmount),
        type: 'expense',
        purpose: 'loan_payment',
        loan_id: selectedLoan.id,
        date: new Date().toISOString().split('T')[0],
        notes: `Loan installment: ${selectedLoan.name}`,
        idempotency_key: Date.now().toString() + '_loanpay'
      });
      setModalType(null);
      setPayAmount('');
    } catch (err) {
      alert('Payment failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-white">Active Loans</h2>
          <p className="text-slate-400 text-sm mt-1">Manage and track debt</p>
        </div>
        <Button onClick={() => setModalType('new')}><Plus size={18} className="mr-2" /> New Loan</Button>
      </div>

      {isLoading ? (
        <div className="text-white animate-pulse">Loading loans...</div>
      ) : activeLoans.length === 0 ? (
        <Card className="text-center py-10 text-slate-400">
          No active loans found. Create one to get started!
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeLoans.map(loan => (
            <Card key={loan.id} className="flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                  <h3 className="text-xl font-bold text-white">{loan.name}</h3>
                  <p className="text-primary-400 text-sm">{(loan.interest_rate * 100).toFixed(2)}% Interest</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => { setSelectedLoan(loan); setLoanForm({name: loan.name, total_amount: loan.total_amount, interest_rate: loan.interest_rate * 100, tenure_months: loan.tenure_months}); setModalType('edit'); }}
                    className="px-2.5 py-1.5 text-xs font-medium bg-slate-700/60 text-slate-300 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg border border-white/5 transition-colors"
                    title="Edit loan"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { if(window.confirm(`Delete "${loan.name}"? This cannot be undone.`)) deleteLoan.mutate(loan.id); }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg border border-white/5 transition-colors"
                    title="Delete loan"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Paid (₹{loan.paid_amount.toLocaleString()})</span>
                  <span>Remaining (₹{loan.remaining_amount.toLocaleString()})</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((loan.paid_amount / loan.total_amount) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                <Button variant="primary" size="sm" onClick={() => { setSelectedLoan(loan); setModalType('pay'); }}>
                  Pay Installment
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Loan Modal */}
      {modalType === 'new' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-slate-900 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Create New Loan</h3>
            <form onSubmit={submitLoan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Loan Name</label>
                <input type="text" required className="w-full bg-slate-800 border-white/10 rounded-lg p-2.5 text-white" value={loanForm.name} onChange={e => setLoanForm({...loanForm, name: e.target.value})} placeholder="e.g. Car Loan" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Total Amount (₹)</label>
                  <input type="number" required className="w-full bg-slate-800 border-white/10 rounded-lg p-2.5 text-white" value={loanForm.total_amount} onChange={e => setLoanForm({...loanForm, total_amount: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Interest Rate (%)</label>
                  <input type="number" step="0.1" required className="w-full bg-slate-800 border-white/10 rounded-lg p-2.5 text-white" value={loanForm.interest_rate} onChange={e => setLoanForm({...loanForm, interest_rate: e.target.value})} placeholder="5.5" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Tenure (Months)</label>
                <input type="number" required className="w-full bg-slate-800 border-white/10 rounded-lg p-2.5 text-white" value={loanForm.tenure_months} onChange={e => setLoanForm({...loanForm, tenure_months: e.target.value})} />
              </div>
              <div className="flex gap-3 mt-6">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalType(null)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1" disabled={createLoan.isLoading}>Create</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Loan Modal */}
      {modalType === 'edit' && selectedLoan && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-slate-900 border border-emerald-500/20">
            <h3 className="text-xl font-bold text-white mb-4">Edit Configuration</h3>
            <form onSubmit={submitUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Loan Name</label>
                <input type="text" required className="w-full bg-slate-800 border-white/10 rounded-lg p-2.5 text-white" value={loanForm.name} onChange={e => setLoanForm({...loanForm, name: e.target.value})} placeholder="e.g. Car Loan" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Total Amount (₹)</label>
                  <input type="number" required className="w-full bg-slate-800 border-white/10 rounded-lg p-2.5 text-white" value={loanForm.total_amount} onChange={e => setLoanForm({...loanForm, total_amount: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Interest Rate (%)</label>
                  <input type="number" step="0.1" required className="w-full bg-slate-800 border-white/10 rounded-lg p-2.5 text-white" value={loanForm.interest_rate} onChange={e => setLoanForm({...loanForm, interest_rate: e.target.value})} placeholder="5.5" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Tenure (Months)</label>
                <input type="number" required className="w-full bg-slate-800 border-white/10 rounded-lg p-2.5 text-white" value={loanForm.tenure_months} onChange={e => setLoanForm({...loanForm, tenure_months: e.target.value})} />
              </div>
              <div className="flex gap-3 mt-6">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalType(null)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1 bg-emerald-600 hover:bg-emerald-500">Save Changes</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Pay Installment Modal */}
      {modalType === 'pay' && selectedLoan && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm bg-slate-900 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-2">Pay Installment</h3>
            <p className="text-sm text-slate-400 mb-6">Towards {selectedLoan.name}</p>
            <form onSubmit={submitPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Amount (₹)</label>
                <input type="number" required autoFocus className="w-full bg-slate-800 border-white/10 rounded-lg p-3 text-white text-lg font-bold" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
              </div>
              <div className="flex gap-3 mt-6">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalType(null)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1" disabled={payInstallment.isLoading}>Pay</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
