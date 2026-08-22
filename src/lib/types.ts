import { z } from 'zod';

/* ------------------------------------------------------------------ *
 * Roles
 * ------------------------------------------------------------------ */

export const ROLES = ['student', 'staff', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  student: 'Student',
  staff: 'Staff',
  admin: 'Administrator',
};

/** Staff and admin share every triage capability; only admin manages people. */
export function isStaff(role: Role | undefined): boolean {
  return role === 'staff' || role === 'admin';
}

/* ------------------------------------------------------------------ *
 * Complaint enums
 * ------------------------------------------------------------------ */

export const STATUSES = [
  'submitted',
  'under_review',
  'in_progress',
  'resolved',
  'rejected',
  'closed',
] as const;
export type ComplaintStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<ComplaintStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  in_progress: 'In progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
  closed: 'Closed',
};

/** CSS custom properties defined in index.css, shared by badges and charts. */
export const STATUS_COLOR_VAR: Record<ComplaintStatus, string> = {
  submitted: 'var(--status-submitted)',
  under_review: 'var(--status-review)',
  in_progress: 'var(--status-progress)',
  resolved: 'var(--status-resolved)',
  rejected: 'var(--status-rejected)',
  closed: 'var(--status-closed)',
};

/** A complaint in one of these states no longer counts as open work. */
export const TERMINAL_STATUSES: ComplaintStatus[] = ['resolved', 'rejected', 'closed'];

export const isOpenStatus = (s: ComplaintStatus) => !TERMINAL_STATUSES.includes(s);

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type ComplaintPriority = (typeof PRIORITIES)[number];

export const PRIORITY_LABEL: Record<ComplaintPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_COLOR_VAR: Record<ComplaintPriority, string> = {
  low: 'var(--priority-low)',
  medium: 'var(--priority-medium)',
  high: 'var(--priority-high)',
  urgent: 'var(--priority-urgent)',
};

/** Response-time target per priority, in hours. Drives `dueAt` and overdue flags. */
export const SLA_HOURS: Record<ComplaintPriority, number> = {
  urgent: 24,
  high: 72,
  medium: 168,
  low: 336,
};

export const CATEGORIES = [
  'academics',
  'faculty',
  'infrastructure',
  'hostel',
  'canteen',
  'transport',
  'library',
  'it_support',
  'sports',
  'safety',
  'administration',
  'other',
] as const;
export type ComplaintCategory = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<ComplaintCategory, string> = {
  academics: 'Academics',
  faculty: 'Faculty',
  infrastructure: 'Infrastructure',
  hostel: 'Hostel',
  canteen: 'Canteen',
  transport: 'Transport',
  library: 'Library',
  it_support: 'IT support',
  sports: 'Sports',
  safety: 'Safety and security',
  administration: 'Administration',
  other: 'Other',
};

/** Which department each category is routed to, shown on the detail page. */
export const CATEGORY_DEPARTMENT: Record<ComplaintCategory, string> = {
  academics: 'Academic Office',
  faculty: 'Dean of Faculty',
  infrastructure: 'Campus Maintenance',
  hostel: 'Hostel Administration',
  canteen: 'Food Services',
  transport: 'Transport Office',
  library: 'Library Services',
  it_support: 'IT Services',
  sports: 'Sports Board',
  safety: 'Campus Security',
  administration: 'Registrar',
  other: 'Student Affairs',
};

export const VISIBILITIES = ['public', 'private'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

/* ------------------------------------------------------------------ *
 * Entities
 * ------------------------------------------------------------------ */

export type Attachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  /** Base64 data URL. A real deployment would store an object-storage key here. */
  dataUrl: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  /** Roll number for students, employee ID for staff. */
  identifier: string | null;
  passwordHash: string;
  passwordSalt: string;
  isActive: boolean;
  createdAt: string;
};

/** What the rest of the app is allowed to see. Never carries credential fields. */
export type PublicUser = Omit<User, 'passwordHash' | 'passwordSalt'>;

export type Complaint = {
  id: string;
  trackingId: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  location: string | null;
  visibility: Visibility;
  isAnonymous: boolean;
  authorId: string;
  assigneeId: string | null;
  attachments: Attachment[];
  upvotedBy: string[];
  createdAt: string;
  updatedAt: string;
  dueAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  /** Required when moving to resolved or rejected. */
  resolutionNote: string | null;
  satisfaction: { rating: number; comment: string | null; at: string } | null;
  reopenCount: number;
};

export type Comment = {
  id: string;
  complaintId: string;
  authorId: string;
  body: string;
  /** Internal notes are visible to staff and admins only. */
  isInternal: boolean;
  createdAt: string;
};

