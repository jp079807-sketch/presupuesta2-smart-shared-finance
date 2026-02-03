import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferences } from '@/hooks/useUserPreferences';

// Types
export interface SharedBudget {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SharedBudgetMember {
  id: string;
  budget_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: 'owner' | 'member';
  invitation_status: 'pending' | 'accepted' | 'rejected';
  contribution_percentage: number;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    user_id: string;
    email: string | null;
    full_name: string | null;
  };
}

export interface MemberIncome {
  user_id: string;
  total_net: number;
}

export type ExpenseOrigin = 'manual' | 'debt' | 'recurring';

export interface AggregatedExpense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  origin: ExpenseOrigin;
  expense_date: string | null;
  due_date: string | null;
  is_paid: boolean;
  paid_by: string | null;
  created_at: string;
  // For debt-originated expenses
  debt_info?: {
    type: 'loan' | 'credit_card';
    name: string;
    principal: number;
    interest: number;
  };
}

export interface MemberSummary {
  user_id: string;
  name: string;
  email: string | null;
  income: number;
  percentage: number;
  expected_contribution: number;
  actual_contribution: number;
  difference: number;
}

export interface SharedBudgetSummary {
  budget: SharedBudget | null;
  members: SharedBudgetMember[];
  memberSummaries: MemberSummary[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  expenses: AggregatedExpense[];
}

export function useSharedBudget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentCycle } = useUserPreferences();
  
  const [budget, setBudget] = useState<SharedBudget | null>(null);
  const [members, setMembers] = useState<SharedBudgetMember[]>([]);
  const [memberIncomes, setMemberIncomes] = useState<MemberIncome[]>([]);
  const [expenses, setExpenses] = useState<AggregatedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch shared budget the user is part of
  const fetchBudget = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // First, find if user has a shared budget (either created or member of)
      const { data: memberData, error: memberError } = await supabase
        .from('shared_budget_members')
        .select(`
          *,
          shared_budgets!inner(*)
        `)
        .eq('user_id', user.id)
        .eq('invitation_status', 'accepted')
        .maybeSingle();

      if (memberError) throw memberError;

      if (!memberData) {
        // No shared budget found
        setBudget(null);
        setMembers([]);
        setLoading(false);
        return;
      }

      const sharedBudget = (memberData as any).shared_budgets as SharedBudget;
      setBudget(sharedBudget);

      // Fetch all members of this budget
      const { data: allMembers, error: membersError } = await supabase
        .from('shared_budget_members')
        .select('*')
        .eq('budget_id', sharedBudget.id)
        .eq('invitation_status', 'accepted');

      if (membersError) throw membersError;

      // Fetch profiles for each member
      const memberUserIds = (allMembers || [])
        .filter((m: any) => m.user_id)
        .map((m: any) => m.user_id);

      let profilesMap: Record<string, any> = {};
      if (memberUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, user_id, email, full_name')
          .in('user_id', memberUserIds);
        
        (profilesData || []).forEach((p: any) => {
          profilesMap[p.user_id] = p;
        });
      }

      const processedMembers = (allMembers || []).map((m: any) => ({
        ...m,
        profile: m.user_id ? profilesMap[m.user_id] : undefined,
      }));
      
      setMembers(processedMembers);

      // Fetch incomes for all members (reuse memberUserIds from above)
      if (memberUserIds.length > 0) {
        const { data: incomeData, error: incomeError } = await supabase
          .from('incomes')
          .select('user_id, net_amount')
          .in('user_id', memberUserIds);

        if (incomeError) throw incomeError;

        // Aggregate incomes by user
        const incomesByUser: Record<string, number> = {};
        (incomeData || []).forEach((income) => {
          const userId = income.user_id;
          incomesByUser[userId] = (incomesByUser[userId] || 0) + Number(income.net_amount);
        });

        setMemberIncomes(
          Object.entries(incomesByUser).map(([user_id, total_net]) => ({
            user_id,
            total_net,
          }))
        );
      }

      // Fetch shared expenses (from expenses table with shared_budget_id)
      await fetchSharedExpenses(sharedBudget.id);

    } catch (err) {
      console.error('Error fetching shared budget:', err);
      setError('No se pudo cargar el presupuesto compartido');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch shared expenses including debt-based ones
  const fetchSharedExpenses = async (budgetId: string) => {
    try {
      // Get manual shared expenses
      const { data: manualExpenses, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('shared_budget_id', budgetId)
        .order('expense_date', { ascending: false });

      if (expenseError) throw expenseError;

      const aggregated: AggregatedExpense[] = (manualExpenses || []).map((e) => ({
        id: e.id,
        category: e.category,
        description: e.description,
        amount: Number(e.amount),
        origin: (e.origin as ExpenseOrigin) || 'manual',
        expense_date: e.expense_date,
        due_date: e.due_date,
        is_paid: e.is_paid,
        paid_by: e.user_id,
        created_at: e.created_at,
      }));

      // Fetch shared loans and convert their payments to expenses
      const { data: sharedLoans, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .eq('shared_budget_id', budgetId)
        .eq('is_shared', true);

      if (!loansError && sharedLoans) {
        sharedLoans.forEach((loan) => {
          // Each unpaid installment becomes a debt expense
          const remainingInstallments = loan.installments_total - loan.installments_paid;
          if (remainingInstallments > 0) {
            const principal = Number(loan.total_amount) / loan.installments_total;
            const interest = Number(loan.installment_amount) - principal;
            
            aggregated.push({
              id: `loan-${loan.id}`,
              category: 'Deuda - Crédito',
              description: loan.name,
              amount: Number(loan.installment_amount),
              origin: 'debt',
              expense_date: null,
              due_date: loan.start_date,
              is_paid: false,
              paid_by: loan.user_id,
              created_at: loan.created_at,
              debt_info: {
                type: 'loan',
                name: loan.name,
                principal,
                interest: interest > 0 ? interest : 0,
              },
            });
          }
        });
      }

      // Fetch shared credit cards and their purchases
      const { data: sharedCards, error: cardsError } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('shared_budget_id', budgetId)
        .eq('is_shared', true);

      if (!cardsError && sharedCards) {
        for (const card of sharedCards) {
          const { data: purchases, error: purchasesError } = await supabase
            .from('card_purchases')
            .select('*')
            .eq('credit_card_id', card.id);

          if (!purchasesError && purchases) {
            purchases.forEach((purchase) => {
              const remainingInstallments = purchase.installments_total - purchase.installments_paid;
              if (remainingInstallments > 0) {
                aggregated.push({
                  id: `card-${purchase.id}`,
                  category: 'Deuda - Tarjeta',
                  description: `${card.name}: ${purchase.description}`,
                  amount: Number(purchase.installment_amount),
                  origin: 'debt',
                  expense_date: null,
                  due_date: null,
                  is_paid: false,
                  paid_by: card.user_id,
                  created_at: purchase.created_at,
                  debt_info: {
                    type: 'credit_card',
                    name: card.name,
                    principal: Number(purchase.installment_amount),
                    interest: 0, // Card purchases don't have separated interest in current model
                  },
                });
              }
            });
          }
        }
      }

      setExpenses(aggregated);
    } catch (err) {
      console.error('Error fetching shared expenses:', err);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  // Calculate member summaries with proportional distribution
  const summary = useMemo((): SharedBudgetSummary => {
    const totalIncome = memberIncomes.reduce((sum, m) => sum + m.total_net, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = totalIncome - totalExpenses;

    // Calculate each member's contribution
    const memberSummaries: MemberSummary[] = members.map((member) => {
      const income = memberIncomes.find((i) => i.user_id === member.user_id)?.total_net || 0;
      const percentage = totalIncome > 0 ? (income / totalIncome) * 100 : 0;
      const expected_contribution = totalExpenses * (percentage / 100);
      
      // Calculate actual contributions (expenses paid by this member)
      const actual_contribution = expenses
        .filter((e) => e.paid_by === member.user_id && e.is_paid)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const difference = actual_contribution - expected_contribution;

      return {
        user_id: member.user_id || '',
        name: member.profile?.full_name || member.invited_email || 'Miembro',
        email: member.profile?.email || member.invited_email,
        income,
        percentage,
        expected_contribution,
        actual_contribution,
        difference,
      };
    });

    return {
      budget,
      members,
      memberSummaries,
      totalIncome,
      totalExpenses,
      balance,
      expenses,
    };
  }, [budget, members, memberIncomes, expenses]);

  // Create a new shared budget
  const createBudget = async (name: string, description?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('shared_budgets')
        .insert({
          name,
          description: description || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Presupuesto compartido creado' });
      await fetchBudget();
      return data;
    } catch (err) {
      console.error('Error creating budget:', err);
      toast({
        title: 'Error',
        description: 'No se pudo crear el presupuesto.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Invite a member by email
  const inviteMember = async (email: string) => {
    if (!user || !budget) return false;

    try {
      const { error } = await supabase
        .from('shared_budget_members')
        .insert({
          budget_id: budget.id,
          invited_email: email,
          role: 'member',
          invitation_status: 'pending',
          contribution_percentage: 0,
        });

      if (error) throw error;

      toast({
        title: 'Invitación enviada',
        description: `Se ha invitado a ${email}`,
      });
      
      await fetchBudget();
      return true;
    } catch (err) {
      console.error('Error inviting member:', err);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la invitación.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Add a shared expense
  const addSharedExpense = async (data: {
    category: string;
    description?: string;
    amount: number;
    expense_date?: string;
  }) => {
    if (!user || !budget) return null;

    try {
      const { data: newExpense, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          type: 'variable',
          category: data.category,
          description: data.description || null,
          amount: data.amount,
          expense_date: data.expense_date || new Date().toISOString().split('T')[0],
          is_paid: true,
          shared_budget_id: budget.id,
          origin: 'manual',
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Gasto compartido añadido' });
      await fetchSharedExpenses(budget.id);
      return newExpense;
    } catch (err) {
      console.error('Error adding shared expense:', err);
      toast({
        title: 'Error',
        description: 'No se pudo añadir el gasto.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update a shared expense
  const updateSharedExpense = async (
    id: string,
    data: {
      category?: string;
      description?: string;
      amount?: number;
      expense_date?: string;
      is_paid?: boolean;
    }
  ) => {
    if (!user || !budget) return false;

    // Don't allow editing debt-based expenses
    if (id.startsWith('loan-') || id.startsWith('card-')) {
      toast({
        title: 'No editable',
        description: 'Los gastos de deuda se gestionan desde el módulo de deudas.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          category: data.category,
          description: data.description,
          amount: data.amount,
          expense_date: data.expense_date,
          is_paid: data.is_paid,
        })
        .eq('id', id)
        .eq('shared_budget_id', budget.id);

      if (error) throw error;

      toast({ title: 'Gasto actualizado' });
      await fetchSharedExpenses(budget.id);
      return true;
    } catch (err) {
      console.error('Error updating shared expense:', err);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el gasto.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Delete a shared expense
  const deleteSharedExpense = async (id: string) => {
    if (!user || !budget) return false;

    // Don't allow deleting debt-based expenses
    if (id.startsWith('loan-') || id.startsWith('card-')) {
      toast({
        title: 'No eliminable',
        description: 'Los gastos de deuda se gestionan desde el módulo de deudas.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('shared_budget_id', budget.id);

      if (error) throw error;

      toast({ title: 'Gasto eliminado' });
      await fetchSharedExpenses(budget.id);
      return true;
    } catch (err) {
      console.error('Error deleting shared expense:', err);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el gasto.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    summary,
    loading,
    error,
    hasBudget: !!budget,
    createBudget,
    inviteMember,
    addSharedExpense,
    updateSharedExpense,
    deleteSharedExpense,
    refetch: fetchBudget,
  };
}
