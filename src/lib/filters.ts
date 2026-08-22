import type { ComplaintQuery } from '@/lib/types';

/** The filter shape the list screens drive, separated so the UI file only exports components. */
export type FilterState = Required<
  Pick<ComplaintQuery, 'search' | 'status' | 'category' | 'priority' | 'sort'>
> &
  Pick<ComplaintQuery, 'assigneeId'>;

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  status: 'all',
  category: 'all',
  priority: 'all',
  sort: 'newest',
  assigneeId: 'all',
};
