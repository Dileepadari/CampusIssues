import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Search, TicketX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { queryKeys, errorMessage } from '@/hooks/useComplaints';
import * as api from '@/lib/api';
import { dateTime, dueLabel } from '@/lib/format';
import { CATEGORY_LABEL, STATUS_LABEL, isOpenStatus } from '@/lib/types';

/**
 * Public tracking. Anyone holding a tracking ID can see progress without an
 * account; the API deliberately returns no names and no internal notes.
 */
export default function Track() {
  const [searchParams, setSearchParams] = useSearchParams();
  const submitted = searchParams.get('id') ?? '';
  const [value, setValue] = useState(submitted);

  const { data, error, isFetching } = useQuery({
    queryKey: queryKeys.tracking(submitted),
    queryFn: () => api.trackComplaint(submitted),
    enabled: submitted.trim().length > 0,
    retry: false,
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Track a complaint</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter the tracking ID shown when the complaint was submitted. No sign-in needed.
      </p>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const next = value.trim();
          setSearchParams(next ? { id: next } : {});
        }}
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value.toUpperCase())}
            placeholder="CI-XXXX-XXXX"
            className="pl-9 font-mono"
            aria-label="Tracking ID"
          />
        </div>
        <Button type="submit" disabled={!value.trim() || isFetching}>
          {isFetching && <Loader2 className="size-4 animate-spin" />}
          Track
        </Button>
      </form>

      {submitted && error && (
        <Card className="mt-6 border-destructive/30">
          <CardContent className="flex items-start gap-3">
            <TicketX className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
            <div>
              <p className="font-medium">{errorMessage(error)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tracking IDs look like CI-7KDQ-2M4X. Check for typos, or sign in to see the
                complaints you filed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={data.status} />
              <PriorityBadge priority={data.priority} />
              <Badge variant="muted">{CATEGORY_LABEL[data.category]}</Badge>
            </div>
            <CardTitle className="mt-1 text-lg">{data.title}</CardTitle>
            <CardDescription>
              <span className="font-mono">{data.trackingId}</span> - handled by {data.department}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Submitted</dt>
                <dd className="mt-0.5">{dateTime(data.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Last update</dt>
                <dd className="mt-0.5">{dateTime(data.updatedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {isOpenStatus(data.status) ? 'Response target' : 'Resolved'}
                </dt>
                <dd className="mt-0.5">
                  {isOpenStatus(data.status)
                    ? dueLabel(data.dueAt, false)
                    : data.resolvedAt
                      ? dateTime(data.resolvedAt)
                      : '-'}
                </dd>
              </div>
            </dl>

            {data.resolutionNote && (
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <CheckCircle2 className="size-4 text-[var(--status-resolved)]" aria-hidden />
                  Outcome
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{data.resolutionNote}</p>
              </div>
            )}

            <div>
              <h2 className="mb-3 text-sm font-medium">Progress</h2>
              <ol className="relative space-y-4 pl-6">
                <span aria-hidden className="absolute top-2 bottom-2 left-[5px] w-px bg-border" />
                {data.timeline.map((step, index) => (
                  <li key={`${step.status}-${step.at}`} className="relative">
                    <span
                      aria-hidden
                      className="absolute top-1.5 -left-6 size-[11px] rounded-full border-2 border-background"
                      style={{
                        backgroundColor:
                          index === data.timeline.length - 1
                            ? 'var(--primary)'
                            : 'var(--muted-foreground)',
                      }}
                    />
                    <p className="text-sm font-medium">{STATUS_LABEL[step.status]}</p>
                    <p className="text-xs text-muted-foreground">{dateTime(step.at)}</p>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
