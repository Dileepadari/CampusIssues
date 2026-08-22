import { useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitFeedback } from '@/hooks/useComplaints';
import { dateTime } from '@/lib/format';
import type { ComplaintDetail } from '@/lib/types';
import { cn } from '@/lib/utils';

function Stars({
  value,
  onChange,
}: {
  value: number;
  onChange?: (next: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center gap-0.5" role={onChange ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= active;
        const icon = (
          <Star
            className={cn(
              'size-5',
              filled ? 'fill-[var(--priority-medium)] text-[var(--priority-medium)]' : 'text-muted-foreground',
            )}
            aria-hidden
          />
        );
        if (!onChange) return <span key={star}>{icon}</span>;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} out of 5`}
            className="cursor-pointer rounded p-0.5"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onFocus={() => setHovered(star)}
            onBlur={() => setHovered(0)}
            onClick={() => onChange(star)}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Shown once a complaint reaches a terminal state: the author rates the
 * outcome, everyone else sees the rating they gave.
 */
export function FeedbackCard({
  complaint,
  isAuthor,
}: {
  complaint: ComplaintDetail;
  isAuthor: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const submit = useSubmitFeedback(complaint.id);

  if (complaint.satisfaction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resolution rating</CardTitle>
          <CardDescription>
            Rated {dateTime(complaint.satisfaction.at)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Stars value={complaint.satisfaction.rating} />
          {complaint.satisfaction.comment && (
            <p className="text-sm text-muted-foreground">{complaint.satisfaction.comment}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!isAuthor) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">How was this handled?</CardTitle>
        <CardDescription>
          Your rating is visible to the staff member who worked on it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit.mutate({ rating, comment });
          }}
        >
          <Stars value={rating} onChange={setRating} />
          <Textarea
            rows={2}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Anything you want to add (optional)"
            aria-label="Feedback comment"
          />
          <Button type="submit" disabled={rating === 0 || submit.isPending}>
            {submit.isPending && <Loader2 className="size-4 animate-spin" />}
            Submit rating
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
