import { Link, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogoBadge, Wordmark } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

export function PublicLayout() {
  const { user } = useAuth();
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="CampusIssues home">
            <Wordmark />
          </Link>

          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/track">Track a complaint</Link>
            </Button>
            <ThemeToggle />
            {user ? (
              <Button asChild size="sm">
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/signup">Create account</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <LogoBadge className="size-7" />
              <span className="font-semibold">CampusIssues</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              One place for students to raise campus problems and for staff to resolve them, with a
              tracking ID on every submission.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-medium">Product</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/track" className="hover:text-foreground">
                  Track a complaint
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-foreground">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-foreground">
                  Create an account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-medium">How it works</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Submit with or without your name attached</li>
              <li>Every complaint is routed to a department</li>
              <li>Response targets are set by priority</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border">
          <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
            &copy; {year} CampusIssues
          </p>
        </div>
      </footer>
    </div>
  );
}
