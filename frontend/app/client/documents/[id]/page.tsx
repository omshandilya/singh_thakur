"use client";

import React, { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Download,
  ArrowLeft,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Lock,
} from "lucide-react";
import {
  getDocumentById,
  downloadDocument,
  replaceDocument,
  type DocumentItem,
  type DocumentStatus,
} from "@/lib/api/documents";

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  REQUESTED: {
    label: "Requested",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    icon: Clock,
  },
  UPLOADED: {
    label: "Uploaded",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    icon: FileText,
  },
  UNDER_REVIEW: {
    label: "Under CA Review",
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-200",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved & Verified",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Needs Revision / Rejected",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    icon: AlertCircle,
  },
};

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Replacement state
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceProgress, setReplaceProgress] = useState(0);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadDoc() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getDocumentById(resolvedParams.id);
        setDoc(data);
      } catch (err: unknown) {
        console.error("Failed to load document:", err);
        setError("Document not found or you do not have permission to view it.");
      } finally {
        setIsLoading(false);
      }
    }
    loadDoc();
  }, [resolvedParams.id]);

  const handleDownload = async () => {
    if (!doc) return;
    try {
      setIsDownloading(true);
      await downloadDocument(doc.id);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Unable to initiate secure download. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReplaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc || !replaceFile) return;

    try {
      setIsReplacing(true);
      setReplaceError(null);
      const updated = await replaceDocument(doc.id, replaceFile, (pct) =>
        setReplaceProgress(pct)
      );
      setDoc(updated);
      setReplaceFile(null);
      router.refresh();
    } catch (err: unknown) {
      console.error("Replacement failed:", err);
      setReplaceError("Failed to upload replacement file. Please check format and size.");
    } finally {
      setIsReplacing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
        <span className="text-sm font-medium">Loading document details...</span>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Document Unavailable
        </h2>
        <p className="text-xs text-slate-500">{error}</p>
        <Link
          href="/client/documents"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Documents</span>
        </Link>
      </div>
    );
  }

  const badge = STATUS_CONFIG[doc.status] || STATUS_CONFIG.UPLOADED;
  const BadgeIcon = badge.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ─── Breadcrumb & Navigation ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/client/documents"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Documents</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Encrypted Storage</span>
        </div>
      </div>

      {/* ─── Document Title Header ───────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {doc.original_filename}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
              >
                <BadgeIcon className="w-3.5 h-3.5" />
                <span>{badge.label}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Uploaded on{" "}
              {new Date(doc.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              • {formatBytes(doc.file_size)}
            </p>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>Download Document</span>
        </button>
      </div>

      {/* ─── Rejection Reason & Re-Upload Flow ─────────────────────────────────── */}
      {doc.status === "REJECTED" && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-900">
                Document Requires Revision
              </h3>
              <p className="text-xs text-rose-700 mt-1">
                {doc.rejection_reason ||
                  "The reviewing Chartered Accountant has requested changes to this document."}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleReplaceSubmit}
            className="pt-2 border-t border-rose-200 space-y-3"
          >
            {replaceError && (
              <p className="text-xs font-semibold text-rose-700">{replaceError}</p>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setReplaceFile(e.target.files[0]);
                  }
                }}
                accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.csv"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-rose-300 text-xs font-semibold text-rose-900 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                {replaceFile ? replaceFile.name : "Select Replacement File"}
              </button>

              <button
                type="submit"
                disabled={!replaceFile || isReplacing}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isReplacing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Re-Upload & Submit</span>
              </button>
            </div>

            {isReplacing && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-rose-700">
                  <span>Uploading replacement...</span>
                  <span>{replaceProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-rose-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-600 transition-all duration-300"
                    style={{ width: `${replaceProgress}%` }}
                  />
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ─── Metadata Specification Card ─────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>File Specifications & Verification Status</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              File Format & MIME Type
            </span>
            <p className="font-semibold text-slate-800">{doc.mime_type}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Binary File Size
            </span>
            <p className="font-semibold text-slate-800">
              {formatBytes(doc.file_size)} ({doc.file_size.toLocaleString()} bytes)
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Upload Date
            </span>
            <p className="font-semibold text-slate-800">
              {new Date(doc.created_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Last Status Update
            </span>
            <p className="font-semibold text-slate-800">
              {new Date(doc.updated_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Security Guarantee ──────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-3">
        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          Document binaries are isolated in S3-compatible cloud storage and accessible
          only via temporary signed tokens that expire after 15 minutes.
        </span>
      </div>
    </div>
  );
}
