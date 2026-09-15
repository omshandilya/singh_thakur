"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  User,
  Building2,
  MapPin,
  FileBadge,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Info,
} from "lucide-react";
import {
  getMyClientProfile,
  updateMyClientProfile,
  type ClientProfile,
  type ClientType,
  type ClientUpdatePayload,
} from "@/lib/api/clients";
import { useAuth } from "@/context/AuthContext";

export default function ClientProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    client_type: ClientType;
    company_name: string;
    pan: string;
    gstin: string;
    phone: string;
    email: string;
    address: string;
  }>({
    name: "",
    client_type: "INDIVIDUAL",
    company_name: "",
    pan: "",
    gstin: "",
    phone: "",
    email: "",
    address: "",
  });

  // Inline field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await getMyClientProfile();
        setProfile(data);
        setFormData({
          name: data.name || "",
          client_type: data.client_type || "INDIVIDUAL",
          company_name: data.company_name || "",
          pan: data.pan || "",
          gstin: data.gstin || "",
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
        });
      } catch (err: unknown) {
        console.error("Failed to load profile:", err);
        setErrorMessage("Unable to fetch client profile from server.");
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "pan" || name === "gstin" ? value.toUpperCase() : value,
    }));
    // Clear inline error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Full Name is required.";
    }

    // PAN validation if provided
    if (formData.pan.trim()) {
      const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panPattern.test(formData.pan.trim())) {
        errors.pan = "PAN must be 10 characters in standard format (e.g., ABCDE1234F).";
      }
    }

    // GSTIN validation if provided
    if (formData.gstin.trim()) {
      const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinPattern.test(formData.gstin.trim())) {
        errors.gstin = "GSTIN must be 15 characters (e.g., 22AAAAA0000A1Z5).";
      }
    }

    // If business, company name is recommended
    if (formData.client_type === "BUSINESS" && !formData.company_name.trim()) {
      errors.company_name = "Company / Firm name is required for Business profiles.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      const payload: ClientUpdatePayload = {
        name: formData.name.trim(),
        client_type: formData.client_type,
        company_name: formData.company_name.trim() || null,
        pan: formData.pan.trim() ? formData.pan.trim().toUpperCase() : null,
        gstin: formData.gstin.trim() ? formData.gstin.trim().toUpperCase() : null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
      };

      const updated = await updateMyClientProfile(payload);
      setProfile(updated);
      setSuccessMessage("Client profile has been updated successfully.");
      await refreshUser();
    } catch (err: unknown) {
      console.error("Failed to update profile:", err);
      let detailMsg = "Failed to update profile. Please verify your details.";
      if (axios.isAxiosError(err) && err.response?.data) {
        const responseData = err.response.data as {
          detail?: unknown;
          message?: string;
        };
        if (Array.isArray(responseData.detail)) {
          detailMsg = responseData.detail
            .map((item) => (typeof item === "object" && item && "msg" in item ? String(item.msg) : JSON.stringify(item)))
            .join(", ");
        } else if (typeof responseData.detail === "string") {
          detailMsg = responseData.detail;
        } else if (responseData.message) {
          detailMsg = responseData.message;
        }
      }
      setErrorMessage(detailMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (!profile) return;
    setFormData({
      name: profile.name || "",
      client_type: profile.client_type || "INDIVIDUAL",
      company_name: profile.company_name || "",
      pan: profile.pan || "",
      gstin: profile.gstin || "",
      phone: profile.phone || "",
      email: profile.email || "",
      address: profile.address || "",
    });
    setFieldErrors({});
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600 font-medium">
          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          <span>Loading your profile details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ─── Page Title ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Client Profile
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your legal tax identity, business details, and official contact information.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Data Protected & Encrypted</span>
        </div>
      </div>

      {/* ─── Notification Banners ────────────────────────────────────────────── */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3 animate-in fade-in duration-300">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ─── Profile Edit Form ────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Classification Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              Client Classification
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select whether you are filing as an individual taxpayer or representing a business entity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`cursor-pointer rounded-xl border p-4 flex items-start gap-3.5 transition-all ${
                formData.client_type === "INDIVIDUAL"
                  ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <input
                type="radio"
                name="client_type"
                value="INDIVIDUAL"
                checked={formData.client_type === "INDIVIDUAL"}
                onChange={handleChange}
                className="mt-1 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-700" />
                  <span className="text-sm font-bold text-slate-900">
                    Individual
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  For salaried professionals, consultants, HUF, or individual tax filers.
                </p>
              </div>
            </label>

            <label
              className={`cursor-pointer rounded-xl border p-4 flex items-start gap-3.5 transition-all ${
                formData.client_type === "BUSINESS"
                  ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <input
                type="radio"
                name="client_type"
                value="BUSINESS"
                checked={formData.client_type === "BUSINESS"}
                onChange={handleChange}
                className="mt-1 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-700" />
                  <span className="text-sm font-bold text-slate-900">
                    Business / Entity
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  For Private Limited, LLP, Partnership firms, Proprietorship, or Trusts.
                </p>
              </div>
            </label>
          </div>

          {formData.client_type === "BUSINESS" && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Company / Firm Legal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="e.g., Apex Financial Solutions Pvt. Ltd."
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.company_name
                    ? "border-rose-300 bg-rose-50/30 focus:ring-rose-400"
                    : "border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
                }`}
              />
              {fieldErrors.company_name && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.company_name}</p>
              )}
            </div>
          )}
        </div>

        {/* Identity & Tax Information Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileBadge className="w-4 h-4 text-amber-600" />
              Tax Identification & Registration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official Indian tax identifiers used for ITR filings and GST compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name / Authorised Signatory <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Rajesh Kumar"
                required
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.name
                    ? "border-rose-300 bg-rose-50/30 focus:ring-rose-400"
                    : "border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
                }`}
              />
              {fieldErrors.name && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.name}</p>
              )}
            </div>

            {/* Permanent Account Number (PAN) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Permanent Account Number (PAN)
              </label>
              <input
                type="text"
                name="pan"
                value={formData.pan}
                onChange={handleChange}
                maxLength={10}
                placeholder="e.g., ABCDE1234F"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-mono tracking-wider focus:outline-none focus:ring-2 transition-colors uppercase ${
                  fieldErrors.pan
                    ? "border-rose-300 bg-rose-50/30 focus:ring-rose-400"
                    : "border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
                }`}
              />
              {fieldErrors.pan ? (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.pan}</p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">
                  10-character alphanumeric tax ID (5 letters, 4 digits, 1 letter)
                </p>
              )}
            </div>

            {/* GSTIN (Only or emphasized for Business) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Goods and Services Tax Identification Number (GSTIN)
              </label>
              <input
                type="text"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
                maxLength={15}
                placeholder="e.g., 22AAAAA0000A1Z5"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-mono tracking-wider focus:outline-none focus:ring-2 transition-colors uppercase ${
                  fieldErrors.gstin
                    ? "border-rose-300 bg-rose-50/30 focus:ring-rose-400"
                    : "border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
                }`}
              />
              {fieldErrors.gstin ? (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.gstin}</p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">
                  15-digit GST registration identifier (leave blank if not GST-registered)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contact & Address Information Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              Contact & Address
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official mailing address and direct contact channels for notices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g., +91 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Official Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g., client@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-colors"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Registered Address
              </label>
              <textarea
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                placeholder="Full registered address with city, state, and pincode..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-colors resize-y"
              />
            </div>
          </div>
        </div>

        {/* Assigned Advisor Section (Read-Only) */}
        <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Assigned Chartered Accountant / Employee
              </h3>
              <p className="text-xs text-slate-500">
                Designated professional responsible for reviewing your returns and accounts.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
              Read-only
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {profile?.assigned_employee
                  ? profile.assigned_employee.full_name || "Assigned CA Staff"
                  : "Singh & Thakur Senior Partner Desk"}
              </p>
              <p className="text-xs text-slate-500">
                {profile?.assigned_employee
                  ? profile.assigned_employee.email
                  : "Direct partner oversight for all new client onboarding"}
              </p>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Assigned by Office Administrator</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Discard Changes</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition-colors inline-flex items-center gap-2 shadow-sm shadow-amber-500/20 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
