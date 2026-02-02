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
  Plus
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
import { formatCurrency } from '@/lib/currency';
import { formatCycleRange } from '@/lib/budget-cycle';

// Placeholder data - will be replaced with real data from Supabase
const dashboardData = {
  balance: 2450.00,
  totalIncome: 4500.00,
  totalExpenses: 2050.00,
  remainingBudget: 1200.00,
  dailyRecommended: 85.00,
  budgetUsed: 63,
};

const upcomingExpenses = [
  { id: 1, category: 'Alquiler', amount: 850, due_date: '2024-02-01', is_paid: false },
  { id: 2, category: 'Internet', amount: 45, due_date: '2024-02-05', is_paid: false },
  { id: 3, category: 'Luz', amount: 78, due_date: '2024-02-10', is_paid: false },
];

const recentTransactions = [
  { id: 1, type: 'expense', category: 'Supermercado', amount: -85.50, date: '2024-01-28' },
  { id: 2, type: 'income', category: 'Salario', amount: 3200.00, date: '2024-01-25' },
  { id: 3, type: 'expense', category: 'Gasolina', amount: -55.00, date: '2024-01-24' },
  { id: 4, type: 'expense', category: 'Restaurante', amount: -42.80, date: '2024-01-23' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { preferences, currentCycle } = useUserPreferences();

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
            value={formatCurrency(dashboardData.balance, preferences.currency)}
            subtitle="Ingresos - Gastos del mes"
            icon={<Wallet className="h-6 w-6" />}
            variant="primary"
          />
          <StatCard
            title="Ingresos"
            value={formatCurrency(dashboardData.totalIncome, preferences.currency)}
            icon={<TrendingUp className="h-6 w-6" />}
            variant="income"
            trend={{ value: 5.2, isPositive: true }}
          />
          <StatCard
            title="Gastos"
            value={formatCurrency(dashboardData.totalExpenses, preferences.currency)}
            icon={<TrendingDown className="h-6 w-6" />}
            variant="expense"
            trend={{ value: 2.1, isPositive: false }}
          />
          <StatCard
            title="Disponible"
            value={formatCurrency(dashboardData.remainingBudget, preferences.currency)}
            subtitle={`${formatCurrency(dashboardData.dailyRecommended, preferences.currency)}/día recomendado`}
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
                  <span className="text-muted-foreground">Gastado este mes</span>
                  <span className="font-medium">{dashboardData.budgetUsed}%</span>
                </div>
                <Progress value={dashboardData.budgetUsed} className="h-3" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl bg-income-muted p-4">
                  <p className="text-sm text-muted-foreground">Presupuesto mensual</p>
                  <p className="text-xl font-bold text-income">
                    {formatCurrency(dashboardData.totalIncome, preferences.currency)}
                  </p>
                </div>
                <div className="rounded-xl bg-expense-muted p-4">
                  <p className="text-sm text-muted-foreground">Gastado</p>
                  <p className="text-xl font-bold text-expense">
                    {formatCurrency(dashboardData.totalExpenses, preferences.currency)}
                  </p>
                </div>
              </div>
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
              <div className="space-y-3">
                {upcomingExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between rounded-xl border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{expense.category}</p>
                      <p className="text-sm text-muted-foreground">
                        Vence el {new Date(expense.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-expense">
                        {formatCurrency(expense.amount, preferences.currency)}
                      </p>
                      <span className="text-xs text-warning">Pendiente</span>
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        transaction.type === 'income' ? 'bg-income-muted' : 'bg-expense-muted'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-5 w-5 text-income" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-expense" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <p className={`font-semibold tabular-nums ${
                      transaction.amount > 0 ? 'text-income' : 'text-expense'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}
                      {formatCurrency(Math.abs(transaction.amount), preferences.currency)}
                    </p>
                  </div>
                ))}
              </div>
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
