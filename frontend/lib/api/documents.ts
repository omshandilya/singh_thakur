/**
 * lib/api/documents.ts
 * Typed wrappers and interfaces for /documents and /document-requests endpoints.
 */

import { apiClient } from "./authClient";

export type DocumentStatus =
  | "REQUESTED"
  | "UPLOADED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

export interface DocumentItem {
  id: string;
  document_request_id: string | null;
  client_id: string;
  uploaded_by_id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  status: DocumentStatus;
  rejection_reason: string | null;
  reviewed_by_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRequestItem {
  id: string;
  client_id: string;
  created_by_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
  documents: DocumentItem[];
}

export interface DownloadUrlResponse {
  download_url: string;
  expires_in: number;
  filename: string;
}

/**
 * Fetch document requests for the authenticated client.
 */
export async function getDocumentRequests(
  status?: DocumentStatus
): Promise<DocumentRequestItem[]> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  const { data } = await apiClient.get<DocumentRequestItem[]>(
    "/document-requests",
    { params }
  );
  return data;
}

/**
 * Fetch a single document request by ID.
 */
export async function getDocumentRequestById(
  id: string
): Promise<DocumentRequestItem> {
  const { data } = await apiClient.get<DocumentRequestItem>(
    `/document-requests/${id}`
  );
  return data;
}

/**
 * Fetch documents uploaded by / for the authenticated client.
 */
export async function getDocuments(
  status?: DocumentStatus,
  limit?: number
): Promise<DocumentItem[]> {
  const params: Record<string, string | number> = {};
  if (status) params.status = status;
  if (limit) params.limit = limit;
  const { data } = await apiClient.get<DocumentItem[]>("/documents", { params });
  return data;
}

/**
 * Fetch a single document's metadata by ID.
 */
export async function getDocumentById(id: string): Promise<DocumentItem> {
  const { data } = await apiClient.get<DocumentItem>(`/documents/${id}`);
  return data;
}

/**
 * Upload a document with optional document_request_id link.
 */
export async function uploadDocument(
  file: File,
  documentRequestId?: string,
  onProgress?: (progressEvent: number) => void
): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append("file", file);
  if (documentRequestId) {
    formData.append("document_request_id", documentRequestId);
  }

  const { data } = await apiClient.post<DocumentItem>(
    "/documents/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    }
  );
  return data;
}

/**
 * Replace / re-upload a rejected document.
 */
export async function replaceDocument(
  id: string,
  file: File,
  onProgress?: (progressEvent: number) => void
): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post<DocumentItem>(
    `/documents/${id}/replace`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    }
  );
  return data;
}

/**
 * Request a short-lived signed download URL for a document.
 */
export async function getDocumentDownloadUrl(
  id: string
): Promise<DownloadUrlResponse> {
  const { data } = await apiClient.get<DownloadUrlResponse>(
    `/documents/${id}/download-url`
  );
  return data;
}

/**
 * Helper to initiate a file download in the browser using the signed URL.
 */
export async function downloadDocument(id: string): Promise<void> {
  const { download_url } = await getDocumentDownloadUrl(id);
  // If the signed url is relative to the API, prepend baseURL if needed
  const targetUrl = download_url.startsWith("http")
    ? download_url
    : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${download_url}`;

  const link = document.createElement("a");
  link.href = targetUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
