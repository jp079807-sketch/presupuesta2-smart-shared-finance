-- Presupuesta2 Database Schema
-- Complete financial management with shared budgets and equitable distribution

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- INCOMES TABLE
-- ============================================
CREATE TABLE public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  gross_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'yearly', 'one-time')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own incomes"
  ON public.incomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own incomes"
  ON public.incomes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own incomes"
  ON public.incomes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own incomes"
  ON public.incomes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- EXPENSES TABLE (UNIFIED: fixed & variable)
-- ============================================
CREATE TYPE public.expense_type AS ENUM ('fixed', 'variable');
CREATE TYPE public.reminder_channel AS ENUM ('sms', 'email');

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type expense_type NOT NULL DEFAULT 'variable',
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  expense_date DATE,
  due_date DATE,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_channel reminder_channel,
  reminder_days_before INTEGER CHECK (reminder_days_before >= 1 AND reminder_days_before <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- DEBTS TABLE
-- ============================================
CREATE TYPE public.debt_status AS ENUM ('active', 'paid', 'defaulted');

CREATE TABLE public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  period_months INTEGER NOT NULL DEFAULT 12,
  installments_total INTEGER NOT NULL DEFAULT 1,
  installments_remaining INTEGER NOT NULL DEFAULT 1,
  installment_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status debt_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own debts"
  ON public.debts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debts"
  ON public.debts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debts"
  ON public.debts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debts"
  ON public.debts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- DEBT PAYMENTS TABLE (Payment History)
-- ============================================
CREATE TABLE public.debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own debt payments"
  ON public.debt_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debt payments"
  ON public.debt_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debt payments"
  ON public.debt_payments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SHARED BUDGETS TABLE
-- ============================================
CREATE TABLE public.shared_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Presupuesto Compartido',
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_budgets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SHARED BUDGET MEMBERS TABLE
-- ============================================
CREATE TYPE public.member_role AS ENUM ('owner', 'member');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE public.shared_budget_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.shared_budgets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT,
  role member_role NOT NULL DEFAULT 'member',
  invitation_status invitation_status NOT NULL DEFAULT 'pending',
  contribution_percentage DECIMAL(5, 2) DEFAULT 0, -- Calculated based on income
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(budget_id, user_id)
);

ALTER TABLE public.shared_budget_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SHARED EXPENSES TABLE
-- ============================================
CREATE TABLE public.shared_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.shared_budgets(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_expenses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR SHARED BUDGETS
-- ============================================

-- Helper function to check if user is member of a budget
CREATE OR REPLACE FUNCTION public.is_budget_member(budget_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_budget_members
    WHERE budget_id = budget_uuid
      AND user_id = user_uuid
      AND invitation_status = 'accepted'
  );
$$;

-- Shared budgets policies
CREATE POLICY "Members can view their shared budgets"
  ON public.shared_budgets FOR SELECT
  USING (
    public.is_budget_member(id, auth.uid())
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create shared budgets"
  ON public.shared_budgets FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update their shared budgets"
  ON public.shared_budgets FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Owners can delete their shared budgets"
  ON public.shared_budgets FOR DELETE
  USING (auth.uid() = created_by);

-- Shared budget members policies
CREATE POLICY "Members can view budget members"
  ON public.shared_budget_members FOR SELECT
  USING (
    public.is_budget_member(budget_id, auth.uid())
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.shared_budgets
      WHERE id = budget_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Budget owners can insert members"
  ON public.shared_budget_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shared_budgets
      WHERE id = budget_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Budget owners can update members"
  ON public.shared_budget_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_budgets
      WHERE id = budget_id AND created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Budget owners can delete members"
  ON public.shared_budget_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_budgets
      WHERE id = budget_id AND created_by = auth.uid()
    )
  );

-- Shared expenses policies
CREATE POLICY "Members can view shared expenses"
  ON public.shared_expenses FOR SELECT
  USING (public.is_budget_member(budget_id, auth.uid()));

CREATE POLICY "Members can insert shared expenses"
  ON public.shared_expenses FOR INSERT
  WITH CHECK (
    public.is_budget_member(budget_id, auth.uid())
    AND auth.uid() = created_by
  );

CREATE POLICY "Members can update shared expenses"
  ON public.shared_expenses FOR UPDATE
  USING (public.is_budget_member(budget_id, auth.uid()));

CREATE POLICY "Creator can delete shared expenses"
  ON public.shared_expenses FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incomes_updated_at
  BEFORE UPDATE ON public.incomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_debts_updated_at
  BEFORE UPDATE ON public.debts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shared_budgets_updated_at
  BEFORE UPDATE ON public.shared_budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shared_budget_members_updated_at
  BEFORE UPDATE ON public.shared_budget_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shared_expenses_updated_at
  BEFORE UPDATE ON public.shared_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- AUTO-ADD OWNER AS ACCEPTED MEMBER
-- ============================================
CREATE OR REPLACE FUNCTION public.add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.shared_budget_members (budget_id, user_id, role, invitation_status, contribution_percentage)
  VALUES (NEW.id, NEW.created_by, 'owner', 'accepted', 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_shared_budget_created
  AFTER INSERT ON public.shared_budgets
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_member();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_incomes_user_id ON public.incomes(user_id);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_type ON public.expenses(type);
CREATE INDEX idx_expenses_due_date ON public.expenses(due_date);
CREATE INDEX idx_debts_user_id ON public.debts(user_id);
CREATE INDEX idx_debts_status ON public.debts(status);
CREATE INDEX idx_debt_payments_debt_id ON public.debt_payments(debt_id);
CREATE INDEX idx_shared_budget_members_budget_id ON public.shared_budget_members(budget_id);
CREATE INDEX idx_shared_budget_members_user_id ON public.shared_budget_members(user_id);
CREATE INDEX idx_shared_expenses_budget_id ON public.shared_expenses(budget_id);