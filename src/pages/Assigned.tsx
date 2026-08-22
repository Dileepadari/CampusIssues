import { PageHeader } from '@/components/common/PageHeader';
import { ComplaintBrowser } from '@/components/complaints/ComplaintBrowser';

export default function Assigned() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned to me"
        description="Complaints you are responsible for. Sort by due date to see what is closest to breaching."
      />

      <ComplaintBrowser
        scope="assigned"
        emptyTitle="Nothing assigned to you"
        emptyDescription="Complaints appear here once an administrator assigns them to you, or you pick one up yourself."
      />
    </div>
  );
}