export const ACTIVITY_TYPES = [
  'created',
  'status_changed',
  'priority_changed',
  'assigned',
  'unassigned',
  'commented',
  'reopened',
  'feedback',
  'edited',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type Activity = {
  id: string;
  complaintId: string;
  /** Null for system-generated events. */
  actorId: string | null;
  type: ActivityType;
  from: string | null;
  to: string | null;
  note: string | null;
  /** Internal activity is hidden from the author and from public tracking. */
  isInternal: boolean;
  createdAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  complaintId: string | null;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

/* ------------------------------------------------------------------ *
 * Composed read models
 * ------------------------------------------------------------------ */

/** A complaint plus everything a page needs to render it without extra lookups. */
export type ComplaintView = Complaint & {
  author: PublicUser | null;
  assignee: PublicUser | null;
  commentCount: number;
  isOverdue: boolean;
};

export type ComplaintDetail = ComplaintView & {
  comments: (Comment & { author: PublicUser | null })[];
  activity: (Activity & { actor: PublicUser | null })[];
};

/** The redacted view returned by public tracking-ID lookup. */
export type TrackedComplaint = {
  trackingId: string;
  title: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  department: string;
  createdAt: string;
  updatedAt: string;
  dueAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  timeline: { status: ComplaintStatus; at: string }[];
};

export type Stats = {
  total: number;
  open: number;
  byStatus: Record<ComplaintStatus, number>;
  byCategory: Record<ComplaintCategory, number>;
  byPriority: Record<ComplaintPriority, number>;
  overdue: number;
  unassigned: number;
  /** Mean hours from creation to resolution, null when nothing is resolved yet. */
  avgResolutionHours: number | null;
  /** Share of resolved complaints closed before their SLA due date, 0-100. */
  slaCompliance: number | null;
  avgSatisfaction: number | null;
  /** Complaints created per day for the last 30 days. */
  trend: { date: string; created: number; resolved: number }[];
};

/* ------------------------------------------------------------------ *
 * Validation schemas
 * ------------------------------------------------------------------ */

const email = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .toLowerCase();

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be under 128 characters')
  .regex(/[a-zA-Z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    email,
    identifier: z.string().trim().max(40).optional().or(z.literal('')),
    department: z.string().trim().max(80).optional().or(z.literal('')),
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type SignupInput = z.infer<typeof signupSchema>;

export const MAX_ATTACHMENTS = 4;
export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

export const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  size: z.number().max(MAX_ATTACHMENT_BYTES, 'Each file must be 4 MB or smaller'),
  dataUrl: z.string(),
});

export const complaintSchema = z.object({
  title: z
    .string()
    .trim()
    .min(8, 'Give the issue a title of at least 8 characters')
    .max(120, 'Keep the title under 120 characters'),
  description: z
    .string()
    .trim()
    .min(30, 'Describe the issue in at least 30 characters so it can be acted on')
    .max(4000, 'Keep the description under 4000 characters'),
  category: z.enum(CATEGORIES, { message: 'Pick a category' }),
  priority: z.enum(PRIORITIES),
  location: z.string().trim().max(120).optional().or(z.literal('')),
  visibility: z.enum(VISIBILITIES),
  isAnonymous: z.boolean(),
  attachments: z.array(attachmentSchema).max(MAX_ATTACHMENTS, 'At most 4 attachments'),
});
export type ComplaintInput = z.infer<typeof complaintSchema>;

export const commentSchema = z.object({
  body: z.string().trim().min(2, 'Write a message').max(2000, 'Keep it under 2000 characters'),
  isInternal: z.boolean(),
});
export type CommentInput = z.infer<typeof commentSchema>;

export const resolutionSchema = z.object({
  status: z.enum(STATUSES),
  note: z.string().trim().max(2000).optional().or(z.literal('')),
});

export const feedbackSchema = z.object({
  rating: z.number().int().min(1, 'Pick a rating').max(5),
  comment: z.string().trim().max(1000).optional().or(z.literal('')),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  department: z.string().trim().max(80).optional().or(z.literal('')),
  identifier: z.string().trim().max(40).optional().or(z.literal('')),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

/* ------------------------------------------------------------------ *
 * Query options
 * ------------------------------------------------------------------ */

export const SORT_OPTIONS = ['newest', 'oldest', 'priority', 'updated', 'upvotes', 'due'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const SORT_LABEL: Record<SortOption, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  updated: 'Recently updated',
  priority: 'Highest priority',
  upvotes: 'Most upvoted',
  due: 'Due soonest',
};

export type ComplaintQuery = {
  /** 'mine' = authored by the actor, 'assigned' = assigned to the actor. */
  scope?: 'all' | 'mine' | 'assigned' | 'public';
  search?: string;
  status?: ComplaintStatus | 'all' | 'open';
  category?: ComplaintCategory | 'all';
  priority?: ComplaintPriority | 'all';
  assigneeId?: string | 'all' | 'unassigned';
  sort?: SortOption;
  page?: number;
  pageSize?: number;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};
