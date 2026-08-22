import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { ComplaintForm } from '@/components/complaints/ComplaintForm';
import { useCreateComplaint } from '@/hooks/useComplaints';

export default function NewComplaint() {
  const navigate = useNavigate();
  const create = useCreateComplaint();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <PageHeader
        title="Raise a complaint"
        description="Give staff enough detail to act without having to come back and ask."
      />

      <Card>
        <CardContent>
          <ComplaintForm
            submitLabel="Submit complaint"
            isSubmitting={create.isPending}
            onCancel={() => navigate('/complaints')}
            onSubmit={(input) =>
              create.mutate(input, {
                onSuccess: (complaint) => {
                  toast.success('Complaint submitted', {
                    description: `Tracking ID ${complaint.trackingId} - keep it to check progress without signing in.`,
                    duration: 8000,
                  });
                  navigate(`/complaints/${complaint.id}`, { replace: true });
                },
              })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
