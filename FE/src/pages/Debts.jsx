import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useDebts, useDebtSummary, useCreateDebt, useUpdateDebt, useDeleteDebt } from '../hooks/useApi';
import { Plus, Trash2, CheckCircle, Clock, TrendingUp, TrendingDown, Edit2 } from 'lucide-react';

const DebtTypeLabel = ({ type }) => (
  <Badge variant={type === 'given' ? 'success' : 'danger'}>
    {type === 'given' ? '▲ Lent Out' : '▼ Borrowed'}
  </Badge>
);

const StatusBadge = ({ settled }) =>
  settled
    ? <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full"><CheckCircle size={11} /> Settled</span>
    : <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full"><Clock size={11} /> Pending</span>;

const emptyForm = { contact_name: '', type: 'taken', amount: '', description: '', due_date: '' };

export const Debts = () => {
  const { data: debts = [], isLoading } = useDebts();
  const { data: summary } = useDebtSummary();
  const createDebt = useCreateDebt();
  const updateDebt = useUpdateDebt();
  const deleteDebt = useDeleteDebt();

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // debt object being edited
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => { setForm(emptyForm); setEditTarget(null); setShowModal(true); };
  const openEdit = (debt) => {
    setEditTarget(debt);
    setForm({
      contact_name: debt.contact_name,
      type: debt.type,
      amount: debt.amount,
      description: debt.description || '',
      due_date: debt.due_date || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      contact_name: form.contact_name,
      type: form.type,
      amount: parseFloat(form.amount),
      description: form.description || null,
      due_date: form.due_date || null,
    };
    try {
      if (editTarget) {
        await updateDebt.mutateAsync({ id: editTarget.id, data: payload });
      } else {
        await createDebt.mutateAsync(payload);
      }
      setShowModal(false);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleSettle = async (debt) => {
    if (!window.confirm(`Mark "${debt.contact_name}" debt as settled?`)) return;
    try {
      await updateDebt.mutateAsync({ id: debt.id, data: { is_settled: true } });
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = (debt) => {
    if (window.confirm(`Delete debt with "${debt.contact_name}"? This cannot be undone.`)) {
      deleteDebt.mutate(debt.id);
    }
  };

  const active = debts.filter(d => !d.is_settled);
  const settled = debts.filter(d => d.is_settled);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-white">Debt Tracker</h2>
          <p className="text-slate-400 text-sm mt-1">Personal debts — isolated to your account</p>
        </div>
        <Button onClick={openCreate}><Plus size={18} className="mr-2" />Add Debt</Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="text-center border border-emerald-500/20">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp size={16} className="text-emerald-400" />
              <p className="text-slate-400 text-sm">Owed to You</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">₹{summary.owed_to_you.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="text-center border border-rose-500/20">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingDown size={16} className="text-rose-400" />
              <p className="text-slate-400 text-sm">You Owe</p>
            </div>
            <p className="text-2xl font-bold text-rose-400">₹{summary.you_owe.toLocaleString('en-IN')}</p>
          </Card>
          <Card className={`text-center border ${summary.net >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
            <p className="text-slate-400 text-sm mb-1">Net Position</p>
            <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summary.net >= 0 ? '+' : ''}₹{summary.net.toLocaleString('en-IN')}
            </p>
          </Card>
        </div>
      )}

      {/* Active Debts */}
      {isLoading ? (
        <div className="text-slate-400 animate-pulse">Loading debts...</div>
      ) : active.length === 0 ? (
        <Card className="text-center py-10 text-slate-500">No active debts. You're all settled up!</Card>
      ) : (
        <Card>
          <h3 className="text-base font-semibold text-white mb-4">Active Debts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wide">
                  <th className="pb-3 px-3">Contact</th>
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3">Due Date</th>
                  <th className="pb-3 px-3">Note</th>
                  <th className="pb-3 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {active.map(d => (
                  <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 px-3 font-medium text-white">{d.contact_name}</td>
                    <td className="py-3 px-3"><DebtTypeLabel type={d.type} /></td>
                    <td className={`py-3 px-3 font-semibold ${d.type === 'given' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ₹{d.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{d.due_date || '—'}</td>
                    <td className="py-3 px-3 text-slate-400 max-w-[180px] truncate">{d.description || '—'}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSettle(d)}
                          className="px-2 py-1 text-xs rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          title="Mark settled"
                        >
                          Settle
                        </button>
                        <button
                          onClick={() => openEdit(d)}
                          className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Settled Debts (collapsible feel) */}
      {settled.length > 0 && (
        <Card className="opacity-60 hover:opacity-100 transition-opacity">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Settled ({settled.length})</h3>
          <div className="space-y-2">
            {settled.map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 px-3 bg-white/[0.02] rounded-lg text-sm">
                <div className="flex items-center gap-3">
                  <StatusBadge settled />
                  <span className="text-slate-400 line-through">{d.contact_name}</span>
                  <DebtTypeLabel type={d.type} />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">₹{d.amount.toLocaleString('en-IN')}</span>
                  <button onClick={() => handleDelete(d)} className="p-1 text-slate-600 hover:text-rose-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-slate-900 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-5">
              {editTarget ? 'Edit Debt' : 'Record Debt'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Contact Name <span className="text-rose-400">*</span></label>
                <input
                  required type="text"
                  className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-primary-500/50"
                  placeholder="e.g. Rahul, Uncle Suresh"
                  value={form.contact_name}
                  onChange={e => setForm({...form, contact_name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Type <span className="text-rose-400">*</span></label>
                  <select
                    className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white"
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value})}
                  >
                    <option value="taken">Borrowed (I owe them)</option>
                    <option value="given">Lent (They owe me)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Amount (₹) <span className="text-rose-400">*</span></label>
                  <input
                    required type="number" min="1" step="0.01"
                    className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white outline-none"
                    value={form.amount}
                    onChange={e => setForm({...form, amount: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Due Date (Optional)</label>
                <input
                  type="date"
                  className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white outline-none"
                  value={form.due_date}
                  onChange={e => setForm({...form, due_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white outline-none resize-none"
                  placeholder="e.g. Borrowed for emergency, Wedding gift..."
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={createDebt.isPending || updateDebt.isPending}>
                  {editTarget ? 'Save Changes' : 'Add Debt'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
