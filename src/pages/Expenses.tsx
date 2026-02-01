import { useState } from 'react';
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
  Filter,
  Loader2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Expense, ExpenseType, ReminderChannel } from '@/lib/types';
import { cn } from '@/lib/utils';

const expenseCategories = [
  'Vivienda', 'Alimentación', 'Transporte', 'Servicios', 'Salud', 
  'Entretenimiento', 'Ropa', 'Educación', 'Otros'
];

// Placeholder data
const mockExpenses: Expense[] = [
  { 
    id: '1', user_id: '1', type: 'fixed', category: 'Vivienda', description: 'Alquiler mensual',
    amount: 850, expense_date: null, due_date: '2024-02-01', is_paid: false,
    reminder_enabled: true, reminder_channel: 'email', reminder_days_before: 3,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  { 
    id: '2', user_id: '1', type: 'fixed', category: 'Servicios', description: 'Internet fibra',
    amount: 45, expense_date: null, due_date: '2024-02-05', is_paid: false,
    reminder_enabled: false, reminder_channel: null, reminder_days_before: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  { 
    id: '3', user_id: '1', type: 'variable', category: 'Alimentación', description: 'Compra semanal',
    amount: 85.50, expense_date: '2024-01-28', due_date: null, is_paid: true,
    reminder_enabled: false, reminder_channel: null, reminder_days_before: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [filter, setFilter] = useState<'all' | 'fixed' | 'variable'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
  });
  const { toast } = useToast();

  const filteredExpenses = expenses.filter(e => filter === 'all' || e.type === filter);
  const totalFixed = expenses.filter(e => e.type === 'fixed').reduce((sum, e) => sum + e.amount, 0);
  const totalVariable = expenses.filter(e => e.type === 'variable').reduce((sum, e) => sum + e.amount, 0);
  const pendingCount = expenses.filter(e => !e.is_paid).length;

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
      });
    }
    setIsFormOpen(true);
  };

  const togglePaid = (expense: Expense) => {
    setExpenses(expenses.map(e => 
      e.id === expense.id ? { ...e, is_paid: !e.is_paid } : e
    ));
    toast({ 
      title: expense.is_paid ? 'Marcado como pendiente' : 'Marcado como pagado',
      description: `${expense.category} ${expense.is_paid ? 'pendiente de pago' : 'pagado'}`
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (editingExpense) {
        setExpenses(expenses.map(exp => 
          exp.id === editingExpense.id 
            ? { 
                ...exp, 
                ...formData, 
                amount: parseFloat(formData.amount),
                description: formData.description || null,
                expense_date: formData.expense_date || null,
                due_date: formData.due_date || null,
                reminder_channel: formData.reminder_enabled ? formData.reminder_channel : null,
                reminder_days_before: formData.reminder_enabled ? formData.reminder_days_before : null,
              }
            : exp
        ));
        toast({ title: 'Gasto actualizado' });
      } else {
        const newExpense: Expense = {
          id: Date.now().toString(),
          user_id: '1',
          type: formData.type,
          category: formData.category,
          description: formData.description || null,
          amount: parseFloat(formData.amount),
          expense_date: formData.expense_date || null,
          due_date: formData.due_date || null,
          is_paid: formData.is_paid,
          reminder_enabled: formData.reminder_enabled,
          reminder_channel: formData.reminder_enabled ? formData.reminder_channel : null,
          reminder_days_before: formData.reminder_enabled ? formData.reminder_days_before : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setExpenses([...expenses, newExpense]);
        toast({ title: 'Gasto añadido' });
      }
      setIsFormOpen(false);
      setIsLoading(false);
    }, 500);
  };

  const handleDelete = () => {
    if (deletingExpense) {
      setExpenses(expenses.filter(e => e.id !== deletingExpense.id));
      toast({ title: 'Gasto eliminado' });
      setIsDeleteOpen(false);
      setDeletingExpense(null);
    }
  };

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
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard
          title="Gastos Fijos"
          value={totalFixed}
          subtitle={`${expenses.filter(e => e.type === 'fixed').length} gastos`}
          icon={<Receipt className="h-6 w-6" />}
          variant="expense"
        />
        <StatCard
          title="Gastos Variables"
          value={totalVariable}
          subtitle={`${expenses.filter(e => e.type === 'variable').length} gastos`}
          icon={<Receipt className="h-6 w-6" />}
          variant="default"
        />
        <StatCard
          title="Pendientes"
          value={pendingCount}
          subtitle="gastos por pagar"
          icon={<Calendar className="h-6 w-6" />}
          variant="default"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="mb-6" onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="fixed">Fijos</TabsTrigger>
          <TabsTrigger value="variable">Variables</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Expense List */}
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
                        onClick={() => togglePaid(expense)}
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
                        <div className="flex items-center gap-2">
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
                          €{expense.amount.toFixed(2)}
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
              <Label htmlFor="amount">Monto (€)</Label>
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
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={n.toString()}>{n} día{n > 1 ? 's' : ''}</SelectItem>
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
