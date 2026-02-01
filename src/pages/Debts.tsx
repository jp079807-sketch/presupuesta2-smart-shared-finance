import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  CreditCard,
  TrendingDown,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Debt, DebtStatus, DebtPayment } from '@/lib/types';
import { cn } from '@/lib/utils';

const statusLabels: Record<DebtStatus, string> = {
  'active': 'Activa',
  'paid': 'Pagada',
  'defaulted': 'Impago',
};

// Mock data
const mockDebts: Debt[] = [
  { 
    id: '1', user_id: '1', name: 'Préstamo coche', 
    total_amount: 15000, interest_rate: 5.5, period_months: 60,
    installments_total: 60, installments_remaining: 42, installment_amount: 286.04,
    start_date: '2022-06-01', status: 'active',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  { 
    id: '2', user_id: '1', name: 'Tarjeta de crédito', 
    total_amount: 2500, interest_rate: 18, period_months: 12,
    installments_total: 12, installments_remaining: 5, installment_amount: 229.17,
    start_date: '2023-08-01', status: 'active',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
];

function calculateInstallment(total: number, rate: number, months: number): number {
  if (rate === 0) return total / months;
  const monthlyRate = rate / 100 / 12;
  return (total * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>(mockDebts);
  const [expandedDebt, setExpandedDebt] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    total_amount: '',
    interest_rate: '',
    period_months: '',
    installments_total: '',
    start_date: new Date().toISOString().split('T')[0],
  });
  const { toast } = useToast();

  const activeDebts = debts.filter(d => d.status === 'active');
  const totalDebt = activeDebts.reduce((sum, d) => sum + (d.installment_amount * d.installments_remaining), 0);
  const monthlyPayments = activeDebts.reduce((sum, d) => sum + d.installment_amount, 0);

  const handleOpenForm = (debt?: Debt) => {
    if (debt) {
      setEditingDebt(debt);
      setFormData({
        name: debt.name,
        total_amount: debt.total_amount.toString(),
        interest_rate: debt.interest_rate.toString(),
        period_months: debt.period_months.toString(),
        installments_total: debt.installments_total.toString(),
        start_date: debt.start_date,
      });
    } else {
      setEditingDebt(null);
      setFormData({
        name: '',
        total_amount: '',
        interest_rate: '0',
        period_months: '12',
        installments_total: '12',
        start_date: new Date().toISOString().split('T')[0],
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const total = parseFloat(formData.total_amount);
    const rate = parseFloat(formData.interest_rate);
    const months = parseInt(formData.period_months);
    const installments = parseInt(formData.installments_total);
    const installmentAmount = calculateInstallment(total, rate, months);

    setTimeout(() => {
      if (editingDebt) {
        setDebts(debts.map(d => 
          d.id === editingDebt.id 
            ? { 
                ...d, 
                name: formData.name,
                total_amount: total,
                interest_rate: rate,
                period_months: months,
                installments_total: installments,
                installment_amount: installmentAmount,
                start_date: formData.start_date,
              }
            : d
        ));
        toast({ title: 'Deuda actualizada' });
      } else {
        const newDebt: Debt = {
          id: Date.now().toString(),
          user_id: '1',
          name: formData.name,
          total_amount: total,
          interest_rate: rate,
          period_months: months,
          installments_total: installments,
          installments_remaining: installments,
          installment_amount: installmentAmount,
          start_date: formData.start_date,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setDebts([...debts, newDebt]);
        toast({ title: 'Deuda añadida' });
      }
      setIsFormOpen(false);
      setIsLoading(false);
    }, 500);
  };

  const handleDelete = () => {
    if (deletingDebt) {
      setDebts(debts.filter(d => d.id !== deletingDebt.id));
      toast({ title: 'Deuda eliminada' });
      setIsDeleteOpen(false);
      setDeletingDebt(null);
    }
  };

  const getProgress = (debt: Debt) => {
    return ((debt.installments_total - debt.installments_remaining) / debt.installments_total) * 100;
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Deudas"
        description="Gestiona y realiza seguimiento de tus deudas"
        action={
          <Button onClick={() => handleOpenForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir deuda
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard
          title="Deuda Total Pendiente"
          value={totalDebt}
          icon={<CreditCard className="h-6 w-6" />}
          variant="debt"
        />
        <StatCard
          title="Pago Mensual Total"
          value={monthlyPayments}
          icon={<TrendingDown className="h-6 w-6" />}
          variant="default"
        />
        <StatCard
          title="Deudas Activas"
          value={activeDebts.length}
          subtitle="en proceso de pago"
          icon={<Calendar className="h-6 w-6" />}
          variant="default"
        />
      </div>

      {/* Debt List */}
      {debts.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-8 w-8" />}
          title="No hay deudas registradas"
          description="Añade tus deudas para realizar un seguimiento de tus pagos"
          action={{ label: 'Añadir primera deuda', onClick: () => handleOpenForm() }}
        />
      ) : (
        <motion.div layout className="space-y-4">
          <AnimatePresence>
            {debts.map((debt) => (
              <motion.div
                key={debt.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className={cn(
                  "shadow-card hover:shadow-card-hover transition-all duration-300",
                  debt.status === 'paid' && "opacity-60",
                  "border-l-4 border-l-debt"
                )}>
                  <Collapsible
                    open={expandedDebt === debt.id}
                    onOpenChange={() => setExpandedDebt(expandedDebt === debt.id ? null : debt.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {debt.name}
                            <span className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full",
                              debt.status === 'active' && "bg-debt-muted text-debt",
                              debt.status === 'paid' && "bg-success-muted text-success",
                              debt.status === 'defaulted' && "bg-destructive-muted text-destructive"
                            )}>
                              {statusLabels[debt.status]}
                            </span>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Cuota mensual: <span className="font-semibold text-foreground">€{debt.installment_amount.toFixed(2)}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon">
                              {expandedDebt === debt.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pb-4">
                      {/* Progress */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progreso de pago</span>
                          <span className="font-medium">{getProgress(debt).toFixed(0)}%</span>
                        </div>
                        <Progress value={getProgress(debt)} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{debt.installments_total - debt.installments_remaining} cuotas pagadas</span>
                          <span>{debt.installments_remaining} cuotas restantes</span>
                        </div>
                      </div>

                      <CollapsibleContent className="space-y-4">
                        {/* Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-muted/50 p-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Monto total</p>
                            <p className="font-semibold">€{debt.total_amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Tasa de interés</p>
                            <p className="font-semibold">{debt.interest_rate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Plazo</p>
                            <p className="font-semibold">{debt.period_months} meses</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Inicio</p>
                            <p className="font-semibold">{new Date(debt.start_date).toLocaleDateString('es-ES')}</p>
                          </div>
                        </div>

                        {/* Remaining Amount */}
                        <div className="flex items-center justify-between rounded-xl bg-debt-muted p-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Monto pendiente</p>
                            <p className="text-xl font-bold text-debt">
                              €{(debt.installment_amount * debt.installments_remaining).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleOpenForm(debt)}>
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Editar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => { setDeletingDebt(debt); setIsDeleteOpen(true); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </CardContent>
                  </Collapsible>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDebt ? 'Editar deuda' : 'Añadir nueva deuda'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la deuda</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Préstamo coche, Hipoteca..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_amount">Monto total (€)</Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interest_rate">Tasa de interés (%)</Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period_months">Plazo (meses)</Label>
                <Input
                  id="period_months"
                  type="number"
                  min="1"
                  value={formData.period_months}
                  onChange={(e) => setFormData({ ...formData, period_months: e.target.value, installments_total: e.target.value })}
                  placeholder="12"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Fecha de inicio</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Calculated Installment Preview */}
            {formData.total_amount && formData.period_months && (
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Cuota mensual estimada</p>
                <p className="text-2xl font-bold text-debt">
                  €{calculateInstallment(
                    parseFloat(formData.total_amount) || 0,
                    parseFloat(formData.interest_rate) || 0,
                    parseInt(formData.period_months) || 1
                  ).toFixed(2)}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingDebt ? 'Guardar' : 'Añadir'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar deuda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La deuda "{deletingDebt?.name}" será eliminada permanentemente.
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
