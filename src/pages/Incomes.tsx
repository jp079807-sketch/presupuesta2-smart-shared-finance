import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  TrendingUp,
  DollarSign,
  Calendar,
  Loader2,
  Info
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIncomes, Income, IncomeFormData } from '@/hooks/useIncomes';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { formatCurrency } from '@/lib/currency';
import { INCOME_TYPES, IncomeType, getDeductionBreakdown } from '@/lib/income-calculator';

type IncomeFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'one-time';

const frequencyLabels: Record<IncomeFrequency, string> = {
  'weekly': 'Semanal',
  'biweekly': 'Quincenal',
  'monthly': 'Mensual',
  'yearly': 'Anual',
  'one-time': 'Único',
};

export default function IncomesPage() {
  const { incomes, loading, totals, addIncome, updateIncome, deleteIncome } = useIncomes();
  const { preferences } = useUserPreferences();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [deletingIncome, setDeletingIncome] = useState<Income | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    source: '',
    income_type: 'labor_contract' as IncomeType,
    gross_amount: '',
    frequency: 'monthly' as IncomeFrequency,
  });

  const handleOpenForm = (income?: Income) => {
    if (income) {
      setEditingIncome(income);
      setFormData({
        source: income.source,
        income_type: income.income_type || 'labor_contract',
        gross_amount: income.gross_amount.toString(),
        frequency: income.frequency as IncomeFrequency,
      });
    } else {
      setEditingIncome(null);
      setFormData({
        source: '',
        income_type: 'labor_contract',
        gross_amount: '',
        frequency: 'monthly',
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const data: IncomeFormData = {
      source: formData.source,
      income_type: formData.income_type,
      gross_amount: parseFloat(formData.gross_amount),
      frequency: formData.frequency,
    };

    if (editingIncome) {
      await updateIncome(editingIncome.id, data);
    } else {
      await addIncome(data);
    }

    setIsFormOpen(false);
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (deletingIncome) {
      await deleteIncome(deletingIncome.id);
      setIsDeleteOpen(false);
      setDeletingIncome(null);
    }
  };

  // Calculate preview deductions
  const previewDeductions = formData.gross_amount 
    ? getDeductionBreakdown(parseFloat(formData.gross_amount), formData.income_type)
    : null;

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
        title="Ingresos"
        description="Gestiona tus fuentes de ingresos"
        action={
          <Button onClick={() => handleOpenForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir ingreso
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard
          title="Total Bruto Mensual"
          value={formatCurrency(totals.gross, preferences.currency)}
          icon={<DollarSign className="h-6 w-6" />}
          variant="default"
        />
        <StatCard
          title="Total Neto Mensual"
          value={formatCurrency(totals.net, preferences.currency)}
          icon={<TrendingUp className="h-6 w-6" />}
          variant="income"
        />
        <StatCard
          title="Fuentes de Ingreso"
          value={incomes.length}
          subtitle="activas"
          icon={<Calendar className="h-6 w-6" />}
          variant="default"
        />
      </div>

      {/* Income List */}
      {incomes.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-8 w-8" />}
          title="No hay ingresos registrados"
          description="Añade tus fuentes de ingresos para empezar a gestionar tu presupuesto"
          action={{ label: 'Añadir primer ingreso', onClick: () => handleOpenForm() }}
        />
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {incomes.map((income) => {
              const typeInfo = INCOME_TYPES.find(t => t.value === income.income_type);
              return (
                <motion.div
                  key={income.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="shadow-card hover:shadow-card-hover transition-all duration-300 border-l-4 border-l-income">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{income.source}</CardTitle>
                        <span className="rounded-full bg-income-muted px-2.5 py-0.5 text-xs font-medium text-income">
                          {frequencyLabels[income.frequency as IncomeFrequency]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {typeInfo?.label || 'Contrato laboral'}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Bruto</span>
                          <span className="font-medium">{formatCurrency(Number(income.gross_amount), preferences.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Neto</span>
                          <span className="font-bold text-income">{formatCurrency(Number(income.net_amount), preferences.currency)}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenForm(income)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => { setDeletingIncome(income); setIsDeleteOpen(true); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingIncome ? 'Editar ingreso' : 'Añadir nuevo ingreso'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source">Fuente de ingreso</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="Ej: Empresa XYZ, Freelance..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="income_type" className="flex items-center gap-2">
                Tipo de ingreso
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>El tipo de ingreso determina las deducciones automáticas según las reglas colombianas.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select 
                value={formData.income_type} 
                onValueChange={(value: IncomeType) => setFormData({ ...formData, income_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {INCOME_TYPES.find(t => t.value === formData.income_type)?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gross_amount">Monto bruto</Label>
              <Input
                id="gross_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.gross_amount}
                onChange={(e) => setFormData({ ...formData, gross_amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frecuencia</Label>
              <Select 
                value={formData.frequency} 
                onValueChange={(value: IncomeFrequency) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(frequencyLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deduction Preview */}
            {previewDeductions && parseFloat(formData.gross_amount) > 0 && (
              <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                <p className="text-sm font-medium">Cálculo automático</p>
                {formData.income_type !== 'exempt' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Salud</span>
                      <span className="text-expense">-{formatCurrency(previewDeductions.health, preferences.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pensión</span>
                      <span className="text-expense">-{formatCurrency(previewDeductions.pension, preferences.currency)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Total deducciones</span>
                      <span className="font-medium text-expense">-{formatCurrency(previewDeductions.total, preferences.currency)}</span>
                    </div>
                  </>
                )}
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-medium">Neto estimado</span>
                  <span className="text-xl font-bold text-income">
                    {formatCurrency(previewDeductions.netAmount, preferences.currency)}
                  </span>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingIncome ? 'Guardar cambios' : 'Añadir ingreso'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ingreso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El ingreso "{deletingIncome?.source}" será eliminado permanentemente.
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
