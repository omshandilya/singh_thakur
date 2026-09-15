/**
 * lib/api/auth.ts
 * Typed wrappers around every /auth/* endpoint.
 */

import { apiClient, TokenStore } from "./authClient";

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "CA" | "EMPLOYEE" | "CLIENT";

export interface MeResponse {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
  is_verified: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  reset_token?: string; // only returned in development
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

// ─── Role-based redirect map ──────────────────────────────────────────────────
export const ROLE_REDIRECT: Record<UserRole, string> = {
  ADMIN: "/dashboard/admin",
  CA: "/dashboard/ca",
  EMPLOYEE: "/dashboard/employee",
  CLIENT: "/client/dashboard",
};

// ─── API calls ────────────────────────────────────────────────────────────────

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/login", payload);
  TokenStore.set(data.access_token, data.refresh_token);
  return data;
}

export async function register(payload: RegisterPayload): Promise<MeResponse> {
  const { data } = await apiClient.post<MeResponse>("/auth/register", payload);
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    await apiClient.post("/auth/logout", { refresh_token: refreshToken });
  } finally {
    TokenStore.clear();
  }
}

export async function getMe(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>("/auth/me");
  return data;
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const { data } = await apiClient.post<ForgotPasswordResponse>("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiClient.post("/auth/reset-password", payload);
}
