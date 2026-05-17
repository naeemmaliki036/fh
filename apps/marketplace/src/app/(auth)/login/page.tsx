"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PORTAL_BRAND_NAME } from "@/lib/portal-brand";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { OtpEntryForm } from "@/components/auth/OtpEntryForm";
import { useRequestOtp, useVerifyOtp } from "@/hooks/mutations/useConsumerAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputCls =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400";

function LoginContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/me";

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  const requestMut = useRequestOtp();
  const verifyMut = useVerifyOtp();

  function handleEmailSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) { setEmailError("Enter a valid email"); return; }
    setEmailError("");
    requestMut.mutate(
      { email },
      {
        onSuccess: (data) => { setDevOtp(data.dev_otp); setStep("otp"); },
        onError: (err: Error) => {
          const msg = err.message ?? "";
          if (msg.includes("429")) setEmailError("Too many requests. Wait a minute.");
          else setEmailError("Failed to send OTP. Try again.");
        },
      },
    );
  }

  function handleOtpSubmit(code: string): void {
    setOtpError(null);
    verifyMut.mutate(
      { email, code },
      {
        onSuccess: () => { router.replace(next); },
        onError: () => { setOtpError("Invalid code. Please try again."); },
      },
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <Link href="/" className="text-lg font-black text-teal-600">{PORTAL_BRAND_NAME}</Link>
          <h1 className="text-2xl font-black text-slate-900">Sign in</h1>
          <p className="text-sm text-slate-500">Enter your email to continue</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <GoogleSignInButton />
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className={inputCls}
                  autoFocus
                />
                {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
              </div>
              <button
                type="submit"
                disabled={requestMut.isPending}
                className="w-full rounded-xl bg-teal-600 py-3 text-sm font-black text-white hover:bg-teal-700 transition disabled:opacity-60"
              >
                {requestMut.isPending ? "Sending..." : "Continue with email"}
              </button>
            </form>
          ) : (
            <OtpEntryForm
              devOtp={devOtp}
              isPending={verifyMut.isPending}
              error={otpError}
              onSubmit={handleOtpSubmit}
              onResend={() => requestMut.mutate({ email })}
              isResendPending={requestMut.isPending}
            />
          )}
        </div>

        <p className="text-center text-sm text-slate-500">
          New here?{" "}
          <Link href="/signup" className="text-teal-600 font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage(): React.ReactElement {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
