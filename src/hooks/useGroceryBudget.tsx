import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { getCycleDateStrings } from '@/lib/budget-cycle';
import { useToast } from '@/hooks/use-toast';

export interface GroceryBudget {
  id: string;
  user_id: string;
  budget_amount: number;
  cycle_start_date: string;
  cycle_end_date: string;
  created_at: string;
  updated_at: string;
}

export interface GroceryPurchase {
  id: string;
  user_id: string;
  grocery_budget_id: string;
  description: string;
  amount: number;
  purchase_date: string;
  created_at: string;
}

export interface GrocerySummary {
  budget: GroceryBudget | null;
  purchases: GroceryPurchase[];
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
  alertLevel: 'safe' | 'warning' | 'danger' | 'exceeded';
}

export function useGroceryBudget() {
  const { user } = useAuth();
  const { currentCycle } = useUserPreferences();
  const { toast } = useToast();
  const [budget, setBudget] = useState<GroceryBudget | null>(null);
  const [purchases, setPurchases] = useState<GroceryPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user || !currentCycle) return;

    const { startDate, endDate } = getCycleDateStrings(currentCycle);

    try {
      // Fetch current cycle's budget
      const { data: budgetData, error: budgetError } = await supabase
        .from('grocery_budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('cycle_start_date', startDate)
        .eq('cycle_end_date', endDate)
        .maybeSingle();

      if (budgetError) throw budgetError;

      setBudget(budgetData as GroceryBudget | null);

      // Fetch purchases if budget exists
      if (budgetData) {
        const { data: purchasesData, error: purchasesError } = await supabase
          .from('grocery_purchases')
          .select('*')
          .eq('grocery_budget_id', budgetData.id)
          .order('purchase_date', { ascending: false });

        if (purchasesError) throw purchasesError;

        setPurchases((purchasesData as GroceryPurchase[]) || []);
      } else {
        setPurchases([]);
      }
    } catch (error) {
      console.error('Error fetching grocery data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentCycle]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createOrUpdateBudget = async (budgetAmount: number) => {
    if (!user || !currentCycle) return;

    const { startDate, endDate } = getCycleDateStrings(currentCycle);

    try {
      if (budget) {
        // Update existing budget
        const { data, error } = await supabase
          .from('grocery_budgets')
          .update({ budget_amount: budgetAmount })
          .eq('id', budget.id)
          .select()
          .single();

        if (error) throw error;
        setBudget(data as GroceryBudget);
      } else {
        // Create new budget for current cycle
        const { data, error } = await supabase
          .from('grocery_budgets')
          .insert({
            user_id: user.id,
            budget_amount: budgetAmount,
            cycle_start_date: startDate,
            cycle_end_date: endDate,
          })
          .select()
          .single();

        if (error) throw error;
        setBudget(data as GroceryBudget);
      }

      toast({
        title: 'Presupuesto guardado',
        description: 'El presupuesto de mercado se ha actualizado.',
      });
    } catch (error) {
      console.error('Error saving grocery budget:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el presupuesto.',
        variant: 'destructive',
      });
    }
  };

  const addPurchase = async (description: string, amount: number, purchaseDate: string) => {
    if (!user || !budget) return;

    try {
      const { data, error } = await supabase
        .from('grocery_purchases')
        .insert({
          user_id: user.id,
          grocery_budget_id: budget.id,
          description,
          amount,
          purchase_date: purchaseDate,
        })
        .select()
        .single();

      if (error) throw error;

      setPurchases(prev => [data as GroceryPurchase, ...prev]);

      toast({
        title: 'Compra registrada',
        description: 'La compra se ha añadido correctamente.',
      });
    } catch (error) {
      console.error('Error adding purchase:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar la compra.',
        variant: 'destructive',
      });
    }
  };

  const updatePurchase = async (id: string, updates: Partial<Pick<GroceryPurchase, 'description' | 'amount' | 'purchase_date'>>) => {
    try {
      const { data, error } = await supabase
        .from('grocery_purchases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPurchases(prev => prev.map(p => p.id === id ? data as GroceryPurchase : p));

      toast({
        title: 'Compra actualizada',
        description: 'Los cambios se han guardado.',
      });
    } catch (error) {
      console.error('Error updating purchase:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la compra.',
        variant: 'destructive',
      });
    }
  };

  const deletePurchase = async (id: string) => {
    try {
      const { error } = await supabase
        .from('grocery_purchases')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPurchases(prev => prev.filter(p => p.id !== id));

      toast({
        title: 'Compra eliminada',
        description: 'La compra se ha eliminado correctamente.',
      });
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la compra.',
        variant: 'destructive',
      });
    }
  };

  // Calculate summary
  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.amount), 0);
  const budgetAmount = budget?.budget_amount || 0;
  const remaining = budgetAmount - totalSpent;
  const percentageUsed = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;

  let alertLevel: GrocerySummary['alertLevel'] = 'safe';
  if (percentageUsed >= 100) alertLevel = 'exceeded';
  else if (percentageUsed >= 90) alertLevel = 'danger';
  else if (percentageUsed >= 70) alertLevel = 'warning';

  const summary: GrocerySummary = {
    budget,
    purchases,
    totalSpent,
    remaining,
    percentageUsed,
    alertLevel,
  };

  return {
    summary,
    loading,
    createOrUpdateBudget,
    addPurchase,
    updatePurchase,
    deletePurchase,
    refetch: fetchData,
  };
}
