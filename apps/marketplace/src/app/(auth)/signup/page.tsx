"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PORTAL_BRAND_NAME } from "@/lib/portal-brand";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { OtpEntryForm } from "@/components/auth/OtpEntryForm";
import { useRequestOtp, useVerifyOtp } from "@/hooks/mutations/useConsumerAuth";
import { isValidPhone, sanitizePhone } from "@/lib/phone";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputCls =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400";

interface DetailsForm {
  fullName: string;
  email: string;
  phone: string;
}
type DetailsErrors = Partial<DetailsForm>;

export default function SignupPage(): React.ReactElement {
  const router = useRouter();
  const [form, setForm] = useState<DetailsForm>({ fullName: "", email: "", phone: "" });
  const [errors, setErrors] = useState<DetailsErrors>({});
  const [step, setStep] = useState<"details" | "otp">("details");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  const requestMut = useRequestOtp();
  const verifyMut = useVerifyOtp();

  function validate(): boolean {
    const e: DetailsErrors = {};
    if (form.fullName.trim().length < 2) e.fullName = "Name required";
    if (!EMAIL_RE.test(form.email)) e.email = "Valid email required";
    if (form.phone && !isValidPhone(form.phone)) e.phone = "Invalid phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleDetailsSubmit(ev: React.FormEvent): void {
    ev.preventDefault();
    if (!validate()) return;
    requestMut.mutate(
      { email: form.email },
      {
        onSuccess: (data) => { setDevOtp(data.dev_otp); setStep("otp"); },
        onError: (err: Error) => {
          const msg = err.message ?? "";
          if (msg.includes("429")) setErrors((e) => ({ ...e, email: "Too many requests. Wait a minute." }));
          else setErrors((e) => ({ ...e, email: "Failed to send OTP. Try again." }));
        },
      },
    );
  }

  function handleOtpSubmit(code: string): void {
    setOtpError(null);
    verifyMut.mutate(
      {
        email: form.email,
        code,
        full_name: form.fullName.trim(),
        phone: form.phone || undefined,
      },
      {
        onSuccess: () => { router.replace("/me"); },
        onError: () => { setOtpError("Invalid code. Please try again."); },
      },
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <Link href="/" className="text-lg font-black text-teal-600">{PORTAL_BRAND_NAME}</Link>
          <h1 className="text-2xl font-black text-slate-900">Create account</h1>
          <p className="text-sm text-slate-500">Post, save and track properties</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <GoogleSignInButton />
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {step === "details" ? (
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="Full name *"
                  className={inputCls}
                  autoFocus
                />
                {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Email *"
                  className={inputCls}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: sanitizePhone(e.target.value) }))}
                  placeholder="+971 50 000 0000"
                  className={inputCls}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
              <button
                type="submit"
                disabled={requestMut.isPending}
                className="w-full rounded-xl bg-teal-600 py-3 text-sm font-black text-white hover:bg-teal-700 transition disabled:opacity-60"
              >
                {requestMut.isPending ? "Sending..." : "Send verification code"}
              </button>
            </form>
          ) : (
            <OtpEntryForm
              devOtp={devOtp}
              isPending={verifyMut.isPending}
              error={otpError}
              onSubmit={handleOtpSubmit}
              onResend={() => requestMut.mutate({ email: form.email })}
              isResendPending={requestMut.isPending}
            />
          )}
        </div>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-teal-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
