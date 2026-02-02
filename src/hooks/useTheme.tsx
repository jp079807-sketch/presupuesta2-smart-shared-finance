import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>('system');
  const [loading, setLoading] = useState(true);

  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;

  // Fetch theme from profile
  useEffect(() => {
    const fetchTheme = async () => {
      if (!user) {
        // Use localStorage for non-authenticated users
        const stored = localStorage.getItem('theme') as Theme | null;
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
          setThemeState(stored);
          applyTheme(stored);
        }
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('theme')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data?.theme && ['light', 'dark', 'system'].includes(data.theme)) {
          setThemeState(data.theme as Theme);
          applyTheme(data.theme as Theme);
        }
      } catch (error) {
        console.error('Error fetching theme:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTheme();
  }, [user]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ theme: newTheme })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    }
  }, [user]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
