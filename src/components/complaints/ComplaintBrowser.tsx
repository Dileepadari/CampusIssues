import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ComplaintCard } from '@/components/complaints/ComplaintCard';
import { ComplaintFilters } from '@/components/complaints/ComplaintFilters';
import { DEFAULT_FILTERS, type FilterState } from '@/lib/filters';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { useAuth } from '@/contexts/AuthContext';
import { useAssignees, useComplaintList, useToggleUpvote } from '@/hooks/useComplaints';
import type { ComplaintQuery } from '@/lib/types';

const PAGE_SIZE = 8;

/**
 * Filters + results + pagination. Every list screen composes this and only
 * differs by `scope`, so the filtering behaviour cannot drift between them.
 */
export function ComplaintBrowser({
  scope,
  emptyTitle,
  emptyDescription,
  showAuthor = true,
  allowUpvote = false,
  showAssigneeFilter = false,
}: {
  scope: ComplaintQuery['scope'];
  emptyTitle: string;
  emptyDescription: string;
  showAuthor?: boolean;
  allowUpvote?: boolean;
  showAssigneeFilter?: boolean;
}) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Keystrokes should not fire a query each; everything else applies at once.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 250);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const query: ComplaintQuery = {
    scope,
    ...filters,
    search: debouncedSearch,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data, isPending } = useComplaintList(query);
  const { data: assignees } = useAssignees();
  const upvote = useToggleUpvote();

  return (
    <div className="space-y-4">
      <ComplaintFilters
        value={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        assignees={showAssigneeFilter ? assignees : undefined}
      />

      {isPending && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={emptyTitle}
          description={emptyDescription}
          action={
            scope === 'mine' ? (
              <Button asChild>
                <Link to="/complaints/new">
                  <PlusCircle className="size-4" />
                  New complaint
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                currentUserId={user?.id ?? ''}
                showAuthor={showAuthor}
                onUpvote={allowUpvote ? (id) => upvote.mutate(id) : undefined}
              />
            ))}
          </div>

          <Pagination
            page={data.page}
            pageCount={data.pageCount}
            total={data.total}
            pageSize={data.pageSize}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
