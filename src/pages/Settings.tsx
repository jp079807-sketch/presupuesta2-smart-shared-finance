import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Palette, Shield, LogOut, Loader2, Save, Calendar, DollarSign } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { CurrencySelect } from '@/components/ui/currency-select';
import { CycleDaySelect } from '@/components/ui/cycle-day-select';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useToast } from '@/hooks/use-toast';
import { formatCycleRange } from '@/lib/budget-cycle';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { preferences, currentCycle, loading: preferencesLoading, updatePreferences } = useUserPreferences();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
  });
  const [notifications, setNotifications] = useState({
    emailReminders: true,
    smsReminders: false,
    weeklyReport: true,
  });

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({ title: 'Perfil actualizado', description: 'Tus cambios han sido guardados.' });
    }, 500);
  };

  const handleCurrencyChange = async (currency: 'COP' | 'USD') => {
    await updatePreferences({ currency });
  };

  const handleCycleDayChange = async (day: number) => {
    await updatePreferences({ cycleStartDay: day });
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Configuración"
        description="Administra tu cuenta y preferencias"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl space-y-6"
      >
        {/* Profile */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Perfil
            </CardTitle>
            <CardDescription>Información de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Tu nombre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
            </div>
            <Button onClick={handleSaveProfile} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar cambios
            </Button>
          </CardContent>
        </Card>

        {/* Budget Preferences */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Preferencias de Presupuesto
            </CardTitle>
            <CardDescription>Configura tu moneda y ciclo de presupuesto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Currency Selection */}
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <CurrencySelect
                value={preferences.currency}
                onValueChange={handleCurrencyChange}
                disabled={preferencesLoading}
              />
              <p className="text-xs text-muted-foreground">
                Todos los montos se mostrarán en esta moneda
              </p>
            </div>

            <Separator />

            {/* Budget Cycle */}
            <div className="space-y-2">
              <Label htmlFor="cycleDay" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Día de inicio del ciclo
              </Label>
              <CycleDaySelect
                value={preferences.cycleStartDay}
                onValueChange={handleCycleDayChange}
                disabled={preferencesLoading}
              />
              <p className="text-xs text-muted-foreground">
                El ciclo de presupuesto comienza el día {preferences.cycleStartDay} de cada mes
              </p>
              {currentCycle && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50 border">
                  <p className="text-sm font-medium">Ciclo actual</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCycleRange(currentCycle)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentCycle.daysRemaining} días restantes
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notificaciones
            </CardTitle>
            <CardDescription>Configura cómo quieres recibir alertas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Recordatorios por email</p>
                <p className="text-sm text-muted-foreground">Recibe alertas de vencimientos por correo</p>
              </div>
              <Switch
                checked={notifications.emailReminders}
                onCheckedChange={(checked) => setNotifications({ ...notifications, emailReminders: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Recordatorios por SMS</p>
                <p className="text-sm text-muted-foreground">Recibe alertas de vencimientos por mensaje</p>
              </div>
              <Switch
                checked={notifications.smsReminders}
                onCheckedChange={(checked) => setNotifications({ ...notifications, smsReminders: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Reporte semanal</p>
                <p className="text-sm text-muted-foreground">Resumen de tus finanzas cada semana</p>
              </div>
              <Switch
                checked={notifications.weeklyReport}
                onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReport: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Seguridad
            </CardTitle>
            <CardDescription>Opciones de seguridad de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Cambiar contraseña
            </Button>
            <Separator />
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </AppLayout>
  );
}
