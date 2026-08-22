import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { avatarTint, initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PublicUser } from '@/lib/types';

/** Falls back to an "Anonymous" chip when a complaint hides its author. */
export function UserAvatar({
  user,
  className,
}: {
  user: Pick<PublicUser, 'id' | 'name'> | null;
  className?: string;
}) {
  if (!user) {
    return (
      <Avatar className={cn('border border-border', className)}>
        <AvatarFallback className="bg-muted text-muted-foreground">?</AvatarFallback>
      </Avatar>
    );
  }
  return (
    <Avatar className={className}>
      <AvatarFallback style={{ backgroundColor: avatarTint(user.id), color: 'oklch(0.25 0.03 300)' }}>
        {initials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}
