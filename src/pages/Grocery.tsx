import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Edit2, 
  AlertTriangle,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useGroceryBudget, GroceryPurchase } from '@/hooks/useGroceryBudget';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { formatCurrency } from '@/lib/currency';
import { formatCycleRange } from '@/lib/budget-cycle';
import { cn } from '@/lib/utils';

export default function GroceryPage() {
  const { summary, loading, createOrUpdateBudget, addPurchase, updatePurchase, deletePurchase } = useGroceryBudget();
  const { preferences, currentCycle } = useUserPreferences();
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<GroceryPurchase | null>(null);

  // Budget form
  const [budgetAmount, setBudgetAmount] = useState('');

  // Purchase form
  const [purchaseDescription, setPurchaseDescription] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSaveBudget = async () => {
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) return;

    await createOrUpdateBudget(amount);
    setBudgetDialogOpen(false);
    setBudgetAmount('');
  };

  const handleSavePurchase = async () => {
    const amount = parseFloat(purchaseAmount);
    if (!purchaseDescription.trim() || isNaN(amount) || amount <= 0) return;

    if (editingPurchase) {
      await updatePurchase(editingPurchase.id, {
        description: purchaseDescription,
        amount,
        purchase_date: purchaseDate,
      });
    } else {
      await addPurchase(purchaseDescription, amount, purchaseDate);
    }

    setPurchaseDialogOpen(false);
    resetPurchaseForm();
  };

  const resetPurchaseForm = () => {
    setPurchaseDescription('');
    setPurchaseAmount('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setEditingPurchase(null);
  };

  const openEditPurchase = (purchase: GroceryPurchase) => {
    setEditingPurchase(purchase);
    setPurchaseDescription(purchase.description);
    setPurchaseAmount(purchase.amount.toString());
    setPurchaseDate(purchase.purchase_date);
    setPurchaseDialogOpen(true);
  };

  const getAlertStyles = () => {
    switch (summary.alertLevel) {
      case 'exceeded':
        return 'border-destructive/50 bg-destructive/10';
      case 'danger':
        return 'border-expense/50 bg-expense/10';
      case 'warning':
        return 'border-warning/50 bg-warning/10';
      default:
        return 'border-income/30 bg-income/10';
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

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Mercado" description="Cargando..." />
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Presupuesto de Mercado"
        description={currentCycle ? `Ciclo: ${formatCycleRange(currentCycle)}` : 'Gestiona tu gasto de supermercado'}
        action={
          summary.budget && (
            <Dialog open={purchaseDialogOpen} onOpenChange={(open) => {
              setPurchaseDialogOpen(open);
              if (!open) resetPurchaseForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Compra
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPurchase ? 'Editar Compra' : 'Registrar Compra'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      placeholder="Ej: Supermercado Éxito"
                      value={purchaseDescription}
                      onChange={(e) => setPurchaseDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto ({preferences.currency})</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input
                      id="date"
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setPurchaseDialogOpen(false);
                        resetPurchaseForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleSavePurchase}
                      disabled={!purchaseDescription.trim() || !purchaseAmount}
                    >
                      {editingPurchase ? 'Guardar' : 'Registrar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Budget Setup or Summary */}
        {!summary.budget ? (
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 p-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <ShoppingCart className="h-12 w-12" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Configura tu presupuesto de mercado</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Define cuánto planeas gastar en mercado este ciclo
                </p>
                <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-6">
                      <Plus className="h-4 w-4 mr-2" />
                      Definir Presupuesto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Presupuesto de Mercado</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="budget">Monto del presupuesto ({preferences.currency})</Label>
                        <Input
                          id="budget"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Ej: 500000"
                          value={budgetAmount}
                          onChange={(e) => setBudgetAmount(e.target.value)}
                        />
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={handleSaveBudget}
                        disabled={!budgetAmount}
                      >
                        Guardar Presupuesto
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Card */}
            <Card className={cn('shadow-card border-2 transition-colors', getAlertStyles())}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Resumen del Ciclo
                  </CardTitle>
                  <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setBudgetAmount(summary.budget?.budget_amount.toString() || '')}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Presupuesto</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="budget">Monto del presupuesto ({preferences.currency})</Label>
                          <Input
                            id="budget"
                            type="number"
                            min="0"
                            step="1"
                            value={budgetAmount}
                            onChange={(e) => setBudgetAmount(e.target.value)}
                          />
                        </div>
                        <Button className="w-full" onClick={handleSaveBudget}>
                          Actualizar Presupuesto
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Alert Banner */}
                <AnimatePresence>
                  {summary.alertLevel !== 'safe' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                        summary.alertLevel === 'exceeded' && 'bg-destructive text-destructive-foreground',
                        summary.alertLevel === 'danger' && 'bg-expense text-white',
                        summary.alertLevel === 'warning' && 'bg-warning text-warning-foreground'
                      )}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      {summary.alertLevel === 'exceeded' && '¡Presupuesto excedido!'}
                      {summary.alertLevel === 'danger' && '¡Cuidado! Has usado más del 90%'}
                      {summary.alertLevel === 'warning' && 'Atención: Has usado más del 70%'}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Consumido</span>
                    <span className="font-medium">{Math.min(summary.percentageUsed, 100).toFixed(0)}%</span>
                  </div>
                  <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(summary.percentageUsed, 100)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={cn('h-full rounded-full', getProgressColor())}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center rounded-xl bg-background p-3 border">
                    <p className="text-xs text-muted-foreground mb-1">Presupuesto</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(summary.budget?.budget_amount || 0, preferences.currency)}
                    </p>
                  </div>
                  <div className="text-center rounded-xl bg-expense-muted p-3">
                    <p className="text-xs text-muted-foreground mb-1">Gastado</p>
                    <p className="text-lg font-bold text-expense">
                      {formatCurrency(summary.totalSpent, preferences.currency)}
                    </p>
                  </div>
                  <div className={cn(
                    'text-center rounded-xl p-3',
                    summary.remaining >= 0 ? 'bg-income-muted' : 'bg-destructive/20'
                  )}>
                    <p className="text-xs text-muted-foreground mb-1">
                      {summary.remaining >= 0 ? 'Disponible' : 'Excedido'}
                    </p>
                    <p className={cn(
                      'text-lg font-bold',
                      summary.remaining >= 0 ? 'text-income' : 'text-destructive'
                    )}>
                      {formatCurrency(Math.abs(summary.remaining), preferences.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchases List */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-expense" />
                  Compras Registradas
                  <span className="text-sm font-normal text-muted-foreground">
                    ({summary.purchases.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary.purchases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No hay compras registradas en este ciclo</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {summary.purchases.map((purchase) => (
                      <motion.div
                        key={purchase.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-expense-muted">
                            <ShoppingCart className="h-5 w-5 text-expense" />
                          </div>
                          <div>
                            <p className="font-medium">{purchase.description}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(purchase.purchase_date).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-expense tabular-nums">
                            -{formatCurrency(purchase.amount, preferences.currency)}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditPurchase(purchase)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar compra?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente esta compra.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deletePurchase(purchase.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </motion.div>
    </AppLayout>
  );
}
