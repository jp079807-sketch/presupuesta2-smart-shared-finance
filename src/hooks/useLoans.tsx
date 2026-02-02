import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type LoanStatus = 'active' | 'paid' | 'defaulted';

export interface Loan {
  id: string;
  user_id: string;
  name: string;
  lender: string | null;
  total_amount: number;
  interest_rate: number;
  installments_total: number;
  installments_paid: number;
  installment_amount: number;
  start_date: string;
  status: LoanStatus;
  created_at: string;
  updated_at: string;
}

export interface LoanPayment {
  id: string;
  user_id: string;
  loan_id: string;
  amount: number;
  payment_date: string;
  note: string | null;
  created_at: string;
}

export interface LoanFormData {
  name: string;
  lender?: string;
  total_amount: number;
  interest_rate: number;
  installments_total: number;
  start_date: string;
}

function calculateInstallment(total: number, rate: number, months: number): number {
  if (rate === 0) return total / months;
  const monthlyRate = rate / 100 / 12;
  return (total * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

export function useLoans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLoans((data as Loan[]) || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los créditos.',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  const fetchPayments = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('loan_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      setPayments((data as LoanPayment[]) || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    Promise.all([fetchLoans(), fetchPayments()]);
  }, [fetchLoans, fetchPayments]);

  const addLoan = async (data: LoanFormData) => {
    if (!user) return null;

    const installmentAmount = calculateInstallment(
      data.total_amount,
      data.interest_rate,
      data.installments_total
    );

    try {
      const { data: newLoan, error } = await supabase
        .from('loans')
        .insert({
          user_id: user.id,
          name: data.name,
          lender: data.lender || null,
          total_amount: data.total_amount,
          interest_rate: data.interest_rate,
          installments_total: data.installments_total,
          installments_paid: 0,
          installment_amount: installmentAmount,
          start_date: data.start_date,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      setLoans(prev => [newLoan as Loan, ...prev]);
      toast({ title: 'Crédito añadido' });
      return newLoan;
    } catch (error) {
      console.error('Error adding loan:', error);
      toast({
        title: 'Error',
        description: 'No se pudo añadir el crédito.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateLoan = async (id: string, data: LoanFormData) => {
    if (!user) return null;

    const installmentAmount = calculateInstallment(
      data.total_amount,
      data.interest_rate,
      data.installments_total
    );

    try {
      const { data: updated, error } = await supabase
        .from('loans')
        .update({
          name: data.name,
          lender: data.lender || null,
          total_amount: data.total_amount,
          interest_rate: data.interest_rate,
          installments_total: data.installments_total,
          installment_amount: installmentAmount,
          start_date: data.start_date,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setLoans(prev => prev.map(l => l.id === id ? updated as Loan : l));
      toast({ title: 'Crédito actualizado' });
      return updated;
    } catch (error) {
      console.error('Error updating loan:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el crédito.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteLoan = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setLoans(prev => prev.filter(l => l.id !== id));
      setPayments(prev => prev.filter(p => p.loan_id !== id));
      toast({ title: 'Crédito eliminado' });
      return true;
    } catch (error) {
      console.error('Error deleting loan:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el crédito.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const payInstallment = async (loanId: string, currentPaid: number, amount: number, note?: string) => {
    if (!user) return false;

    try {
      // Add payment record
      const { error: paymentError } = await supabase
        .from('loan_payments')
        .insert({
          user_id: user.id,
          loan_id: loanId,
          amount,
          payment_date: new Date().toISOString().split('T')[0],
          note: note || null,
        });

      if (paymentError) throw paymentError;

      // Update loan installments paid
      const loan = loans.find(l => l.id === loanId);
      const newPaid = currentPaid + 1;
      const newStatus = loan && newPaid >= loan.installments_total ? 'paid' : 'active';

      const { error: loanError } = await supabase
        .from('loans')
        .update({ 
          installments_paid: newPaid,
          status: newStatus,
        })
        .eq('id', loanId)
        .eq('user_id', user.id);

      if (loanError) throw loanError;

      setLoans(prev => prev.map(l => 
        l.id === loanId ? { ...l, installments_paid: newPaid, status: newStatus as LoanStatus } : l
      ));

      await fetchPayments();
      toast({ title: 'Cuota pagada' });
      return true;
    } catch (error) {
      console.error('Error paying loan installment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar el pago.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getLoanPayments = (loanId: string) => {
    return payments.filter(p => p.loan_id === loanId);
  };

  const getTotalDebt = () => {
    return loans
      .filter(l => l.status === 'active')
      .reduce((sum, l) => {
        const remaining = l.installments_total - l.installments_paid;
        return sum + (l.installment_amount * remaining);
      }, 0);
  };

  const getMonthlyPayment = () => {
    return loans
      .filter(l => l.status === 'active')
      .reduce((sum, l) => sum + l.installment_amount, 0);
  };

  const activeLoans = loans.filter(l => l.status === 'active');

  return {
    loans,
    payments,
    loading,
    activeLoans,
    addLoan,
    updateLoan,
    deleteLoan,
    payInstallment,
    getLoanPayments,
    getTotalDebt,
    getMonthlyPayment,
    refetch: () => Promise.all([fetchLoans(), fetchPayments()]),
  };
}
