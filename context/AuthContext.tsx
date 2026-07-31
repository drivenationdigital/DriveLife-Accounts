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

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitialised: boolean;
  signIn: (params: LoginParams) => Promise<AuthUser>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // Hydrate synchronously from cookies. Lazy initialisers only run once, on
  // mount, so there's no cascading render and no SSR/CSR mismatch (cookies
  // aren't available on the server anyway — we return null there, then the
  // first client render reads the real values).
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof document === "undefined") return null;
    const token = readTokenClient();
    const cachedUser = readUserClient<AuthUser>();
    return token && cachedUser ? cachedUser : null;
  });
  // Always true on the client — the lazy initialiser above already ran.
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

  const signIn = useCallback(async (params: LoginParams): Promise<AuthUser> => {
    // Skip auth-redirect during login so a 401 surfaces as an error here
    // instead of bouncing to /login mid-login.
    const res = await apiPost<LoginResponse, LoginParams>(
      "/next-dash-login",
      params,
      { skipAuthRedirect: true },
    );

    writeTokenClient(res.token, res.expires_at);
    writeUserClient(res.user, res.expires_at);
    setUser(res.user);
    return res.user;
  }, []);

  const signOut = useCallback(() => {
    clearTokenClient();
    setUser(null);
    queryClient.clear(); // wipe all cached account data
    window.location.href = "/login"; // hard reload — NOT router.push
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitialised,
      signIn,
      signOut,
    }),
    [user, isInitialised, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
