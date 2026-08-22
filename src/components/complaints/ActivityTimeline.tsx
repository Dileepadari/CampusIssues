import {
  ArrowRightLeft,
  FilePlus2,
  Lock,
  MessageSquare,
  RotateCcw,
  Star,
  UserMinus,
  UserPlus,
  Wrench,
} from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { dateTime, relativeTime } from '@/lib/format';
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  type Activity,
  type ComplaintDetail,
  type ComplaintPriority,
  type ComplaintStatus,
  type PublicUser,
} from '@/lib/types';

type Entry = Activity & { actor: PublicUser | null };

const ICON: Record<Activity['type'], typeof FilePlus2> = {
  created: FilePlus2,
  status_changed: ArrowRightLeft,
  priority_changed: Wrench,
  assigned: UserPlus,
  unassigned: UserMinus,
  commented: MessageSquare,
  reopened: RotateCcw,
  feedback: Star,
  edited: Wrench,
};

function describe(entry: Entry, assigneeName: string | null): string {
  const actor = entry.actor?.name ?? 'Someone';
  switch (entry.type) {
    case 'created':
      return `${actor} submitted this complaint`;
    case 'status_changed':
      return `${actor} moved it from ${STATUS_LABEL[entry.from as ComplaintStatus] ?? entry.from} to ${
        STATUS_LABEL[entry.to as ComplaintStatus] ?? entry.to
      }`;
    case 'priority_changed':
      return `${actor} changed priority from ${
        PRIORITY_LABEL[entry.from as ComplaintPriority] ?? entry.from
      } to ${PRIORITY_LABEL[entry.to as ComplaintPriority] ?? entry.to}`;
    case 'assigned':
      return `${actor} assigned it to ${assigneeName ?? 'a staff member'}`;
    case 'unassigned':
      return `${actor} removed the assignee`;
    case 'commented':
      return entry.isInternal ? `${actor} added an internal note` : `${actor} replied`;
    case 'reopened':
      return `${actor} reopened this complaint`;
    case 'feedback':
      return `${actor} rated the resolution ${entry.to} out of 5`;
    case 'edited':
      return `${actor} edited the details`;
    default:
      return `${actor} updated this complaint`;
  }
}

export function ActivityTimeline({ complaint }: { complaint: ComplaintDetail }) {
  const assigneeName = complaint.assignee?.name ?? null;

  return (
    <ol className="relative space-y-5 pl-6">
      {/* Spine, drawn behind the markers. */}
      <span
        aria-hidden
        className="absolute top-2 bottom-2 left-[11px] w-px bg-border"
      />
      {complaint.activity.map((entry) => {
        const Icon = ICON[entry.type] ?? ArrowRightLeft;
        return (
          <li key={entry.id} className="relative">
            <span className="absolute top-0.5 -left-6 flex size-[23px] items-center justify-center rounded-full border border-border bg-background">
              <Icon className="size-3 text-muted-foreground" aria-hidden />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {entry.actor && <UserAvatar user={entry.actor} className="size-5" />}
              <p className="text-sm">{describe(entry, assigneeName)}</p>
              {entry.isInternal && (
                <Badge variant="muted" className="gap-1">
                  <Lock className="size-3" />
                  Internal
                </Badge>
              )}
            </div>
            <time
              className="text-xs text-muted-foreground"
              dateTime={entry.createdAt}
              title={dateTime(entry.createdAt)}
            >
              {relativeTime(entry.createdAt)}
            </time>
            {entry.note && (
              <p className="mt-1.5 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                {entry.note}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
