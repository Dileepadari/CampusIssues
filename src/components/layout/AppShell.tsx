import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  PlusCircle,
  Settings as SettingsIcon,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogoBadge } from '@/components/common/Logo';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { UserAvatar } from '@/components/common/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABEL } from '@/lib/types';
import { cn } from '@/lib/utils';

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  /** Which roles see the item. Undefined means everyone signed in. */
  roles?: ('student' | 'staff' | 'admin')[];
};

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/complaints', label: 'Complaints', icon: Inbox },
  { to: '/assigned', label: 'Assigned to me', icon: MessagesSquare, roles: ['staff', 'admin'] },
  { to: '/board', label: 'Community board', icon: MessagesSquare, roles: ['student'] },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['staff', 'admin'] },
  { to: '/people', label: 'People', icon: Users, roles: ['admin'] },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const role = user?.role ?? 'student';

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role)).map(
        ({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </NavLink>
        ),
      )}
    </nav>
  );
}

function AccountMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto w-full justify-start gap-2 px-2 py-2">
          <UserAvatar user={user} />
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-medium">{user.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {ROLE_LABEL[user.role]}
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/settings')}>
          <SettingsIcon className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={async () => {
            await signOut();
            navigate('/');
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1500px]">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border p-4 lg:flex">
          <Link to="/dashboard" className="mb-6 flex items-center gap-2 px-2">
            <LogoBadge />
            <span className="text-base font-semibold tracking-tight">CampusIssues</span>
          </Link>

          <Button asChild className="mb-4 w-full justify-start gap-2">
            <Link to="/complaints/new">
              <PlusCircle className="size-4" />
              New complaint
            </Link>
          </Button>

          <NavItems />

          <div className="mt-auto">
            <Separator className="mb-3" />
            <AccountMenu />
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur">
            <div className="flex items-center gap-2 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
              <Link to="/dashboard" className="flex items-center gap-2">
                <LogoBadge className="size-7" />
                <span className="font-semibold">CampusIssues</span>
              </Link>
            </div>

            <p className="hidden text-sm text-muted-foreground lg:block">
              Signed in as {user?.name}
            </p>

            <div className="flex items-center gap-1">
              <Button asChild variant="outline" size="sm" className="hidden gap-1.5 sm:flex lg:hidden">
                <Link to="/complaints/new">
                  <PlusCircle className="size-4" />
                  New
                </Link>
              </Button>
              <NotificationBell />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile drawer. Rendered outside the flex row so it can cover the page. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-background p-4">
            <div className="mb-6 flex items-center justify-between">
              <Link
                to="/dashboard"
                className="flex items-center gap-2"
                onClick={() => setMobileOpen(false)}
              >
                <LogoBadge />
                <span className="font-semibold">CampusIssues</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>

            <Button asChild className="mb-4 w-full justify-start gap-2">
              <Link to="/complaints/new" onClick={() => setMobileOpen(false)}>
                <PlusCircle className="size-4" />
                New complaint
              </Link>
            </Button>

            <NavItems onNavigate={() => setMobileOpen(false)} />

            <div className="mt-auto">
              <Separator className="mb-3" />
              <AccountMenu />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
