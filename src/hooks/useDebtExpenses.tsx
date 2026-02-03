import { useMemo } from 'react';
import { useLoans, Loan } from '@/hooks/useLoans';
import { useCreditCards, CreditCard, CardPurchase } from '@/hooks/useCreditCards';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { BudgetCycle } from '@/lib/budget-cycle';

export type DebtOrigin = 'loan' | 'credit_card';

export interface DebtExpense {
  id: string;
  origin: DebtOrigin;
  source_id: string;
  source_name: string;
  description: string;
  total_amount: number;
  principal_amount: number;
  interest_amount: number;
  due_date: string | null;
  is_shared: boolean;
  shared_budget_id: string | null;
  installment_number: number;
  installments_total: number;
  lender?: string;
  bank?: string;
}

/**
 * Calculate interest portion using diminishing balance method
 * For loans with interest, calculates how much of the installment is interest vs principal
 */
function calculateLoanBreakdown(
  loan: Loan,
  currentInstallment: number
): { principal: number; interest: number } {
  if (loan.interest_rate === 0) {
    return { principal: loan.installment_amount, interest: 0 };
  }

  const monthlyRate = loan.interest_rate / 100 / 12;
  const totalInstallments = loan.installments_total;
  const installmentAmount = loan.installment_amount;
  
  // Calculate remaining balance before this installment
  let remainingBalance = loan.total_amount;
  for (let i = 0; i < currentInstallment; i++) {
    const interestForInstallment = remainingBalance * monthlyRate;
    const principalForInstallment = installmentAmount - interestForInstallment;
    remainingBalance -= principalForInstallment;
  }
  
  // Calculate interest and principal for current installment
  const interest = remainingBalance * monthlyRate;
  const principal = installmentAmount - interest;
  
  return {
    principal: Math.max(0, principal),
    interest: Math.max(0, interest),
  };
}

/**
 * Get the due date for a loan installment based on start date and installment number
 */
function getLoanDueDate(startDate: string, installmentNumber: number): string {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + installmentNumber);
  return date.toISOString().split('T')[0];
}

/**
 * Get the due date for a credit card based on payment_due_day
 */
function getCardDueDate(paymentDueDay: number, cycle: BudgetCycle | null): string {
  const today = new Date();
  const currentDay = today.getDate();
  
  let dueDate: Date;
  if (currentDay >= paymentDueDay) {
    // Due date is next month
    dueDate = new Date(today.getFullYear(), today.getMonth() + 1, paymentDueDay);
  } else {
    // Due date is this month
    dueDate = new Date(today.getFullYear(), today.getMonth(), paymentDueDay);
  }
  
  return dueDate.toISOString().split('T')[0];
}

/**
 * Check if a date falls within the current budget cycle
 */
function isInCurrentCycle(dateStr: string, cycle: BudgetCycle | null): boolean {
  if (!cycle) return true; // If no cycle, include all
  
  const date = new Date(dateStr);
  const start = new Date(cycle.startDate);
  const end = new Date(cycle.endDate);
  
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  date.setHours(12, 0, 0, 0);
  
  return date >= start && date <= end;
}

export function useDebtExpenses() {
  const { loans, activeLoans, loading: loansLoading } = useLoans();
  const { creditCards, purchases, loading: cardsLoading, getCardPurchases } = useCreditCards();
  const { currentCycle } = useUserPreferences();

  const debtExpenses = useMemo(() => {
    const expenses: DebtExpense[] = [];

    // Process active loans
    activeLoans.forEach(loan => {
      const nextInstallmentNumber = loan.installments_paid + 1;
      const dueDate = getLoanDueDate(loan.start_date, nextInstallmentNumber - 1);
      
      // Only include if within current cycle
      if (!isInCurrentCycle(dueDate, currentCycle)) return;
      
      const { principal, interest } = calculateLoanBreakdown(loan, loan.installments_paid);
      
      expenses.push({
        id: `loan-${loan.id}-${nextInstallmentNumber}`,
        origin: 'loan',
        source_id: loan.id,
        source_name: loan.name,
        description: `Cuota ${nextInstallmentNumber}/${loan.installments_total} - ${loan.name}`,
        total_amount: loan.installment_amount,
        principal_amount: principal,
        interest_amount: interest,
        due_date: dueDate,
        is_shared: loan.is_shared,
        shared_budget_id: loan.shared_budget_id,
        installment_number: nextInstallmentNumber,
        installments_total: loan.installments_total,
        lender: loan.lender || undefined,
      });
    });

    // Process credit card purchases with pending installments
    creditCards.forEach(card => {
      const cardPurchases = getCardPurchases(card.id);
      const pendingPurchases = cardPurchases.filter(
        p => p.installments_paid < p.installments_total
      );

      // Calculate total monthly payment for this card
      const monthlyPayment = pendingPurchases.reduce((sum, p) => sum + p.installment_amount, 0);
      
      if (monthlyPayment <= 0) return;

      const dueDate = getCardDueDate(card.payment_due_day, currentCycle);
      
      // Only include if within current cycle
      if (!isInCurrentCycle(dueDate, currentCycle)) return;

      // For credit cards, we calculate interest differently
      // Interest is typically on the remaining balance at the card rate
      const cardInterestRate = card.interest_rate || 0;
      
      // Total remaining balance for this card
      const remainingBalance = pendingPurchases.reduce((sum, p) => {
        const remaining = p.installments_total - p.installments_paid;
        return sum + (p.installment_amount * remaining);
      }, 0);
      
      // Monthly interest on remaining balance
      const monthlyInterest = (remainingBalance * (cardInterestRate / 100)) / 12;
      const principal = monthlyPayment;

      // Create aggregated expense for the card
      expenses.push({
        id: `card-${card.id}-monthly`,
        origin: 'credit_card',
        source_id: card.id,
        source_name: `${card.name} (${card.bank})`,
        description: `Pago mensual - ${card.name}`,
        total_amount: monthlyPayment + monthlyInterest,
        principal_amount: principal,
        interest_amount: monthlyInterest,
        due_date: dueDate,
        is_shared: card.is_shared,
        shared_budget_id: card.shared_budget_id,
        installment_number: 0, // Aggregated
        installments_total: 0,
        bank: card.bank,
      });
    });

    // Sort by due date
    return expenses.sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [activeLoans, creditCards, purchases, getCardPurchases, currentCycle]);

  const totals = useMemo(() => {
    return debtExpenses.reduce(
      (acc, expense) => ({
        total: acc.total + expense.total_amount,
        principal: acc.principal + expense.principal_amount,
        interest: acc.interest + expense.interest_amount,
        loans: acc.loans + (expense.origin === 'loan' ? expense.total_amount : 0),
        cards: acc.cards + (expense.origin === 'credit_card' ? expense.total_amount : 0),
      }),
      { total: 0, principal: 0, interest: 0, loans: 0, cards: 0 }
    );
  }, [debtExpenses]);

  return {
    debtExpenses,
    totals,
    loading: loansLoading || cardsLoading,
  };
}
