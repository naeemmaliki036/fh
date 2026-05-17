"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { PORTAL_BRAND_NAME } from "@/lib/portal-brand";
import { useAuthDialog } from "@/lib/auth-dialog-context";
import { useRequestOtp, useVerifyOtp } from "@/hooks/mutations/useConsumerAuth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { OtpEntryForm } from "@/components/auth/OtpEntryForm";
import { isValidPhone, sanitizePhone } from "@/lib/phone";
import { cn } from "@/lib/cn";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputCls =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400";

interface SignupFields {
  fullName: string;
  phone: string;
}

interface FieldErrors {
  fullName?: string;
  email?: string;
  phone?: string;
}

function TabBar({
  mode,
  onSwitch,
}: {
  mode: "login" | "signup";
  onSwitch: (m: "login" | "signup") => void;
}): React.ReactElement {
  return (
    <div className="flex border-b border-slate-100">
      {(["login", "signup"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onSwitch(m)}
          className={cn(
            "flex-1 py-3 text-sm font-bold transition",
            mode === m
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          {m === "login" ? "Sign in" : "Create account"}
        </button>
      ))}
    </div>
  );
}

export function LoginDialog(): React.ReactElement | null {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, mode, reason, redirectAfter, onSuccess, close, switchMode } = useAuthDialog();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [signup, setSignup] = useState<SignupFields>({ fullName: "", phone: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [step, setStep] = useState<"email" | "otp">("email");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  const requestMut = useRequestOtp();
  const verifyMut = useVerifyOtp();

  // Auto-close on route change
  useEffect(() => {
    if (isOpen) close();
    // Only run on pathname change, not on isOpen change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ESC key closes the dialog
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  // Reset OTP step when mode switches (preserve email)
  const handleSwitchMode = useCallback(
    (m: "login" | "signup"): void => {
      switchMode(m);
      setStep("email");
      setDevOtp(null);
      setOtpError(null);
      setEmailError("");
      setFieldErrors({});
    },
    [switchMode],
  );

  // Reset all state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep("email");
      setDevOtp(null);
      setOtpError(null);
      setEmailError("");
      setFieldErrors({});
      setSignup({ fullName: "", phone: "" });
    }
  }, [isOpen]);

  function validateSignup(): boolean {
    const e: FieldErrors = {};
    if (signup.fullName.trim().length < 2) e.fullName = "Name required";
    if (!EMAIL_RE.test(email)) e.email = "Valid email required";
    if (signup.phone && !isValidPhone(signup.phone)) e.phone = "Invalid phone number";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleEmailSubmit(ev: React.FormEvent): void {
    ev.preventDefault();
    if (mode === "signup") {
      if (!validateSignup()) return;
    } else {
      if (!EMAIL_RE.test(email)) { setEmailError("Enter a valid email"); return; }
      setEmailError("");
    }
    requestMut.mutate(
      { email },
      {
        onSuccess: (data) => { setDevOtp(data.dev_otp); setStep("otp"); },
        onError: (err: Error) => {
          const msg = err.message ?? "";
          const text = msg.includes("429") ? "Too many requests. Wait a minute." : "Failed to send OTP. Try again.";
          if (mode === "signup") setFieldErrors((fe) => ({ ...fe, email: text }));
          else setEmailError(text);
        },
      },
    );
  }

  function handleOtpSubmit(code: string): void {
    setOtpError(null);
    const payload =
      mode === "signup"
        ? { email, code, full_name: signup.fullName.trim(), phone: signup.phone || undefined }
        : { email, code };

    verifyMut.mutate(payload, {
      onSuccess: () => {
        onSuccess?.();
        if (redirectAfter) router.push(redirectAfter);
        close();
      },
      onError: () => { setOtpError("Invalid code. Please try again."); },
    });
  }

  if (!isOpen) return null;

  const heading = mode === "login" ? "Welcome back" : "Create your account";
  const footerPrompt =
    mode === "login" ? "New here?" : "Already have an account?";
  const footerAction = mode === "login" ? "signup" : "login";
  const footerLabel = mode === "login" ? "Create an account" : "Sign in";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      role="dialog"
      aria-modal="true"
      aria-label={heading}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand wordmark */}
        <div className="pt-8 pb-0 px-8 text-center">
          <span className="text-base font-black text-teal-600">{PORTAL_BRAND_NAME}</span>
        </div>

        {/* Tabs */}
        <div className="mt-4 px-0">
          <TabBar mode={mode} onSwitch={handleSwitchMode} />
        </div>

        <div className="px-8 pt-6 pb-8 space-y-5">
          {reason && (
            <p className="text-xs text-slate-500 text-center">{reason}</p>
          )}

          <h2 className="text-xl font-black text-slate-900 text-center">{heading}</h2>

          {step === "email" ? (
            <>
              <GoogleSignInButton />
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400">or</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {mode === "signup" && (
                  <>
                    <div>
                      <input
                        value={signup.fullName}
                        onChange={(e) => setSignup((s) => ({ ...s, fullName: e.target.value }))}
                        placeholder="Full name *"
                        className={inputCls}
                        autoFocus
                      />
                      {fieldErrors.fullName && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.fullName}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="tel"
                        value={signup.phone}
                        onChange={(e) => setSignup((s) => ({ ...s, phone: sanitizePhone(e.target.value) }))}
                        placeholder="+971 50 000 0000"
                        className={inputCls}
                      />
                      {fieldErrors.phone && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    autoFocus={mode === "login"}
                    className={inputCls}
                  />
                  {(emailError || fieldErrors.email) && (
                    <p className="text-xs text-red-500 mt-1">{emailError || fieldErrors.email}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={requestMut.isPending}
                  className="w-full rounded-xl bg-teal-600 py-3 text-sm font-black text-white hover:bg-teal-700 transition disabled:opacity-60"
                >
                  {requestMut.isPending ? "Sending..." : "Continue with email"}
                </button>
              </form>
            </>
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

          <p className="text-center text-sm text-slate-500">
            {footerPrompt}{" "}
            <button
              type="button"
              onClick={() => handleSwitchMode(footerAction)}
              className="text-teal-600 font-semibold hover:underline"
            >
              {footerLabel}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
