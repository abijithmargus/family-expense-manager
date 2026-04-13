import React from 'react';
import { Card } from '../components/ui/Card';
import { useBudgets } from '../hooks/useApi';

export const Budgets = () => {
  const { data: budgets = [], isLoading } = useBudgets();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading font-semibold text-white">Budgets</h2>
      
      {isLoading ? (
        <div className="text-white animate-pulse">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-slate-400 max-w-md">No budgets created yet.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map(bgt => (
            <Card key={bgt.id} className="flex flex-col items-center justify-center p-8">
              <h3 className="text-lg text-slate-300 mb-2">Month: {bgt.month_year}</h3>
              <p className="text-3xl font-bold text-white">₹{bgt.amount}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
