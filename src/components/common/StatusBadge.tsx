import { STATUS_COLOR_VAR, STATUS_LABEL, type ComplaintStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Status is carried by colour *and* by the label, so the two never disagree and
 * the badge stays readable for anyone who cannot separate the hues.
 */
export function StatusBadge({
  status,
  className,
  size = 'default',
}: {
  status: ComplaintStatus;
  className?: string;
  size?: 'sm' | 'default';
}) {
  const color = STATUS_COLOR_VAR[status];
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-md border font-medium whitespace-nowrap',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs',
        className,
      )}
      style={{
        color,
        borderColor: `color-mix(in oklab, ${color} 35%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`,
      }}
    >
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}
