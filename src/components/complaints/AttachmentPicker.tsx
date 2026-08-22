import { useRef, useState } from 'react';
import { FileText, ImageIcon, Paperclip, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { newId } from '@/lib/crypto';
import { fileSize } from '@/lib/format';
import {
  ACCEPTED_MIME,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
  type Attachment,
} from '@/lib/types';
import { cn } from '@/lib/utils';

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function AttachmentPicker({
  value,
  onChange,
}: {
  value: Attachment[];
  onChange: (next: Attachment[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);

  async function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    if (!incoming.length) return;

    const room = MAX_ATTACHMENTS - value.length;
    if (room <= 0) {
      toast.error(`You can attach at most ${MAX_ATTACHMENTS} files`);
      return;
    }

    setIsReading(true);
    const accepted: Attachment[] = [];
    try {
      for (const file of incoming.slice(0, room)) {
        if (!ACCEPTED_MIME.includes(file.type)) {
          toast.error(`${file.name} is not a PNG, JPEG, WebP or PDF`);
          continue;
        }
        if (file.size > MAX_ATTACHMENT_BYTES) {
          toast.error(`${file.name} is larger than ${fileSize(MAX_ATTACHMENT_BYTES)}`);
          continue;
        }
        accepted.push({
          id: newId('att'),
          name: file.name,
          mimeType: file.type,
          size: file.size,
          dataUrl: await readAsDataUrl(file),
        });
      }
      if (incoming.length > room) {
        toast.error(`Only ${room} more file${room === 1 ? '' : 's'} could be added`);
      }
      if (accepted.length) onChange([...value, ...accepted]);
    } finally {
      setIsReading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void addFiles(event.dataTransfer.files);
        }}
        className={cn(
          'rounded-lg border border-dashed border-input p-6 text-center transition-colors',
          isDragging && 'border-primary bg-primary/5',
        )}
      >
        <Upload className="mx-auto size-6 text-muted-foreground" aria-hidden />
        <p className="mt-2 text-sm">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={() => inputRef.current?.click()}
            disabled={isReading || value.length >= MAX_ATTACHMENTS}
          >
            Choose files
          </Button>{' '}
          <span className="text-muted-foreground">or drag them here</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PNG, JPEG, WebP or PDF - up to {MAX_ATTACHMENTS} files, {fileSize(MAX_ATTACHMENT_BYTES)}{' '}
          each
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept={ACCEPTED_MIME.join(',')}
          onChange={(event) => {
            if (event.target.files) void addFiles(event.target.files);
            // Reset so picking the same file twice still fires a change event.
            event.target.value = '';
          }}
        />
      </div>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
            >
              {attachment.mimeType.startsWith('image/') ? (
                <img
                  src={attachment.dataUrl}
                  alt=""
                  className="size-9 shrink-0 rounded object-cover"
                />
              ) : (
                <span className="flex size-9 shrink-0 items-center justify-center rounded bg-muted">
                  <FileText className="size-4 text-muted-foreground" aria-hidden />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{attachment.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {fileSize(attachment.size)}
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onChange(value.filter((a) => a.id !== attachment.id))}
                aria-label={`Remove ${attachment.name}`}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Read-only rendering of the same list, used on the detail page. */
export function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  if (!attachments.length) return null;

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
        <Paperclip className="size-4" aria-hidden />
        Attachments ({attachments.length})
      </h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {attachments.map((attachment) => (
          <li key={attachment.id}>
            <a
              href={attachment.dataUrl}
              target="_blank"
              rel="noreferrer"
              download={attachment.name}
              className="flex items-center gap-3 rounded-md border border-border px-3 py-2 transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              {attachment.mimeType.startsWith('image/') ? (
                <img src={attachment.dataUrl} alt="" className="size-9 shrink-0 rounded object-cover" />
              ) : (
                <span className="flex size-9 shrink-0 items-center justify-center rounded bg-muted">
                  <ImageIcon className="size-4 text-muted-foreground" aria-hidden />
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm">{attachment.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {fileSize(attachment.size)}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
