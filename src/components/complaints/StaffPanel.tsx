import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  useAssignComplaint,
  useAssignees,
  useChangePriority,
  useChangeStatus,
} from '@/hooks/useComplaints';
import { ALLOWED_TRANSITIONS } from '@/lib/api';
import {
  PRIORITIES,
  PRIORITY_LABEL,
  STATUS_LABEL,
  type ComplaintDetail,
  type ComplaintStatus,
} from '@/lib/types';

/** Statuses that cannot be set without writing down why. */
const NEEDS_NOTE: ComplaintStatus[] = ['resolved', 'rejected'];

export function StaffPanel({ complaint }: { complaint: ComplaintDetail }) {
  const { data: assignees = [] } = useAssignees();
  const changeStatus = useChangeStatus(complaint.id);
  const changePriority = useChangePriority(complaint.id);
  const assign = useAssignComplaint(complaint.id);

  const [pendingStatus, setPendingStatus] = useState<ComplaintStatus | null>(null);
  const [note, setNote] = useState('');

  const nextStatuses = ALLOWED_TRANSITIONS[complaint.status];

  function applyStatus(status: ComplaintStatus) {
    if (NEEDS_NOTE.includes(status)) {
      setNote('');
      setPendingStatus(status);
      return;
    }
    changeStatus.mutate({ status });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Triage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="assignee">Assignee</Label>
          <Select
            value={complaint.assigneeId ?? 'unassigned'}
            onValueChange={(value) => assign.mutate(value === 'unassigned' ? null : value)}
          >
            <SelectTrigger id="assignee" disabled={assign.isPending}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {assignees.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.name}
                  {person.department ? ` - ${person.department}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="priority-select">Priority</Label>
          <Select
            value={complaint.priority}
            onValueChange={(value) =>
              changePriority.mutate(value as (typeof PRIORITIES)[number])
            }
          >
            <SelectTrigger id="priority-select" disabled={changePriority.isPending}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {PRIORITY_LABEL[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Changing priority moves the response deadline, measured from submission.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Move to</Label>
          {nextStatuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This complaint is closed and has no further transitions.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  disabled={changeStatus.isPending}
                  onClick={() => applyStatus(status)}
                >
                  {STATUS_LABEL[status]}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={pendingStatus !== null} onOpenChange={(open) => !open && setPendingStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingStatus === 'resolved' ? 'Mark as resolved' : 'Reject this complaint'}
            </DialogTitle>
            <DialogDescription>
              {pendingStatus === 'resolved'
                ? 'Say what was actually done. The student sees this, and it is what they rate.'
                : 'Explain why this is being rejected so the student knows where to take it instead.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="resolution-note">
              {pendingStatus === 'resolved' ? 'What was done' : 'Reason'}
            </Label>
            <Textarea
              id="resolution-note"
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              autoFocus
            />
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              Status will change from <StatusBadge status={complaint.status} size="sm" /> to{' '}
              {pendingStatus && <StatusBadge status={pendingStatus} size="sm" />}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingStatus(null)}>
              Cancel
            </Button>
            <Button
              disabled={note.trim().length === 0 || changeStatus.isPending}
              onClick={() =>
                pendingStatus &&
                changeStatus.mutate(
                  { status: pendingStatus, note },
                  { onSuccess: () => setPendingStatus(null) },
                )
              }
            >
              {changeStatus.isPending && <Loader2 className="size-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
