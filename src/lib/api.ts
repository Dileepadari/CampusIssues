import { getDatabase, flush, mutate, resetDatabase, type Database } from '@/lib/db';
import {
  hashPassword,
  newId,
  newSessionToken,
  newTrackingId,
  randomSalt,
  verifyPassword,
} from '@/lib/crypto';
import {
  CATEGORIES,
  CATEGORY_DEPARTMENT,
  PRIORITIES,
  ROLE_LABEL,
  SLA_HOURS,
  STATUSES,
  commentSchema,
  complaintSchema,
  feedbackSchema,
  isOpenStatus,
  isStaff,
  loginSchema,
  passwordChangeSchema,
  profileSchema,
  signupSchema,
  type Activity,
  type ActivityType,
  type Comment,
  type CommentInput,
  type Complaint,
  type ComplaintCategory,
  type ComplaintDetail,
  type ComplaintInput,
  type ComplaintPriority,
  type ComplaintQuery,
  type ComplaintStatus,
  type ComplaintView,
  type FeedbackInput,
  type LoginInput,
  type Notification,
  type Paginated,
  type PasswordChangeInput,
  type ProfileInput,
  type PublicUser,
  type Role,
  type SignupInput,
  type Stats,
  type TrackedComplaint,
  type User,
} from '@/lib/types';

/**
 * Application API.
 *
 * Every read and write goes through this module, and every function that
 * mutates state re-checks who the caller is against the same rules a server
 * would enforce. Components never touch the database directly, so replacing
 * `db.ts` with `fetch()` calls to a real backend is a change confined to this
 * file.
 */

const SESSION_KEY = 'campusissues.session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
/** How long after resolution the author may still reopen a complaint. */
const REOPEN_WINDOW_DAYS = 14;

export class ApiError extends Error {
  code: 'unauthenticated' | 'forbidden' | 'not_found' | 'conflict' | 'invalid';

