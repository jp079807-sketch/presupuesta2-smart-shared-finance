import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar,
  AlertTriangle,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Loader2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GroceryWidget } from '@/components/dashboard/GroceryWidget';
import { useNavigate } from 'react-router-dom';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useIncomes } from '@/hooks/useIncomes';
import { useExpenses } from '@/hooks/useExpenses';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useLoans } from '@/hooks/useLoans';
import { formatCurrency } from '@/lib/currency';
import { formatCycleRange } from '@/lib/budget-cycle';

export default function Dashboard() {
  const navigate = useNavigate();
  const { preferences, currentCycle } = useUserPreferences();
  const { totals: incomeTotals, loading: incomesLoading } = useIncomes();
  const { expenses, totals: expenseTotals, loading: expensesLoading } = useExpenses();
  const { getTotalDebt: getCardDebt, getMonthlyPayment: getCardMonthly } = useCreditCards();
  const { getTotalDebt: getLoanDebt, getMonthlyPayment: getLoanMonthly } = useLoans();

  const loading = incomesLoading || expensesLoading;

  // Calculate dashboard data
  const totalIncome = incomeTotals.net;
  const totalExpenses = expenseTotals.total;
  const balance = totalIncome - totalExpenses;
  const totalDebt = getCardDebt() + getLoanDebt();
  const monthlyDebtPayment = getCardMonthly() + getLoanMonthly();
  const remainingBudget = totalIncome - totalExpenses - monthlyDebtPayment;
  
  const budgetUsed = totalIncome > 0 
    ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100))
    : 0;

  const dailyRecommended = currentCycle && currentCycle.daysRemaining > 0
    ? remainingBudget / currentCycle.daysRemaining
    : 0;

  // Get upcoming expenses (unpaid fixed expenses)
  const upcomingExpenses = expenses
    .filter(e => e.type === 'fixed' && !e.is_paid && e.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  // Get recent transactions
  const recentTransactions = expenses
    .filter(e => e.expense_date || e.due_date)
    .sort((a, b) => {
      const dateA = new Date(a.expense_date || a.due_date || a.created_at);
      const dateB = new Date(b.expense_date || b.due_date || b.created_at);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
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

  return (
    <AppLayout>
      <PageHeader 
        title="Dashboard"
        description={currentCycle ? `Ciclo: ${formatCycleRange(currentCycle)}` : 'Resumen de tu situación financiera actual'}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Main Stats */}
        <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Balance Actual"
            value={formatCurrency(balance, preferences.currency)}
            subtitle="Ingresos - Gastos del mes"
            icon={<Wallet className="h-6 w-6" />}
            variant="primary"
          />
          <StatCard
            title="Ingresos Netos"
            value={formatCurrency(totalIncome, preferences.currency)}
            icon={<TrendingUp className="h-6 w-6" />}
            variant="income"
          />
          <StatCard
            title="Gastos"
            value={formatCurrency(totalExpenses, preferences.currency)}
            icon={<TrendingDown className="h-6 w-6" />}
            variant="expense"
          />
          <StatCard
            title="Disponible"
            value={formatCurrency(Math.max(0, remainingBudget), preferences.currency)}
            subtitle={dailyRecommended > 0 ? `${formatCurrency(dailyRecommended, preferences.currency)}/día recomendado` : undefined}
            icon={<Calendar className="h-6 w-6" />}
            variant="default"
          />
        </motion.div>

        {/* Budget Progress, Grocery & Alerts */}
        <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-card lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Progreso del Presupuesto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gastado este ciclo</span>
                  <span className="font-medium">{budgetUsed}%</span>
                </div>
                <Progress value={budgetUsed} className="h-3" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl bg-income-muted p-4">
                  <p className="text-sm text-muted-foreground">Ingresos netos</p>
                  <p className="text-xl font-bold text-income">
                    {formatCurrency(totalIncome, preferences.currency)}
                  </p>
                </div>
                <div className="rounded-xl bg-expense-muted p-4">
                  <p className="text-sm text-muted-foreground">Gastado</p>
                  <p className="text-xl font-bold text-expense">
                    {formatCurrency(totalExpenses, preferences.currency)}
                  </p>
                </div>
              </div>
              {totalDebt > 0 && (
                <div className="rounded-xl bg-debt-muted p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Deuda total</p>
                      <p className="text-lg font-bold text-debt">
                        {formatCurrency(totalDebt, preferences.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Pago mensual</p>
                      <p className="text-lg font-bold text-debt">
                        {formatCurrency(monthlyDebtPayment, preferences.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grocery Widget */}
          <GroceryWidget />
        </motion.div>

        {/* Upcoming Expenses */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Próximos Vencimientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingExpenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No hay gastos pendientes
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between rounded-xl border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{expense.description || expense.category}</p>
                        <p className="text-sm text-muted-foreground">
                          Vence el {new Date(expense.due_date!).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-expense">
                          {formatCurrency(Number(expense.amount), preferences.currency)}
                        </p>
                        <span className="text-xs text-warning">Pendiente</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="mt-4 w-full" onClick={() => navigate('/gastos')}>
                Ver todos los gastos
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transactions & Shared Budget */}
        <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Movimientos Recientes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/gastos')}>
                Ver todos
              </Button>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No hay movimientos recientes
                </p>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-expense-muted">
                          <ArrowDownRight className="h-5 w-5 text-expense" />
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description || transaction.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.expense_date || transaction.due_date || transaction.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold tabular-nums text-expense">
                        -{formatCurrency(Number(transaction.amount), preferences.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border-shared/20 bg-shared-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-shared" />
                Presupuesto Compartido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Gestiona gastos compartidos con tu pareja de forma equitativa, basado en los ingresos de cada uno.
              </p>
              <div className="rounded-xl bg-background p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Distribución equitativa</span>
                  <span className="text-sm font-medium">Basada en ingresos</span>
                </div>
                <div className="flex gap-2">
                  <div className="h-2 flex-1 rounded-full bg-primary" style={{ width: '60%' }} />
                  <div className="h-2 flex-1 rounded-full bg-shared" style={{ width: '40%' }} />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Tú: 60%</span>
                  <span>Pareja: 40%</span>
                </div>
              </div>
              <Button className="w-full" onClick={() => navigate('/compartido')}>
                <Plus className="h-4 w-4 mr-2" />
                Configurar presupuesto compartido
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
