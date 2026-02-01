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
  CheckCircle2,
  Clock,
  Loader2
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Mock shared budget data
const mockSharedBudget = {
  id: '1',
  name: 'Presupuesto de Pareja',
  members: [
    { id: '1', name: 'Tú', income: 3200, percentage: 61.54, expected: 923.08, actual: 900, difference: -23.08 },
    { id: '2', name: 'Pareja', income: 2000, percentage: 38.46, expected: 576.92, actual: 600, difference: 23.08 },
  ],
  totalIncome: 5200,
  totalExpenses: 1500,
  balance: 3700,
  sharedExpenses: [
    { id: '1', category: 'Alquiler', amount: 850, paid_by: '1', date: '2024-02-01' },
    { id: '2', category: 'Servicios', amount: 150, paid_by: '2', date: '2024-02-05' },
    { id: '3', category: 'Supermercado', amount: 350, paid_by: '1', date: '2024-01-28' },
    { id: '4', category: 'Seguro', amount: 150, paid_by: '2', date: '2024-01-20' },
  ],
};

export default function SharedBudgetPage() {
  const [hasSharedBudget, setHasSharedBudget] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const budget = mockSharedBudget;

  const handleCreateBudget = () => {
    setIsLoading(true);
    setTimeout(() => {
      setHasSharedBudget(true);
      setIsCreateOpen(false);
      setIsLoading(false);
      toast({ title: 'Presupuesto compartido creado' });
    }, 500);
  };

  const handleInvite = () => {
    setIsLoading(true);
    setTimeout(() => {
      toast({ title: 'Invitación enviada', description: `Se ha enviado una invitación a ${inviteEmail}` });
      setInviteEmail('');
      setIsInviteOpen(false);
      setIsLoading(false);
    }, 500);
  };

  if (!hasSharedBudget) {
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
                <Input id="budget-name" defaultValue="Presupuesto de Pareja" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateBudget} disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear presupuesto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader 
        title={budget.name}
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Ingresos Combinados"
          value={budget.totalIncome}
          icon={<TrendingUp className="h-6 w-6" />}
          variant="income"
        />
        <StatCard
          title="Gastos Compartidos"
          value={budget.totalExpenses}
          icon={<Receipt className="h-6 w-6" />}
          variant="expense"
        />
        <StatCard
          title="Balance Compartido"
          value={budget.balance}
          icon={<Wallet className="h-6 w-6" />}
          variant="shared"
        />
        <StatCard
          title="Miembros"
          value={budget.members.length}
          subtitle="activos"
          icon={<Users className="h-6 w-6" />}
          variant="default"
        />
      </div>

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
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Ingresos y porcentajes</p>
              {budget.members.map((member, index) => (
                <div key={member.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{member.name}</span>
                    <span className="text-muted-foreground">
                      €{member.income.toLocaleString()} ({member.percentage.toFixed(1)}%)
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
              {budget.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Esperado: €{member.expected.toFixed(2)} | Real: €{member.actual.toFixed(2)}
                    </p>
                  </div>
                  <div className={cn(
                    "text-sm font-semibold",
                    member.difference >= 0 ? "text-success" : "text-expense"
                  )}>
                    {member.difference >= 0 ? '+' : ''}€{member.difference.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shared Expenses */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gastos Compartidos</CardTitle>
              <CardDescription>Últimos gastos del presupuesto</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {budget.sharedExpenses.map((expense) => {
                const payer = budget.members.find(m => m.id === expense.paid_by);
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-shared-muted">
                        <Receipt className="h-5 w-5 text-shared" />
                      </div>
                      <div>
                        <p className="font-medium">{expense.category}</p>
                        <p className="text-xs text-muted-foreground">
                          Pagado por {payer?.name} • {new Date(expense.date).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold tabular-nums">€{expense.amount.toFixed(2)}</p>
                  </div>
                );
              })}
            </div>
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
            <Button onClick={handleInvite} disabled={isLoading || !inviteEmail}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expense-category">Categoría</Label>
              <Input id="expense-category" placeholder="Ej: Alquiler, Servicios..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Monto (€)</Label>
              <Input id="expense-amount" type="number" step="0.01" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-date">Fecha</Label>
              <Input id="expense-date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>Cancelar</Button>
            <Button onClick={() => { setIsAddExpenseOpen(false); toast({ title: 'Gasto añadido' }); }}>
              Añadir gasto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
