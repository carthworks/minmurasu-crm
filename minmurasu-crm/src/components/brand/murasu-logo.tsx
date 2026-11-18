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
          'flex items-center justify-center bg-brand-navy dark:bg-brand-orange text-white shadow-md shadow-brand-orange/20 ring-1 ring-white/15 shrink-0',
          iconSizes[size]
        )}
      >
        <svg
          className={size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <ellipse cx="12" cy="7" rx="8" ry="3" />
          <path d="M4 7v10c0 1.66 3.58 3 8 3s8-1.34 8-3V7" />
          <path d="M8 12l2.5 2L16 10" />
        </svg>
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
