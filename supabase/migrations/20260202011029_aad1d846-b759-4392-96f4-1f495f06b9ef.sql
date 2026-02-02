-- =============================================
-- REFACTORIZACIÓN: Tarjetas de Crédito + Créditos + Mejoras
-- =============================================

-- Agregar columna de tema al perfil
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'system';

-- Agregar columna de tipo de ingreso para cálculo de neto automático
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS income_type text NOT NULL DEFAULT 'labor_contract';

-- =============================================
-- TARJETAS DE CRÉDITO
-- =============================================
CREATE TABLE public.credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  bank text NOT NULL,
  credit_limit numeric NOT NULL DEFAULT 0,
  cut_off_day integer NOT NULL CHECK (cut_off_day >= 1 AND cut_off_day <= 31),
  payment_due_day integer NOT NULL CHECK (payment_due_day >= 1 AND payment_due_day <= 31),
  interest_rate numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credit cards" ON public.credit_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own credit cards" ON public.credit_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own credit cards" ON public.credit_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own credit cards" ON public.credit_cards FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_credit_cards_updated_at 
  BEFORE UPDATE ON public.credit_cards 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- COMPRAS DE TARJETA DE CRÉDITO
-- =============================================
CREATE TABLE public.card_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credit_card_id uuid NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  description text NOT NULL,
  total_amount numeric NOT NULL,
  installments_total integer NOT NULL DEFAULT 1,
  installments_paid integer NOT NULL DEFAULT 0,
  installment_amount numeric NOT NULL,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.card_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own card purchases" ON public.card_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own card purchases" ON public.card_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own card purchases" ON public.card_purchases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own card purchases" ON public.card_purchases FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_card_purchases_updated_at 
  BEFORE UPDATE ON public.card_purchases 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- CRÉDITOS (Préstamos separados de tarjetas)
-- =============================================
CREATE TABLE public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  lender text, -- Entidad que presta
  total_amount numeric NOT NULL,
  interest_rate numeric NOT NULL DEFAULT 0,
  installments_total integer NOT NULL,
  installments_paid integer NOT NULL DEFAULT 0,
  installment_amount numeric NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid', 'defaulted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own loans" ON public.loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own loans" ON public.loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own loans" ON public.loans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own loans" ON public.loans FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_loans_updated_at 
  BEFORE UPDATE ON public.loans 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PAGOS DE CRÉDITOS (historial)
-- =============================================
CREATE TABLE public.loan_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own loan payments" ON public.loan_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own loan payments" ON public.loan_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own loan payments" ON public.loan_payments FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- MODIFICAR GASTOS PARA SOPORTAR PRESUPUESTOS COMPARTIDOS
-- =============================================
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS shared_budget_id uuid REFERENCES public.shared_budgets(id) ON DELETE SET NULL;