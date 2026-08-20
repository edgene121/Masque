"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatErrorForUser } from "@memberstack/dom";
import { Eye, EyeOff, Info } from "lucide-react";
import { getMemberstack } from "@/lib/memberstack";
import { getPostLoginPath } from "@/lib/login/safe-next-path";
import type { SignInFormProps, SignInFormState } from "@/types/login";

export default function SignInForm({ onForgotPassword }: SignInFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<SignInFormState>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    setError(null);

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setIsLoading(true);

    try {
      const memberstack = getMemberstack();
      const { data } = await memberstack.loginMemberEmailPassword({
        email,
        password,
      });

      if (!data?.member) {
        setError("Login failed. Please check your email and password.");
        return;
      }

      router.push(getPostLoginPath(searchParams.get("next")));
    } catch (err) {
      setError(
        formatErrorForUser(err) ||
          "Login failed. Please check your email and password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] font-bold leading-tight text-white md:text-[32px]">
          Welcome back
        </h1>
        <p className="mt-2 max-w-[34rem] text-[14px] leading-relaxed text-[#d8d4cc] md:text-[15px]">
          Sign in to access your membership, upcoming events, Dispatches, and
          exclusive member content.
        </p>
      </div>

      <div className="rounded-[16px] border border-white/30 bg-transparent p-4 md:rounded-[18px] md:p-5">
        <div className="approved-notice-header">
          <Info
            className="approved-info-icon"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-[#b9965b] md:text-base">
              Already an Approved Member?
            </h2>
            <div className="mt-2 space-y-3 text-[13px] leading-relaxed text-[#e8e4dc] md:text-[14px]">
              <p>
                If your Masqué membership has already been approved, you already
                have access to the Member Portal.
              </p>
              <p>
                If this is your first time logging in or you don&apos;t know your
                password, click{" "}
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="font-medium text-[#c5a568] underline-offset-2 hover:underline"
                >
                  “Forgot Password?”
                </button>{" "}
                and use the email address associated with your membership to set
                your password and access your account.
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-[#f7f5f0]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isLoading}
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            className="h-[44px] w-full rounded-[10px] border border-transparent bg-[#e8eef2] px-3.5 text-[15px] text-[#1a1410] outline-none placeholder:text-[#7a8490] focus:border-[#b9965b] focus:ring-2 focus:ring-[#b9965b]/35 disabled:opacity-70"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-[#f7f5f0]"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              disabled={isLoading}
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              className="h-[44px] w-full rounded-[10px] border border-transparent bg-[#e8eef2] px-3.5 pr-11 text-[15px] text-[#1a1410] outline-none placeholder:text-[#7a8490] focus:border-[#b9965b] focus:ring-2 focus:ring-[#b9965b]/35 disabled:opacity-70"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a6169] hover:text-[#1a1410] disabled:opacity-70"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-[#e8dfcf] hover:text-[#c5a568]"
          >
            Forgot Password?
          </button>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-[10px] border border-white/70 bg-[#b9965b] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c5a568] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </form>
    </div>
  );
}
