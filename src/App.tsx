import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GuestRoute, ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

// The landing page is the first thing an anonymous visitor sees, so it ships in
// the entry chunk. Every other screen is split out and fetched on navigation -
// a student never downloads recharts or the admin tables.
import Landing from '@/pages/Landing';

const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const Track = lazy(() => import('@/pages/Track'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Complaints = lazy(() => import('@/pages/Complaints'));
const Board = lazy(() => import('@/pages/Board'));
const Assigned = lazy(() => import('@/pages/Assigned'));
const NewComplaint = lazy(() => import('@/pages/NewComplaint'));
const ComplaintDetail = lazy(() => import('@/pages/ComplaintDetail'));
const Settings = lazy(() => import('@/pages/Settings'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const People = lazy(() => import('@/pages/People'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function RouteFallback() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <BrowserRouter>
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    {/* Public pages, plus the two auth screens a signed-in user is bounced off. */}
                    <Route element={<PublicLayout />}>
                      <Route path="/" element={<Landing />} />
                      <Route path="/track" element={<Track />} />
                      <Route element={<GuestRoute />}>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                      </Route>
                    </Route>

                    {/* Everything behind sign-in shares the app shell. */}
                    <Route element={<ProtectedRoute />}>
                      <Route element={<AppShell />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/complaints" element={<Complaints />} />
                        <Route path="/complaints/new" element={<NewComplaint />} />
                        <Route path="/complaints/:id" element={<ComplaintDetail />} />
                        <Route path="/board" element={<Board />} />
                        <Route path="/settings" element={<Settings />} />

                        <Route element={<ProtectedRoute require="staff" />}>
                          <Route path="/assigned" element={<Assigned />} />
                          <Route path="/analytics" element={<Analytics />} />
                        </Route>

                        <Route element={<ProtectedRoute require="admin" />}>
                          <Route path="/people" element={<People />} />
                        </Route>
                      </Route>
                    </Route>

                    {/* Paths from the previous version that may still be bookmarked. */}
                    <Route path="/new-complaint" element={<Navigate to="/complaints/new" replace />} />
                    <Route path="/complaint/:id" element={<Navigate to="/complaints" replace />} />
                    <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
