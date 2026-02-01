import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type AuthMode = 'login' | 'signup' | 'forgot-password';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      if (mode === 'forgot-password') {
        const emailResult = z.string().email().safeParse(formData.email);
        if (!emailResult.success) {
          setErrors({ email: 'Email inválido' });
          setIsLoading(false);
          return;
        }
        
        const { error } = await resetPassword(formData.email);
        if (error) throw error;
        
        toast({
          title: '¡Revisa tu correo!',
          description: 'Te hemos enviado un enlace para restablecer tu contraseña.',
        });
        setMode('login');
      } else if (mode === 'login') {
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Credenciales inválidas. Verifica tu email y contraseña.');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Por favor confirma tu email antes de iniciar sesión.');
          }
          throw error;
        }
        
        navigate('/');
      } else {
        const result = signupSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) {
          if (error.message.includes('User already registered')) {
            throw new Error('Este email ya está registrado. Intenta iniciar sesión.');
          }
          throw error;
        }
        
        toast({
          title: '¡Cuenta creada!',
          description: 'Revisa tu correo para confirmar tu cuenta.',
        });
        setMode('login');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Ha ocurrido un error. Inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm">
              <Wallet className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white font-display">
              Presupuesta2
            </h1>
            <p className="text-lg text-white/80">
              Gestión financiera personal y compartida. Control real, equidad financiera y excelente experiencia.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {['Ingresos', 'Gastos', 'Deudas', 'Compartido'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-primary">
              <Wallet className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="mt-4 text-2xl font-bold font-display">Presupuesta2</h1>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">
              {mode === 'login' && '¡Bienvenido de nuevo!'}
              {mode === 'signup' && 'Crea tu cuenta'}
              {mode === 'forgot-password' && 'Recupera tu contraseña'}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {mode === 'login' && 'Ingresa tus credenciales para continuar'}
              {mode === 'signup' && 'Completa los datos para empezar'}
              {mode === 'forgot-password' && 'Te enviaremos un enlace para restablecer tu contraseña'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Juan García"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            {mode !== 'forgot-password' && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Iniciar sesión'}
                  {mode === 'signup' && 'Crear cuenta'}
                  {mode === 'forgot-password' && 'Enviar enlace'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            {mode === 'login' && (
              <p className="text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="font-medium text-primary hover:underline"
                >
                  Regístrate
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p className="text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="font-medium text-primary hover:underline"
                >
                  Inicia sesión
                </button>
              </p>
            )}
            {mode === 'forgot-password' && (
              <button
                onClick={() => setMode('login')}
                className="font-medium text-primary hover:underline"
              >
                Volver al inicio de sesión
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
