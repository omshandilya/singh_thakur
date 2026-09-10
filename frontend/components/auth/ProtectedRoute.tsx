"use client";

/**
 * components/auth/ProtectedRoute.tsx
 * Wraps pages that require authentication.
 * Optionally accepts a list of allowed roles.
 *
 * Usage:
 *   <ProtectedRoute roles={["ADMIN", "CA"]}>
 *     <AdminPage />
 *   </ProtectedRoute>
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/lib/api/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (roles && roles.length > 0 && !roles.includes(currentUser.role)) {
      router.replace("/unauthorized");
    }
  }, [currentUser, isLoading, roles, router]);

  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  if (!currentUser) return null;
  if (roles && roles.length > 0 && !roles.includes(currentUser.role)) return null;

  return <>{children}</>;
}
