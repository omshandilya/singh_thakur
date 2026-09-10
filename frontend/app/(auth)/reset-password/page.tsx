"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "@/lib/api/auth";
import "@/app/auth.css";

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"#86efac"}}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/** Password strength: 0-4 */
function calcStrength(pw: string): number {
  if (pw.length < 6) return 0;
  let score = 1;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_CLASSES = ["", "weak", "fair", "good", "strong"];

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const strength = calcStrength(password);

  // After success, count down and redirect
  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) { router.push("/login"); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [success, countdown, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) { setError("Reset token is missing. Please use the link from your email."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (strength < 2) { setError("Please choose a stronger password."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setIsLoading(true);
    try {
      await resetPassword({ token, new_password: password });
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Reset token is invalid or has expired. Please request a new link.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
          <CheckCircleIcon />
        </div>
        <h1 className="auth-title" style={{ textAlign: "center" }}>Password updated!</h1>
        <p className="auth-subtitle" style={{ textAlign: "center" }}>
          Your password has been changed successfully. Redirecting to login in{" "}
          <strong style={{ color: "#c7d2fe" }}>{countdown}s</strong>…
        </p>
        <Link
          href="/login"
          className="auth-btn auth-btn-primary"
          id="reset-go-to-login"
          style={{ textDecoration: "none", display: "flex", marginTop: "0.5rem" }}
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="auth-title">Set new password</h1>
      <p className="auth-subtitle">
        Choose a strong, unique password for your account.
      </p>

      {!token && (
        <div className="auth-alert danger" style={{ marginBottom: "1rem" }}>
          <AlertIcon />
          No reset token found. Please use the link sent to your email.
        </div>
      )}

      {error && (
        <div className="auth-alert danger" style={{ marginBottom: "1rem" }}>
          <AlertIcon />
          {error}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate id="reset-password-form">
        {/* New password */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="reset-password">New Password</label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon"><LockIcon /></span>
            <input
              id="reset-password"
              type={showPw ? "text" : "password"}
              className="auth-input"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              autoComplete="new-password"
              disabled={isLoading}
              style={{ paddingRight: "2.75rem" }}
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowPw(v => !v)} id="reset-toggle-pw">
              {showPw ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {/* Strength bars */}
          {password.length > 0 && (
            <>
              <div className="pw-strength">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`pw-bar ${i <= strength ? STRENGTH_CLASSES[strength] : ""}`} />
                ))}
              </div>
              <span style={{ fontSize: "0.72rem", color: strength >= 3 ? "#86efac" : "#fbbf24" }}>
                {STRENGTH_LABELS[strength]}
              </span>
            </>
          )}
        </div>

        {/* Confirm password */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="reset-confirm">Confirm Password</label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon"><LockIcon /></span>
            <input
              id="reset-confirm"
              type={showConfirm ? "text" : "password"}
              className={`auth-input ${confirm && confirm !== password ? "error" : ""}`}
              placeholder="Repeat your new password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(null); }}
              autoComplete="new-password"
              disabled={isLoading}
              style={{ paddingRight: "2.75rem" }}
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm(v => !v)} id="reset-toggle-confirm">
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {confirm && confirm !== password && (
            <span className="auth-error">Passwords do not match</span>
          )}
        </div>

        <button
          type="submit"
          id="reset-submit-btn"
          className="auth-btn auth-btn-primary"
          disabled={isLoading || !token}
        >
          {isLoading ? (
            <>
              <span className="btn-spinner" />
              Updating password…
            </>
          ) : (
            "Set New Password"
          )}
        </button>
      </form>

      <div className="auth-footer">
        Remember it?{" "}
        <Link href="/login" className="auth-link" id="reset-back-link">
          Back to Sign In
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-logo">S&amp;T</div>
          <div className="auth-brand-text">
            <span className="auth-brand-name">Singh &amp; Thakur Associates</span>
            <span className="auth-brand-sub">CA Practice Portal</span>
          </div>
        </div>
        <Suspense fallback={<div className="auth-spinner" style={{ margin: "2rem auto" }} />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
