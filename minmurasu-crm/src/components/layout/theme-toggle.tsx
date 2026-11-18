'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/15 bg-white/90 dark:bg-brand-navy/90 backdrop-blur px-3 py-1.5 text-xs font-medium text-brand-slate dark:text-slate-200 hover:border-brand-blue/50 transition cursor-pointer"
    >
      {isDark ? (
        <Moon className="h-3.5 w-3.5 text-brand-orange" />
      ) : (
        <Sun className="h-3.5 w-3.5 text-brand-orange" />
      )}
      <span>{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}
