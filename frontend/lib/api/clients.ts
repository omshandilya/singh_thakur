/**
 * lib/api/clients.ts
 * Typed wrappers and interfaces for /clients/* endpoints.
 */

import { apiClient } from "./authClient";

export type ClientType = "INDIVIDUAL" | "BUSINESS";

export interface AssignedEmployee {
  id: string;
  full_name: string | null;
  email: string;
}

export interface ClientProfile {
  id: string;
  user_id: string;
  name: string;
  client_type: ClientType;
  company_name: string | null;
  pan: string | null;
  gstin: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  assigned_employee_id: string | null;
  assigned_employee: AssignedEmployee | null;
  created_at: string;
  updated_at: string;
}

export interface ClientUpdatePayload {
  name?: string;
  client_type?: ClientType;
  company_name?: string | null;
  pan?: string | null;
  gstin?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

/**
 * Fetch the authenticated client's profile.
 * Endpoint: GET /api/v1/clients/me
 */
export async function getMyClientProfile(): Promise<ClientProfile> {
  const { data } = await apiClient.get<ClientProfile>("/clients/me");
  return data;
}

/**
 * Update the authenticated client's profile.
 * Endpoint: PUT /api/v1/clients/me
 */
export async function updateMyClientProfile(
  payload: ClientUpdatePayload
): Promise<ClientProfile> {
  const { data } = await apiClient.put<ClientProfile>("/clients/me", payload);
  return data;
}
