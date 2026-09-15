"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  X,
  RefreshCw,
  Eye,
  Loader2,
  FileCheck2,
  FolderOpen,
  Filter,
} from "lucide-react";
import {
  getDocumentRequests,
  getDocuments,
  uploadDocument,
  replaceDocument,
  downloadDocument,
  type DocumentItem,
  type DocumentRequestItem,
  type DocumentStatus,
} from "@/lib/api/documents";

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  REQUESTED: {
    label: "Requested",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  UPLOADED: {
    label: "Uploaded",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  APPROVED: {
    label: "Approved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  REJECTED: {
    label: "Needs Revision",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
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

export default function ClientDocumentsPage() {
  const [activeTab, setActiveTab] = useState<"requests" | "all">("requests");
  const [requests, setRequests] = useState<DocumentRequestItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const [replaceDocId, setReplaceDocId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [reqsData, docsData] = await Promise.all([
        getDocumentRequests(),
        getDocuments(),
      ]);
      setRequests(reqsData);
      setDocuments(docsData);
    } catch (err: unknown) {
      console.error("Failed to load documents:", err);
      setError("Unable to load document records from the server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  // Handle open upload modal for a specific request
  const openUploadForRequest = (reqId: string) => {
    setSelectedRequestId(reqId);
    setReplaceDocId(null);
    setSelectedFile(null);
    setUploadError(null);
    setUploadProgress(0);
    setUploadModalOpen(true);
  };

  // Handle open replace modal for a rejected document
  const openReplaceForDoc = (docId: string, associatedReqId?: string | null) => {
    setReplaceDocId(docId);
    setSelectedRequestId(associatedReqId || "");
    setSelectedFile(null);
    setUploadError(null);
    setUploadProgress(0);
    setUploadModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 15 * 1024 * 1024) {
        setUploadError("File size exceeds the 15 MB limit.");
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 15 * 1024 * 1024) {
        setUploadError("File size exceeds the 15 MB limit.");
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      if (replaceDocId) {
        await replaceDocument(replaceDocId, selectedFile, (pct) =>
          setUploadProgress(pct)
        );
      } else {
        await uploadDocument(
          selectedFile,
          selectedRequestId ? selectedRequestId : undefined,
          (pct) => setUploadProgress(pct)
        );
      }

      setUploadModalOpen(false);
      setSelectedFile(null);
      setReplaceDocId(null);
      setSelectedRequestId("");
      await loadData();
    } catch (err: unknown) {
      console.error("Upload failed:", err);
      setUploadError("Failed to upload document. Please verify file format and size.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      setDownloadingId(id);
      await downloadDocument(id);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Unable to generate secure download link. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const pendingRequests = requests.filter(
    (r) => r.status === "REQUESTED" || r.status === "REJECTED"
  );

  const filteredDocuments = documents.filter((doc) => {
    if (statusFilter === "ALL") return true;
    return doc.status === statusFilter;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ─── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Document Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Securely upload, track status, and access verified tax files & filings.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedRequestId("");
            setReplaceDocId(null);
            setSelectedFile(null);
            setUploadError(null);
            setUploadProgress(0);
            setUploadModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
          <button
            onClick={loadData}
            className="ml-auto text-xs font-semibold text-rose-700 underline hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── Summary Counters ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Pending Requests
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {pendingRequests.length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Uploaded
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {documents.length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Approved Documents
          </span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {documents.filter((d) => d.status === "APPROVED").length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Needs Attention
          </span>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            {documents.filter((d) => d.status === "REJECTED").length}
          </p>
        </div>
      </div>

      {/* ─── Tabs Navigation ─────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "requests"
                ? "border-amber-500 text-amber-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>Document Requests</span>
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`pb-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "all"
                ? "border-amber-500 text-amber-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>All Documents</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-medium">
              {documents.length}
            </span>
          </button>
        </nav>

        {activeTab === "all" && (
          <div className="hidden sm:flex items-center gap-2 pb-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="UPLOADED">Uploaded</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Needs Revision</option>
            </select>
          </div>
        )}
      </div>

      {/* ─── Tab Content ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-16 flex items-center justify-center text-slate-500 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          <span className="text-sm font-medium">Loading documents & requests...</span>
        </div>
      ) : activeTab === "requests" ? (
        // ── Tab 1: Document Requests
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white p-8">
              <FileCheck2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">
                No active document requests
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Your assigned CA will create requests here when specific invoices,
                statements, or filing forms are needed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {requests.map((req) => {
                const badge = STATUS_CONFIG[req.status] || STATUS_CONFIG.REQUESTED;
                const isPending =
                  req.status === "REQUESTED" || req.status === "REJECTED";

                return (
                  <div
                    key={req.id}
                    className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900">
                            {req.title}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        {req.description && (
                          <p className="text-xs text-slate-600 max-w-2xl pt-1">
                            {req.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 flex-wrap">
                          {req.due_date && (
                            <span className="flex items-center gap-1 text-slate-500 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-amber-600" />
                              Due:{" "}
                              {new Date(req.due_date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Created:{" "}
                            {new Date(req.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                          {req.documents.length > 0 && (
                            <span className="flex items-center gap-1 text-blue-600 font-medium">
                              <FileText className="w-3.5 h-3.5" />
                              {req.documents.length} document(s) uploaded
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        {isPending ? (
                          <button
                            onClick={() => openUploadForRequest(req.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload File</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Submitted</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Show uploaded documents list inside request */}
                    {req.documents.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Associated Files
                        </span>
                        {req.documents.map((d) => {
                          const docBadge = STATUS_CONFIG[d.status];
                          return (
                            <div
                              key={d.id}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                                <span className="font-semibold text-slate-800 truncate">
                                  {d.original_filename}
                                </span>
                                <span className="text-slate-400">
                                  ({formatBytes(d.file_size)})
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${docBadge.bg} ${docBadge.text} ${docBadge.border}`}
                                >
                                  {docBadge.label}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleDownload(d.id)}
                                  disabled={downloadingId === d.id}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-white transition-colors cursor-pointer"
                                  title="Download"
                                >
                                  {downloadingId === d.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </button>
                                <Link
                                  href={`/client/documents/${d.id}`}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // ── Tab 2: All Documents
        <div className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white p-8">
              <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">
                No documents found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {statusFilter !== "ALL"
                  ? `No documents match status "${statusFilter}".`
                  : "You have not uploaded any documents yet."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filteredDocuments.map((doc) => {
                  const badge = STATUS_CONFIG[doc.status] || STATUS_CONFIG.UPLOADED;

                  return (
                    <div
                      key={doc.id}
                      className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {doc.original_filename}
                            </p>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              {badge.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span>{formatBytes(doc.file_size)}</span>
                            <span>•</span>
                            <span>
                              {new Date(doc.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>

                          {doc.rejection_reason && (
                            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs mt-2 flex items-start gap-2 max-w-xl">
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold">Review note: </span>
                                <span>{doc.rejection_reason}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {doc.status === "REJECTED" && (
                          <button
                            onClick={() =>
                              openReplaceForDoc(doc.id, doc.document_request_id)
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Replace File</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDownload(doc.id)}
                          disabled={downloadingId === doc.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          {downloadingId === doc.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span>Download</span>
                        </button>

                        <Link
                          href={`/client/documents/${doc.id}`}
                          className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Upload / Replace Modal ──────────────────────────────────────────── */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {replaceDocId ? "Replace Rejected Document" : "Upload Document"}
                </h3>
                <p className="text-xs text-slate-500">
                  {replaceDocId
                    ? "Upload the corrected file to reset the review process."
                    : "Upload files for statutory filings, GST, and accounting."}
                </p>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                disabled={isUploading}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Optional linked request selector (if not replacing) */}
              {!replaceDocId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Link to Document Request (Optional)
                  </label>
                  <select
                    value={selectedRequestId}
                    onChange={(e) => setSelectedRequestId(e.target.value)}
                    disabled={isUploading}
                    className="w-full text-xs font-medium border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">General Document Upload (No Request)</option>
                    {requests
                      .filter((r) => r.status === "REQUESTED" || r.status === "REJECTED")
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Drag & Drop Zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select File <span className="text-rose-500">*</span>
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    selectedFile
                      ? "border-amber-500 bg-amber-50/20"
                      : "border-slate-200 hover:border-amber-400 bg-slate-50/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.csv"
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  {selectedFile ? (
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatBytes(selectedFile.size)} • Click to change
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        Drop files here or click to browse
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        PDF, PNG, JPG, DOCX, XLSX, CSV (Max: 15 MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {isUploading && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>Uploading file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{replaceDocId ? "Submit Replacement" : "Upload"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
