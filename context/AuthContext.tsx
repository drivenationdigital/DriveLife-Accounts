"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiPost, setUnauthorizedHandler } from "@/lib/apiClient";
import {
  readTokenClient,
  writeTokenClient,
  clearTokenClient,
  readUserClient,
  writeUserClient,
} from "@/lib/authCookies";
import type { AuthUser, LoginParams, LoginResponse } from "@/lib/apiTypes";
import { useQueryClient } from "@tanstack/react-query";

/** The three fields every authenticating route returns. */
export interface Session {
  token: string;
  expires_at: number;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitialised: boolean;
  signIn: (params: LoginParams) => Promise<AuthUser>;
  /**
   * Adopt a session issued by a route other than sign-in.
   *
   * Registration returns the same token envelope as /next-dash-login,
   * so a new account is already signed in by the time the response
   * lands - re-posting the credentials to sign in would be a second
   * round trip that can independently fail, leaving a created account
   * stranded on the signup form.
   */
  adoptSession: (session: Session) => AuthUser;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // Hydrate synchronously from cookies. Lazy initialisers only run once, on
  // mount, so there's no cascading render and no SSR/CSR mismatch (cookies
  // aren't available on the server anyway - we return null there, then the
  // first client render reads the real values).
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof document === "undefined") return null;
    const token = readTokenClient();
    const cachedUser = readUserClient<AuthUser>();
    return token && cachedUser ? cachedUser : null;
  });
  // Always true on the client - the lazy initialiser above already ran.
  // Kept on the context so consumers have a stable "are we ready?" signal
  // if we later hydrate auth from the server.
  const isInitialised = typeof document !== "undefined";
  const router = useRouter();

  // Wire the api client's 401 handler to our signOut flow.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearTokenClient();
      setUser(null);
      if (typeof window !== "undefined") {
        const here = window.location.pathname + window.location.search;
        const returnTo =
          here && here !== "/login"
            ? `?returnTo=${encodeURIComponent(here)}`
            : "";
        // Using window over router so the reload kills any cached queries.
        window.location.href = `/login${returnTo}`;
      }
    });
  }, []);

  // Writing the cookies and context state is identical however the
  // token was obtained, so sign-in and registration share this.
  const adoptSession = useCallback((session: Session): AuthUser => {
    writeTokenClient(session.token, session.expires_at);
    writeUserClient(session.user, session.expires_at);
    setUser(session.user);
    return session.user;
  }, []);

  const signIn = useCallback(async (params: LoginParams): Promise<AuthUser> => {
    // Skip auth-redirect during login so a 401 surfaces as an error here
    // instead of bouncing to /login mid-login.
    const res = await apiPost<LoginResponse, LoginParams>(
      "/next-dash-login",
      params,
      { skipAuthRedirect: true },
    );

    return adoptSession(res);
  }, [adoptSession]);

  const signOut = useCallback(() => {
    clearTokenClient();
    setUser(null);
    queryClient.clear(); // wipe all cached account data
    window.location.href = "/login"; // hard reload - NOT router.push
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitialised,
      signIn,
      adoptSession,
      signOut,
    }),
    [user, isInitialised, signIn, adoptSession, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
