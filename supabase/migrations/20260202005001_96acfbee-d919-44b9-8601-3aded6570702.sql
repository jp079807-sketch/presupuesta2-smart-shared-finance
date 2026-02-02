-- Add currency and budget cycle preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN currency TEXT NOT NULL DEFAULT 'COP' CHECK (currency IN ('COP', 'USD')),
ADD COLUMN cycle_start_day INTEGER NOT NULL DEFAULT 1 CHECK (cycle_start_day >= 1 AND cycle_start_day <= 28);

-- Create grocery budgets table (monthly/cycle budget for groceries)
CREATE TABLE public.grocery_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  budget_amount NUMERIC NOT NULL DEFAULT 0,
  cycle_start_date DATE NOT NULL,
  cycle_end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create grocery purchases table (individual purchases)
CREATE TABLE public.grocery_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  grocery_budget_id UUID NOT NULL REFERENCES public.grocery_budgets(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on grocery tables
ALTER TABLE public.grocery_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for grocery_budgets
CREATE POLICY "Users can view their own grocery budgets"
ON public.grocery_budgets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own grocery budgets"
ON public.grocery_budgets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grocery budgets"
ON public.grocery_budgets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grocery budgets"
ON public.grocery_budgets FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for grocery_purchases
CREATE POLICY "Users can view their own grocery purchases"
ON public.grocery_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own grocery purchases"
ON public.grocery_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grocery purchases"
ON public.grocery_purchases FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grocery purchases"
ON public.grocery_purchases FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at on grocery_budgets
CREATE TRIGGER update_grocery_budgets_updated_at
BEFORE UPDATE ON public.grocery_budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();