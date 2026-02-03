import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  credit_limit: number;
  cut_off_day: number;
  payment_due_day: number;
  interest_rate: number | null;
  is_shared: boolean;
  shared_budget_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardPurchase {
  id: string;
  user_id: string;
  credit_card_id: string;
  description: string;
  total_amount: number;
  installments_total: number;
  installments_paid: number;
  installment_amount: number;
  purchase_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreditCardFormData {
  name: string;
  bank: string;
  credit_limit: number;
  cut_off_day: number;
  payment_due_day: number;
  interest_rate?: number;
  is_shared?: boolean;
  shared_budget_id?: string;
}

export interface CardPurchaseFormData {
  credit_card_id: string;
  description: string;
  total_amount: number;
  installments_total: number;
  purchase_date: string;
}

export function useCreditCards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [purchases, setPurchases] = useState<CardPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCreditCards = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCreditCards((data as CreditCard[]) || []);
    } catch (error) {
      console.error('Error fetching credit cards:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las tarjetas de crédito.',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  const fetchPurchases = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('card_purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false });

      if (error) throw error;

      setPurchases((data as CardPurchase[]) || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    Promise.all([fetchCreditCards(), fetchPurchases()]);
  }, [fetchCreditCards, fetchPurchases]);

  const addCreditCard = async (data: CreditCardFormData) => {
    if (!user) return null;

    try {
      const { data: newCard, error } = await supabase
        .from('credit_cards')
        .insert({
          user_id: user.id,
          name: data.name,
          bank: data.bank,
          credit_limit: data.credit_limit,
          cut_off_day: data.cut_off_day,
          payment_due_day: data.payment_due_day,
          interest_rate: data.interest_rate || 0,
          is_shared: data.is_shared || false,
          shared_budget_id: data.shared_budget_id || null,
        })
        .select()
        .single();

      if (error) throw error;

      setCreditCards(prev => [newCard as CreditCard, ...prev]);
      toast({ title: 'Tarjeta añadida' });
      return newCard;
    } catch (error) {
      console.error('Error adding credit card:', error);
      toast({
        title: 'Error',
        description: 'No se pudo añadir la tarjeta.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCreditCard = async (id: string, data: CreditCardFormData) => {
    if (!user) return null;

    try {
      const { data: updated, error } = await supabase
        .from('credit_cards')
        .update({
          name: data.name,
          bank: data.bank,
          credit_limit: data.credit_limit,
          cut_off_day: data.cut_off_day,
          payment_due_day: data.payment_due_day,
          interest_rate: data.interest_rate || 0,
          is_shared: data.is_shared || false,
          shared_budget_id: data.shared_budget_id || null,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setCreditCards(prev => prev.map(c => c.id === id ? updated as CreditCard : c));
      toast({ title: 'Tarjeta actualizada' });
      return updated;
    } catch (error) {
      console.error('Error updating credit card:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la tarjeta.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteCreditCard = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCreditCards(prev => prev.filter(c => c.id !== id));
      setPurchases(prev => prev.filter(p => p.credit_card_id !== id));
      toast({ title: 'Tarjeta eliminada' });
      return true;
    } catch (error) {
      console.error('Error deleting credit card:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la tarjeta.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const addPurchase = async (data: CardPurchaseFormData) => {
    if (!user) return null;

    const installmentAmount = data.total_amount / data.installments_total;

    try {
      const { data: newPurchase, error } = await supabase
        .from('card_purchases')
        .insert({
          user_id: user.id,
          credit_card_id: data.credit_card_id,
          description: data.description,
          total_amount: data.total_amount,
          installments_total: data.installments_total,
          installments_paid: 0,
          installment_amount: installmentAmount,
          purchase_date: data.purchase_date,
        })
        .select()
        .single();

      if (error) throw error;

      setPurchases(prev => [newPurchase as CardPurchase, ...prev]);
      toast({ title: 'Compra registrada' });
      return newPurchase;
    } catch (error) {
      console.error('Error adding purchase:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar la compra.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const payInstallment = async (purchaseId: string, currentPaid: number) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('card_purchases')
        .update({ installments_paid: currentPaid + 1 })
        .eq('id', purchaseId)
        .eq('user_id', user.id);

      if (error) throw error;

      setPurchases(prev => prev.map(p => 
        p.id === purchaseId ? { ...p, installments_paid: currentPaid + 1 } : p
      ));
      toast({ title: 'Cuota marcada como pagada' });
      return true;
    } catch (error) {
      console.error('Error paying installment:', error);
      return false;
    }
  };

  const deletePurchase = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('card_purchases')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setPurchases(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Compra eliminada' });
      return true;
    } catch (error) {
      console.error('Error deleting purchase:', error);
      return false;
    }
  };

  const getCardPurchases = (cardId: string) => {
    return purchases.filter(p => p.credit_card_id === cardId);
  };

  const getCardDebt = (cardId: string) => {
    const cardPurchases = getCardPurchases(cardId);
    return cardPurchases.reduce((sum, p) => {
      const remainingInstallments = p.installments_total - p.installments_paid;
      return sum + (p.installment_amount * remainingInstallments);
    }, 0);
  };

  const getTotalDebt = () => {
    return purchases.reduce((sum, p) => {
      const remainingInstallments = p.installments_total - p.installments_paid;
      return sum + (p.installment_amount * remainingInstallments);
    }, 0);
  };

  const getMonthlyPayment = () => {
    return purchases
      .filter(p => p.installments_paid < p.installments_total)
      .reduce((sum, p) => sum + p.installment_amount, 0);
  };

  return {
    creditCards,
    purchases,
    loading,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    addPurchase,
    payInstallment,
    deletePurchase,
    getCardPurchases,
    getCardDebt,
    getTotalDebt,
    getMonthlyPayment,
    refetch: () => Promise.all([fetchCreditCards(), fetchPurchases()]),
  };
}
