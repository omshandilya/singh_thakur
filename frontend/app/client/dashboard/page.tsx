"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Building2,
  FileText,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Phone,
  Mail,
  FileCheck2,
  UserCheck,
  Loader2,
  Sparkles,
  Download,
  Upload,
  FolderOpen,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getMyClientProfile, type ClientProfile } from "@/lib/api/clients";
import {
  getDocumentRequests,
  getDocuments,
  downloadDocument,
  type DocumentRequestItem,
  type DocumentItem,
} from "@/lib/api/documents";

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function ClientDashboardPage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [docRequests, setDocRequests] = useState<DocumentRequestItem[]>([]);
  const [recentDocs, setRecentDocs] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        const [profileData, requestsData, documentsData] = await Promise.all([
          getMyClientProfile(),
          getDocumentRequests().catch(() => []),
          getDocuments(undefined, 5).catch(() => []),
        ]);
        setProfile(profileData);
        setDocRequests(requestsData);
        setRecentDocs(documentsData);
      } catch (err: unknown) {
        console.error("Failed to load dashboard data:", err);
        setError("Unable to load latest dashboard information.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownload = async (id: string) => {
    try {
      setDownloadingId(id);
      await downloadDocument(id);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Unable to generate download link.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Calculate profile completeness score
  const calculateCompleteness = (p: ClientProfile | null): number => {
    if (!p) return 0;
    let total = 6;
    let filled = 0;
    if (p.name) filled++;
    if (p.email) filled++;
    if (p.phone) filled++;
    if (p.pan) filled++;
    if (p.address) filled++;
    if (p.client_type === "BUSINESS") {
      total = 7;
      if (p.company_name) filled++;
    } else {
      filled++;
    }
    return Math.round((filled / total) * 100);
  };

  const completeness = calculateCompleteness(profile);

  const displayName =
    profile?.name || currentUser?.full_name || currentUser?.email || "Valued Client";

  const pendingRequests = docRequests.filter(
    (r) => r.status === "REQUESTED" || r.status === "REJECTED"
  );

  return (
    <div className="space-y-8">
      {/* ─── Top Banner ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white shadow-lg border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Client Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {displayName}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Welcome to your Singh & Thakur CA portal. Monitor your tax compliance,
              document requests, and financial filings from this dashboard.
            </p>
          </div>

          <div className="flex sm:shrink-0 gap-3">
            <Link
              href="/client/documents"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors shadow-sm"
            >
              <span>Manage Documents</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Profile Summary Card ────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-600" />
              Profile Summary
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified identity and registration details on file
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Completeness
              </span>
              <p className="text-sm font-bold text-slate-900">{completeness}%</p>
            </div>
            <div className="w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  completeness === 100
                    ? "bg-emerald-500"
                    : completeness > 60
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 flex items-center justify-center text-slate-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
            <span className="text-sm">Loading profile summary...</span>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Field 1: Client Type */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Client Classification
              </span>
              <div className="flex items-center gap-2 pt-0.5">
                {profile?.client_type === "BUSINESS" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <Building2 className="w-3.5 h-3.5" />
                    Business Entity
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <User className="w-3.5 h-3.5" />
                    Individual Client
                  </span>
                )}
              </div>
              {profile?.company_name && (
                <p className="text-xs text-slate-600 truncate font-medium pt-1">
                  {profile.company_name}
                </p>
              )}
            </div>

            {/* Field 2: PAN & GSTIN */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tax Identifiers
              </span>
              <div className="pt-0.5 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500">PAN:</span>
                  {profile?.pan ? (
                    <span className="text-xs font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {profile.pan}
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 italic">
                      Pending setup
                    </span>
                  )}
                </div>

                {profile?.client_type === "BUSINESS" && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500">GSTIN:</span>
                    {profile?.gstin ? (
                      <span className="text-xs font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {profile.gstin}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Not provided
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Field 3: Contact Details */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Contact Details
              </span>
              <div className="pt-0.5 space-y-1 text-xs text-slate-700">
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{profile?.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{profile?.phone || "No phone added"}</span>
                </div>
              </div>
            </div>

            {/* Field 4: Assigned CA / Staff */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Assigned CA Advisor
              </span>
              <div className="pt-0.5">
                {profile?.assigned_employee ? (
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {profile.assigned_employee.full_name || "Staff Member"}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {profile.assigned_employee.email}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Senior Partner Desk</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─── Operational Documents & Compliance Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Pending Document Requests (Live API Data) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pending Document Requests
                  </h3>
                  <p className="text-xs text-slate-500">
                    Required for audits & statutory filings
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  pendingRequests.length > 0
                    ? "bg-amber-100 text-amber-800 border-amber-200 font-bold"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {pendingRequests.length} Pending
              </span>
            </div>

            {isLoading ? (
              <div className="py-8 flex items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span className="text-xs">Loading requests...</span>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="py-8 px-4 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                <FileCheck2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800">
                  No pending document requests
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  All required documents are up-to-date. When your CA requires new
                  statements or forms, they will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-amber-50/20 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {req.title}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {req.description || "No description provided"}
                      </p>
                      {req.due_date && (
                        <p className="text-[10px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due:{" "}
                          {new Date(req.due_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      )}
                    </div>
                    <Link
                      href="/client/documents"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors shrink-0"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Secure CA file exchange</span>
            <Link
              href="/client/documents"
              className="text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1"
            >
              <span>View all requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Section 2: Recently Uploaded Documents (Live API Data) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Recently Uploaded Documents
                  </h3>
                  <p className="text-xs text-slate-500">
                    Latest file submissions & review status
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {recentDocs.length} Recent
              </span>
            </div>

            {isLoading ? (
              <div className="py-8 flex items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span className="text-xs">Loading documents...</span>
              </div>
            ) : recentDocs.length === 0 ? (
              <div className="py-8 px-4 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                <FolderOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800">
                  No documents uploaded yet
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Upload your tax returns, balance sheets, and GST reports to make them
                  available to your CA.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {doc.original_filename}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{formatBytes(doc.file_size)}</span>
                        <span>•</span>
                        <span>
                          {new Date(doc.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                          doc.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : doc.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : doc.status === "UNDER_REVIEW"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {doc.status}
                      </span>

                      <button
                        onClick={() => handleDownload(doc.id)}
                        disabled={downloadingId === doc.id}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-white transition-colors cursor-pointer"
                        title="Download"
                      >
                        {downloadingId === doc.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Encrypted file storage</span>
            <Link
              href="/client/documents"
              className="text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1"
            >
              <span>Manage all documents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Section 3: Pending Tasks Placeholder */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pending Action Items
                  </h3>
                  <p className="text-xs text-slate-500">
                    Approvals and verifications
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                0 Action Required
              </span>
            </div>

            <div className="py-8 px-4 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
              <CheckCircle2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                No pending tasks
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                There are no open tax approvals, DSC signing requests, or
                acknowledgments pending your confirmation.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Workflow automation</span>
            <span className="text-blue-600 font-medium">Clear</span>
          </div>
        </div>

        {/* Section 4: Upcoming Deadlines */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Upcoming Tax Deadlines
                  </h3>
                  <p className="text-xs text-slate-500">
                    Important statutory filing dates
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Calendar
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Monthly GSTR-3B Filing
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Applicable for registered GST businesses
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  20th of every month
                </span>
              </div>

              <div className="flex items-start justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Advance Tax Installment (Q4)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Final installment for eligible taxpayers
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  15th March
                </span>
              </div>

              <div className="flex items-start justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Annual ITR Verification
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Standard individual assessment cycle
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  31st July
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
            Automated reminders will be delivered prior to each due date.
          </div>
        </div>
      </div>
    </div>
  );
}
