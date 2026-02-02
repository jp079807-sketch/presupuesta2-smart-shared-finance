import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { IncomeType, calculateNetIncome } from '@/lib/income-calculator';

export interface Income {
  id: string;
  user_id: string;
  source: string;
  income_type: IncomeType;
  gross_amount: number;
  net_amount: number;
  frequency: string;
  created_at: string;
  updated_at: string;
}

export interface IncomeFormData {
  source: string;
  income_type: IncomeType;
  gross_amount: number;
  frequency: string;
}

export function useIncomes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncomes = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setIncomes((data as Income[]) || []);
    } catch (error) {
      console.error('Error fetching incomes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los ingresos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  const addIncome = async (data: IncomeFormData) => {
    if (!user) return null;

    const netAmount = calculateNetIncome(data.gross_amount, data.income_type);

    try {
      const { data: newIncome, error } = await supabase
        .from('incomes')
        .insert({
          user_id: user.id,
          source: data.source,
          income_type: data.income_type,
          gross_amount: data.gross_amount,
          net_amount: netAmount,
          frequency: data.frequency,
        })
        .select()
        .single();

      if (error) throw error;

      setIncomes(prev => [newIncome as Income, ...prev]);
      toast({ title: 'Ingreso añadido' });
      return newIncome;
    } catch (error) {
      console.error('Error adding income:', error);
      toast({
        title: 'Error',
        description: 'No se pudo añadir el ingreso.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateIncome = async (id: string, data: IncomeFormData) => {
    if (!user) return null;

    const netAmount = calculateNetIncome(data.gross_amount, data.income_type);

    try {
      const { data: updated, error } = await supabase
        .from('incomes')
        .update({
          source: data.source,
          income_type: data.income_type,
          gross_amount: data.gross_amount,
          net_amount: netAmount,
          frequency: data.frequency,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setIncomes(prev => prev.map(i => i.id === id ? updated as Income : i));
      toast({ title: 'Ingreso actualizado' });
      return updated;
    } catch (error) {
      console.error('Error updating income:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el ingreso.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteIncome = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setIncomes(prev => prev.filter(i => i.id !== id));
      toast({ title: 'Ingreso eliminado' });
      return true;
    } catch (error) {
      console.error('Error deleting income:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el ingreso.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const totals = {
    gross: incomes.reduce((sum, i) => sum + Number(i.gross_amount), 0),
    net: incomes.reduce((sum, i) => sum + Number(i.net_amount), 0),
  };

  return {
    incomes,
    loading,
    totals,
    addIncome,
    updateIncome,
    deleteIncome,
    refetch: fetchIncomes,
  };
}
