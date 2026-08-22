import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AttachmentPicker } from '@/components/complaints/AttachmentPicker';
import {
  CATEGORIES,
  CATEGORY_DEPARTMENT,
  CATEGORY_LABEL,
  PRIORITIES,
  PRIORITY_LABEL,
  SLA_HOURS,
  complaintSchema,
  type ComplaintInput,
} from '@/lib/types';
import { duration } from '@/lib/format';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}

export function ComplaintForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  defaultValues?: Partial<ComplaintInput>;
  submitLabel: string;
  onSubmit: (input: ComplaintInput) => void;
  onCancel?: () => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ComplaintInput>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      location: '',
      visibility: 'public',
      isAnonymous: false,
      attachments: [],
      ...defaultValues,
    },
  });

  // useWatch rather than the form's watch() so the subscription is memo-safe.
  const category = useWatch({ control, name: 'category' });
  const priority = useWatch({ control, name: 'priority' });
  const isAnonymous = useWatch({ control, name: 'isAnonymous' });
  const description = useWatch({ control, name: 'description' }) ?? '';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Summarise the issue in one line"
          aria-invalid={Boolean(errors.title)}
          {...register('title')}
        />
        <FieldError message={errors.title?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="category" aria-invalid={Boolean(errors.category)}>
                  <SelectValue placeholder="Pick a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {CATEGORY_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {category ? (
            <p className="text-xs text-muted-foreground">
              Routed to {CATEGORY_DEPARTMENT[category]}
            </p>
          ) : (
            <FieldError message={errors.category?.message} />
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {PRIORITY_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className="text-xs text-muted-foreground">
            Response target: {duration(SLA_HOURS[priority])}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={7}
          placeholder="What is wrong, where, since when, and who it affects. Specifics get things fixed faster."
          aria-invalid={Boolean(errors.description)}
          {...register('description')}
        />
        <div className="flex items-center justify-between">
          <FieldError message={errors.description?.message} />
          <span className="ml-auto text-xs text-muted-foreground">{description.length}/4000</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">Location (optional)</Label>
        <Input id="location" placeholder="e.g. Hostel Block C, second floor" {...register('location')} />
        <FieldError message={errors.location?.message} />
      </div>

      <div className="space-y-1.5">
        <Label>Attachments (optional)</Label>
        <Controller
          control={control}
          name="attachments"
          render={({ field }) => (
            <AttachmentPicker value={field.value ?? []} onChange={field.onChange} />
          )}
        />
        <FieldError message={errors.attachments?.message} />
      </div>

      <div className="space-y-3 rounded-lg border border-border p-4">
        <Controller
          control={control}
          name="visibility"
          render={({ field }) => (
            <div className="flex items-start gap-3">
              <Switch
                id="visibility"
                checked={field.value === 'public'}
                onCheckedChange={(checked) => field.onChange(checked ? 'public' : 'private')}
              />
              <div className="space-y-0.5">
                <Label htmlFor="visibility" className="gap-1.5">
                  {field.value === 'public' ? (
                    <Eye className="size-3.5" />
                  ) : (
                    <EyeOff className="size-3.5" />
                  )}
                  Show on the community board
                </Label>
                <p className="text-xs text-muted-foreground">
                  Other students can see it and upvote instead of filing a duplicate. Turn this off
                  for anything personal - only you and staff will see it.
                </p>
              </div>
            </div>
          )}
        />

        <Controller
          control={control}
          name="isAnonymous"
          render={({ field }) => (
            <div className="flex items-start gap-3">
              <Switch id="anonymous" checked={field.value} onCheckedChange={field.onChange} />
              <div className="space-y-0.5">
                <Label htmlFor="anonymous">Submit anonymously</Label>
                <p className="text-xs text-muted-foreground">
                  Your name is hidden from other students. Staff handling the complaint can still
                  see who filed it, because they may need to follow up.
                </p>
              </div>
            </div>
          )}
        />

        {isAnonymous && (
          <p className="flex items-start gap-2 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden />
            This complaint will still appear in your own list, and you keep the tracking ID.
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
