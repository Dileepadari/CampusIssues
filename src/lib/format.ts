import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isThisYear,
  isToday,
  isYesterday,
} from 'date-fns';

/** "3 minutes ago", "2 days ago". Used for anything inside a timeline. */
export function relativeTime(value: string | number | Date): string {
  return `${formatDistanceToNowStrict(new Date(value))} ago`;
}

/** "Today, 14:20" / "12 Mar, 14:20" / "12 Mar 2024, 14:20" */
export function dateTime(value: string | number | Date): string {
  const date = new Date(value);
  if (isToday(date)) return `Today, ${format(date, 'HH:mm')}`;
  if (isYesterday(date)) return `Yesterday, ${format(date, 'HH:mm')}`;
  return format(date, isThisYear(date) ? "d MMM, HH:mm" : "d MMM yyyy, HH:mm");
}

export function dateOnly(value: string | number | Date): string {
  const date = new Date(value);
  return format(date, isThisYear(date) ? 'd MMM' : 'd MMM yyyy');
}

/** How a deadline reads on a badge: "2 days left", "overdue by 5 hours". */
export function dueLabel(dueAt: string, isClosed: boolean): string {
  const due = new Date(dueAt);
  if (isClosed) return `Target was ${dateOnly(due)}`;
  const diff = due.getTime() - Date.now();
  if (diff < 0) return `Overdue by ${formatDistanceToNowStrict(due)}`;
  return `${formatDistanceToNowStrict(due)} left`;
}

/** Hours as a short human duration: "6h", "2d 4h". */
export function duration(hours: number | null): string {
  if (hours === null) return '-';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  const rest = Math.round(hours % 24);
  return rest ? `${days}d ${rest}h` : `${days}d`;
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

/** Stable per-person avatar tint so the same user is always the same colour. */
export function avatarTint(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return `oklch(0.85 0.06 ${hash % 360})`;
}

export function percent(value: number | null, digits = 0): string {
  if (value === null) return '-';
  return `${value.toFixed(digits)}%`;
}

/** Chart axis label for a yyyy-MM-dd bucket key. */
export function trendLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return format(new Date(y, m - 1, d), 'd MMM');
}

export function daysSince(value: string): number {
  return differenceInCalendarDays(new Date(), new Date(value));
}

/** Turns rows of plain values into a CSV blob body, quoting where needed. */
export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const escape = (cell: string | number | null) => {
    const text = cell === null || cell === undefined ? '' : String(cell);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n');
}

export function downloadFile(filename: string, contents: string, mimeType: string): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
