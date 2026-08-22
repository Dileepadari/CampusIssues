import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowBigUp,
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Pencil,
  RotateCcw,
  Trash2,
  UserRound,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { UserAvatar } from '@/components/common/UserAvatar';
import { ActivityTimeline } from '@/components/complaints/ActivityTimeline';
import { AttachmentList } from '@/components/complaints/AttachmentPicker';
import { CommentThread } from '@/components/complaints/CommentThread';
import { ComplaintForm } from '@/components/complaints/ComplaintForm';
import { FeedbackCard } from '@/components/complaints/FeedbackCard';
import { StaffPanel } from '@/components/complaints/StaffPanel';
import { useAuth } from '@/contexts/AuthContext';
import {
  errorMessage,
  useChangeStatus,
  useComplaint,
  useDeleteComplaint,
  useReopenComplaint,
  useToggleUpvote,
  useUpdateComplaint,
} from '@/hooks/useComplaints';
import { dateTime, dueLabel, relativeTime } from '@/lib/format';
import {
  CATEGORY_DEPARTMENT,
  CATEGORY_LABEL,
  isOpenStatus,
  type ComplaintDetail as ComplaintDetailType,
} from '@/lib/types';
import { cn } from '@/lib/utils';

function DetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isStaff, isAdmin } = useAuth();
  const { data: complaint, isPending, error } = useComplaint(id);

  const [isEditing, setIsEditing] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const update = useUpdateComplaint(id ?? '');
  const changeStatus = useChangeStatus(id ?? '');
  const reopen = useReopenComplaint(id ?? '');
  const remove = useDeleteComplaint();
  const upvote = useToggleUpvote();

  if (isPending) return <DetailSkeleton />;

  if (error || !complaint || !user) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="py-10 text-center">
          <p className="font-medium">{error ? errorMessage(error) : 'Complaint not found'}</p>
          <Button asChild className="mt-5">
            <Link to="/complaints">Back to complaints</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const detail: ComplaintDetailType = complaint;
  const isAuthor = detail.authorId === user.id;
  const open = isOpenStatus(detail.status);
  const canEdit = isAuthor && detail.status === 'submitted';
  const canWithdraw = isAuthor && open;
  const canReopen = (isAuthor || isStaff) && !open;
  const hasUpvoted = detail.upvotedBy.includes(user.id);

  if (isEditing) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setIsEditing(false)}>
          <ArrowLeft className="size-4" />
          Back to complaint
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Edit complaint</h1>
        <Card>
          <CardContent>
            <ComplaintForm
              submitLabel="Save changes"
              isSubmitting={update.isPending}
              onCancel={() => setIsEditing(false)}
              defaultValues={{
                title: detail.title,
                description: detail.description,
                category: detail.category,
                priority: detail.priority,
                location: detail.location ?? '',
                visibility: detail.visibility,
                isAnonymous: detail.isAnonymous,
                attachments: detail.attachments,
              }}
              onSubmit={(input) =>
                update.mutate(input, { onSuccess: () => setIsEditing(false) })
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={detail.status} />
              <PriorityBadge priority={detail.priority} />
              <Badge variant="muted">{CATEGORY_LABEL[detail.category]}</Badge>
              {detail.isOverdue && <Badge variant="destructive">Overdue</Badge>}
              {detail.reopenCount > 0 && (
                <Badge variant="outline">
                  Reopened {detail.reopenCount}
                  {detail.reopenCount === 1 ? ' time' : ' times'}
                </Badge>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-balance">
              {detail.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <UserAvatar user={detail.author} className="size-5" />
                {detail.author ? detail.author.name : 'Anonymous'}
                {detail.isAnonymous && isStaff && detail.author && ' (anonymous to students)'}
              </span>
              <span>{relativeTime(detail.createdAt)}</span>
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1.5 rounded font-mono text-xs hover:text-foreground"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(detail.trackingId)
                    .then(() => toast.success('Tracking ID copied'))
                    .catch(() => toast.error('Could not copy - select it manually'));
                }}
              >
                <Copy className="size-3.5" aria-hidden />
                {detail.trackingId}
              </button>
            </div>
          </div>

          <Card>
            <CardContent className="space-y-5">
              <p className="text-sm whitespace-pre-wrap">{detail.description}</p>
              <AttachmentList attachments={detail.attachments} />
            </CardContent>
          </Card>

          {detail.resolutionNote && (
            <Card
              className={cn(
                'border-l-4',
                detail.status === 'rejected' ? 'border-l-destructive' : 'border-l-[var(--status-resolved)]',
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {detail.status === 'rejected' ? (
                    <XCircle className="size-4 text-destructive" aria-hidden />
                  ) : (
                    <CheckCircle2 className="size-4 text-[var(--status-resolved)]" aria-hidden />
                  )}
                  {detail.status === 'rejected' ? 'Why this was rejected' : 'What was done'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {detail.resolutionNote}
                </p>
              </CardContent>
            </Card>
          )}

          {!open && <FeedbackCard complaint={detail} isAuthor={isAuthor} />}

          <Card>
            <CardContent>
              <Tabs defaultValue="conversation">
                <TabsList>
                  <TabsTrigger value="conversation">
                    Conversation
                    {detail.commentCount > 0 && (
                      <span className="text-muted-foreground">({detail.commentCount})</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="conversation" className="pt-2">
                  <CommentThread complaint={detail} currentUser={user} />
                </TabsContent>
                <TabsContent value="activity" className="pt-2">
                  <ActivityTimeline complaint={detail} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetaRow icon={Building2} label="Handled by">
                {CATEGORY_DEPARTMENT[detail.category]}
              </MetaRow>

              <MetaRow icon={UserRound} label="Assignee">
                {detail.assignee ? (
                  <span className="flex items-center gap-1.5">
                    <UserAvatar user={detail.assignee} className="size-5" />
                    {detail.assignee.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Not assigned yet</span>
                )}
              </MetaRow>

              {detail.location && (
                <MetaRow icon={MapPin} label="Location">
                  {detail.location}
                </MetaRow>
              )}

              <MetaRow icon={CalendarClock} label={open ? 'Response target' : 'Timeline'}>
                {open ? (
                  <span className={cn(detail.isOverdue && 'text-destructive')}>
                    {dueLabel(detail.dueAt, false)}
                  </span>
                ) : (
                  <span>
                    Closed {detail.resolvedAt ? dateTime(detail.resolvedAt) : dateTime(detail.updatedAt)}
                  </span>
                )}
              </MetaRow>

              <MetaRow
                icon={detail.visibility === 'public' ? Eye : EyeOff}
                label="Visibility"
              >
                {detail.visibility === 'public'
                  ? 'On the community board'
                  : 'Private - you and staff only'}
              </MetaRow>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {detail.upvotedBy.length} upvote{detail.upvotedBy.length === 1 ? '' : 's'}
                </span>
                {!isAuthor && detail.visibility === 'public' && (
                  <Button
                    variant={hasUpvoted ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => upvote.mutate(detail.id)}
                    aria-pressed={hasUpvoted}
                  >
                    <ArrowBigUp className={cn('size-4', hasUpvoted && 'fill-current')} />
                    {hasUpvoted ? 'Upvoted' : 'Upvote'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {isStaff && <StaffPanel complaint={detail} />}

          {(canEdit || canWithdraw || canReopen || isAdmin) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {canEdit && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Pencil className="size-4" />
                    Edit complaint
                  </Button>
                )}
                {canWithdraw && (
                  <Button variant="outline" onClick={() => setWithdrawOpen(true)}>
                    <XCircle className="size-4" />
                    Withdraw
                  </Button>
                )}
                {canReopen && (
                  <Button variant="outline" onClick={() => setReopenOpen(true)}>
                    <RotateCcw className="size-4" />
                    Reopen
                  </Button>
                )}
                {isAdmin && (
                  <Button variant="ghost" className="text-destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="size-4" />
                    Delete permanently
                  </Button>
                )}
                {canEdit && (
                  <p className="text-xs text-muted-foreground">
                    Editing is possible until staff start work on this complaint.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title="Withdraw this complaint?"
        description="It will be closed and staff will stop working on it. You can reopen it within 14 days."
        confirmLabel="Withdraw"
        onConfirm={() => changeStatus.mutate({ status: 'closed' })}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this complaint?"
        description="The complaint, its replies and its whole history are removed. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() =>
          remove.mutate(detail.id, { onSuccess: () => navigate('/complaints', { replace: true }) })
        }
      />

      <Dialog open={reopenOpen} onOpenChange={setReopenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reopen this complaint</DialogTitle>
            <DialogDescription>
              Say what is still wrong. It goes back into the queue under review with a fresh
              response target.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={reopenReason}
            onChange={(event) => setReopenReason(event.target.value)}
            placeholder="The lights on that path are out again since Tuesday."
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={reopenReason.trim().length < 10 || reopen.isPending}
              onClick={() =>
                reopen.mutate(reopenReason, {
                  onSuccess: () => {
                    setReopenOpen(false);
                    setReopenReason('');
                  },
                })
              }
            >
              {reopen.isPending && <Loader2 className="size-4 animate-spin" />}
              Reopen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
