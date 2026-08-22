import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/useComplaints';
import { relativeTime } from '@/lib/format';

export function NotificationBell() {
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-90 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-medium">Notifications</p>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => markAll.mutate(undefined)}
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nothing yet. Updates on your complaints show up here.
          </p>
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y divide-border">
              {notifications.map((notification) => {
                const body = (
                  <>
                    <div className="flex items-start gap-2">
                      {!notification.readAt && (
                        <span
                          aria-hidden
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                        />
                      )}
                      <div className={notification.readAt ? 'pl-3.5' : undefined}>
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {notification.body}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {relativeTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </>
                );

                return (
                  <li key={notification.id}>
                    {notification.complaintId ? (
                      <Link
                        to={`/complaints/${notification.complaintId}`}
                        className="block px-4 py-3 transition-colors hover:bg-accent/60"
                        onClick={() => !notification.readAt && markRead.mutate(notification.id)}
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="block w-full cursor-pointer px-4 py-3 text-left transition-colors hover:bg-accent/60"
                        onClick={() => !notification.readAt && markRead.mutate(notification.id)}
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
