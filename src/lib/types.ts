// Presupuesta2 Types

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type IncomeFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'one-time';

export interface Income {
  id: string;
  user_id: string;
  source: string;
  gross_amount: number;
  net_amount: number;
  frequency: IncomeFrequency;
  created_at: string;
  updated_at: string;
}

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
  created_at: string;
  updated_at: string;
}

export type DebtStatus = 'active' | 'paid' | 'defaulted';

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  total_amount: number;
  interest_rate: number;
  period_months: number;
  installments_total: number;
  installments_remaining: number;
  installment_amount: number;
  start_date: string;
  status: DebtStatus;
  created_at: string;
  updated_at: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  note: string | null;
  created_at: string;
}

export interface SharedBudget {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type MemberRole = 'owner' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'rejected';

export interface SharedBudgetMember {
  id: string;
  budget_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: MemberRole;
  invitation_status: InvitationStatus;
  contribution_percentage: number;
  created_at: string;
  updated_at: string;
  // Joined data
  profile?: Profile;
}

export interface SharedExpense {
  id: string;
  budget_id: string;
  created_by: string;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
  is_paid: boolean;
  paid_by: string | null;
  created_at: string;
  updated_at: string;
}

// Dashboard Types
export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  remainingBudget: number;
  dailyRecommendedSpend: number;
  upcomingExpenses: Expense[];
  recentTransactions: (Income | Expense)[];
}

export interface SharedBudgetSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  members: Array<{
    profile: Profile | null;
    income: number;
    contributionPercentage: number;
    expectedContribution: number;
    actualContribution: number;
    difference: number;
  }>;
}

// Form Types
export interface IncomeFormData {
  source: string;
  gross_amount: number;
  net_amount: number;
  frequency: IncomeFrequency;
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
}

export interface DebtFormData {
  name: string;
  total_amount: number;
  interest_rate: number;
  period_months: number;
  installments_total: number;
  start_date: string;
}
