import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { BreakdownBars } from '@/components/dashboard/BreakdownBars';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { useStaffWorkload, useStats } from '@/hooks/useComplaints';
import { downloadFile, duration, percent, toCsv } from '@/lib/format';
import {
  CATEGORIES,
  CATEGORY_LABEL,
  PRIORITIES,
  PRIORITY_COLOR_VAR,
  PRIORITY_LABEL,
  STATUSES,
  STATUS_COLOR_VAR,
  STATUS_LABEL,
} from '@/lib/types';

export default function Analytics() {
  const { data: stats, isPending } = useStats('all');
  const { data: workload = [] } = useStaffWorkload();

  function exportCsv() {
    if (!stats) return;
    const rows: (string | number)[][] = [
      ['Total complaints', stats.total],
      ['Open', stats.open],
      ['Overdue', stats.overdue],
      ['Unassigned', stats.unassigned],
      ['Average resolution', duration(stats.avgResolutionHours)],
      ['Within SLA', percent(stats.slaCompliance, 1)],
      ['Average satisfaction', stats.avgSatisfaction?.toFixed(2) ?? '-'],
      ...STATUSES.map((status) => [`Status: ${STATUS_LABEL[status]}`, stats.byStatus[status]]),
      ...PRIORITIES.map((priority) => [
        `Priority: ${PRIORITY_LABEL[priority]}`,
        stats.byPriority[priority],
      ]),
      ...CATEGORIES.map((category) => [
        `Category: ${CATEGORY_LABEL[category]}`,
        stats.byCategory[category],
      ]),
    ];
    downloadFile(
      `campusissues-summary-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(['Metric', 'Value'], rows),
      'text/csv',
    );
  }

  if (isPending || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Computed from the live queue - no separate reporting job."
        actions={
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4" />
            Export summary
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total complaints" value={stats.total} tone="primary" />
        <StatCard
          label="Average resolution"
          value={duration(stats.avgResolutionHours)}
          hint="From submission to resolved"
        />
        <StatCard
          label="Resolved within target"
          value={percent(stats.slaCompliance)}
          hint="Measured against the priority SLA"
          tone="success"
        />
        <StatCard
          label="Satisfaction"
          value={stats.avgSatisfaction !== null ? `${stats.avgSatisfaction.toFixed(1)}/5` : '-'}
          hint="Average rating students gave"
          tone="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submitted against resolved</CardTitle>
          <CardDescription>
            When the two lines diverge, the queue is growing faster than it is being cleared.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrendChart trend={stats.trend} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By category</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownBars
              rows={CATEGORIES.map((category) => ({
                key: category,
                label: CATEGORY_LABEL[category],
                value: stats.byCategory[category],
              }))}
              total={stats.total}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">By status</CardTitle>
            </CardHeader>
            <CardContent>
              <BreakdownBars
                rows={STATUSES.map((status) => ({
                  key: status,
                  label: STATUS_LABEL[status],
                  value: stats.byStatus[status],
                  color: STATUS_COLOR_VAR[status],
                }))}
                total={stats.total}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">By priority</CardTitle>
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
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workload by staff member</CardTitle>
          <CardDescription>Counts every complaint currently assigned to each person.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff member</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Open</TableHead>
                <TableHead className="text-right">Overdue</TableHead>
                <TableHead className="text-right">Resolved</TableHead>
                <TableHead className="text-right">Avg time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workload.map((row) => (
                <TableRow key={row.user.id}>
                  <TableCell className="font-medium">{row.user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.user.department ?? '-'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.open}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={row.overdue ? 'text-destructive' : undefined}>
                      {row.overdue}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.resolved}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {duration(row.avgHours)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
