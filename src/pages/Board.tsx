import { PageHeader } from '@/components/common/PageHeader';
import { ComplaintBrowser } from '@/components/complaints/ComplaintBrowser';

/**
 * The community board: complaints their authors chose to publish. Upvoting is
 * how a shared problem gets weight instead of five duplicate submissions.
 */
export default function Board() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Community board"
        description="Issues other students have raised publicly. Upvote one instead of filing a duplicate."
      />

      <ComplaintBrowser
        scope="public"
        allowUpvote
        emptyTitle="Nothing on the board yet"
        emptyDescription="Public complaints show up here as soon as someone files one."
      />
    </div>
  );
}