  constructor(code: ApiError['code'], message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/** Small delay so loading states are exercised the way they would be over a network. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 80));

/* ------------------------------------------------------------------ *
 * Session
 * ------------------------------------------------------------------ */

type StoredSession = { token: string; userId: string; expiresAt: number };

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.userId || !parsed.expiresAt || parsed.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(userId: string): void {
  const session: StoredSession = {
    token: newSessionToken(),
    userId,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _hash, passwordSalt: _salt, ...rest } = user;
  return rest;
}

async function currentUserOrNull(db: Database): Promise<User | null> {
  const session = readSession();
  if (!session) return null;
  const user = db.users.find((u) => u.id === session.userId);
  if (!user || !user.isActive) {
    clearSession();
    return null;
  }
  return user;
}

async function requireUser(db: Database): Promise<User> {
  const user = await currentUserOrNull(db);
  if (!user) throw new ApiError('unauthenticated', 'Please sign in to continue');
  return user;
}

async function requireStaff(db: Database): Promise<User> {
  const user = await requireUser(db);
  if (!isStaff(user.role)) {
    throw new ApiError('forbidden', 'This action is restricted to staff');
  }
  return user;
}

async function requireAdmin(db: Database): Promise<User> {
  const user = await requireUser(db);
  if (user.role !== 'admin') {
    throw new ApiError('forbidden', 'This action is restricted to administrators');
  }
  return user;
}

/* ------------------------------------------------------------------ *
 * Auth
 * ------------------------------------------------------------------ */

export async function signUp(input: SignupInput): Promise<PublicUser> {
  const parsed = signupSchema.parse(input);
  await tick();
  const db = await getDatabase();

  if (db.users.some((u) => u.email === parsed.email)) {
    throw new ApiError('conflict', 'An account with this email already exists');
  }

  const salt = randomSalt();
  const user: User = {
    id: newId('usr'),
    name: parsed.name,
    email: parsed.email,
    // Self-service sign-up always creates a student. Staff and admin accounts
    // are granted by an existing admin from the Users screen.
    role: 'student',
    department: parsed.department?.trim() || null,
    identifier: parsed.identifier?.trim() || null,
    passwordHash: await hashPassword(parsed.password, salt),
    passwordSalt: salt,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  await mutate((d) => d.users.push(user));
  writeSession(user.id);
  return toPublicUser(user);
}

export async function signIn(input: LoginInput): Promise<PublicUser> {
  const parsed = loginSchema.parse(input);
  await tick();
  const db = await getDatabase();

  const user = db.users.find((u) => u.email === parsed.email);
  // Same message either way so the form cannot be used to enumerate accounts.
  const invalid = new ApiError('invalid', 'Email or password is incorrect');
  if (!user) throw invalid;

  const ok = await verifyPassword(parsed.password, user.passwordSalt, user.passwordHash);
  if (!ok) throw invalid;
  if (!user.isActive) {
    throw new ApiError('forbidden', 'This account has been deactivated. Contact the administrator.');
  }

  writeSession(user.id);
  return toPublicUser(user);
}

export async function signOut(): Promise<void> {
  clearSession();
}

export async function getSessionUser(): Promise<PublicUser | null> {
  const db = await getDatabase();
  const user = await currentUserOrNull(db);
  return user ? toPublicUser(user) : null;
}

export async function updateProfile(input: ProfileInput): Promise<PublicUser> {
  const parsed = profileSchema.parse(input);
  const db = await getDatabase();
  const user = await requireUser(db);

  await mutate(() => {
    user.name = parsed.name;
    user.department = parsed.department?.trim() || null;
    user.identifier = parsed.identifier?.trim() || null;
  });
  return toPublicUser(user);
}

export async function changePassword(input: PasswordChangeInput): Promise<void> {
  const parsed = passwordChangeSchema.parse(input);
  const db = await getDatabase();
  const user = await requireUser(db);

  const ok = await verifyPassword(parsed.currentPassword, user.passwordSalt, user.passwordHash);
  if (!ok) throw new ApiError('invalid', 'Your current password is incorrect');

  const salt = randomSalt();
  const hash = await hashPassword(parsed.newPassword, salt);
  await mutate(() => {
    user.passwordSalt = salt;
    user.passwordHash = hash;
  });
}

/* ------------------------------------------------------------------ *
 * Internal helpers
 * ------------------------------------------------------------------ */

function findComplaint(db: Database, id: string): Complaint {
  const complaint = db.complaints.find((c) => c.id === id);
  if (!complaint) throw new ApiError('not_found', 'Complaint not found');
  return complaint;
}

/** Students see their own complaints and anything published to the board. */
function canView(complaint: Complaint, user: User): boolean {
  if (isStaff(user.role)) return true;
  if (complaint.authorId === user.id) return true;
  return complaint.visibility === 'public';
}

function isOverdue(complaint: Complaint): boolean {
  return isOpenStatus(complaint.status) && new Date(complaint.dueAt).getTime() < Date.now();
}

function logActivity(
  db: Database,
  complaint: Complaint,
  actorId: string | null,
  type: ActivityType,
  fields: { from?: string | null; to?: string | null; note?: string | null; isInternal?: boolean } = {},
): void {
  const event: Activity = {
    id: newId('act'),
    complaintId: complaint.id,
    actorId,
    type,
    from: fields.from ?? null,
    to: fields.to ?? null,
    note: fields.note ?? null,
    isInternal: fields.isInternal ?? false,
    createdAt: new Date().toISOString(),
  };
  db.activity.push(event);
  complaint.updatedAt = event.createdAt;
}

function notify(
  db: Database,
  userId: string | null,
  complaintId: string | null,
  title: string,
  body: string,
): void {
  if (!userId) return;
  const notification: Notification = {
    id: newId('ntf'),
    userId,
    complaintId,
    title,
    body,
    createdAt: new Date().toISOString(),
    readAt: null,
  };
  db.notifications.push(notification);
}

/** Notifies everyone watching a complaint except whoever triggered the change. */
function notifyParticipants(
  db: Database,
  complaint: Complaint,
  actorId: string,
  title: string,
  body: string,
): void {
  const recipients = new Set<string>();
  recipients.add(complaint.authorId);
  if (complaint.assigneeId) recipients.add(complaint.assigneeId);
  for (const comment of db.comments) {
    if (comment.complaintId === complaint.id && !comment.isInternal) {
      recipients.add(comment.authorId);
    }
  }
  recipients.delete(actorId);
  for (const userId of recipients) notify(db, userId, complaint.id, title, body);
}

function publicUserById(db: Database, id: string | null): PublicUser | null {
  if (!id) return null;
  const user = db.users.find((u) => u.id === id);
  return user ? toPublicUser(user) : null;
}

/** Hides the author from everyone but staff when a complaint is anonymous. */
function visibleAuthor(db: Database, complaint: Complaint, viewer: User): PublicUser | null {
  if (!complaint.isAnonymous) return publicUserById(db, complaint.authorId);
  if (complaint.authorId === viewer.id) return publicUserById(db, complaint.authorId);
  return null;
}

function toView(db: Database, complaint: Complaint, viewer: User): ComplaintView {
  return {
    ...complaint,
    author: visibleAuthor(db, complaint, viewer),
    assignee: publicUserById(db, complaint.assigneeId),
    commentCount: db.comments.filter(
      (c) => c.complaintId === complaint.id && (!c.isInternal || isStaff(viewer.role)),
    ).length,
    isOverdue: isOverdue(complaint),
  };
}

/* ------------------------------------------------------------------ *
 * Complaint workflow
 * ------------------------------------------------------------------ */

/** Which status a complaint may move to next, regardless of who is asking. */
export const ALLOWED_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  submitted: ['under_review', 'in_progress', 'rejected', 'closed'],
  under_review: ['in_progress', 'resolved', 'rejected', 'closed'],
  in_progress: ['under_review', 'resolved', 'rejected', 'closed'],
  resolved: ['closed', 'in_progress'],
  rejected: ['under_review'],
  closed: ['under_review'],
};

/** A note explaining the outcome is mandatory for these states. */
const NOTE_REQUIRED: ComplaintStatus[] = ['resolved', 'rejected'];

export function canTransition(from: ComplaintStatus, to: ComplaintStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export async function createComplaint(input: ComplaintInput): Promise<Complaint> {
  const parsed = complaintSchema.parse(input);
  await tick();
  const db = await getDatabase();
  const user = await requireUser(db);

  const nowIso = new Date().toISOString();
  const complaint: Complaint = {
    id: newId('cmp'),
    trackingId: newTrackingId(),
    title: parsed.title,
    description: parsed.description,
    category: parsed.category,
    priority: parsed.priority,
    status: 'submitted',
    location: parsed.location?.trim() || null,
    visibility: parsed.visibility,
    isAnonymous: parsed.isAnonymous,
    authorId: user.id,
    assigneeId: null,
    attachments: parsed.attachments,
    upvotedBy: [],
    createdAt: nowIso,
    updatedAt: nowIso,
    dueAt: new Date(Date.now() + SLA_HOURS[parsed.priority] * HOUR_MS).toISOString(),
    resolvedAt: null,
    closedAt: null,
    resolutionNote: null,
    satisfaction: null,
    reopenCount: 0,
  };

  await mutate((d) => {
    d.complaints.push(complaint);
    logActivity(d, complaint, user.id, 'created', { to: 'submitted' });
    // Everyone who triages sees new work land in their notification list.
    for (const staff of d.users.filter((u) => isStaff(u.role) && u.isActive)) {
      notify(
        d,
        staff.id,
        complaint.id,
        'New complaint submitted',
        `${complaint.title} (${CATEGORY_DEPARTMENT[complaint.category]})`,
      );
    }
  });

  return complaint;
}

/** The author may correct a complaint only while nobody has started work on it. */
export async function updateComplaint(id: string, input: ComplaintInput): Promise<Complaint> {
  const parsed = complaintSchema.parse(input);
  const db = await getDatabase();
  const user = await requireUser(db);
  const complaint = findComplaint(db, id);

  if (complaint.authorId !== user.id) {
    throw new ApiError('forbidden', 'Only the author can edit a complaint');
  }
  if (complaint.status !== 'submitted') {
    throw new ApiError(
      'conflict',
      'This complaint is already being handled and can no longer be edited. Add a comment instead.',
    );
  }

  await mutate((d) => {
    complaint.title = parsed.title;
    complaint.description = parsed.description;
    complaint.category = parsed.category;
    complaint.location = parsed.location?.trim() || null;
    complaint.visibility = parsed.visibility;
    complaint.isAnonymous = parsed.isAnonymous;
    complaint.attachments = parsed.attachments;
    if (complaint.priority !== parsed.priority) {
      complaint.priority = parsed.priority;
      // The clock restarts from submission, not from the edit.
      complaint.dueAt = new Date(
        new Date(complaint.createdAt).getTime() + SLA_HOURS[parsed.priority] * HOUR_MS,
      ).toISOString();
    }
    logActivity(d, complaint, user.id, 'edited');
  });

  return complaint;
}

export async function changeStatus(
  id: string,
  status: ComplaintStatus,
  note?: string,
): Promise<Complaint> {
  const db = await getDatabase();
  const user = await requireUser(db);
  const complaint = findComplaint(db, id);
  const trimmedNote = note?.trim() || null;

  const isAuthor = complaint.authorId === user.id;
  const staff = isStaff(user.role);

  // An author may only withdraw their own complaint or close one that is done.
  if (!staff) {
    if (!isAuthor) throw new ApiError('forbidden', 'You cannot change this complaint');
    const authorAllowed = status === 'closed';
    if (!authorAllowed) {
      throw new ApiError('forbidden', 'Only staff can move a complaint through triage');
    }
  }

  if (complaint.status === status) {
    throw new ApiError('conflict', `This complaint is already ${status.replace('_', ' ')}`);
  }
  if (!canTransition(complaint.status, status)) {
    throw new ApiError('conflict', 'That status change is not allowed from the current state');
  }
  if (NOTE_REQUIRED.includes(status) && !trimmedNote) {
    throw new ApiError(
      'invalid',
      status === 'resolved'
        ? 'Explain what was done before marking this resolved'
        : 'Give a reason before rejecting this complaint',
    );
  }

  const from = complaint.status;
  await mutate((d) => {
    complaint.status = status;
    if (trimmedNote) complaint.resolutionNote = trimmedNote;

    if (status === 'resolved') {
      complaint.resolvedAt = new Date().toISOString();
      complaint.closedAt = null;
    } else if (status === 'closed') {
      complaint.closedAt = new Date().toISOString();
    } else {
      // Moving back into an open state clears the completion stamps so the
      // resolution-time and SLA figures never count an unfinished complaint.
      complaint.resolvedAt = null;
      complaint.closedAt = null;
    }

    logActivity(d, complaint, user.id, 'status_changed', { from, to: status, note: trimmedNote });
    notifyParticipants(
      d,
      complaint,
      user.id,
      `Status changed to ${status.replace('_', ' ')}`,
      complaint.title,
    );
  });

  return complaint;
}

export async function reopenComplaint(id: string, reason: string): Promise<Complaint> {
  const db = await getDatabase();
  const user = await requireUser(db);
  const complaint = findComplaint(db, id);
  const trimmed = reason.trim();

  if (!trimmed || trimmed.length < 10) {
    throw new ApiError('invalid', 'Say what is still wrong, in at least 10 characters');
  }
  if (isOpenStatus(complaint.status)) {
    throw new ApiError('conflict', 'This complaint is still open');
  }

  const isAuthor = complaint.authorId === user.id;
  if (!isAuthor && !isStaff(user.role)) {
    throw new ApiError('forbidden', 'You cannot reopen this complaint');
  }
  // Staff can reopen at any time; the author only inside the feedback window.
  if (isAuthor && !isStaff(user.role)) {
    const reference = complaint.closedAt ?? complaint.resolvedAt;
    const closedAgo = reference ? Date.now() - new Date(reference).getTime() : 0;
    if (closedAgo > REOPEN_WINDOW_DAYS * DAY_MS) {
      throw new ApiError(
        'conflict',
        `This complaint was closed more than ${REOPEN_WINDOW_DAYS} days ago. Please file a new one.`,
      );
    }
  }

  const from = complaint.status;
  await mutate((d) => {
    complaint.status = 'under_review';
    complaint.resolvedAt = null;
    complaint.closedAt = null;
    complaint.reopenCount += 1;
    // A reopened complaint gets a fresh response window at its own priority.
    complaint.dueAt = new Date(Date.now() + SLA_HOURS[complaint.priority] * HOUR_MS).toISOString();
    logActivity(d, complaint, user.id, 'reopened', { from, to: 'under_review', note: trimmed });
    notifyParticipants(d, complaint, user.id, 'Complaint reopened', complaint.title);
    if (complaint.assigneeId && complaint.assigneeId !== user.id) {
      notify(d, complaint.assigneeId, complaint.id, 'Complaint reopened', complaint.title);
    }
  });

  return complaint;
}

export async function changePriority(id: string, priority: ComplaintPriority): Promise<Complaint> {
  const db = await getDatabase();
  const user = await requireStaff(db);
  const complaint = findComplaint(db, id);

  if (complaint.priority === priority) return complaint;
  const from = complaint.priority;

  await mutate((d) => {
    complaint.priority = priority;
    // Re-derive the due date from submission so raising priority pulls the
    // deadline in rather than granting extra time.
    complaint.dueAt = new Date(
      new Date(complaint.createdAt).getTime() + SLA_HOURS[priority] * HOUR_MS,
    ).toISOString();
    logActivity(d, complaint, user.id, 'priority_changed', { from, to: priority });
    notifyParticipants(d, complaint, user.id, `Priority set to ${priority}`, complaint.title);
  });

  return complaint;
}

export async function assignComplaint(id: string, assigneeId: string | null): Promise<Complaint> {
  const db = await getDatabase();
  const user = await requireStaff(db);
  const complaint = findComplaint(db, id);

  if (assigneeId) {
    const assignee = db.users.find((u) => u.id === assigneeId);
    if (!assignee) throw new ApiError('not_found', 'That person does not exist');
    if (!isStaff(assignee.role)) {
      throw new ApiError('invalid', 'Complaints can only be assigned to staff or administrators');
    }
    if (!assignee.isActive) {
      throw new ApiError('invalid', 'That account is deactivated');
    }
  }

  const from = complaint.assigneeId;
  if (from === assigneeId) return complaint;

  await mutate((d) => {
    complaint.assigneeId = assigneeId;
    logActivity(d, complaint, user.id, assigneeId ? 'assigned' : 'unassigned', {
      from,
      to: assigneeId,
    });
    // Picking up untriaged work moves it out of the submitted queue.
    if (assigneeId && complaint.status === 'submitted') {
      logActivity(d, complaint, user.id, 'status_changed', {
        from: 'submitted',
        to: 'under_review',
      });
      complaint.status = 'under_review';
    }
    if (assigneeId && assigneeId !== user.id) {
      notify(d, assigneeId, complaint.id, 'Complaint assigned to you', complaint.title);
    }
  });

  return complaint;
}

export async function addComment(id: string, input: CommentInput): Promise<Comment> {
  const parsed = commentSchema.parse(input);
  const db = await getDatabase();
  const user = await requireUser(db);
  const complaint = findComplaint(db, id);

  if (!canView(complaint, user)) {
    throw new ApiError('forbidden', 'You cannot comment on this complaint');
  }
  if (parsed.isInternal && !isStaff(user.role)) {
    throw new ApiError('forbidden', 'Only staff can leave internal notes');
  }

  const comment: Comment = {
    id: newId('cmt'),
    complaintId: complaint.id,
    authorId: user.id,
    body: parsed.body,
    isInternal: parsed.isInternal,
    createdAt: new Date().toISOString(),
  };

  await mutate((d) => {
    d.comments.push(comment);
    logActivity(d, complaint, user.id, 'commented', { isInternal: comment.isInternal });
    if (!comment.isInternal) {
      notifyParticipants(d, complaint, user.id, 'New reply on a complaint', complaint.title);
    }
  });

  return comment;
}

export async function submitFeedback(id: string, input: FeedbackInput): Promise<Complaint> {
  const parsed = feedbackSchema.parse(input);
  const db = await getDatabase();
  const user = await requireUser(db);
  const complaint = findComplaint(db, id);

  if (complaint.authorId !== user.id) {
    throw new ApiError('forbidden', 'Only the person who raised this can rate the outcome');
  }
  if (complaint.status !== 'resolved' && complaint.status !== 'closed') {
    throw new ApiError('conflict', 'You can rate a complaint once it has been resolved');
  }
  if (complaint.satisfaction) {
    throw new ApiError('conflict', 'You have already rated this resolution');
  }

  await mutate((d) => {
    complaint.satisfaction = {
      rating: parsed.rating,
      comment: parsed.comment?.trim() || null,
      at: new Date().toISOString(),
    };
    logActivity(d, complaint, user.id, 'feedback', {
      to: String(parsed.rating),
      note: complaint.satisfaction.comment,
    });
    if (complaint.assigneeId) {
      notify(
        d,
        complaint.assigneeId,
        complaint.id,
        `Rated ${parsed.rating} out of 5`,
        complaint.title,
      );
    }
  });

  return complaint;
}

export async function toggleUpvote(id: string): Promise<Complaint> {
  const db = await getDatabase();
  const user = await requireUser(db);
  const complaint = findComplaint(db, id);

  if (!canView(complaint, user)) {
    throw new ApiError('forbidden', 'You cannot vote on this complaint');
  }
  if (complaint.authorId === user.id) {
    throw new ApiError('conflict', 'You cannot upvote your own complaint');
  }

  await mutate(() => {
    const index = complaint.upvotedBy.indexOf(user.id);
    if (index >= 0) complaint.upvotedBy.splice(index, 1);
    else complaint.upvotedBy.push(user.id);
  });

  return complaint;
}

export async function deleteComplaint(id: string): Promise<void> {
  const db = await getDatabase();
  await requireAdmin(db);
  findComplaint(db, id);

  await mutate((d) => {
    d.complaints = d.complaints.filter((c) => c.id !== id);
    d.comments = d.comments.filter((c) => c.complaintId !== id);
    d.activity = d.activity.filter((a) => a.complaintId !== id);
    d.notifications = d.notifications.filter((n) => n.complaintId !== id);
  });
}

/* ------------------------------------------------------------------ *
 * Complaint reads
 * ------------------------------------------------------------------ */

const PRIORITY_RANK: Record<ComplaintPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export async function listComplaints(
  query: ComplaintQuery = {},
): Promise<Paginated<ComplaintView>> {
  await tick();
  const db = await getDatabase();
  const user = await requireUser(db);

  const {
    scope = 'all',
    search = '',
    status = 'all',
    category = 'all',
    priority = 'all',
    assigneeId = 'all',
    sort = 'newest',
    page = 1,
    pageSize = 10,
  } = query;

  const needle = search.trim().toLowerCase();

  let items = db.complaints.filter((complaint) => {
    if (!canView(complaint, user)) return false;

    if (scope === 'mine' && complaint.authorId !== user.id) return false;
    if (scope === 'assigned' && complaint.assigneeId !== user.id) return false;
    if (scope === 'public' && complaint.visibility !== 'public') return false;
    // Students browsing the board should see the community, not their own list.
    if (scope === 'all' && !isStaff(user.role) && complaint.authorId !== user.id) {
      if (complaint.visibility !== 'public') return false;
    }

    if (status === 'open' && !isOpenStatus(complaint.status)) return false;
    if (status !== 'all' && status !== 'open' && complaint.status !== status) return false;
    if (category !== 'all' && complaint.category !== category) return false;
    if (priority !== 'all' && complaint.priority !== priority) return false;

    if (assigneeId === 'unassigned' && complaint.assigneeId !== null) return false;
    if (assigneeId !== 'all' && assigneeId !== 'unassigned' && complaint.assigneeId !== assigneeId) {
      return false;
    }

    if (needle) {
      const haystack = [
        complaint.title,
        complaint.description,
        complaint.trackingId,
        complaint.location ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    return true;
  });

  const time = (value: string) => new Date(value).getTime();
  items = [...items].sort((a, b) => {
    switch (sort) {
      case 'oldest':
        return time(a.createdAt) - time(b.createdAt);
      case 'updated':
        return time(b.updatedAt) - time(a.updatedAt);
      case 'priority':
        return (
          PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] ||
          time(a.createdAt) - time(b.createdAt)
        );
      case 'upvotes':
        return b.upvotedBy.length - a.upvotedBy.length || time(b.createdAt) - time(a.createdAt);
      case 'due':
        // Open work first, soonest deadline at the top.
        if (isOpenStatus(a.status) !== isOpenStatus(b.status)) {
          return isOpenStatus(a.status) ? -1 : 1;
        }
        return time(a.dueAt) - time(b.dueAt);
      case 'newest':
      default:
        return time(b.createdAt) - time(a.createdAt);
    }
  });

  const total = items.length;
  const safePageSize = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize).map((c) => toView(db, c, user)),
    total,
    page: safePage,
    pageSize: safePageSize,
    pageCount,
  };
}

export async function getComplaint(id: string): Promise<ComplaintDetail> {
  await tick();
  const db = await getDatabase();
  const user = await requireUser(db);
  const complaint = findComplaint(db, id);

  if (!canView(complaint, user)) {
    throw new ApiError('forbidden', 'You do not have access to this complaint');
  }

  const staff = isStaff(user.role);
  const time = (value: string) => new Date(value).getTime();

  const comments = db.comments
    .filter((c) => c.complaintId === complaint.id && (staff || !c.isInternal))
    .sort((a, b) => time(a.createdAt) - time(b.createdAt))
    .map((c) => ({ ...c, author: publicUserById(db, c.authorId) }));

  const activity = db.activity
    .filter((a) => a.complaintId === complaint.id && (staff || !a.isInternal))
    .sort((a, b) => time(a.createdAt) - time(b.createdAt))
    .map((a) => ({ ...a, actor: publicUserById(db, a.actorId) }));

  return { ...toView(db, complaint, user), comments, activity };
}

/** Public lookup. Deliberately returns no identities and no internal notes. */
export async function trackComplaint(trackingId: string): Promise<TrackedComplaint> {
  await tick();
  const db = await getDatabase();
  const normalized = trackingId.trim().toUpperCase();

  const complaint = db.complaints.find((c) => c.trackingId.toUpperCase() === normalized);
  if (!complaint) {
    throw new ApiError('not_found', 'No complaint found with that tracking ID');
  }

  const timeline = db.activity
    .filter((a) => a.complaintId === complaint.id && !a.isInternal)
    .filter((a) => a.type === 'created' || a.type === 'status_changed' || a.type === 'reopened')
    .map((a) => ({ status: (a.to ?? 'submitted') as ComplaintStatus, at: a.createdAt }))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return {
    trackingId: complaint.trackingId,
    title: complaint.title,
    category: complaint.category,
    priority: complaint.priority,
    status: complaint.status,
    department: CATEGORY_DEPARTMENT[complaint.category],
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    dueAt: complaint.dueAt,
    resolvedAt: complaint.resolvedAt,
    resolutionNote: complaint.resolutionNote,
    timeline,
  };
}

/* ------------------------------------------------------------------ *
 * Statistics
 * ------------------------------------------------------------------ */

function emptyCount<T extends string>(keys: readonly T[]): Record<T, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>;
}

export async function getStats(scope: 'all' | 'mine' = 'all'): Promise<Stats> {
  await tick();
  const db = await getDatabase();
  const user = await requireUser(db);

  const source = db.complaints.filter((complaint) => {
    if (!canView(complaint, user)) return false;
    if (scope === 'mine') return complaint.authorId === user.id;
    if (!isStaff(user.role)) return complaint.authorId === user.id;
    return true;
  });

  const byStatus = emptyCount(STATUSES);
  const byCategory = emptyCount(CATEGORIES) as Record<ComplaintCategory, number>;
  const byPriority = emptyCount(PRIORITIES);

  let overdue = 0;
  let unassigned = 0;
  let resolutionHoursTotal = 0;
  let resolvedCount = 0;
  let withinSla = 0;
  let ratingTotal = 0;
  let ratingCount = 0;

  for (const complaint of source) {
    byStatus[complaint.status] += 1;
    byCategory[complaint.category] += 1;
    byPriority[complaint.priority] += 1;

    if (isOverdue(complaint)) overdue += 1;
    if (!complaint.assigneeId && isOpenStatus(complaint.status)) unassigned += 1;

    if (complaint.resolvedAt) {
      const hours =
        (new Date(complaint.resolvedAt).getTime() - new Date(complaint.createdAt).getTime()) /
        HOUR_MS;
      resolutionHoursTotal += hours;
      resolvedCount += 1;
      if (new Date(complaint.resolvedAt).getTime() <= new Date(complaint.dueAt).getTime()) {
        withinSla += 1;
      }
    }

    if (complaint.satisfaction) {
      ratingTotal += complaint.satisfaction.rating;
      ratingCount += 1;
    }
  }

  // Thirty day trend, bucketed by local calendar day so "today" matches the user.
  const dayKey = (value: string | number) => {
    const d = new Date(value);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
  };

  const trend: Stats['trend'] = [];
  const buckets = new Map<string, { created: number; resolved: number }>();
  for (let i = 29; i >= 0; i -= 1) {
    const key = dayKey(Date.now() - i * DAY_MS);
    buckets.set(key, { created: 0, resolved: 0 });
  }
  for (const complaint of source) {
    const createdKey = dayKey(complaint.createdAt);
    const createdBucket = buckets.get(createdKey);
    if (createdBucket) createdBucket.created += 1;
    if (complaint.resolvedAt) {
      const resolvedBucket = buckets.get(dayKey(complaint.resolvedAt));
      if (resolvedBucket) resolvedBucket.resolved += 1;
    }
  }
  for (const [date, counts] of buckets) trend.push({ date, ...counts });

  return {
    total: source.length,
    open: source.filter((c) => isOpenStatus(c.status)).length,
    byStatus,
    byCategory,
    byPriority,
    overdue,
    unassigned,
    avgResolutionHours: resolvedCount ? resolutionHoursTotal / resolvedCount : null,
    slaCompliance: resolvedCount ? (withinSla / resolvedCount) * 100 : null,
    avgSatisfaction: ratingCount ? ratingTotal / ratingCount : null,
    trend,
  };
}

/** Per-assignee workload table for the admin analytics screen. */
export async function getStaffWorkload(): Promise<
  { user: PublicUser; open: number; resolved: number; overdue: number; avgHours: number | null }[]
> {
  const db = await getDatabase();
  await requireStaff(db);

  return db.users
    .filter((u) => isStaff(u.role))
    .map((staff) => {
      const assigned = db.complaints.filter((c) => c.assigneeId === staff.id);
      const resolved = assigned.filter((c) => c.resolvedAt);
      const hours = resolved.map(
        (c) =>
          (new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime()) / HOUR_MS,
      );
      return {
        user: toPublicUser(staff),
        open: assigned.filter((c) => isOpenStatus(c.status)).length,
        resolved: resolved.length,
        overdue: assigned.filter(isOverdue).length,
        avgHours: hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : null,
      };
    })
    .sort((a, b) => b.open - a.open);
}

/* ------------------------------------------------------------------ *
 * People
 * ------------------------------------------------------------------ */

export async function listUsers(): Promise<PublicUser[]> {
  await tick();
  const db = await getDatabase();
  await requireStaff(db);
  return db.users
    .map(toPublicUser)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Staff and admins available to take assignments. */
export async function listAssignees(): Promise<PublicUser[]> {
  const db = await getDatabase();
  await requireStaff(db);
  return db.users
    .filter((u) => isStaff(u.role) && u.isActive)
    .map(toPublicUser)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function setUserRole(userId: string, role: Role): Promise<PublicUser> {
  const db = await getDatabase();
  const admin = await requireAdmin(db);
  const target = db.users.find((u) => u.id === userId);
  if (!target) throw new ApiError('not_found', 'User not found');

  if (target.id === admin.id && role !== 'admin') {
    throw new ApiError('conflict', 'You cannot remove your own administrator access');
  }
  if (
    target.role === 'admin' &&
    role !== 'admin' &&
    db.users.filter((u) => u.role === 'admin' && u.isActive).length <= 1
  ) {
    throw new ApiError('conflict', 'At least one active administrator must remain');
  }

  await mutate((d) => {
    target.role = role;
    // Someone who is no longer staff cannot stay on the hook for open work.
    if (!isStaff(role)) {
      for (const complaint of d.complaints) {
        if (complaint.assigneeId === target.id) complaint.assigneeId = null;
      }
    }
    notify(d, target.id, null, 'Your access level changed', `You are now a ${ROLE_LABEL[role].toLowerCase()}.`);
  });
  return toPublicUser(target);
}

export async function setUserActive(userId: string, isActive: boolean): Promise<PublicUser> {
  const db = await getDatabase();
  const admin = await requireAdmin(db);
  const target = db.users.find((u) => u.id === userId);
  if (!target) throw new ApiError('not_found', 'User not found');

  if (target.id === admin.id) {
    throw new ApiError('conflict', 'You cannot deactivate your own account');
  }
  if (
    !isActive &&
    target.role === 'admin' &&
    db.users.filter((u) => u.role === 'admin' && u.isActive).length <= 1
  ) {
    throw new ApiError('conflict', 'At least one active administrator must remain');
  }

  await mutate((d) => {
    target.isActive = isActive;
    if (!isActive) {
      for (const complaint of d.complaints) {
        if (complaint.assigneeId === target.id) complaint.assigneeId = null;
      }
    }
  });
  return toPublicUser(target);
}

/* ------------------------------------------------------------------ *
 * Notifications
 * ------------------------------------------------------------------ */

export async function listNotifications(): Promise<Notification[]> {
  const db = await getDatabase();
  const user = await requireUser(db);
  return db.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);
}

export async function markNotificationRead(id: string): Promise<void> {
  const db = await getDatabase();
  const user = await requireUser(db);
  await mutate(() => {
    const notification = db.notifications.find((n) => n.id === id && n.userId === user.id);
    if (notification && !notification.readAt) notification.readAt = new Date().toISOString();
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  const db = await getDatabase();
  const user = await requireUser(db);
  await mutate(() => {
    const stamp = new Date().toISOString();
    for (const notification of db.notifications) {
      if (notification.userId === user.id && !notification.readAt) notification.readAt = stamp;
    }
  });
}

/* ------------------------------------------------------------------ *
 * Data ownership
 * ------------------------------------------------------------------ */

/** Exports what the signed-in user is entitled to, with credentials stripped. */
export async function exportData(): Promise<string> {
  const db = await getDatabase();
  const user = await requireUser(db);
  await flush();

  const complaints = db.complaints.filter((c) =>
    isStaff(user.role) ? true : c.authorId === user.id,
  );
  const ids = new Set(complaints.map((c) => c.id));

  const payload = {
    exportedAt: new Date().toISOString(),
    exportedBy: { id: user.id, name: user.name, email: user.email, role: user.role },
    complaints,
    comments: db.comments.filter((c) => ids.has(c.complaintId) && (isStaff(user.role) || !c.isInternal)),
    activity: db.activity.filter((a) => ids.has(a.complaintId) && (isStaff(user.role) || !a.isInternal)),
    users: isStaff(user.role) ? db.users.map(toPublicUser) : undefined,
  };

  return JSON.stringify(payload, null, 2);
}

/** Restores the demo dataset. Admin only - it discards everything. */
export async function resetDemoData(): Promise<void> {
  const db = await getDatabase();
  await requireAdmin(db);
  clearSession();
  await resetDatabase();
}
