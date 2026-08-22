import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { ComplaintBrowser } from '@/components/complaints/ComplaintBrowser';
import { useAuth } from '@/contexts/AuthContext';

/** Staff see the whole queue here; students see the complaints they filed. */
export default function Complaints() {
  const { isStaff } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title={isStaff ? 'All complaints' : 'My complaints'}
        description={
          isStaff
            ? 'Everything students have raised, across every department.'
            : 'Every complaint you have filed, including anonymous ones.'
        }
        actions={
          <Button asChild>
            <Link to="/complaints/new">
              <PlusCircle className="size-4" />
              New complaint
            </Link>
          </Button>
        }
      />

      <ComplaintBrowser
        scope={isStaff ? 'all' : 'mine'}
        showAssigneeFilter={isStaff}
        showAuthor={isStaff}
        emptyTitle={isStaff ? 'No complaints match these filters' : 'You have not filed anything yet'}
        emptyDescription={
          isStaff
            ? 'Try widening the status or category filter.'
            : 'When something on campus needs fixing, raise it here and follow it to the end.'
        }
      />
    </div>
  );
}
