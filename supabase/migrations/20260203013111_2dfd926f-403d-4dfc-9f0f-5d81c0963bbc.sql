-- Add is_shared column to loans for shared debt tracking
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false;

-- Add shared_budget_id to loans for linking to a shared budget
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS shared_budget_id uuid REFERENCES public.shared_budgets(id) ON DELETE SET NULL;

-- Add is_shared column to credit_cards for shared debt tracking
ALTER TABLE public.credit_cards ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false;

-- Add shared_budget_id to credit_cards for linking to a shared budget
ALTER TABLE public.credit_cards ADD COLUMN IF NOT EXISTS shared_budget_id uuid REFERENCES public.shared_budgets(id) ON DELETE SET NULL;

-- Add origin column to expenses to track where the expense came from (manual, debt, recurring)
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'manual';

-- Create index on shared expenses for faster lookups
CREATE INDEX IF NOT EXISTS idx_expenses_shared_budget_id ON public.expenses(shared_budget_id);
CREATE INDEX IF NOT EXISTS idx_loans_shared ON public.loans(is_shared) WHERE is_shared = true;
CREATE INDEX IF NOT EXISTS idx_credit_cards_shared ON public.credit_cards(is_shared) WHERE is_shared = true;