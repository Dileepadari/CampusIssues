<p align="center">
  <img src="src/assets/logo-mark.png" alt="" width="96" />
</p>

# CampusIssues

A campus complaint and feedback portal. Students report what is broken, every submission gets a tracking ID, and staff work the queue against response deadlines until each issue is closed with a written outcome.

> Building on this? See **[DEVDOC.md](./DEVDOC.md)** for architecture, the data model and local setup.

## Roles

| Role | What they can do |
|---|---|
| Student | Raise complaints, follow their own, reply on the thread, upvote public ones, rate a resolution, reopen it if the problem is still there |
| Staff | Everything a student can do, plus triage: assign, set priority, move status, leave internal notes, see the analytics |
| Administrator | Everything staff can do, plus manage people (grant staff access, deactivate accounts) and delete a complaint outright |

Self-service sign-up always creates a student account. Staff and administrator access is granted by an existing administrator from the People screen.

## A typical complaint

1. **Submit.** Title, category, priority, description, optional location and up to four attachments. You choose whether it appears on the community board and whether your name is attached.
2. **Get a tracking ID.** Something like `CI-7KDQ-2M4X`. Anyone holding it can check progress from `/track` with no account, which is what makes anonymous submissions still followable.
3. **Triage.** The complaint is routed to a department by category, an administrator or staff member assigns it, and the status moves to under review.
4. **Work.** Staff reply on the thread. Internal notes are visible to staff only, and never appear in the student's view, the activity timeline or public tracking.
5. **Close.** Resolving or rejecting requires a written outcome. The student sees exactly that text.
6. **Rate or reopen.** The person who raised it rates the resolution out of 5. If the problem is still there they can reopen within 14 days, which puts it back under review with a fresh deadline.

## Features

### Raising and tracking
- Twelve categories, each routed to a named department (IT Services, Hostel Administration, Campus Security, and so on)
- Four priorities, each with its own response target: urgent 24h, high 3d, medium 7d, low 14d. The deadline is set at submission and shown on every card
- Attachments: PNG, JPEG, WebP or PDF, up to four files of 4 MB each
- Two independent privacy switches. **Anonymous** hides your name from other students but not from the staff handling it, because they may need to follow up. **Private** keeps the complaint off the community board entirely
- Edit a complaint until staff start work on it. After that, add a comment instead
- Withdraw your own complaint at any time while it is open

### Community board
- Complaints published to the board are visible to every signed-in student
- Upvote one instead of filing a duplicate, so a shared problem carries weight
- You cannot upvote your own complaint

### For staff
- The full queue with search across title, description, tracking ID and location, plus filters on status, category, priority and assignee, and six sort orders including "due soonest"
- Assignment to any active staff member. Picking up an untriaged complaint moves it to under review automatically
- Changing priority re-derives the deadline from the submission time, so raising priority pulls the deadline in rather than granting extra time
- Internal notes on the thread, marked as such and hidden from the student
- Status changes follow a fixed workflow. Only the transitions that make sense from the current state are offered
- Overdue complaints are flagged everywhere they appear

### Dashboards and analytics
- Students see what they filed, what is still open, what was resolved and the average rating they gave
- Staff see open volume, overdue count, unassigned count and the share of complaints resolved within target
- A 30-day chart of submitted against resolved: when the lines diverge, the queue is growing faster than it is being cleared
- Breakdowns by category, status and priority, plus a per-staff workload table with average resolution time
- Summary export as CSV

### Everything else
- Notifications for assignment, replies, status changes and reopens, with an unread count in the header
- Light, dark and system themes, applied before first paint so there is no flash
- Full data export as JSON. Students get their own complaints, staff get the whole record
- Public tracking page that returns status and progress but never an identity or an internal note

## Demo accounts

The app seeds itself with a realistic dataset the first time it runs. Every account uses the same seeded data set, so signing in as each one shows the same complaints from three different angles.

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@campus.edu` | `Admin@1234` |
| Staff | `maintenance@campus.edu` | `Staff@1234` |
| Student | `student@campus.edu` | `Student@1234` |

Other seeded students are `meera@campus.edu`, `sanjay@campus.edu` and `fatima@campus.edu`, and other staff are `hostel@campus.edu` and `it@campus.edu`, all with the password shown for their role above.

The login screen lists the first three and fills the form when you click one. An administrator can restore the seeded dataset at any time from Settings.

## Running it

```sh
npm install
npm run dev
```

Then open http://localhost:8080.

Data is stored in your browser, so the demo dataset and anything you add live on the machine you are using. Clearing site data resets it. See [DEVDOC.md](./DEVDOC.md) for what that means and how to move it to a real backend.
