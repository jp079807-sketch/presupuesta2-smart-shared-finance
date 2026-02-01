import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'income' | 'expense' | 'debt' | 'shared' | 'primary';
  className?: string;
}

const variantStyles = {
  default: 'bg-card',
  income: 'bg-income-muted border-income/20',
  expense: 'bg-expense-muted border-expense/20',
  debt: 'bg-debt-muted border-debt/20',
  shared: 'bg-shared-muted border-shared/20',
  primary: 'gradient-primary text-primary-foreground',
};

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  income: 'bg-income text-income-foreground',
  expense: 'bg-expense text-expense-foreground',
  debt: 'bg-debt text-debt-foreground',
  shared: 'bg-shared text-shared-foreground',
  primary: 'bg-primary-foreground/20 text-primary-foreground',
};

const textStyles = {
  default: 'text-foreground',
  income: 'text-income',
  expense: 'text-expense',
  debt: 'text-debt',
  shared: 'text-shared',
  primary: 'text-primary-foreground',
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  variant = 'default',
  className 
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-6 shadow-card transition-all duration-300 hover:shadow-card-hover',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            'text-sm font-medium',
            variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className={cn(
            'text-3xl font-bold font-display tabular-nums tracking-tight',
            textStyles[variant]
          )}>
            {typeof value === 'number' ? value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : value}
          </p>
          {subtitle && (
            <p className={cn(
              'text-xs',
              variant === 'primary' ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-1 text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground">vs mes anterior</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            iconStyles[variant]
          )}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
