import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus,
  UserPlus,
  Receipt,
  TrendingUp,
  Wallet,
  Mail,
  Loader2,
  CreditCard,
  Landmark,
  Edit2,
  Trash2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useSharedBudget, AggregatedExpense } from '@/hooks/useSharedBudget';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

export default function SharedBudgetPage() {
  const { toast } = useToast();
  const { preferences } = useUserPreferences();
  const { 
    summary, 
    loading, 
    hasBudget,
    createBudget,
    inviteMember,
    addSharedExpense,
    updateSharedExpense,
    deleteSharedExpense
  } = useSharedBudget();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<AggregatedExpense | null>(null);
  
  const [budgetName, setBudgetName] = useState('Presupuesto de Pareja');
  const [inviteEmail, setInviteEmail] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateBudget = async () => {
    if (!budgetName.trim()) return;
    
    setIsSubmitting(true);
    const result = await createBudget(budgetName);
    setIsSubmitting(false);
    
    if (result) {
      setIsCreateOpen(false);
      setBudgetName('Presupuesto de Pareja');
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    setIsSubmitting(true);
    const success = await inviteMember(inviteEmail);
    setIsSubmitting(false);
    
    if (success) {
      setInviteEmail('');
      setIsInviteOpen(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseCategory.trim() || !expenseAmount) return;
    
    setIsSubmitting(true);
    const result = await addSharedExpense({
      category: expenseCategory,
      description: expenseDescription || undefined,
      amount: parseFloat(expenseAmount),
      expense_date: expenseDate,
    });
    setIsSubmitting(false);
    
    if (result) {
      setExpenseCategory('');
      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setIsAddExpenseOpen(false);
    }
  };

  const handleEditExpense = async () => {
    if (!selectedExpense || !expenseCategory.trim() || !expenseAmount) return;
    
    setIsSubmitting(true);
    const success = await updateSharedExpense(selectedExpense.id, {
      category: expenseCategory,
      description: expenseDescription || undefined,
      amount: parseFloat(expenseAmount),
      expense_date: expenseDate,
    });
    setIsSubmitting(false);
    
    if (success) {
      setSelectedExpense(null);
      setExpenseCategory('');
      setExpenseAmount('');
      setExpenseDescription('');
      setIsEditExpenseOpen(false);
    }
  };

  const handleDeleteExpense = async (expense: AggregatedExpense) => {
    if (expense.origin === 'debt') {
      toast({
        title: 'No eliminable',
        description: 'Los gastos de deuda se gestionan desde el módulo de deudas.',
        variant: 'destructive',
      });
      return;
    }
    
    await deleteSharedExpense(expense.id);
  };

  const openEditDialog = (expense: AggregatedExpense) => {
    if (expense.origin === 'debt') {
      toast({
        title: 'No editable',
        description: 'Los gastos de deuda se gestionan desde el módulo de deudas.',
      });
      return;
    }
    
    setSelectedExpense(expense);
    setExpenseCategory(expense.category);
    setExpenseAmount(expense.amount.toString());
    setExpenseDescription(expense.description || '');
    setExpenseDate(expense.expense_date || new Date().toISOString().split('T')[0]);
    setIsEditExpenseOpen(true);
  };

  const getOriginBadge = (origin: string) => {
    switch (origin) {
      case 'debt':
        return <Badge variant="outline" className="bg-debt-muted text-debt border-debt/30">Deuda</Badge>;
      case 'recurring':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Recurrente</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted">Manual</Badge>;
    }
  };

  const getOriginIcon = (expense: AggregatedExpense) => {
    if (expense.origin === 'debt' && expense.debt_info) {
      return expense.debt_info.type === 'credit_card' 
        ? <CreditCard className="h-5 w-5 text-debt" />
        : <Landmark className="h-5 w-5 text-debt" />;
    }
    return <Receipt className="h-5 w-5 text-shared" />;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!hasBudget) {
    return (
      <AppLayout>
        <PageHeader 
          title="Presupuesto Compartido"
          description="Gestiona gastos con tu pareja de forma equitativa"
        />
        
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No tienes un presupuesto compartido"
          description="Crea un presupuesto compartido para gestionar gastos en pareja con distribución equitativa basada en ingresos"
          action={{ label: 'Crear presupuesto compartido', onClick: () => setIsCreateOpen(true) }}
          className="min-h-[400px]"
        />

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear presupuesto compartido</DialogTitle>
              <DialogDescription>
                Configura un presupuesto compartido donde los gastos se distribuyen de forma equitativa según los ingresos de cada miembro.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="rounded-xl bg-shared-muted p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-shared" />
                  Distribución equitativa
                </h4>
                <p className="text-sm text-muted-foreground">
                  Los gastos se reparten proporcionalmente según los ingresos de cada persona. Si ganas más, aportas más. Es justo y equilibrado.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget-name">Nombre del presupuesto</Label>
                <Input 
                  id="budget-name" 
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  placeholder="Presupuesto de Pareja"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateBudget} disabled={isSubmitting || !budgetName.trim()}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear presupuesto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    );
  }

  const { budget, memberSummaries, totalIncome, totalExpenses, balance, expenses } = summary;

  return (
    <AppLayout>
      <PageHeader 
        title={budget?.name || 'Presupuesto Compartido'}
        description="Distribución equitativa basada en ingresos"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsInviteOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invitar
            </Button>
            <Button onClick={() => setIsAddExpenseOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir gasto
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6"
      >
        <StatCard
          title="Ingresos Combinados"
          value={formatCurrency(totalIncome, preferences.currency)}
          icon={<TrendingUp className="h-6 w-6" />}
          variant="income"
        />
        <StatCard
          title="Gastos Compartidos"
          value={formatCurrency(totalExpenses, preferences.currency)}
          icon={<Receipt className="h-6 w-6" />}
          variant="expense"
        />
        <StatCard
          title="Balance Compartido"
          value={formatCurrency(balance, preferences.currency)}
          icon={<Wallet className="h-6 w-6" />}
          variant="shared"
        />
        <StatCard
          title="Miembros"
          value={memberSummaries.length}
          subtitle="activos"
          icon={<Users className="h-6 w-6" />}
          variant="default"
        />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribution Card */}
        <Card className="shadow-card border-shared/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-shared" />
              Distribución Equitativa
            </CardTitle>
            <CardDescription>
              Cada miembro aporta según sus ingresos netos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Income Comparison */}
            {memberSummaries.length > 0 ? (
              <>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Ingresos y porcentajes</p>
                  {memberSummaries.map((member, index) => (
                    <div key={member.user_id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(member.income, preferences.currency)} ({member.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress 
                        value={member.percentage} 
                        className={cn("h-3", index === 0 ? "[&>div]:bg-primary" : "[&>div]:bg-shared")}
                      />
                    </div>
                  ))}
                </div>

                {/* Contribution Summary */}
                <div className="rounded-xl bg-muted/50 p-4 space-y-3">
                  <p className="text-sm font-medium">Resumen de aportes</p>
                  {memberSummaries.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Esperado: {formatCurrency(member.expected_contribution, preferences.currency)} | Real: {formatCurrency(member.actual_contribution, preferences.currency)}
                        </p>
                      </div>
                      <div className={cn(
                        "text-sm font-semibold",
                        member.difference >= 0 ? "text-success" : "text-expense"
                      )}>
                        {member.difference >= 0 ? '+' : ''}{formatCurrency(member.difference, preferences.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>Invita a alguien para ver la distribución</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shared Expenses */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gastos Compartidos</CardTitle>
              <CardDescription>Gastos del presupuesto con su origen</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay gastos compartidos</p>
                <p className="text-sm">Añade gastos manuales o marca deudas como compartidas</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {expenses.map((expense) => {
                  const payer = memberSummaries.find(m => m.user_id === expense.paid_by);
                  return (
                    <div 
                      key={expense.id} 
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
                          expense.origin === 'debt' ? "bg-debt-muted" : "bg-shared-muted"
                        )}>
                          {getOriginIcon(expense)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{expense.description || expense.category}</p>
                            {getOriginBadge(expense.origin)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {payer ? `Pagado por ${payer.name}` : 'Sin asignar'}
                            {expense.expense_date && ` • ${new Date(expense.expense_date).toLocaleDateString('es-CO')}`}
                          </p>
                          {expense.debt_info && (
                            <p className="text-xs text-debt">
                              Capital: {formatCurrency(expense.debt_info.principal, preferences.currency)}
                              {expense.debt_info.interest > 0 && ` | Interés: ${formatCurrency(expense.debt_info.interest, preferences.currency)}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold tabular-nums">
                          {formatCurrency(expense.amount, preferences.currency)}
                        </p>
                        {expense.origin === 'manual' && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => openEditDialog(expense)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteExpense(expense)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar a presupuesto compartido</DialogTitle>
            <DialogDescription>
              Envía una invitación por email para que otra persona se una a tu presupuesto compartido.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email de la persona</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="pareja@email.com"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={isSubmitting || !inviteEmail.trim()}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar invitación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir gasto compartido</DialogTitle>
            <DialogDescription>
              Este gasto se guardará y distribuirá según los ingresos de cada miembro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expense-category">Categoría</Label>
              <Input 
                id="expense-category" 
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                placeholder="Ej: Alquiler, Servicios..." 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-description">Descripción (opcional)</Label>
              <Input 
                id="expense-description" 
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder="Descripción del gasto" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Monto ({preferences.currency})</Label>
              <Input 
                id="expense-amount" 
                type="number" 
                step="0.01" 
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="0" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-date">Fecha</Label>
              <Input 
                id="expense-date" 
                type="date" 
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddExpense} disabled={isSubmitting || !expenseCategory.trim() || !expenseAmount}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Añadir gasto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar gasto compartido</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-expense-category">Categoría</Label>
              <Input 
                id="edit-expense-category" 
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                placeholder="Ej: Alquiler, Servicios..." 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expense-description">Descripción (opcional)</Label>
              <Input 
                id="edit-expense-description" 
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder="Descripción del gasto" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expense-amount">Monto ({preferences.currency})</Label>
              <Input 
                id="edit-expense-amount" 
                type="number" 
                step="0.01" 
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="0" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expense-date">Fecha</Label>
              <Input 
                id="edit-expense-date" 
                type="date" 
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditExpenseOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditExpense} disabled={isSubmitting || !expenseCategory.trim() || !expenseAmount}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
