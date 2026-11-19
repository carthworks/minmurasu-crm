import { cn } from '@/lib/utils';

interface MurasuLogoProps {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  className?: string;
}

export function MurasuLogo({
  size = 'md',
  subtitle = 'The Digital Drum · minmurasu.digital',
  className,
}: MurasuLogoProps) {
  const iconSizes = {
    sm: 'h-8 w-8 rounded-lg',
    md: 'h-10 w-10 rounded-xl',
    lg: 'h-12 w-12 rounded-xl',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <div
        className={cn(
          'flex items-center justify-center bg-white p-1 shadow-md shadow-brand-navy/10 ring-1 ring-slate-200 dark:ring-white/15 shrink-0 overflow-hidden',
          iconSizes[size]
        )}
      >
        <img
          src="/brand/min-murasu-logo.png"
          alt="MIN MURASU Logo"
          className="h-full w-full object-contain"
        />
      </div>
      <div>
        <span
          className={cn(
            'font-display font-extrabold tracking-tight text-brand-navy dark:text-white block leading-none',
            titleSizes[size]
          )}
        >
          MIN MURASU
        </span>
        {subtitle && (
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-orange mt-1">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
