"use client";

/**
 * context/AuthContext.tsx
 * Global authentication context — wraps the entire app.
 *
 * Provides:
 *   - currentUser: MeResponse | null
 *   - isLoading: boolean (true while /auth/me is in-flight)
 *   - login(), logout(), refresh() helpers
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  type MeResponse,
  type LoginPayload,
  type UserRole,
  ROLE_REDIRECT,
  login as apiLogin,
  logout as apiLogout,
  getMe,
} from "@/lib/api/auth";
import { TokenStore } from "@/lib/api/authClient";

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  currentUser: MeResponse | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Fetch the current user from the API and store in state. */
  const refreshUser = useCallback(async () => {
    const token = TokenStore.getAccess();
    if (!token) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await getMe();
      setCurrentUser(me);
    } catch {
      setCurrentUser(null);
      TokenStore.clear();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On mount, restore session from localStorage
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const tokenData = await apiLogin(payload);
      const me = await getMe();
      setCurrentUser(me);
      const redirect = ROLE_REDIRECT[tokenData.role] ?? "/";
      router.push(redirect);
    },
    [router]
  );

  const logout = useCallback(async () => {
    const refreshToken = TokenStore.getRefresh();
    if (refreshToken) {
      await apiLogout(refreshToken);
    } else {
      TokenStore.clear();
    }
    setCurrentUser(null);
    router.push("/login");
  }, [router]);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!currentUser) return false;
      return roles.includes(currentUser.role);
    },
    [currentUser]
  );

  return (
    <AuthContext.Provider
      value={{ currentUser, isLoading, login, logout, refreshUser, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
