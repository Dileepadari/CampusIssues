import { useState } from 'react';
import { Lock, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/common/UserAvatar';
import { EmptyState } from '@/components/common/EmptyState';
import { useAddComment } from '@/hooks/useComplaints';
import { dateTime } from '@/lib/format';
import { isStaff, type ComplaintDetail, type PublicUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

export function CommentThread({
  complaint,
  currentUser,
}: {
  complaint: ComplaintDetail;
  currentUser: PublicUser;
}) {
  const [body, setBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const addComment = useAddComment(complaint.id);
  const staff = isStaff(currentUser.role);
  const canComment = staff || complaint.authorId === currentUser.id;

  return (
    <div className="space-y-5">
      {complaint.comments.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No replies yet"
          description={
            staff
              ? 'Post an update so the student knows this is being looked at.'
              : 'Staff replies will appear here.'
          }
        />
      ) : (
        <ul className="space-y-4">
          {complaint.comments.map((comment) => {
            const isMine = comment.authorId === currentUser.id;
            const authorIsStaff = isStaff(comment.author?.role);
            return (
              <li key={comment.id} className="flex gap-3">
                <UserAvatar user={comment.author} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      {isMine ? 'You' : (comment.author?.name ?? 'Unknown')}
                    </span>
                    {authorIsStaff && <Badge variant="secondary">Staff</Badge>}
                    {comment.isInternal && (
                      <Badge variant="muted" className="gap-1">
                        <Lock className="size-3" />
                        Internal note
                      </Badge>
                    )}
                    <time className="text-xs text-muted-foreground" dateTime={comment.createdAt}>
                      {dateTime(comment.createdAt)}
                    </time>
                  </div>
                  <p
                    className={cn(
                      'mt-1.5 rounded-lg border px-3 py-2 text-sm whitespace-pre-wrap',
                      comment.isInternal
                        ? 'border-dashed border-border bg-muted/40 text-muted-foreground'
                        : 'border-border bg-card',
                    )}
                  >
                    {comment.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canComment ? (
        <form
          className="space-y-3 border-t border-border pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            addComment.mutate(
              { body, isInternal },
              {
                onSuccess: () => {
                  setBody('');
                  setIsInternal(false);
                },
              },
            );
          }}
        >
          <Label htmlFor="reply" className="sr-only">
            Write a reply
          </Label>
          <Textarea
            id="reply"
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={
              isInternal
                ? 'Visible to staff only - context, vendor references, anything not for the student'
                : 'Write a reply...'
            }
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            {staff ? (
              <div className="flex items-center gap-2">
                <Switch id="internal" checked={isInternal} onCheckedChange={setIsInternal} />
                <Label htmlFor="internal" className="text-sm text-muted-foreground">
                  <Lock className="size-3.5" />
                  Internal note
                </Label>
              </div>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={body.trim().length < 2 || addComment.isPending}>
              {addComment.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Post reply
            </Button>
          </div>
        </form>
      ) : (
        <p className="border-t border-border pt-5 text-sm text-muted-foreground">
          Only the person who raised this complaint and staff can reply to it.
        </p>
      )}
    </div>
  );
}
