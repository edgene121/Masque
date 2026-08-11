"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatErrorForUser } from "@memberstack/dom";
import { HelpCircle, Mail } from "lucide-react";
import { getMemberstack } from "@/lib/memberstack";

type ForgotStep = "request" | "verify";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function friendlyResetError(err: unknown): string {
  const raw = formatErrorForUser(err) || "";
  const lower = raw.toLowerCase();

  if (lower.includes("invalid-reset-code") || lower.includes("reset code")) {
    return "That code is invalid or has expired. Please request a new one.";
  }
  if (lower.includes("password-too-short") || lower.includes("too short")) {
    return "Password must be at least 8 characters.";
  }
  if (lower.includes("invalid-password")) {
    return "Please choose a stronger password (at least 8 characters).";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }
  if (lower.includes("not found") || lower.includes("no member")) {
    return "We couldn't find an account with that email.";
  }

  return raw || "Something went wrong. Please try again.";
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<ForgotStep>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmitRequest = useMemo(() => {
    return isValidEmail(email.trim()) && !isLoading;
  }, [email, isLoading]);

  const canSubmitReset = useMemo(() => {
    const token = code.trim();
    return (
      /^\d{6}$/.test(token) && newPassword.trim().length >= 8 && !isLoading
    );
  }, [code, newPassword, isLoading]);

  const handleRequestReset = async (event: FormEvent) => {
    event.preventDefault();
    if (isLoading) return;

    const trimmedEmail = email.trim();
    setError(null);

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const memberstack = getMemberstack();
      await memberstack.sendMemberResetPasswordEmail({
        email: trimmedEmail,
      });
      setEmail(trimmedEmail);
      setStep("verify");
    } catch (err) {
      setError(friendlyResetError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteReset = async (event: FormEvent) => {
    event.preventDefault();
    if (isLoading) return;

    setError(null);

    const token = code.trim();
    const password = newPassword;

    if (!/^\d{6}$/.test(token)) {
      setError("Please enter the 6-digit code from your email.");
      return;
    }

    if (password.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const memberstack = getMemberstack();
      const { data } = await memberstack.resetMemberPassword({
        token,
        newPassword: password,
      });

      if (data && "success" in data && data.success === false) {
        setError("Unable to reset password. Please try again.");
        return;
      }

      router.replace(
        "/login?reset=success&message=" +
          encodeURIComponent(
            "Password reset successfully. Please sign in with your new password.",
          ),
      );
    } catch (err) {
      setError(friendlyResetError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-page__bg" aria-hidden="true" />

      <div className="forgot-password-page__center">
        <div className="forgot-password-card">
          {step === "request" ? (
            <>
              <div className="forgot-password-card__icon" aria-hidden="true">
                <HelpCircle className="forgot-password-card__icon-svg" strokeWidth={2} />
              </div>

              <h1 className="forgot-password-card__title">Forgot password?</h1>
              <p className="forgot-password-card__subtitle">
                No worries, we&apos;ll send you reset instructions.
              </p>

              <form
                className="forgot-password-form"
                onSubmit={handleRequestReset}
                noValidate
              >
                <div className="forgot-password-form__field">
                  <label htmlFor="forgot-email">Email</label>
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="e.g. howard.thurman@gmail.com"
                    value={email}
                    disabled={isLoading}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {error ? (
                  <p className="forgot-password-form__error" role="alert">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="forgot-password-form__submit"
                  disabled={!canSubmitRequest}
                >
                  {isLoading ? "Sending…" : "Reset password"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="forgot-password-card__icon" aria-hidden="true">
                <Mail className="forgot-password-card__icon-svg" strokeWidth={2} />
              </div>

              <h1 className="forgot-password-card__title">Check your email</h1>
              <p className="forgot-password-card__subtitle">
                Please enter your 6-digit code. Then create and confirm your new
                password.
              </p>

              <form
                className="forgot-password-form"
                onSubmit={handleCompleteReset}
                noValidate
              >
                <div className="forgot-password-form__field">
                  <label htmlFor="forgot-code">6-digit code</label>
                  <input
                    id="forgot-code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    disabled={isLoading}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                  />
                </div>

                <div className="forgot-password-form__field">
                  <label htmlFor="forgot-new-password">New Password</label>
                  <input
                    id="forgot-new-password"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    disabled={isLoading}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <p className="forgot-password-form__hint">
                    Must be at least 8 characters.
                  </p>
                </div>

                {error ? (
                  <p className="forgot-password-form__error" role="alert">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="forgot-password-form__submit"
                  disabled={!canSubmitReset}
                >
                  {isLoading ? "Resetting…" : "Reset password"}
                </button>
              </form>
            </>
          )}

          <Link href="/login" className="forgot-password-card__back">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
