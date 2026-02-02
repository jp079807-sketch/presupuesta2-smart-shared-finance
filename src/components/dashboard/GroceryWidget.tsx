import { motion } from 'framer-motion';
import { ShoppingCart, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGroceryBudget } from '@/hooks/useGroceryBudget';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function GroceryWidget() {
  const { summary, loading } = useGroceryBudget();
  const { preferences } = useUserPreferences();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAlertStyles = () => {
    switch (summary.alertLevel) {
      case 'exceeded':
        return 'border-destructive/50 bg-destructive/10';
      case 'danger':
        return 'border-expense/50 bg-expense/10';
      case 'warning':
        return 'border-warning/50 bg-warning/10';
      default:
        return '';
    }
  };

  const getProgressColor = () => {
    switch (summary.alertLevel) {
      case 'exceeded':
        return 'bg-destructive';
      case 'danger':
        return 'bg-expense';
      case 'warning':
        return 'bg-warning';
      default:
        return 'bg-income';
    }
  };

  if (!summary.budget) {
    return (
      <Card className="shadow-card border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
              <ShoppingCart className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium mb-1">Presupuesto de Mercado</p>
            <p className="text-sm text-muted-foreground mb-4">
              Aún no has configurado tu presupuesto
            </p>
            <Button size="sm" onClick={() => navigate('/mercado')}>
              Configurar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('shadow-card transition-colors', getAlertStyles())}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Mercado
          </span>
          <Button variant="ghost" size="sm" onClick={() => navigate('/mercado')}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Alert Banner */}
        {summary.alertLevel !== 'safe' && (
          <div className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium',
            summary.alertLevel === 'exceeded' && 'bg-destructive text-destructive-foreground',
            summary.alertLevel === 'danger' && 'bg-expense text-white',
            summary.alertLevel === 'warning' && 'bg-warning text-warning-foreground'
          )}>
            <AlertTriangle className="h-3 w-3" />
            {summary.alertLevel === 'exceeded' && '¡Presupuesto excedido!'}
            {summary.alertLevel === 'danger' && '¡Más del 90% usado!'}
            {summary.alertLevel === 'warning' && 'Más del 70% usado'}
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Consumido</span>
            <span className="font-medium">{Math.min(summary.percentageUsed, 100).toFixed(0)}%</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(summary.percentageUsed, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={cn('h-full rounded-full', getProgressColor())}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="text-center rounded-lg bg-background p-2 border">
            <p className="text-xs text-muted-foreground">Gastado</p>
            <p className="text-sm font-bold text-expense">
              {formatCurrency(summary.totalSpent, preferences.currency)}
            </p>
          </div>
          <div className={cn(
            'text-center rounded-lg p-2',
            summary.remaining >= 0 ? 'bg-income-muted' : 'bg-destructive/20'
          )}>
            <p className="text-xs text-muted-foreground">
              {summary.remaining >= 0 ? 'Disponible' : 'Excedido'}
            </p>
            <p className={cn(
              'text-sm font-bold',
              summary.remaining >= 0 ? 'text-income' : 'text-destructive'
            )}>
              {formatCurrency(Math.abs(summary.remaining), preferences.currency)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
