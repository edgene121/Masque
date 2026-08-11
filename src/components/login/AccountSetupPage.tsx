"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { formatErrorForUser } from "@memberstack/dom";
import { Check, HelpCircle, Mail } from "lucide-react";
import { getMemberstack } from "@/lib/memberstack";

type AccountSetupStep = "email" | "verify" | "success";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function friendlySetupError(err: unknown): string {
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
  if (lower.includes("rate") || lower.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return raw || "Something went wrong. Please try again.";
}

export default function AccountSetupPage() {
  const [step, setStep] = useState<AccountSetupStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canContinueEmail = useMemo(() => {
    return isValidEmail(email.trim()) && !isLoading;
  }, [email, isLoading]);

  const canSetPassword = useMemo(() => {
    return (
      /^\d{6}$/.test(code.trim()) &&
      newPassword.trim().length >= 8 &&
      !isLoading
    );
  }, [code, newPassword, isLoading]);

  const handleSendCode = async (event: FormEvent) => {
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
      // Existing Memberstack members only — sends setup/reset verification code.
      // Does not create a new member record.
      const memberstack = getMemberstack();
      await memberstack.sendMemberResetPasswordEmail({
        email: trimmedEmail,
      });
      setEmail(trimmedEmail);
      setCode("");
      setNewPassword("");
      setStep("verify");
    } catch (err) {
      setError(friendlySetupError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (event: FormEvent) => {
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
        setError("Unable to set your password. Please try again.");
        return;
      }

      // Clear sensitive fields from component state after success.
      setCode("");
      setNewPassword("");
      setStep("success");
    } catch (err) {
      setError(friendlySetupError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-page__bg" aria-hidden="true" />

      <div className="forgot-password-page__center">
        <div className="forgot-password-card">
          {step === "email" ? (
            <>
              <div className="forgot-password-card__icon" aria-hidden="true">
                <HelpCircle
                  className="forgot-password-card__icon-svg"
                  strokeWidth={2}
                />
              </div>

              <h1 className="forgot-password-card__title">Set your password</h1>
              <p className="forgot-password-card__subtitle">
                Enter your email and we&apos;ll send you a verification code.
              </p>

              <form
                className="forgot-password-form"
                onSubmit={handleSendCode}
                noValidate
              >
                <div className="forgot-password-form__field">
                  <label htmlFor="setup-email">Email</label>
                  <input
                    id="setup-email"
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
                  disabled={!canContinueEmail}
                >
                  {isLoading ? "Sending…" : "Continue"}
                </button>
              </form>

              <Link href="/login" className="forgot-password-card__back">
                ← Back to login
              </Link>
            </>
          ) : null}

          {step === "verify" ? (
            <>
              <div className="forgot-password-card__icon" aria-hidden="true">
                <Mail
                  className="forgot-password-card__icon-svg"
                  strokeWidth={2}
                />
              </div>

              <h1 className="forgot-password-card__title">Check your email</h1>
              <p className="forgot-password-card__subtitle">
                Please enter your 6-digit code. Then create your new password.
              </p>

              <form
                className="forgot-password-form"
                onSubmit={handleSetPassword}
                noValidate
              >
                <div className="forgot-password-form__field">
                  <label htmlFor="setup-code">6-digit code</label>
                  <input
                    id="setup-code"
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
                  <label htmlFor="setup-new-password">New Password</label>
                  <input
                    id="setup-new-password"
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
                  disabled={!canSetPassword}
                >
                  {isLoading ? "Saving…" : "Set password"}
                </button>
              </form>

              <Link href="/login" className="forgot-password-card__back">
                ← Back to login
              </Link>
            </>
          ) : null}

          {step === "success" ? (
            <>
              <div
                className="forgot-password-card__icon forgot-password-card__icon--success"
                aria-hidden="true"
              >
                <Check
                  className="forgot-password-card__icon-svg forgot-password-card__icon-svg--success"
                  strokeWidth={3}
                />
              </div>

              <h1 className="forgot-password-card__title">
                Account setup complete
              </h1>
              <p className="forgot-password-card__subtitle">
                Your password has been successfully created.
                <br />
                Click below to log in.
              </p>

              <Link
                href="/login"
                className="forgot-password-form__submit forgot-password-form__submit--link"
              >
                Back to login
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
