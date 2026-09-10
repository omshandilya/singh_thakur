"use client";

import Link from "next/link";
import { useState } from "react";
import { forgotPassword } from "@/lib/api/auth";
import "@/app/auth.css";

const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color: "#86efac"}}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink: 0}}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  // Dev-only: expose reset token directly if returned
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError("Please enter your email address."); return; }

    setIsLoading(true);
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      if (res.reset_token) setDevToken(res.reset_token);
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-logo">S&amp;T</div>
          <div className="auth-brand-text">
            <span className="auth-brand-name">Singh &amp; Thakur Associates</span>
            <span className="auth-brand-sub">CA Practice Portal</span>
          </div>
        </div>

        {submitted ? (
          /* ── Success state ── */
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
              <CheckCircleIcon />
            </div>
            <h1 className="auth-title" style={{ textAlign: "center" }}>Check your inbox</h1>
            <p className="auth-subtitle" style={{ textAlign: "center" }}>
              If an account exists for <strong style={{ color: "#c7d2fe" }}>{email}</strong>,
              a password reset link has been sent.
            </p>

            {devToken && (
              <div
                className="auth-alert success"
                style={{ textAlign: "left", wordBreak: "break-all", marginBottom: "1rem" }}
              >
                <span style={{ fontSize: "0.75rem" }}>
                  <strong>Dev token:</strong> {devToken}
                  <br />
                  <Link
                    href={`/reset-password?token=${devToken}`}
                    className="auth-link"
                    id="forgot-use-token-link"
                  >
                    → Use this token to reset password
                  </Link>
                </span>
              </div>
            )}

            <Link href="/login" className="auth-btn auth-btn-primary" id="forgot-back-to-login" style={{ textDecoration: "none", marginTop: "0.5rem", display: "flex" }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <h1 className="auth-title">Forgot password?</h1>
            <p className="auth-subtitle">
              Enter your registered email and we&apos;ll send you a secure reset link.
            </p>

            {error && (
              <div className="auth-alert danger" style={{ marginBottom: "1rem" }}>
                <AlertIcon />
                {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate id="forgot-password-form">
              <div className="auth-field">
                <label className="auth-label" htmlFor="forgot-email">Email Address</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><EmailIcon /></span>
                  <input
                    id="forgot-email"
                    type="email"
                    className={`auth-input${error ? " error" : ""}`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                id="forgot-submit-btn"
                className="auth-btn auth-btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="btn-spinner" />
                    Sending link…
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

            <div className="auth-footer">
              <Link href="/login" className="auth-link" id="forgot-back-link" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <ArrowLeftIcon /> Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
