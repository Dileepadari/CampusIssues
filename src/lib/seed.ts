import { hashPassword, newId, newTrackingId, randomSalt } from '@/lib/crypto';
import type { Database } from '@/lib/db';
import {
  SLA_HOURS,
  type Activity,
  type Comment,
  type Complaint,
  type ComplaintCategory,
  type ComplaintPriority,
  type ComplaintStatus,
  type Role,
  type User,
} from '@/lib/types';

/**
 * Demo dataset. Generated relative to "now" so the dashboards, SLA badges and
 * 30-day trend chart always look alive rather than frozen in 2023.
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const now = () => Date.now();
const iso = (ms: number) => new Date(ms).toISOString();
const daysAgo = (d: number) => now() - d * DAY;

type SeedUser = {
  key: string;
  name: string;
  email: string;
  role: Role;
  password: string;
  department: string | null;
  identifier: string | null;
};

export const DEMO_ACCOUNTS: { role: Role; email: string; password: string; name: string }[] = [
  { role: 'admin', email: 'admin@campus.edu', password: 'Admin@1234', name: 'Priya Nair' },
  { role: 'staff', email: 'maintenance@campus.edu', password: 'Staff@1234', name: 'Rahul Verma' },
  { role: 'student', email: 'student@campus.edu', password: 'Student@1234', name: 'Aditya Sharma' },
];

const SEED_USERS: SeedUser[] = [
  {
    key: 'admin',
    name: 'Priya Nair',
    email: 'admin@campus.edu',
    role: 'admin',
    password: 'Admin@1234',
    department: 'Registrar',
    identifier: 'EMP-1001',
  },
  {
    key: 'maintenance',
    name: 'Rahul Verma',
    email: 'maintenance@campus.edu',
    role: 'staff',
    password: 'Staff@1234',
    department: 'Campus Maintenance',
    identifier: 'EMP-2043',
  },
  {
    key: 'hostel',
    name: 'Anita Desai',
    email: 'hostel@campus.edu',
    role: 'staff',
    password: 'Staff@1234',
    department: 'Hostel Administration',
    identifier: 'EMP-2078',
  },
  {
    key: 'it',
    name: 'Karthik Menon',
    email: 'it@campus.edu',
    role: 'staff',
    password: 'Staff@1234',
    department: 'IT Services',
    identifier: 'EMP-2110',
  },
  {
    key: 'aditya',
    name: 'Aditya Sharma',
    email: 'student@campus.edu',
    role: 'student',
    password: 'Student@1234',
    department: 'Computer Science',
    identifier: 'CS21B1042',
  },
  {
    key: 'meera',
    name: 'Meera Iyer',
    email: 'meera@campus.edu',
    role: 'student',
    password: 'Student@1234',
    department: 'Electronics',
    identifier: 'EC22B1119',
  },
  {
    key: 'sanjay',
    name: 'Sanjay Rao',
    email: 'sanjay@campus.edu',
    role: 'student',
    password: 'Student@1234',
    department: 'Mechanical',
    identifier: 'ME20B1007',
  },
  {
    key: 'fatima',
    name: 'Fatima Khan',
    email: 'fatima@campus.edu',
    role: 'student',
    password: 'Student@1234',
    department: 'Civil',
    identifier: 'CE21B1063',
  },
];

type SeedComment = { by: string; body: string; internal?: boolean; afterDays: number };

type SeedComplaint = {
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  author: string;
  assignee?: string;
  createdDaysAgo: number;
  /** Days from creation to the terminal state. Ignored for open complaints. */
  closedAfterDays?: number;
  location?: string;
  isAnonymous?: boolean;
  visibility?: 'public' | 'private';
  upvoters?: string[];
  comments?: SeedComment[];
  resolutionNote?: string;
  satisfaction?: { rating: number; comment?: string };
};

