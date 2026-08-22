import { Link } from 'react-router-dom';
import { ArrowBigUp, Clock, MapPin, MessageSquare, Paperclip } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CATEGORY_LABEL, isOpenStatus, type ComplaintView } from '@/lib/types';
import { dueLabel, relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export function ComplaintCard({
  complaint,
  currentUserId,
  onUpvote,
  showAuthor = true,
}: {
  complaint: ComplaintView;
  currentUserId: string;
  onUpvote?: (id: string) => void;
  showAuthor?: boolean;
}) {
  const hasUpvoted = complaint.upvotedBy.includes(currentUserId);
  const isOwn = complaint.authorId === currentUserId;
  const open = isOpenStatus(complaint.status);

  return (
    <article className="group relative rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            <Badge variant="muted">{CATEGORY_LABEL[complaint.category]}</Badge>
            {complaint.isOverdue && (
              <Badge variant="destructive" className="gap-1">
                <Clock className="size-3" />
                Overdue
              </Badge>
            )}
            {complaint.visibility === 'private' && <Badge variant="outline">Private</Badge>}
          </div>

          <h3 className="text-base font-medium leading-snug">
            {/* The whole card is clickable via this stretched link. */}
            <Link to={`/complaints/${complaint.id}`} className="after:absolute after:inset-0">
              {complaint.title}
            </Link>
          </h3>

          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
            {complaint.description}
          </p>
        </div>

        {onUpvote && !isOwn && (
          <Button
            variant={hasUpvoted ? 'default' : 'outline'}
            size="sm"
            // Sits above the stretched link so the vote does not open the card.
            className="relative z-10 h-auto shrink-0 flex-col gap-0 px-2.5 py-1.5"
            onClick={() => onUpvote(complaint.id)}
            aria-pressed={hasUpvoted}
            aria-label={hasUpvoted ? 'Remove your upvote' : 'Upvote this complaint'}
          >
            <ArrowBigUp className={cn('size-4', hasUpvoted && 'fill-current')} />
            <span className="text-xs font-semibold">{complaint.upvotedBy.length}</span>
          </Button>
        )}
        {(!onUpvote || isOwn) && complaint.upvotedBy.length > 0 && (
          <span className="flex shrink-0 flex-col items-center rounded-md border border-border px-2.5 py-1.5 text-muted-foreground">
            <ArrowBigUp className="size-4" aria-hidden />
            <span className="text-xs font-semibold">{complaint.upvotedBy.length}</span>
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {showAuthor && (
          <span className="flex items-center gap-1.5">
            <UserAvatar user={complaint.author} className="size-5" />
            {complaint.author ? complaint.author.name : 'Anonymous'}
          </span>
        )}
        <span className="font-mono text-[11px]">{complaint.trackingId}</span>
        {complaint.location && (
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {complaint.location}
          </span>
        )}
        {complaint.commentCount > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3.5" aria-hidden />
            {complaint.commentCount}
          </span>
        )}
        {complaint.attachments.length > 0 && (
          <span className="flex items-center gap-1">
            <Paperclip className="size-3.5" aria-hidden />
            {complaint.attachments.length}
          </span>
        )}
        <span className="ml-auto flex items-center gap-3">
          {open && (
            <span className={cn(complaint.isOverdue && 'text-destructive')}>
              {dueLabel(complaint.dueAt, false)}
            </span>
          )}
          <span>{relativeTime(complaint.createdAt)}</span>
        </span>
      </div>

      {complaint.assignee && (
        <p className="mt-2 text-xs text-muted-foreground">
          Assigned to <span className="text-foreground">{complaint.assignee.name}</span>
        </p>
      )}
    </article>
  );
}
