import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export type ExpenseType = 'fixed' | 'variable';
export type ReminderChannel = 'sms' | 'email';

export interface Expense {
  id: string;
  user_id: string;
  type: ExpenseType;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string | null;
  due_date: string | null;
  is_paid: boolean;
  reminder_enabled: boolean;
  reminder_channel: ReminderChannel | null;
  reminder_days_before: number | null;
  shared_budget_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseFormData {
  type: ExpenseType;
  category: string;
  description?: string;
  amount: number;
  expense_date?: string;
  due_date?: string;
  is_paid?: boolean;
  reminder_enabled?: boolean;
  reminder_channel?: ReminderChannel;
  reminder_days_before?: number;
  shared_budget_id?: string | null;
}

export function useExpenses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentCycle } = useUserPreferences();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Filter by current cycle if available
      if (currentCycle) {
        query = query
          .or(`expense_date.gte.${currentCycle.startDate},due_date.gte.${currentCycle.startDate}`)
          .or(`expense_date.lte.${currentCycle.endDate},due_date.lte.${currentCycle.endDate}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching expenses:', error);
        // Only show error toast once on initial load failure
        return;
      }

      setExpenses((data as Expense[]) || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentCycle]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = async (data: ExpenseFormData) => {
    if (!user) return null;

    try {
      const { data: newExpense, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          type: data.type,
          category: data.category,
          description: data.description || null,
          amount: data.amount,
          expense_date: data.expense_date || null,
          due_date: data.due_date || null,
          is_paid: data.is_paid ?? false,
          reminder_enabled: data.reminder_enabled ?? false,
          reminder_channel: data.reminder_enabled ? data.reminder_channel : null,
          reminder_days_before: data.reminder_enabled ? data.reminder_days_before : null,
          shared_budget_id: data.shared_budget_id || null,
        })
        .select()
        .single();

      if (error) throw error;

      setExpenses(prev => [newExpense as Expense, ...prev]);
      toast({ title: 'Gasto añadido' });
      return newExpense;
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: 'Error',
        description: 'No se pudo añadir el gasto.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateExpense = async (id: string, data: ExpenseFormData) => {
    if (!user) return null;

    try {
      const { data: updated, error } = await supabase
        .from('expenses')
        .update({
          type: data.type,
          category: data.category,
          description: data.description || null,
          amount: data.amount,
          expense_date: data.expense_date || null,
          due_date: data.due_date || null,
          is_paid: data.is_paid ?? false,
          reminder_enabled: data.reminder_enabled ?? false,
          reminder_channel: data.reminder_enabled ? data.reminder_channel : null,
          reminder_days_before: data.reminder_enabled ? data.reminder_days_before : null,
          shared_budget_id: data.shared_budget_id || null,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setExpenses(prev => prev.map(e => e.id === id ? updated as Expense : e));
      toast({ title: 'Gasto actualizado' });
      return updated;
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el gasto.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setExpenses(prev => prev.filter(e => e.id !== id));
      toast({ title: 'Gasto eliminado' });
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el gasto.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const togglePaid = async (id: string, currentStatus: boolean) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('expenses')
        .update({ is_paid: !currentStatus })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setExpenses(prev => prev.map(e => e.id === id ? { ...e, is_paid: !currentStatus } : e));
      toast({ 
        title: !currentStatus ? 'Marcado como pagado' : 'Marcado como pendiente' 
      });
      return true;
    } catch (error) {
      console.error('Error toggling expense:', error);
      return false;
    }
  };

  const totals = {
    fixed: expenses.filter(e => e.type === 'fixed').reduce((sum, e) => sum + Number(e.amount), 0),
    variable: expenses.filter(e => e.type === 'variable').reduce((sum, e) => sum + Number(e.amount), 0),
    pending: expenses.filter(e => !e.is_paid).length,
    total: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
  };

  return {
    expenses,
    loading,
    totals,
    addExpense,
    updateExpense,
    deleteExpense,
    togglePaid,
    refetch: fetchExpenses,
  };
}
