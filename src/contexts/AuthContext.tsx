/* eslint-disable react-refresh/only-export-components -- provider and its hook belong together */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { isStaff, type LoginInput, type PublicUser, type SignupInput } from '@/lib/types';

type AuthContextValue = {
  user: PublicUser | null;
  /** True until the stored session has been checked against the database. */
  isLoading: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  signIn: (input: LoginInput) => Promise<PublicUser>;
  signUp: (input: SignupInput) => Promise<PublicUser>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    api
      .getSessionUser()
      .then((session) => {
        if (!cancelled) setUser(session);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignIn = useCallback(
    async (input: LoginInput) => {
      const session = await api.signIn(input);
      setUser(session);
      // Anything cached under the previous identity is no longer valid.
      queryClient.clear();
      return session;
    },
    [queryClient],
  );

  const handleSignUp = useCallback(
    async (input: SignupInput) => {
      const session = await api.signUp(input);
      setUser(session);
      queryClient.clear();
      return session;
    },
    [queryClient],
  );

  const handleSignOut = useCallback(async () => {
    await api.signOut();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const refresh = useCallback(async () => {
    setUser(await api.getSessionUser());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isStaff: isStaff(user?.role),
      isAdmin: user?.role === 'admin',
      signIn: handleSignIn,
      signUp: handleSignUp,
      signOut: handleSignOut,
      refresh,
    }),
    [user, isLoading, handleSignIn, handleSignUp, handleSignOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