const SEED_COMPLAINTS: SeedComplaint[] = [
  {
    title: 'Library Wi-Fi drops every evening after 6 pm',
    description:
      'The Wi-Fi in the central library reading hall disconnects every 5 to 10 minutes after 6 pm. It is impossible to stay connected to the online journal portal long enough to download a paper. Speed tests show under 1 Mbps at peak hours while the same laptop gets 40 Mbps in the academic block.',
    category: 'it_support',
    priority: 'high',
    status: 'in_progress',
    author: 'aditya',
    assignee: 'it',
    createdDaysAgo: 4,
    location: 'Central Library, Reading Hall 2',
    upvoters: ['meera', 'sanjay', 'fatima'],
    comments: [
      {
        by: 'it',
        body: 'Confirmed. The reading hall runs on two access points that are both saturated in the evening. We have raised a purchase request for two additional APs and rebalanced the channels in the meantime.',
        afterDays: 1,
      },
      {
        by: 'it',
        body: 'AP procurement quote pending finance approval - track under REQ-4471.',
        internal: true,
        afterDays: 1.2,
      },
      {
        by: 'aditya',
        body: 'Thanks. Slightly better yesterday but it still drops around 8 pm.',
        afterDays: 2,
      },
    ],
  },
  {
    title: 'No water supply in Hostel Block C for three days',
    description:
      'Block C has had no running water on the second and third floors since Monday morning. Around 60 students are affected and are carrying water up from the ground floor tap. The overhead tank appears to be filling but nothing reaches the upper floors.',
    category: 'hostel',
    priority: 'urgent',
    status: 'resolved',
    author: 'sanjay',
    assignee: 'hostel',
    createdDaysAgo: 12,
    closedAfterDays: 1,
    location: 'Hostel Block C',
    upvoters: ['aditya', 'fatima'],
    resolutionNote:
      'The booster pump feeding the upper floors had a burnt motor winding. It was replaced the same evening and supply was restored to all floors by 9 pm. A spare pump is now kept on site.',
    satisfaction: { rating: 5, comment: 'Fixed the same day, very responsive.' },
    comments: [
      {
        by: 'hostel',
        body: 'Maintenance is on site. The booster pump has failed and a replacement is being fitted today.',
        afterDays: 0.4,
      },
    ],
  },
  {
    title: 'Broken oscilloscope channels in Electronics Lab 2',
    description:
      'Four of the twelve oscilloscopes in Electronics Lab 2 have a dead channel 2, so batches of three students share one working instrument. This makes it impossible to finish the two-signal experiments within the lab slot.',
    category: 'infrastructure',
    priority: 'medium',
    status: 'under_review',
    author: 'meera',
    assignee: 'maintenance',
    createdDaysAgo: 6,
    location: 'Electronics Lab 2, Block B',
    upvoters: ['aditya'],
    comments: [
      {
        by: 'maintenance',
        body: 'We have logged the serial numbers and asked the vendor for a service visit quote.',
        afterDays: 2,
      },
    ],
  },
  {
    title: 'Canteen serving cold food during the late lunch slot',
    description:
      'Food served after 1:30 pm in the main canteen is consistently cold, particularly the rice and dal. The warming trays on the right counter do not appear to be switched on. Students in the 1:30 batch are effectively getting a worse meal for the same coupon price.',
    category: 'canteen',
    priority: 'medium',
    status: 'in_progress',
    author: 'fatima',
    assignee: 'maintenance',
    createdDaysAgo: 9,
    location: 'Main Canteen',
    upvoters: ['aditya', 'meera', 'sanjay'],
    comments: [
      {
        by: 'maintenance',
        body: 'Two of the four bain-marie units were faulty. Replacements have been ordered and the working units have been moved to the late-lunch counter.',
        afterDays: 3,
      },
    ],
  },
  {
    title: 'Street lights out on the path between Block D and the sports ground',
    description:
      'The entire stretch of path from Block D to the sports ground has been dark for over two weeks. Six poles are out. Students returning from evening practice walk the stretch using phone torches, and it feels unsafe for the women hostel residents in particular.',
    category: 'safety',
    priority: 'high',
    status: 'resolved',
    author: 'meera',
    assignee: 'maintenance',
    createdDaysAgo: 20,
    closedAfterDays: 3,
    location: 'Path between Block D and sports ground',
    upvoters: ['fatima', 'sanjay', 'aditya'],
    resolutionNote:
      'The underground feeder cable to that stretch had failed. It was replaced and all six poles are working. The stretch has also been added to the weekly security patrol checklist.',
    satisfaction: { rating: 4, comment: 'Took a few days but well handled.' },
  },
  {
    title: 'Grades for ECO202 midterm not released four weeks after the exam',
    description:
      'The ECO202 midterm was written on the 3rd and results were promised within two weeks. It has now been four weeks with no update on the portal, and the re-evaluation window closes before the end of semester.',
    category: 'academics',
    priority: 'high',
    status: 'resolved',
    author: 'sanjay',
    assignee: 'admin',
    createdDaysAgo: 26,
    closedAfterDays: 5,
    resolutionNote:
      'Grades were uploaded on the portal and the re-evaluation window has been extended by ten days for this course.',
    satisfaction: { rating: 4 },
  },
  {
    title: 'Evening shuttle to the city skips the north gate stop',
    description:
      'The 7:15 pm shuttle has skipped the north gate stop on most days this month, so students waiting there have to walk to the main gate and usually miss it. The published timetable still lists the stop.',
    category: 'transport',
    priority: 'medium',
    status: 'submitted',
    author: 'fatima',
    createdDaysAgo: 2,
    location: 'North Gate',
    upvoters: ['meera'],
  },
  {
    title: 'Library closes before the announced time during exam week',
    description:
      'The library has been shutting the reading hall at 10 pm during exam week even though the notice board says it stays open until midnight. Staff say they were not given the extended-hours roster.',
    category: 'library',
    priority: 'medium',
    status: 'under_review',
    author: 'aditya',
    assignee: 'admin',
    createdDaysAgo: 3,
    upvoters: ['sanjay', 'fatima', 'meera'],
  },
  {
    title: 'Course registration portal times out on submit',
    description:
      'Submitting the elective registration form returns a gateway timeout roughly one time in three, and on retry the earlier selection is lost. Multiple students in my batch have had to redo the whole form four or five times.',
    category: 'it_support',
    priority: 'urgent',
    status: 'in_progress',
    author: 'meera',
    assignee: 'it',
    createdDaysAgo: 1,
    upvoters: ['aditya', 'sanjay', 'fatima'],
    comments: [
      {
        by: 'it',
        body: 'Reproduced. The registration service is running out of database connections during the peak window. We have raised the pool size and are adding a queue in front of the submit endpoint.',
        afterDays: 0.3,
      },
      {
        by: 'it',
        body: 'Connection pool raised from 20 to 80. Watching error rate before closing.',
        internal: true,
        afterDays: 0.4,
      },
    ],
  },
  {
    title: 'Gym equipment unusable - two treadmills and the cable machine',
    description:
      'Two of the four treadmills have been out of order for over a month and the cable machine has a frayed wire that looks dangerous. With a single working treadmill the morning queue is over half an hour.',
    category: 'sports',
    priority: 'medium',
    status: 'under_review',
    author: 'sanjay',
    assignee: 'maintenance',
    createdDaysAgo: 15,
    location: 'Sports Complex, Gym',
    upvoters: ['aditya'],
    comments: [
      {
        by: 'maintenance',
        body: 'The cable machine has been taken out of service as an immediate safety measure. Treadmill service visit is scheduled.',
        afterDays: 4,
      },
    ],
  },
  {
    title: 'Faculty member consistently cancels lab sessions without notice',
    description:
      'The Thursday lab slot for our section has been cancelled six times this semester, usually with students already in the lab. No make-up sessions have been scheduled and the lab component is 30 percent of the grade.',
    category: 'faculty',
    priority: 'high',
    status: 'under_review',
    author: 'fatima',
    assignee: 'admin',
    createdDaysAgo: 7,
    isAnonymous: true,
    visibility: 'private',
    comments: [
      {
        by: 'admin',
        body: 'Received. This is being handled by the department head; the reporter is anonymous to the faculty member.',
        internal: true,
        afterDays: 1,
      },
      {
        by: 'admin',
        body: 'Your report has been forwarded to the department head. Make-up sessions will be scheduled and communicated to the whole section.',
        afterDays: 1.5,
      },
    ],
  },
  {
    title: 'Request for a 24-hour study room during exam weeks',
    description:
      'Many of us study better late at night but every space on campus closes by midnight. A single room with power sockets kept open around the clock during exam weeks would make a real difference and needs no new construction.',
    category: 'administration',
    priority: 'low',
    status: 'submitted',
    author: 'aditya',
    createdDaysAgo: 5,
    upvoters: ['meera', 'sanjay', 'fatima'],
  },
  {
    title: 'Hostel mess menu repeats the same three dinners every week',
    description:
      'The dinner menu has had the same rotation for the entire semester. There is also no protein option for vegetarians on four nights of the week.',
    category: 'canteen',
    priority: 'low',
    status: 'rejected',
    author: 'sanjay',
    assignee: 'hostel',
    createdDaysAgo: 30,
    closedAfterDays: 6,
    resolutionNote:
      'The menu is fixed by the mess committee, which has two elected student representatives. Menu changes need to go through the committee rather than this portal - the next meeting is on the first Monday of the month and this request has been added to its agenda.',
  },
  {
    title: 'Leaking roof in Lecture Hall 3 during rain',
    description:
      'Water comes through the ceiling near the projector in Lecture Hall 3 whenever it rains. The projector has been unplugged twice as a precaution and classes have had to move rooms mid-session.',
    category: 'infrastructure',
    priority: 'high',
    status: 'closed',
    author: 'meera',
    assignee: 'maintenance',
    createdDaysAgo: 40,
    closedAfterDays: 8,
    location: 'Lecture Hall 3',
    resolutionNote:
      'The roof flashing above Hall 3 was resealed and the damaged ceiling panel replaced. Verified during the last two rain spells with no further ingress.',
    satisfaction: { rating: 5, comment: 'No leaks since. Thank you.' },
  },
  {
    title: 'Printer in the department office out of service for two weeks',
    description:
      'The shared printer used for assignment submissions has shown a paper feed error for two weeks. Students are printing off campus at their own cost to meet submission deadlines.',
    category: 'it_support',
    priority: 'low',
    status: 'resolved',
    author: 'fatima',
    assignee: 'it',
    createdDaysAgo: 18,
    closedAfterDays: 4,
    resolutionNote: 'The feed roller was replaced and the printer is back in service.',
    satisfaction: { rating: 3, comment: 'Sorted, though it took longer than it should have.' },
  },
  {
    title: 'Bicycle stands overflowing near the academic block',
    description:
      'The stands near the academic block hold about 40 cycles and there are well over a hundred parked every morning, so the overflow blocks the ramp entrance. The ramp is the accessible entrance and is regularly unusable.',
    category: 'infrastructure',
    priority: 'medium',
    status: 'submitted',
    author: 'aditya',
    createdDaysAgo: 1,
    location: 'Academic Block entrance',
    upvoters: ['meera', 'fatima'],
  },
];

