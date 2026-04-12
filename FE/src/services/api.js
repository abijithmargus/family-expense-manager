import api from './axios';

// Auth
export const loginWithGoogle = async (id_token) => {
  return await api.post('/auth/google', { id_token });
};

// Users
export const getUsers = async () => {
  return await api.get('/users');
};

export const getCategories = async () => {
  return await api.get('/categories');
};

// Dashboard
export const getDashboardSummary = async (filters = {}) => {
  return await api.get('/dashboard/summary', { params: filters });
};

// Transactions
export const getTransactions = async (filters) => {
  return await api.get('/transactions', { params: filters });
};

export const createTransaction = async (data) => {
  return await api.post('/transactions', data);
};

export const deleteTransaction = async (id) => {
  return await api.delete(`/transactions/${id}`);
};

// Loans
export const getLoans = async () => {
  return await api.get('/loans');
};

export const createLoan = async (data) => {
  return await api.post('/loans', data);
};

export const deleteLoan = async (id) => {
  return await api.delete(`/loans/${id}`);
};

export const updateLoan = async (id, data) => {
  return await api.put(`/loans/${id}`, data);
};

// Savings
export const getSavingsPool = async () => {
  return await api.get('/savings/pool');
};

export const createSavingsPool = async (data) => {
  return await api.post('/savings/pool', data);
};

export const deleteSavingsPool = async (id) => {
  return await api.delete(`/savings/pool/${id}`);
};

export const withdrawSavings = async (data) => {
  return await api.post('/savings/withdraw', data);
};

// Recurring Rules
export const getRecurringRules = async () => {
  return await api.get('/recurring-rules');
};

export const createRecurringRule = async (data) => {
  return await api.post('/recurring-rules', data);
};

export const deleteRecurringRule = async (id) => {
  return await api.delete(`/recurring-rules/${id}`);
};

// Budgets
export const getBudgets = async () => {
  return await api.get('/budgets');
};

export const createBudget = async (data) => {
  return await api.post('/budgets', data);
};

export const deleteBudget = async (id) => {
  return await api.delete(`/budgets/${id}`);
};

// Debts
export const getDebts = async () => api.get('/debts');
export const getDebtSummary = async () => api.get('/debts/summary');
export const createDebt = async (data) => api.post('/debts', data);
export const updateDebt = async (id, data) => api.put(`/debts/${id}`, data);
export const deleteDebt = async (id) => api.delete(`/debts/${id}`);
