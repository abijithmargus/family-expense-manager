import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Loans } from './pages/Loans';
import { Savings } from './pages/Savings';
import { Recurring } from './pages/Recurring';
import { Budgets } from './pages/Budgets';
import { Debts } from './pages/Debts';

const AuthRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="/debts" element={<Debts />} />
            
            {/* Admin only routes */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/loans" element={<Loans />} />
              <Route path="/recurring" element={<Recurring />} />
              <Route path="/budgets" element={<Budgets />} />
            </Route>
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
