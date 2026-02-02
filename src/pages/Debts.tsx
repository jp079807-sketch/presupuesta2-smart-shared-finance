import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  CreditCard,
  Landmark,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  Calendar
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreditCards, CreditCard as CreditCardType, CardPurchase, CreditCardFormData, CardPurchaseFormData } from '@/hooks/useCreditCards';
import { useLoans, Loan, LoanFormData } from '@/hooks/useLoans';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

export default function DebtsPage() {
  const { preferences } = useUserPreferences();
  const { 
    creditCards, purchases, loading: cardsLoading,
    addCreditCard, updateCreditCard, deleteCreditCard,
    addPurchase, payInstallment: payCardInstallment, deletePurchase,
    getCardPurchases, getCardDebt, getTotalDebt: getCardsTotalDebt, getMonthlyPayment: getCardsMonthlyPayment
  } = useCreditCards();
  const { 
    loans, activeLoans, loading: loansLoading,
    addLoan, updateLoan, deleteLoan,
    payInstallment: payLoanInstallment,
    getTotalDebt: getLoansTotalDebt, getMonthlyPayment: getLoansMonthlyPayment
  } = useLoans();

  const [activeTab, setActiveTab] = useState('cards');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);

  // Card dialogs
  const [isCardFormOpen, setIsCardFormOpen] = useState(false);
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false);
  const [isCardDeleteOpen, setIsCardDeleteOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [deletingCard, setDeletingCard] = useState<CreditCardType | null>(null);
  const [selectedCardForPurchase, setSelectedCardForPurchase] = useState<string>('');

  // Loan dialogs
  const [isLoanFormOpen, setIsLoanFormOpen] = useState(false);
  const [isLoanDeleteOpen, setIsLoanDeleteOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [deletingLoan, setDeletingLoan] = useState<Loan | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Card form state
  const [cardForm, setCardForm] = useState<CreditCardFormData>({
    name: '',
    bank: '',
    credit_limit: 0,
    cut_off_day: 1,
    payment_due_day: 15,
    interest_rate: 0,
  });

  // Purchase form state
  const [purchaseForm, setPurchaseForm] = useState<CardPurchaseFormData>({
    credit_card_id: '',
    description: '',
    total_amount: 0,
    installments_total: 1,
    purchase_date: new Date().toISOString().split('T')[0],
  });

  // Loan form state
  const [loanForm, setLoanForm] = useState<LoanFormData>({
    name: '',
    lender: '',
    total_amount: 0,
    interest_rate: 0,
    installments_total: 12,
    start_date: new Date().toISOString().split('T')[0],
  });

  const loading = cardsLoading || loansLoading;
  const totalDebt = getCardsTotalDebt() + getLoansTotalDebt();
  const monthlyPayment = getCardsMonthlyPayment() + getLoansMonthlyPayment();

  // Card handlers
  const handleOpenCardForm = (card?: CreditCardType) => {
    if (card) {
      setEditingCard(card);
      setCardForm({
        name: card.name,
        bank: card.bank,
        credit_limit: card.credit_limit,
        cut_off_day: card.cut_off_day,
        payment_due_day: card.payment_due_day,
        interest_rate: card.interest_rate || 0,
      });
    } else {
      setEditingCard(null);
      setCardForm({
        name: '',
        bank: '',
        credit_limit: 0,
        cut_off_day: 1,
        payment_due_day: 15,
        interest_rate: 0,
      });
    }
    setIsCardFormOpen(true);
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (editingCard) {
      await updateCreditCard(editingCard.id, cardForm);
    } else {
      await addCreditCard(cardForm);
    }
    
    setIsCardFormOpen(false);
    setIsLoading(false);
  };

  const handleDeleteCard = async () => {
    if (deletingCard) {
      await deleteCreditCard(deletingCard.id);
      setIsCardDeleteOpen(false);
      setDeletingCard(null);
    }
  };

  // Purchase handlers
  const handleOpenPurchaseForm = (cardId?: string) => {
    setSelectedCardForPurchase(cardId || '');
    setPurchaseForm({
      credit_card_id: cardId || '',
      description: '',
      total_amount: 0,
      installments_total: 1,
      purchase_date: new Date().toISOString().split('T')[0],
    });
    setIsPurchaseFormOpen(true);
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await addPurchase(purchaseForm);
    setIsPurchaseFormOpen(false);
    setIsLoading(false);
  };

  // Loan handlers
  const handleOpenLoanForm = (loan?: Loan) => {
    if (loan) {
      setEditingLoan(loan);
      setLoanForm({
        name: loan.name,
        lender: loan.lender || '',
        total_amount: loan.total_amount,
        interest_rate: loan.interest_rate,
        installments_total: loan.installments_total,
        start_date: loan.start_date,
      });
    } else {
      setEditingLoan(null);
      setLoanForm({
        name: '',
        lender: '',
        total_amount: 0,
        interest_rate: 0,
        installments_total: 12,
        start_date: new Date().toISOString().split('T')[0],
      });
    }
    setIsLoanFormOpen(true);
  };

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (editingLoan) {
      await updateLoan(editingLoan.id, loanForm);
    } else {
      await addLoan(loanForm);
    }
    
    setIsLoanFormOpen(false);
    setIsLoading(false);
  };

  const handleDeleteLoan = async () => {
    if (deletingLoan) {
      await deleteLoan(deletingLoan.id);
      setIsLoanDeleteOpen(false);
      setDeletingLoan(null);
    }
  };

  const calculateInstallmentPreview = () => {
    if (!loanForm.total_amount || !loanForm.installments_total) return 0;
    if (loanForm.interest_rate === 0) return loanForm.total_amount / loanForm.installments_total;
    const monthlyRate = loanForm.interest_rate / 100 / 12;
    return (loanForm.total_amount * monthlyRate * Math.pow(1 + monthlyRate, loanForm.installments_total)) / 
           (Math.pow(1 + monthlyRate, loanForm.installments_total) - 1);
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
        title="Deudas"
        description="Gestiona tarjetas de crédito y créditos"
        action={
          <div className="flex gap-2">
            {activeTab === 'cards' ? (
              <>
                <Button variant="outline" onClick={() => handleOpenPurchaseForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva compra
                </Button>
                <Button onClick={() => handleOpenCardForm()}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Nueva tarjeta
                </Button>
              </>
            ) : (
              <Button onClick={() => handleOpenLoanForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo crédito
              </Button>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard
          title="Deuda Total"
          value={formatCurrency(totalDebt, preferences.currency)}
          icon={<CreditCard className="h-6 w-6" />}
          variant="debt"
        />
        <StatCard
          title="Pago Mensual"
          value={formatCurrency(monthlyPayment, preferences.currency)}
          icon={<Calendar className="h-6 w-6" />}
          variant="default"
        />
        <StatCard
          title="Obligaciones"
          value={creditCards.length + activeLoans.length}
          subtitle={`${creditCards.length} tarjetas, ${activeLoans.length} créditos`}
          icon={<Landmark className="h-6 w-6" />}
          variant="default"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="cards" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Tarjetas de Crédito
          </TabsTrigger>
          <TabsTrigger value="loans" className="gap-2">
            <Landmark className="h-4 w-4" />
            Créditos
          </TabsTrigger>
        </TabsList>

        {/* Credit Cards Tab */}
        <TabsContent value="cards" className="space-y-4">
          {creditCards.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="h-8 w-8" />}
              title="No hay tarjetas registradas"
              description="Añade tus tarjetas de crédito para hacer seguimiento de compras en cuotas"
              action={{ label: 'Añadir tarjeta', onClick: () => handleOpenCardForm() }}
            />
          ) : (
            <motion.div layout className="space-y-4">
              <AnimatePresence>
                {creditCards.map((card) => {
                  const cardPurchases = getCardPurchases(card.id);
                  const cardDebt = getCardDebt(card.id);
                  const activePurchases = cardPurchases.filter(p => p.installments_paid < p.installments_total);

                  return (
                    <motion.div
                      key={card.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Card className="shadow-card hover:shadow-card-hover transition-all border-l-4 border-l-debt">
                        <Collapsible
                          open={expandedCard === card.id}
                          onOpenChange={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <CreditCard className="h-5 w-5 text-debt" />
                                  {card.name}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {card.bank} • Corte día {card.cut_off_day} • Pago día {card.payment_due_day}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <p className="text-lg font-bold text-debt">
                                    {formatCurrency(cardDebt, preferences.currency)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {activePurchases.length} compras activas
                                  </p>
                                </div>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    {expandedCard === card.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </Button>
                                </CollapsibleTrigger>
                              </div>
                            </div>
                          </CardHeader>

                          <CollapsibleContent>
                            <CardContent className="space-y-4">
                              {/* Card Info */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-muted/50 p-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Cupo</p>
                                  <p className="font-semibold">{formatCurrency(card.credit_limit, preferences.currency)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Tasa</p>
                                  <p className="font-semibold">{card.interest_rate || 0}%</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Usado</p>
                                  <p className="font-semibold">{formatCurrency(cardDebt, preferences.currency)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Disponible</p>
                                  <p className="font-semibold text-income">
                                    {formatCurrency(Math.max(0, card.credit_limit - cardDebt), preferences.currency)}
                                  </p>
                                </div>
                              </div>

                              {/* Purchases */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">Compras</h4>
                                  <Button size="sm" variant="outline" onClick={() => handleOpenPurchaseForm(card.id)}>
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Añadir
                                  </Button>
                                </div>

                                {cardPurchases.length === 0 ? (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay compras registradas
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {cardPurchases.map((purchase) => {
                                      const progress = (purchase.installments_paid / purchase.installments_total) * 100;
                                      const remaining = purchase.installments_total - purchase.installments_paid;
                                      const isComplete = remaining === 0;

                                      return (
                                        <div 
                                          key={purchase.id} 
                                          className={cn(
                                            "p-3 rounded-lg border",
                                            isComplete ? "bg-success-muted opacity-60" : "bg-background"
                                          )}
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <div>
                                              <p className={cn("font-medium", isComplete && "line-through")}>
                                                {purchase.description}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {new Date(purchase.purchase_date).toLocaleDateString('es-ES')} • 
                                                Total: {formatCurrency(purchase.total_amount, preferences.currency)}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-semibold">
                                                {formatCurrency(purchase.installment_amount, preferences.currency)}/mes
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {purchase.installments_paid}/{purchase.installments_total} cuotas
                                              </p>
                                            </div>
                                          </div>
                                          <Progress value={progress} className="h-1.5 mb-2" />
                                          <div className="flex gap-2">
                                            {!isComplete && (
                                              <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => payCardInstallment(purchase.id, purchase.installments_paid)}
                                              >
                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                                Pagar cuota
                                              </Button>
                                            )}
                                            <Button 
                                              size="sm" 
                                              variant="ghost"
                                              className="text-destructive"
                                              onClick={() => deletePurchase(purchase.id)}
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Card Actions */}
                              <div className="flex gap-2 pt-2 border-t">
                                <Button variant="outline" size="sm" onClick={() => handleOpenCardForm(card)}>
                                  <Pencil className="h-3.5 w-3.5 mr-1" />
                                  Editar tarjeta
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => { setDeletingCard(card); setIsCardDeleteOpen(true); }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>

        {/* Loans Tab */}
        <TabsContent value="loans" className="space-y-4">
          {loans.length === 0 ? (
            <EmptyState
              icon={<Landmark className="h-8 w-8" />}
              title="No hay créditos registrados"
              description="Añade tus créditos o préstamos para hacer seguimiento de los pagos"
              action={{ label: 'Añadir crédito', onClick: () => handleOpenLoanForm() }}
            />
          ) : (
            <motion.div layout className="space-y-4">
              <AnimatePresence>
                {loans.map((loan) => {
                  const progress = (loan.installments_paid / loan.installments_total) * 100;
                  const remaining = loan.installments_total - loan.installments_paid;
                  const remainingAmount = loan.installment_amount * remaining;

                  return (
                    <motion.div
                      key={loan.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Card className={cn(
                        "shadow-card hover:shadow-card-hover transition-all border-l-4 border-l-debt",
                        loan.status === 'paid' && "opacity-60"
                      )}>
                        <Collapsible
                          open={expandedLoan === loan.id}
                          onOpenChange={() => setExpandedLoan(expandedLoan === loan.id ? null : loan.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Landmark className="h-5 w-5 text-debt" />
                                  {loan.name}
                                  <span className={cn(
                                    "text-xs font-medium px-2 py-0.5 rounded-full",
                                    loan.status === 'active' && "bg-debt-muted text-debt",
                                    loan.status === 'paid' && "bg-success-muted text-success",
                                    loan.status === 'defaulted' && "bg-destructive-muted text-destructive"
                                  )}>
                                    {loan.status === 'active' ? 'Activo' : loan.status === 'paid' ? 'Pagado' : 'Impago'}
                                  </span>
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {loan.lender || 'Sin entidad'} • Cuota: {formatCurrency(loan.installment_amount, preferences.currency)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    {expandedLoan === loan.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </Button>
                                </CollapsibleTrigger>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pb-4">
                            {/* Progress */}
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Progreso</span>
                                <span className="font-medium">{progress.toFixed(0)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{loan.installments_paid} cuotas pagadas</span>
                                <span>{remaining} cuotas restantes</span>
                              </div>
                            </div>

                            <CollapsibleContent className="space-y-4">
                              {/* Details Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-muted/50 p-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Monto total</p>
                                  <p className="font-semibold">{formatCurrency(loan.total_amount, preferences.currency)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Tasa</p>
                                  <p className="font-semibold">{loan.interest_rate}%</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Plazo</p>
                                  <p className="font-semibold">{loan.installments_total} meses</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Inicio</p>
                                  <p className="font-semibold">{new Date(loan.start_date).toLocaleDateString('es-ES')}</p>
                                </div>
                              </div>

                              {/* Remaining */}
                              <div className="flex items-center justify-between rounded-xl bg-debt-muted p-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Monto pendiente</p>
                                  <p className="text-xl font-bold text-debt">
                                    {formatCurrency(remainingAmount, preferences.currency)}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  {loan.status === 'active' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => payLoanInstallment(loan.id, loan.installments_paid, loan.installment_amount)}
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                      Pagar cuota
                                    </Button>
                                  )}
                                  <Button variant="outline" size="sm" onClick={() => handleOpenLoanForm(loan)}>
                                    <Pencil className="h-3.5 w-3.5 mr-1" />
                                    Editar
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => { setDeletingLoan(loan); setIsLoanDeleteOpen(true); }}
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
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* Credit Card Form Dialog */}
      <Dialog open={isCardFormOpen} onOpenChange={setIsCardFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCard ? 'Editar tarjeta' : 'Nueva tarjeta de crédito'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCardSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="card-name">Nombre</Label>
                <Input
                  id="card-name"
                  value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  placeholder="Ej: Visa Gold"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-bank">Banco</Label>
                <Input
                  id="card-bank"
                  value={cardForm.bank}
                  onChange={(e) => setCardForm({ ...cardForm, bank: e.target.value })}
                  placeholder="Ej: Bancolombia"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-limit">Cupo</Label>
              <Input
                id="card-limit"
                type="number"
                min="0"
                value={cardForm.credit_limit || ''}
                onChange={(e) => setCardForm({ ...cardForm, credit_limit: Number(e.target.value) })}
                placeholder="0"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="card-cut-off">Día corte</Label>
                <Input
                  id="card-cut-off"
                  type="number"
                  min="1"
                  max="31"
                  value={cardForm.cut_off_day}
                  onChange={(e) => setCardForm({ ...cardForm, cut_off_day: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-due">Día pago</Label>
                <Input
                  id="card-due"
                  type="number"
                  min="1"
                  max="31"
                  value={cardForm.payment_due_day}
                  onChange={(e) => setCardForm({ ...cardForm, payment_due_day: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-rate">Tasa % (opc)</Label>
                <Input
                  id="card-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cardForm.interest_rate || ''}
                  onChange={(e) => setCardForm({ ...cardForm, interest_rate: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCardFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingCard ? 'Guardar' : 'Añadir'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Purchase Form Dialog */}
      <Dialog open={isPurchaseFormOpen} onOpenChange={setIsPurchaseFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva compra en cuotas</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePurchaseSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchase-card">Tarjeta</Label>
              <Select 
                value={purchaseForm.credit_card_id} 
                onValueChange={(value) => setPurchaseForm({ ...purchaseForm, credit_card_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tarjeta" />
                </SelectTrigger>
                <SelectContent>
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name} - {card.bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase-description">Descripción</Label>
              <Input
                id="purchase-description"
                value={purchaseForm.description}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, description: e.target.value })}
                placeholder="Ej: iPhone, TV, etc."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase-amount">Monto total</Label>
                <Input
                  id="purchase-amount"
                  type="number"
                  min="0"
                  value={purchaseForm.total_amount || ''}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, total_amount: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase-installments">Cuotas</Label>
                <Input
                  id="purchase-installments"
                  type="number"
                  min="1"
                  max="72"
                  value={purchaseForm.installments_total}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, installments_total: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase-date">Fecha de compra</Label>
              <Input
                id="purchase-date"
                type="date"
                value={purchaseForm.purchase_date}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })}
                required
              />
            </div>
            {purchaseForm.total_amount > 0 && purchaseForm.installments_total > 0 && (
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Cuota mensual</p>
                <p className="text-2xl font-bold text-debt">
                  {formatCurrency(purchaseForm.total_amount / purchaseForm.installments_total, preferences.currency)}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPurchaseFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || !purchaseForm.credit_card_id}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Añadir compra
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Loan Form Dialog */}
      <Dialog open={isLoanFormOpen} onOpenChange={setIsLoanFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLoan ? 'Editar crédito' : 'Nuevo crédito'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLoanSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loan-name">Nombre del crédito</Label>
              <Input
                id="loan-name"
                value={loanForm.name}
                onChange={(e) => setLoanForm({ ...loanForm, name: e.target.value })}
                placeholder="Ej: Crédito de vehículo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loan-lender">Entidad (opcional)</Label>
              <Input
                id="loan-lender"
                value={loanForm.lender}
                onChange={(e) => setLoanForm({ ...loanForm, lender: e.target.value })}
                placeholder="Ej: Bancolombia, Davivienda..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loan-amount">Monto total</Label>
                <Input
                  id="loan-amount"
                  type="number"
                  min="0"
                  value={loanForm.total_amount || ''}
                  onChange={(e) => setLoanForm({ ...loanForm, total_amount: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loan-rate">Tasa anual (%)</Label>
                <Input
                  id="loan-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={loanForm.interest_rate || ''}
                  onChange={(e) => setLoanForm({ ...loanForm, interest_rate: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loan-installments">Número de cuotas</Label>
                <Input
                  id="loan-installments"
                  type="number"
                  min="1"
                  value={loanForm.installments_total}
                  onChange={(e) => setLoanForm({ ...loanForm, installments_total: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loan-start">Fecha de inicio</Label>
                <Input
                  id="loan-start"
                  type="date"
                  value={loanForm.start_date}
                  onChange={(e) => setLoanForm({ ...loanForm, start_date: e.target.value })}
                  required
                />
              </div>
            </div>
            {loanForm.total_amount > 0 && loanForm.installments_total > 0 && (
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Cuota mensual estimada</p>
                <p className="text-2xl font-bold text-debt">
                  {formatCurrency(calculateInstallmentPreview(), preferences.currency)}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsLoanFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingLoan ? 'Guardar' : 'Añadir'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Card Confirmation */}
      <AlertDialog open={isCardDeleteOpen} onOpenChange={setIsCardDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarjeta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la tarjeta "{deletingCard?.name}" y todas sus compras registradas. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Loan Confirmation */}
      <AlertDialog open={isLoanDeleteOpen} onOpenChange={setIsLoanDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar crédito?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el crédito "{deletingLoan?.name}" y todo su historial de pagos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLoan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
