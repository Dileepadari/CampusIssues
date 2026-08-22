import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from '@/lib/api';
import { ApiError } from '@/lib/api';
import type {
  CommentInput,
  ComplaintInput,
  ComplaintPriority,
  ComplaintQuery,
  ComplaintStatus,
  FeedbackInput,
  Role,
} from '@/lib/types';

/**
 * Every server interaction the UI performs. Mutations invalidate the query
 * families they can affect, so a status change updates the list, the detail
 * page, the stat tiles and the notification bell without any manual refetch.
 */

export const queryKeys = {
  complaints: ['complaints'] as const,
  complaintList: (query: ComplaintQuery) => ['complaints', 'list', query] as const,
  complaint: (id: string) => ['complaints', 'detail', id] as const,
  stats: (scope: 'all' | 'mine') => ['stats', scope] as const,
  workload: ['workload'] as const,
  users: ['users'] as const,
  assignees: ['assignees'] as const,
  notifications: ['notifications'] as const,
  tracking: (trackingId: string) => ['tracking', trackingId] as const,
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) {
    // Zod validation errors arrive as a JSON array of issues.
    try {
      const issues = JSON.parse(error.message) as { message?: string }[];
      if (Array.isArray(issues) && issues[0]?.message) return issues[0].message;
    } catch {
      /* not a zod error */
    }
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

type QueryKeyLike = readonly unknown[];

type ApiMutationOptions<TData, TVariables> = {
  success?: string | ((data: TData) => string);
  invalidate?: readonly QueryKeyLike[];
} & Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>;

/** Shared mutation wiring: toast on failure, refresh the affected caches. */
function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: ApiMutationOptions<TData, TVariables> = {},
) {
  const queryClient = useQueryClient();
  const { success, invalidate, onSuccess, onError, ...rest } = options;

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: (...args) => {
      for (const key of invalidate ?? []) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
      const data = args[0];
      if (success) toast.success(typeof success === 'function' ? success(data) : success);
      onSuccess?.(...args);
    },
    onError: (...args) => {
      toast.error(errorMessage(args[0]));
      onError?.(...args);
    },
    ...rest,
  });
}

const COMPLAINT_CACHES = [
  queryKeys.complaints,
  ['stats'],
  queryKeys.notifications,
  queryKeys.workload,
] as const;

/* ----------------------------- reads ----------------------------- */

export function useComplaintList(query: ComplaintQuery) {
  return useQuery({
    queryKey: queryKeys.complaintList(query),
    queryFn: () => api.listComplaints(query),
    placeholderData: (previous) => previous,
  });
}

export function useComplaint(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.complaint(id ?? ''),
    queryFn: () => api.getComplaint(id!),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useStats(scope: 'all' | 'mine') {
  return useQuery({ queryKey: queryKeys.stats(scope), queryFn: () => api.getStats(scope) });
}

export function useStaffWorkload() {
  return useQuery({ queryKey: queryKeys.workload, queryFn: api.getStaffWorkload });
}

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: api.listUsers });
}

export function useAssignees() {
  return useQuery({ queryKey: queryKeys.assignees, queryFn: api.listAssignees });
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: api.listNotifications,
    refetchInterval: 60_000,
  });
}

/* --------------------------- mutations --------------------------- */

export function useCreateComplaint() {
  return useApiMutation((input: ComplaintInput) => api.createComplaint(input), {
    invalidate: [...COMPLAINT_CACHES],
  });
}

export function useUpdateComplaint(id: string) {
  return useApiMutation((input: ComplaintInput) => api.updateComplaint(id, input), {
    success: 'Complaint updated',
    invalidate: [...COMPLAINT_CACHES],
  });
}

export function useChangeStatus(id: string) {
  return useApiMutation(
    (vars: { status: ComplaintStatus; note?: string }) =>
      api.changeStatus(id, vars.status, vars.note),
    { success: 'Status updated', invalidate: [...COMPLAINT_CACHES] },
  );
}

export function useChangePriority(id: string) {
  return useApiMutation((priority: ComplaintPriority) => api.changePriority(id, priority), {
    success: 'Priority updated',
    invalidate: [...COMPLAINT_CACHES],
  });
}

export function useAssignComplaint(id: string) {
  return useApiMutation((assigneeId: string | null) => api.assignComplaint(id, assigneeId), {
    success: 'Assignment updated',
    invalidate: [...COMPLAINT_CACHES],
  });
}

export function useAddComment(id: string) {
  return useApiMutation((input: CommentInput) => api.addComment(id, input), {
    success: 'Reply posted',
    invalidate: [...COMPLAINT_CACHES],
  });
}

export function useReopenComplaint(id: string) {
  return useApiMutation((reason: string) => api.reopenComplaint(id, reason), {
    success: 'Complaint reopened',
    invalidate: [...COMPLAINT_CACHES],
  });
}

export function useSubmitFeedback(id: string) {
  return useApiMutation((input: FeedbackInput) => api.submitFeedback(id, input), {
    success: 'Thanks for the feedback',
    invalidate: [...COMPLAINT_CACHES],
  });
}

export function useToggleUpvote() {
  return useApiMutation((id: string) => api.toggleUpvote(id), {
    invalidate: [queryKeys.complaints],
  });
}

export function useDeleteComplaint() {
  return useApiMutation((id: string) => api.deleteComplaint(id), {
    success: 'Complaint deleted',
    invalidate: [...COMPLAINT_CACHES],
  });
}

export function useSetUserRole() {
  return useApiMutation((vars: { userId: string; role: Role }) => api.setUserRole(vars.userId, vars.role), {
    success: 'Role updated',
    invalidate: [queryKeys.users, queryKeys.assignees, queryKeys.complaints],
  });
}

export function useSetUserActive() {
  return useApiMutation(
    (vars: { userId: string; isActive: boolean }) => api.setUserActive(vars.userId, vars.isActive),
    {
      success: 'Account updated',
      invalidate: [queryKeys.users, queryKeys.assignees, queryKeys.complaints],
    },
  );
}

export function useMarkNotificationRead() {
  return useApiMutation((id: string) => api.markNotificationRead(id), {
    invalidate: [queryKeys.notifications],
  });
}

export function useMarkAllNotificationsRead() {
  return useApiMutation(() => api.markAllNotificationsRead(), {
    invalidate: [queryKeys.notifications],
  });
}
