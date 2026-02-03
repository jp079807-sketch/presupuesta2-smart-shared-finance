import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Receipt,
  CheckCircle2,
  Circle,
  Bell,
  BellOff,
  Calendar,
  Loader2,
  Users,
  CreditCard,
  Landmark,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExpenses, Expense, ExpenseFormData, ExpenseType, ReminderChannel } from '@/hooks/useExpenses';
import { useDebtExpenses, DebtExpense } from '@/hooks/useDebtExpenses';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const expenseCategories = [
  'Vivienda', 'Alimentación', 'Transporte', 'Servicios', 'Salud', 
  'Entretenimiento', 'Ropa', 'Educación', 'Deudas', 'Otros'
];

interface SharedBudget {
  id: string;
  name: string;
}

export default function ExpensesPage() {
  const { user } = useAuth();
  const { expenses, loading, totals, addExpense, updateExpense, deleteExpense, togglePaid } = useExpenses();
  const { debtExpenses, totals: debtTotals, loading: debtLoading } = useDebtExpenses();
  const { preferences } = useUserPreferences();
  const [filter, setFilter] = useState<'all' | 'fixed' | 'variable' | 'debts'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sharedBudgets, setSharedBudgets] = useState<SharedBudget[]>([]);
  const [formData, setFormData] = useState({
    type: 'variable' as ExpenseType,
    category: '',
    description: '',
    amount: '',
    expense_date: '',
    due_date: '',
    is_paid: false,
    reminder_enabled: false,
    reminder_channel: 'email' as ReminderChannel,
    reminder_days_before: 3,
    shared_budget_id: '' as string,
  });

  // Fetch shared budgets for the dropdown
  useEffect(() => {
    const fetchSharedBudgets = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('shared_budgets')
        .select('id, name')
        .or(`created_by.eq.${user.id}`);

      if (!error && data) {
        setSharedBudgets(data);
      }
    };

    fetchSharedBudgets();
  }, [user]);

  const filteredExpenses = expenses.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'debts') return false; // Debts shown separately
    return e.type === filter;
  });

  // Combined totals including debt expenses
  const combinedTotals = {
    ...totals,
    debts: debtTotals.total,
    total: totals.total + debtTotals.total,
  };

  const handleOpenForm = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        type: expense.type,
        category: expense.category,
        description: expense.description || '',
        amount: expense.amount.toString(),
        expense_date: expense.expense_date || '',
        due_date: expense.due_date || '',
        is_paid: expense.is_paid,
        reminder_enabled: expense.reminder_enabled,
        reminder_channel: expense.reminder_channel || 'email',
        reminder_days_before: expense.reminder_days_before || 3,
        shared_budget_id: expense.shared_budget_id || '',
      });
    } else {
      setEditingExpense(null);
      setFormData({
        type: 'variable',
        category: '',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        due_date: '',
        is_paid: false,
        reminder_enabled: false,
        reminder_channel: 'email',
        reminder_days_before: 3,
        shared_budget_id: '',
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const data: ExpenseFormData = {
      type: formData.type,
      category: formData.category,
      description: formData.description || undefined,
      amount: parseFloat(formData.amount),
      expense_date: formData.expense_date || undefined,
      due_date: formData.due_date || undefined,
      is_paid: formData.is_paid,
      reminder_enabled: formData.reminder_enabled,
      reminder_channel: formData.reminder_enabled ? formData.reminder_channel : undefined,
      reminder_days_before: formData.reminder_enabled ? formData.reminder_days_before : undefined,
      shared_budget_id: formData.shared_budget_id || null,
    };

    if (editingExpense) {
      await updateExpense(editingExpense.id, data);
    } else {
      await addExpense(data);
    }

    setIsFormOpen(false);
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (deletingExpense) {
      await deleteExpense(deletingExpense.id);
      setIsDeleteOpen(false);
      setDeletingExpense(null);
    }
  };

  if (loading || debtLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader 
        title="Gastos"
        description="Gestiona tus gastos fijos y variables"
        action={
          <Button onClick={() => handleOpenForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir gasto
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <StatCard
          title="Gastos Fijos"
          value={formatCurrency(totals.fixed, preferences.currency)}
          subtitle={`${expenses.filter(e => e.type === 'fixed').length} gastos`}
          icon={<Receipt className="h-6 w-6" />}
          variant="expense"
        />
        <StatCard
          title="Gastos Variables"
          value={formatCurrency(totals.variable, preferences.currency)}
          subtitle={`${expenses.filter(e => e.type === 'variable').length} gastos`}
          icon={<Receipt className="h-6 w-6" />}
          variant="default"
        />
        <StatCard
          title="Cuotas Deudas"
          value={formatCurrency(debtTotals.total, preferences.currency)}
          subtitle={`${debtExpenses.length} pagos pendientes`}
          icon={<Wallet className="h-6 w-6" />}
          variant="expense"
        />
        <StatCard
          title="Total Mensual"
          value={formatCurrency(combinedTotals.total, preferences.currency)}
          subtitle={`${totals.pending} gastos pendientes`}
          icon={<Calendar className="h-6 w-6" />}
          variant="default"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="mb-6" onValueChange={(v) => setFilter(v as 'all' | 'fixed' | 'variable' | 'debts')}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="fixed">Fijos</TabsTrigger>
          <TabsTrigger value="variable">Variables</TabsTrigger>
          <TabsTrigger value="debts" className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            Deudas
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Debt Expenses Section - shown when 'debts' or 'all' is selected */}
      {(filter === 'debts' || filter === 'all') && debtExpenses.length > 0 && (
        <div className="mb-6">
          {filter === 'all' && (
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Cuotas de Deudas del Periodo
            </h3>
          )}
          <motion.div layout className="space-y-3">
            <AnimatePresence>
              {debtExpenses.map((debt) => (
                <motion.div
                  key={debt.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className={cn(
                    "shadow-card hover:shadow-card-hover transition-all duration-300",
                    "border-l-4",
                    debt.origin === 'loan' ? "border-l-warning" : "border-l-primary"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          {debt.origin === 'loan' ? (
                            <Landmark className="h-6 w-6 text-warning" />
                          ) : (
                            <CreditCard className="h-6 w-6 text-primary" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full",
                              debt.origin === 'loan'
                                ? "bg-warning/10 text-warning"
                                : "bg-primary/10 text-primary"
                            )}>
                              {debt.origin === 'loan' ? 'Préstamo' : 'Tarjeta'}
                            </span>
                            {debt.installment_number > 0 && (
                              <span className="text-xs text-muted-foreground">
                                Cuota {debt.installment_number}/{debt.installments_total}
                              </span>
                            )}
                            {debt.is_shared && (
                              <span className="flex items-center gap-1 text-xs text-shared">
                                <Users className="h-3 w-3" />
                                Compartido
                              </span>
                            )}
                          </div>
                          <p className="font-medium truncate">
                            {debt.source_name}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            {debt.due_date && (
                              <span>
                                Vence: {new Date(debt.due_date).toLocaleDateString('es-ES')}
                              </span>
                            )}
                            {(debt.lender || debt.bank) && (
                              <span>{debt.lender || debt.bank}</span>
                            )}
                          </div>
                        </div>

                        {/* Amount Breakdown */}
                        <div className="text-right">
                          <p className="text-lg font-bold text-expense tabular-nums">
                            {formatCurrency(debt.total_amount, preferences.currency)}
                          </p>
                          <div className="flex flex-col text-xs text-muted-foreground gap-0.5">
                            <span className="flex items-center justify-end gap-1">
                              <span>Capital:</span>
                              <span className="tabular-nums">{formatCurrency(debt.principal_amount, preferences.currency)}</span>
                            </span>
                            {debt.interest_amount > 0 && (
                              <span className="flex items-center justify-end gap-1 text-warning">
                                <TrendingUp className="h-3 w-3" />
                                <span>Interés:</span>
                                <span className="tabular-nums">{formatCurrency(debt.interest_amount, preferences.currency)}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* Debt summary card when debts filter is active */}
      {filter === 'debts' && debtExpenses.length > 0 && (
        <Card className="mb-6 bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resumen de Cuotas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold tabular-nums">{formatCurrency(debtTotals.total, preferences.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Capital</p>
                <p className="text-lg font-semibold tabular-nums">{formatCurrency(debtTotals.principal, preferences.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3 text-warning" />
                  Intereses
                </p>
                <p className="text-lg font-semibold text-warning tabular-nums">{formatCurrency(debtTotals.interest, preferences.currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state for debts */}
      {filter === 'debts' && debtExpenses.length === 0 && (
        <EmptyState
          icon={<Wallet className="h-8 w-8" />}
          title="No hay cuotas pendientes"
          description="No tienes cuotas de deudas pendientes para este periodo"
        />
      )}

      {/* Regular Expense List - hidden when only debts filter is active */}
      {filter !== 'debts' && (
        <>
          {filter === 'all' && filteredExpenses.length > 0 && (
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Gastos Registrados
            </h3>
          )}
          {filteredExpenses.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-8 w-8" />}
              title="No hay gastos registrados"
              description="Añade tus gastos para llevar un control de tu presupuesto"
              action={{ label: 'Añadir primer gasto', onClick: () => handleOpenForm() }}
            />
          ) : (
            <motion.div layout className="space-y-3">
              <AnimatePresence>
                {filteredExpenses.map((expense) => (
                  <motion.div
                    key={expense.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className={cn(
                      "shadow-card hover:shadow-card-hover transition-all duration-300",
                      expense.is_paid ? "opacity-60" : "",
                      expense.type === 'fixed' ? "border-l-4 border-l-expense" : "border-l-4 border-l-muted-foreground/30"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Paid Toggle */}
                          <button
                            onClick={() => togglePaid(expense.id, expense.is_paid)}
                            className="flex-shrink-0 transition-transform hover:scale-110"
                          >
                            {expense.is_paid ? (
                              <CheckCircle2 className="h-6 w-6 text-success" />
                            ) : (
                              <Circle className="h-6 w-6 text-muted-foreground" />
                            )}
                          </button>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                expense.type === 'fixed' 
                                  ? "bg-expense-muted text-expense" 
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {expense.type === 'fixed' ? 'Fijo' : 'Variable'}
                              </span>
                              <span className="text-xs text-muted-foreground">{expense.category}</span>
                              {expense.reminder_enabled && (
                                <Bell className="h-3.5 w-3.5 text-warning" />
                              )}
                              {expense.shared_budget_id && (
                                <span className="flex items-center gap-1 text-xs text-shared">
                                  <Users className="h-3 w-3" />
                                  Compartido
                                </span>
                              )}
                            </div>
                            <p className={cn(
                              "font-medium truncate",
                              expense.is_paid && "line-through"
                            )}>
                              {expense.description || expense.category}
                            </p>
                            {expense.due_date && (
                              <p className="text-xs text-muted-foreground">
                                Vence: {new Date(expense.due_date).toLocaleDateString('es-ES')}
                              </p>
                            )}
                          </div>

                          {/* Amount */}
                          <div className="text-right">
                            <p className="text-lg font-bold text-expense tabular-nums">
                              {formatCurrency(Number(expense.amount), preferences.currency)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenForm(expense)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => { setDeletingExpense(expense); setIsDeleteOpen(true); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Editar gasto' : 'Añadir nuevo gasto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de gasto</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.type === 'fixed' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setFormData({ ...formData, type: 'fixed' })}
                >
                  Fijo
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 'variable' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setFormData({ ...formData, type: 'variable' })}
                >
                  Variable
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {formData.type === 'variable' && (
                <div className="space-y-2">
                  <Label htmlFor="expense_date">Fecha de gasto</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  />
                </div>
              )}
              {formData.type === 'fixed' && (
                <div className="space-y-2">
                  <Label htmlFor="due_date">Fecha de vencimiento</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Shared Budget Selection */}
            {sharedBudgets.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="shared_budget" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-shared" />
                  Presupuesto compartido (opcional)
                </Label>
                <Select 
                  value={formData.shared_budget_id} 
                  onValueChange={(value) => setFormData({ ...formData, shared_budget_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Gasto personal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Gasto personal</SelectItem>
                    {sharedBudgets.map((budget) => (
                      <SelectItem key={budget.id} value={budget.id}>{budget.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.type === 'fixed' && (
              <div className="space-y-4 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {formData.reminder_enabled ? <Bell className="h-4 w-4 text-warning" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
                    <Label htmlFor="reminder">Recordatorio</Label>
                  </div>
                  <Switch
                    id="reminder"
                    checked={formData.reminder_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })}
                  />
                </div>
                {formData.reminder_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Canal</Label>
                      <Select 
                        value={formData.reminder_channel} 
                        onValueChange={(value: ReminderChannel) => setFormData({ ...formData, reminder_channel: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Días antes</Label>
                      <Select 
                        value={formData.reminder_days_before.toString()} 
                        onValueChange={(value) => setFormData({ ...formData, reminder_days_before: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 5, 7].map((days) => (
                            <SelectItem key={days} value={days.toString()}>{days} días</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingExpense ? 'Guardar' : 'Añadir'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El gasto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
