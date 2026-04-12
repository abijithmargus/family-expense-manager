import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useRecurringRules, useCreateRecurringRule, useDeleteRecurringRule, useCategories, useSavingsPool, useLoans } from '../hooks/useApi';
import { Plus, Trash2 } from 'lucide-react';

export const Recurring = () => {
  const { data: rules = [], isLoading } = useRecurringRules();
  const { data: categories = [] } = useCategories();
  const { data: pools = [] } = useSavingsPool();
  const { data: loans = [] } = useLoans();

  const createRule = useCreateRecurringRule();
  const deleteRule = useDeleteRecurringRule();
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    rule_type: 'expense',
    amount: '',
    frequency: 'monthly',
    category_id: null,
    savings_pool_id: null,
    loan_id: null,
    start_date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createRule.mutateAsync({
      ...formData,
      amount: parseFloat(formData.amount)
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading font-semibold text-white">Recurring Rules</h2>
        <Button onClick={() => setShowModal(true)}><Plus size={18} className="mr-2" /> Add Rule</Button>
      </div>
      
      {isLoading ? (
        <div className="text-white animate-pulse">Loading rules...</div>
      ) : rules.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-slate-400 max-w-md">No recurring rules configured yet.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-sm font-medium">
                  <th className="pb-3 px-4">Type</th>
                  <th className="pb-3 px-4">Amount</th>
                  <th className="pb-3 px-4">Frequency</th>
                  <th className="pb-3 px-4">Next Run</th>
                  <th className="pb-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4 capitalize text-slate-300">{rule.rule_type.replace('_', ' ')}</td>
                    <td className="py-4 px-4 font-medium text-white">₹{rule.amount.toLocaleString()}</td>
                    <td className="py-4 px-4"><Badge variant="info" className="capitalize">{rule.frequency}</Badge></td>
                    <td className="py-4 px-4 text-slate-300">{rule.next_run_date}</td>
                    <td className="py-4 px-4">
                      <button 
                        onClick={() => deleteRule.mutate(rule.id)}
                        className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-slate-900 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Add Recurring Rule</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                <select 
                  className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white"
                  value={formData.rule_type}
                  onChange={e => setFormData({...formData, rule_type: e.target.value})}
                >
                  <option value="expense">Expense</option>
                  <option value="savings_contribution">Savings Contribution</option>
                  <option value="loan_payment">Loan Payment</option>
                </select>
              </div>

              {formData.rule_type === 'expense' && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                  <select 
                    required
                    className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white"
                    value={formData.category_id || ""}
                    onChange={e => setFormData({...formData, category_id: e.target.value ? parseInt(e.target.value) : null})}
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {formData.rule_type === 'savings_contribution' && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Savings Goal</label>
                  <select 
                    required
                    className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white"
                    value={formData.savings_pool_id || ""}
                    onChange={e => setFormData({...formData, savings_pool_id: e.target.value ? parseInt(e.target.value) : null})}
                  >
                    <option value="">Select Goal</option>
                    {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}

              {formData.rule_type === 'loan_payment' && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Loan Account</label>
                  <select 
                    required
                    className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white"
                    value={formData.loan_id || ""}
                    onChange={e => setFormData({...formData, loan_id: e.target.value ? parseInt(e.target.value) : null})}
                  >
                    <option value="">Select Loan</option>
                    {loans.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Amount (₹)</label>
                <input 
                  type="number" required
                  className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Frequency</label>
                <select 
                  className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white"
                  value={formData.frequency}
                  onChange={e => setFormData({...formData, frequency: e.target.value})}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1" disabled={createRule.isLoading}>Save Rule</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
