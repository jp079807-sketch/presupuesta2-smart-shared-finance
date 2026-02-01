import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Palette, Shield, LogOut, Loader2, Save } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
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
