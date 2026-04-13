import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';

export const useDashboardSummary = (filters = {}) => {
  return useQuery({
    queryKey: ['dashboardSummary', filters],
    queryFn: async () => {
      const res = await api.getDashboardSummary(filters);
      return res.data.data;
    }
  });
};

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.getUsers();
      return res.data.data;
    }
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.getCategories();
      return res.data.data;
    }
  });
};

export const useTransactions = (filters) => {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const res = await api.getTransactions(filters);
      return res.data.data;
    }
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.createTransaction(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['savingsPool'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    }
  });
};

export const useLoans = () => {
  return useQuery({
    queryKey: ['loans'],
    queryFn: async () => {
      const res = await api.getLoans();
      return res.data.data;
    }
  });
};

export const useSavingsPool = () => {
  return useQuery({
    queryKey: ['savingsPool'],
    queryFn: async () => {
      const res = await api.getSavingsPool();
      return res.data.data;
    }
  });
};

export const useRecurringRules = () => {
  return useQuery({
    queryKey: ['recurringRules'],
    queryFn: async () => {
      const res = await api.getRecurringRules();
      return res.data.data;
    }
  });
};

export const useBudgets = () => {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const res = await api.getBudgets();
      return res.data.data;
    }
  });
};

export const useCreateLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.createLoan(data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    }
  });
};

export const useDeleteLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.deleteLoan(id)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loans'] })
  });
};

export const useWithdrawSavings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.withdrawSavings(data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsPool'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });
};

export const useCreateRecurringRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.createRecurringRule(data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurringRules'] })
  });
};

export const useCreateSavingsPool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.createSavingsPool(data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsPool'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    }
  });
};

export const useDeleteSavingsPool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.deleteSavingsPool(id)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsPool'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    }
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.deleteTransaction(id)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['savingsPool'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    }
  });
};

export const useDeleteRecurringRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.deleteRecurringRule(id)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurringRules'] })
  });
};

export const useDebts = () => useQuery({
  queryKey: ['debts'],
  queryFn: async () => (await api.getDebts()).data.data,
});

export const useDebtSummary = () => useQuery({
  queryKey: ['debtSummary'],
  queryFn: async () => (await api.getDebtSummary()).data.data,
});

export const useCreateDebt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.createDebt(data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debtSummary'] });
    }
  });
};

export const useUpdateDebt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => (await api.updateDebt(id, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debtSummary'] });
    }
  });
};

export const useDeleteDebt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.deleteDebt(id)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debtSummary'] });
    }
  });
};
