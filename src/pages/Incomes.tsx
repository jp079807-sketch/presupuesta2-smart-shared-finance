import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  TrendingUp,
  DollarSign,
  Calendar,
  Loader2
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
import { useToast } from '@/hooks/use-toast';
import { Income, IncomeFrequency } from '@/lib/types';

const frequencyLabels: Record<IncomeFrequency, string> = {
  'weekly': 'Semanal',
  'biweekly': 'Quincenal',
  'monthly': 'Mensual',
  'yearly': 'Anual',
  'one-time': 'Único',
};

// Placeholder data
const mockIncomes: Income[] = [
  { 
    id: '1', 
    user_id: '1', 
    source: 'Salario Principal', 
    gross_amount: 3500, 
    net_amount: 2800, 
    frequency: 'monthly',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: '2', 
    user_id: '1', 
    source: 'Freelance', 
    gross_amount: 800, 
    net_amount: 700, 
    frequency: 'monthly',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
];

export default function IncomesPage() {
  const [incomes, setIncomes] = useState<Income[]>(mockIncomes);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [deletingIncome, setDeletingIncome] = useState<Income | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    source: '',
    gross_amount: '',
    net_amount: '',
    frequency: 'monthly' as IncomeFrequency,
  });
  const { toast } = useToast();

  const totalGross = incomes.reduce((sum, i) => sum + i.gross_amount, 0);
  const totalNet = incomes.reduce((sum, i) => sum + i.net_amount, 0);

  const handleOpenForm = (income?: Income) => {
    if (income) {
      setEditingIncome(income);
      setFormData({
        source: income.source,
        gross_amount: income.gross_amount.toString(),
        net_amount: income.net_amount.toString(),
        frequency: income.frequency,
      });
    } else {
      setEditingIncome(null);
      setFormData({
        source: '',
        gross_amount: '',
        net_amount: '',
        frequency: 'monthly',
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulated save - will be replaced with Supabase
    setTimeout(() => {
      if (editingIncome) {
        setIncomes(incomes.map(i => 
          i.id === editingIncome.id 
            ? { ...i, ...formData, gross_amount: parseFloat(formData.gross_amount), net_amount: parseFloat(formData.net_amount) }
            : i
        ));
        toast({ title: 'Ingreso actualizado', description: 'El ingreso se ha actualizado correctamente.' });
      } else {
        const newIncome: Income = {
          id: Date.now().toString(),
          user_id: '1',
          source: formData.source,
          gross_amount: parseFloat(formData.gross_amount),
          net_amount: parseFloat(formData.net_amount),
          frequency: formData.frequency,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setIncomes([...incomes, newIncome]);
        toast({ title: 'Ingreso añadido', description: 'El ingreso se ha añadido correctamente.' });
      }
      setIsFormOpen(false);
      setIsLoading(false);
    }, 500);
  };

  const handleDelete = () => {
    if (deletingIncome) {
      setIncomes(incomes.filter(i => i.id !== deletingIncome.id));
      toast({ title: 'Ingreso eliminado', description: 'El ingreso se ha eliminado correctamente.' });
      setIsDeleteOpen(false);
      setDeletingIncome(null);
    }
  };

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
          value={totalGross}
          icon={<DollarSign className="h-6 w-6" />}
          variant="default"
        />
        <StatCard
          title="Total Neto Mensual"
          value={totalNet}
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
            {incomes.map((income) => (
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
                        {frequencyLabels[income.frequency]}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Bruto</span>
                        <span className="font-medium">€{income.gross_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Neto</span>
                        <span className="font-bold text-income">€{income.net_amount.toLocaleString()}</span>
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
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
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
                placeholder="Ej: Salario, Freelance, Alquiler..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gross_amount">Monto bruto (€)</Label>
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
                <Label htmlFor="net_amount">Monto neto (€)</Label>
                <Input
                  id="net_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.net_amount}
                  onChange={(e) => setFormData({ ...formData, net_amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
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
