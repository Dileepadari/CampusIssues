import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CATEGORIES,
  CATEGORY_LABEL,
  PRIORITIES,
  PRIORITY_LABEL,
  SORT_LABEL,
  SORT_OPTIONS,
  STATUSES,
  STATUS_LABEL,
  type PublicUser,
} from '@/lib/types';
import { DEFAULT_FILTERS, type FilterState } from '@/lib/filters';

export function ComplaintFilters({
  value,
  onChange,
  assignees,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  /** Present only for staff, who can filter by who owns the work. */
  assignees?: PublicUser[];
}) {
  const set = <K extends keyof FilterState>(key: K, next: FilterState[K]) =>
    onChange({ ...value, [key]: next });

  const isFiltered =
    value.search !== '' ||
    value.status !== 'all' ||
    value.category !== 'all' ||
    value.priority !== 'all' ||
    value.sort !== 'newest' ||
    (value.assigneeId ?? 'all') !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={value.search}
          onChange={(event) => set('search', event.target.value)}
          placeholder="Search title, description or tracking ID"
          className="pl-9"
          aria-label="Search complaints"
        />
      </div>

      <Select value={value.status} onValueChange={(next) => set('status', next as FilterState['status'])}>
        <SelectTrigger className="w-40" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="open">Open only</SelectItem>
          {STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABEL[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.category}
        onValueChange={(next) => set('category', next as FilterState['category'])}
      >
        <SelectTrigger className="w-44" aria-label="Filter by category">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {CATEGORY_LABEL[category]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.priority}
        onValueChange={(next) => set('priority', next as FilterState['priority'])}
      >
        <SelectTrigger className="w-36" aria-label="Filter by priority">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {PRIORITIES.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {PRIORITY_LABEL[priority]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {assignees && (
        <Select
          value={value.assigneeId ?? 'all'}
          onValueChange={(next) => set('assigneeId', next)}
        >
          <SelectTrigger className="w-44" aria-label="Filter by assignee">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Anyone assigned</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {assignees.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={value.sort} onValueChange={(next) => set('sort', next as FilterState['sort'])}>
        <SelectTrigger className="w-44" aria-label="Sort complaints">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {SORT_LABEL[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isFiltered && (
        <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_FILTERS)}>
          <X className="size-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
