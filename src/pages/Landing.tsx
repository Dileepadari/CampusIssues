import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bell,
  EyeOff,
  Gauge,
  MessagesSquare,
  Search,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PRIORITY_LABEL, PRIORITIES, SLA_HOURS } from '@/lib/types';
import { duration } from '@/lib/format';

const FEATURES = [
  {
    icon: Ticket,
    title: 'A tracking ID on every complaint',
    body: 'Every submission gets an ID you can check from the public tracking page without signing in.',
  },
  {
    icon: EyeOff,
    title: 'Anonymous when it matters',
    body: 'Hide your name from other students. Staff handling the case still see it, so they can follow up.',
  },
  {
    icon: Gauge,
    title: 'Response targets by priority',
    body: 'Priority sets a deadline the moment you submit. Anything past it is flagged as overdue on the staff queue.',
  },
  {
    icon: MessagesSquare,
    title: 'One thread per issue',
    body: 'Replies, status changes and internal notes live on the same timeline, so nothing is lost in email.',
  },
  {
    icon: Bell,
    title: 'Updates that find you',
    body: 'Assignment, status changes and replies all raise a notification for everyone involved.',
  },
  {
    icon: BarChart3,
    title: 'Numbers staff can act on',
    body: 'Resolution times, SLA compliance and category hot spots, computed from the live queue.',
  },
];

const STEPS = [
  { title: 'Submit', body: 'Describe the issue, pick a category, attach a photo if it helps.' },
  { title: 'Triage', body: 'It is routed to the right department and assigned to a named person.' },
  { title: 'Resolve', body: 'Staff reply on the thread and close it out with a written outcome.' },
  { title: 'Rate', body: 'You rate the resolution, and can reopen it if the problem is still there.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [trackingId, setTrackingId] = useState('');

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="surface-grid absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" aria-hidden />
                Anonymous submissions supported
              </span>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Campus problems, raised and actually resolved
              </h1>

              <p className="mt-4 max-w-lg text-lg text-muted-foreground">
                CampusIssues gives students one place to report what is broken and gives staff the
                queue, the deadlines and the record they need to fix it.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/signup">
                    Get started
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/login">Sign in</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-medium">Already have a tracking ID?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Check the status of any complaint without an account.
              </p>
              <form
                className="mt-4 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const id = trackingId.trim();
                  if (id) navigate(`/track?id=${encodeURIComponent(id)}`);
                }}
              >
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    value={trackingId}
                    onChange={(event) => setTrackingId(event.target.value.toUpperCase())}
                    placeholder="CI-XXXX-XXXX"
                    className="pl-9 font-mono"
                    aria-label="Tracking ID"
                  />
                </div>
                <Button type="submit" disabled={!trackingId.trim()}>
                  Track
                </Button>
              </form>

              <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5 text-sm">
                {PRIORITIES.map((priority) => (
                  <div key={priority}>
                    <dt className="text-xs text-muted-foreground">
                      {PRIORITY_LABEL[priority]} priority
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {duration(SLA_HOURS[priority])} target
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative rounded-xl border border-border bg-card p-5">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <h3 className="mt-3 font-medium">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">What you get</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/12">
                  <Icon className="size-4.5 text-primary" aria-hidden />
                </span>
                <h3 className="mt-3 font-medium">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Something on campus needs fixing?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Raise it once, follow it to the end, and see what was actually done about it.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/signup">
              Create your account
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
