import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Currency } from '@/lib/currency';
import { getCurrentCycle, BudgetCycle } from '@/lib/budget-cycle';
import { useToast } from '@/hooks/use-toast';

export interface UserPreferences {
  currency: Currency;
  cycleStartDay: number;
}

export function useUserPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>({
    currency: 'COP',
    cycleStartDay: 1,
  });
  const [loading, setLoading] = useState(true);
  const [currentCycle, setCurrentCycle] = useState<BudgetCycle | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('currency, cycle_start_day')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        const prefs = {
          currency: (data.currency as Currency) || 'COP',
          cycleStartDay: data.cycle_start_day || 1,
        };
        setPreferences(prefs);
        setCurrentCycle(getCurrentCycle(prefs.cycleStartDay));
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.currency !== undefined) {
        dbUpdates.currency = updates.currency;
      }
      if (updates.cycleStartDay !== undefined) {
        dbUpdates.cycle_start_day = updates.cycleStartDay;
      }

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('user_id', user.id);

      if (error) throw error;

      const newPrefs = { ...preferences, ...updates };
      setPreferences(newPrefs);
      setCurrentCycle(getCurrentCycle(newPrefs.cycleStartDay));

      toast({
        title: 'Preferencias actualizadas',
        description: 'Tus preferencias se han guardado correctamente.',
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar las preferencias.',
        variant: 'destructive',
      });
    }
  };

  return {
    preferences,
    currentCycle,
    loading,
    updatePreferences,
    refetch: fetchPreferences,
  };
}