/** Fills `db` with demo users and complaints. Returns the same object. */
export async function seedDatabase(db: Database): Promise<Database> {
  const usersByKey = new Map<string, User>();

  for (const seed of SEED_USERS) {
    const salt = randomSalt();
    const user: User = {
      id: newId('usr'),
      name: seed.name,
      email: seed.email,
      role: seed.role,
      department: seed.department,
      identifier: seed.identifier,
      passwordHash: await hashPassword(seed.password, salt),
      passwordSalt: salt,
      isActive: true,
      createdAt: iso(daysAgo(120)),
    };
    usersByKey.set(seed.key, user);
    db.users.push(user);
  }

  const id = (key: string) => usersByKey.get(key)!.id;

  for (const seed of SEED_COMPLAINTS) {
    const createdMs = daysAgo(seed.createdDaysAgo);
    const complaintId = newId('cmp');
    const authorId = id(seed.author);
    const assigneeId = seed.assignee ? id(seed.assignee) : null;
    const terminal =
      seed.status === 'resolved' || seed.status === 'rejected' || seed.status === 'closed';
    const closedMs = terminal
      ? createdMs + (seed.closedAfterDays ?? 3) * DAY
      : null;

    const activity: Activity[] = [
      {
        id: newId('act'),
        complaintId,
        actorId: authorId,
        type: 'created',
        from: null,
        to: 'submitted',
        note: null,
        isInternal: false,
        createdAt: iso(createdMs),
      },
    ];

    if (assigneeId) {
      activity.push({
        id: newId('act'),
        complaintId,
        actorId: id('admin'),
        type: 'assigned',
        from: null,
        to: assigneeId,
        note: null,
        isInternal: false,
        createdAt: iso(createdMs + 4 * HOUR),
      });
      activity.push({
        id: newId('act'),
        complaintId,
        actorId: id('admin'),
        type: 'status_changed',
        from: 'submitted',
        to: 'under_review',
        note: null,
        isInternal: false,
        createdAt: iso(createdMs + 4 * HOUR),
      });
    }

    if (seed.status === 'in_progress' || (terminal && seed.status !== 'rejected')) {
      activity.push({
        id: newId('act'),
        complaintId,
        actorId: assigneeId ?? id('admin'),
        type: 'status_changed',
        from: 'under_review',
        to: 'in_progress',
        note: null,
        isInternal: false,
        createdAt: iso(createdMs + 12 * HOUR),
      });
    }

    if (terminal && closedMs) {
      const finalFrom = seed.status === 'rejected' ? 'under_review' : 'in_progress';
      activity.push({
        id: newId('act'),
        complaintId,
        actorId: assigneeId ?? id('admin'),
        type: 'status_changed',
        from: finalFrom,
        to: seed.status === 'closed' ? 'resolved' : seed.status,
        note: seed.resolutionNote ?? null,
        isInternal: false,
        createdAt: iso(closedMs),
      });
      if (seed.status === 'closed') {
        activity.push({
          id: newId('act'),
          complaintId,
          actorId: authorId,
          type: 'status_changed',
          from: 'resolved',
          to: 'closed',
          note: null,
          isInternal: false,
          createdAt: iso(closedMs + 2 * DAY),
        });
      }
    }

    const comments: Comment[] = (seed.comments ?? []).map((c) => {
      const at = createdMs + c.afterDays * DAY;
      activity.push({
        id: newId('act'),
        complaintId,
        actorId: id(c.by),
        type: 'commented',
        from: null,
        to: null,
        note: null,
        isInternal: Boolean(c.internal),
        createdAt: iso(at),
      });
      return {
        id: newId('cmt'),
        complaintId,
        authorId: id(c.by),
        body: c.body,
        isInternal: Boolean(c.internal),
        createdAt: iso(at),
      };
    });

    const satisfactionAt = closedMs ? closedMs + 6 * HOUR : null;
    if (seed.satisfaction && satisfactionAt) {
      activity.push({
        id: newId('act'),
        complaintId,
        actorId: authorId,
        type: 'feedback',
        from: null,
        to: String(seed.satisfaction.rating),
        note: seed.satisfaction.comment ?? null,
        isInternal: false,
        createdAt: iso(satisfactionAt),
      });
    }

    const lastEventAt = activity.reduce(
      (max, event) => Math.max(max, new Date(event.createdAt).getTime()),
      createdMs,
    );

    const complaint: Complaint = {
      id: complaintId,
      trackingId: newTrackingId(),
      title: seed.title,
      description: seed.description,
      category: seed.category,
      priority: seed.priority,
      status: seed.status,
      location: seed.location ?? null,
      visibility: seed.visibility ?? 'public',
      isAnonymous: Boolean(seed.isAnonymous),
      authorId,
      assigneeId,
      attachments: [],
      upvotedBy: (seed.upvoters ?? []).map(id),
      createdAt: iso(createdMs),
      updatedAt: iso(lastEventAt),
      dueAt: iso(createdMs + SLA_HOURS[seed.priority] * HOUR),
      resolvedAt: seed.status === 'rejected' ? null : closedMs ? iso(closedMs) : null,
      closedAt: seed.status === 'closed' ? iso(closedMs! + 2 * DAY) : null,
      resolutionNote: seed.resolutionNote ?? null,
      satisfaction:
        seed.satisfaction && satisfactionAt
          ? {
              rating: seed.satisfaction.rating,
              comment: seed.satisfaction.comment ?? null,
              at: iso(satisfactionAt),
            }
          : null,
      reopenCount: 0,
    };

    db.complaints.push(complaint);
    db.comments.push(...comments);
    db.activity.push(...activity);
  }

  return db;
}
