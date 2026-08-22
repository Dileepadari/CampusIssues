import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isStaff } from '@/lib/types';

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
    </div>
  );
}

/**
 * Gates a branch of the router. `require` narrows it further than "signed in":
 * a student who types /people is sent to their dashboard, not to the login page,
 * because they are authenticated - just not allowed.
 */
export function ProtectedRoute({ require = 'user' }: { require?: 'user' | 'staff' | 'admin' }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  const allowed =
    require === 'user' ||
    (require === 'staff' && isStaff(user.role)) ||
    (require === 'admin' && user.role === 'admin');

  if (!allowed) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

/** Keeps a signed-in user off the login and sign-up screens. */
export function GuestRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
