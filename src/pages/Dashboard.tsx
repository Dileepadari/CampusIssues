import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Gauge,
  Inbox,
  PlusCircle,
  Star,
  Ticket,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { ComplaintCard } from '@/components/complaints/ComplaintCard';
import { BreakdownBars } from '@/components/dashboard/BreakdownBars';
import { StatCard } from '@/components/dashboard/StatCard';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { useAuth } from '@/contexts/AuthContext';
import { useComplaintList, useStats } from '@/hooks/useComplaints';
import { duration, percent } from '@/lib/format';
import {
  CATEGORIES,
  CATEGORY_LABEL,
  PRIORITIES,
  PRIORITY_COLOR_VAR,
  PRIORITY_LABEL,
  STATUSES,
  STATUS_COLOR_VAR,
  STATUS_LABEL,
  type Stats,
} from '@/lib/types';

function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

function statusRows(stats: Stats) {
  return STATUSES.map((status) => ({
    key: status,
    label: STATUS_LABEL[status],
    value: stats.byStatus[status],
    color: STATUS_COLOR_VAR[status],
  }));
}

function categoryRows(stats: Stats) {
  return CATEGORIES.map((category) => ({
    key: category,
    label: CATEGORY_LABEL[category],
    value: stats.byCategory[category],
  }));
}

function StudentDashboard() {
  const { user } = useAuth();
  const { data: stats, isPending } = useStats('mine');
  const { data: recent } = useComplaintList({ scope: 'mine', sort: 'updated', pageSize: 3 });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${user?.name.split(' ')[0]}`}
        description="Everything you have raised, and where each one stands."
        actions={
          <Button asChild>
            <Link to="/complaints/new">
              <PlusCircle className="size-4" />
              New complaint
            </Link>
          </Button>
        }
      />

      {isPending || !stats ? (
        <StatGrid>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </StatGrid>
      ) : (
        <StatGrid>
          <StatCard label="Filed" value={stats.total} icon={ClipboardList} tone="primary" />
          <StatCard
            label="Still open"
            value={stats.open}
            hint={stats.overdue ? `${stats.overdue} past its target` : 'All within target'}
            icon={Clock}
            tone={stats.overdue ? 'danger' : 'neutral'}
          />
          <StatCard
            label="Resolved"
            value={stats.byStatus.resolved + stats.byStatus.closed}
            hint={
              stats.avgResolutionHours !== null
                ? `Average ${duration(stats.avgResolutionHours)} to resolve`
                : undefined
            }
            icon={CheckCircle2}
            tone="success"
          />
          <StatCard
            label="Your average rating"
            value={stats.avgSatisfaction !== null ? stats.avgSatisfaction.toFixed(1) : '-'}
            hint={stats.avgSatisfaction !== null ? 'out of 5' : 'Rate a resolved complaint'}
            icon={Star}
            tone="warning"
          />
        </StatGrid>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recently updated</CardTitle>
            <CardDescription>The complaints with the newest activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!recent ? (
              <>
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </>
            ) : recent.items.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Nothing raised yet"
                description="Report a problem and you will get a tracking ID you can follow."
                action={
                  <Button asChild>
                    <Link to="/complaints/new">
                      <PlusCircle className="size-4" />
                      Raise your first complaint
                    </Link>
                  </Button>
                }
              />
            ) : (
              <>
                {recent.items.map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    currentUserId={user?.id ?? ''}
                    showAuthor={false}
                  />
                ))}
                <Button asChild variant="ghost" className="w-full">
                  <Link to="/complaints">
                    See all my complaints
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {stats && stats.total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By status</CardTitle>
              </CardHeader>
              <CardContent>
                <BreakdownBars rows={statusRows(stats)} total={stats.total} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Ticket className="size-4 text-muted-foreground" aria-hidden />
                Tracking IDs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Every complaint has an ID like <span className="font-mono">CI-7KDQ-2M4X</span>.
                Anyone holding it can check progress without signing in - useful when you filed
                anonymously.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/track">Open the tracking page</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StaffDashboard() {
  const { user } = useAuth();
  const { data: stats, isPending } = useStats('all');
  const { data: unassigned } = useComplaintList({
    scope: 'all',
    assigneeId: 'unassigned',
    status: 'open',
    sort: 'priority',
    pageSize: 3,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${user?.name.split(' ')[0]}`}
        description="The state of the queue across every department."
        actions={
          <Button asChild variant="outline">
            <Link to="/analytics">
              Full analytics
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />

      {isPending || !stats ? (
        <StatGrid>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </StatGrid>
      ) : (
        <StatGrid>
          <StatCard
            label="Open complaints"
            value={stats.open}
            hint={`${stats.total} filed in total`}
            icon={Inbox}
            tone="primary"
          />
          <StatCard
            label="Overdue"
            value={stats.overdue}
            hint="Past their response target"
            icon={AlertTriangle}
            tone={stats.overdue ? 'danger' : 'success'}
          />
          <StatCard
            label="Unassigned"
            value={stats.unassigned}
            hint="Open and waiting for an owner"
            icon={UserPlus}
            tone={stats.unassigned ? 'warning' : 'neutral'}
          />
          <StatCard
            label="Within target"
            value={percent(stats.slaCompliance)}
            hint={
              stats.avgResolutionHours !== null
                ? `Average ${duration(stats.avgResolutionHours)} to resolve`
                : 'Nothing resolved yet'
            }
            icon={Gauge}
            tone="success"
          />
        </StatGrid>
      )}

      {stats && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submitted against resolved</CardTitle>
              <CardDescription>Last 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart trend={stats.trend} />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Where complaints come from</CardTitle>
                <CardDescription>Top categories by volume.</CardDescription>
              </CardHeader>
              <CardContent>
                <BreakdownBars rows={categoryRows(stats)} total={stats.total} maxRows={6} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Queue by status</CardTitle>
                <CardDescription>Everything in the system right now.</CardDescription>
              </CardHeader>
              <CardContent>
                <BreakdownBars rows={statusRows(stats)} total={stats.total} />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Needs an owner</CardTitle>
          <CardDescription>Open complaints nobody has picked up, highest priority first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!unassigned ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : unassigned.items.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Everything is assigned"
              description="No open complaint is sitting without an owner."
            />
          ) : (
            <>
              {unassigned.items.map((complaint) => (
                <ComplaintCard
                  key={complaint.id}
                  complaint={complaint}
                  currentUserId={user?.id ?? ''}
                />
              ))}
              <Button asChild variant="ghost" className="w-full">
                <Link to="/complaints">
                  Open the full queue
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {stats && stats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Priority mix</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownBars
              rows={PRIORITIES.map((priority) => ({
                key: priority,
                label: PRIORITY_LABEL[priority],
                value: stats.byPriority[priority],
                color: PRIORITY_COLOR_VAR[priority],
              }))}
              total={stats.total}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { isStaff } = useAuth();
  return isStaff ? <StaffDashboard /> : <StudentDashboard />;
}
