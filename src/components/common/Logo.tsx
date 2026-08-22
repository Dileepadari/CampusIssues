import logoMark from '@/assets/logo-mark.png';
import { cn } from '@/lib/utils';

/**
 * The ADK DEV mark in a tinted badge. One file serves both themes - see the
 * `.logo-mono` filter in index.css.
 */
export function LogoBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 p-1.5',
        className,
      )}
    >
      <img src={logoMark} alt="" className="logo-mono size-full object-contain" />
    </div>
  );
}

export function Wordmark({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <LogoBadge className={markClassName} />
      <span className="text-lg font-semibold tracking-tight">CampusIssues</span>
    </span>
  );
}
