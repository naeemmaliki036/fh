"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface OtpEntryFormProps {
  devOtp: string | null;
  isPending: boolean;
  error: string | null;
  onSubmit: (code: string) => void;
  onResend: () => void;
  isResendPending: boolean;
}

export function OtpEntryForm({
  devOtp,
  isPending,
  error,
  onSubmit,
  onResend,
  isResendPending,
}: OtpEntryFormProps): React.ReactElement {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [seconds, setSeconds] = useState(60);
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null));

  // Countdown
  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const handleResend = useCallback((): void => {
    setSeconds(60);
    setDigits(Array(6).fill(""));
    onResend();
  }, [onResend]);

  const focusNext = useCallback((idx: number): void => {
    if (idx < 5) inputRefs.current[idx + 1]?.focus();
  }, []);

  const handleChange = useCallback(
    (idx: number, val: string): void => {
      const digit = val.replace(/\D/g, "").slice(-1);
      const next = [...digits];
      next[idx] = digit;
      setDigits(next);
      if (digit) focusNext(idx);
    },
    [digits, focusNext],
  );

  const handleKeyDown = useCallback(
    (idx: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === "Backspace" && !digits[idx] && idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    },
    [digits],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>): void => {
      e.preventDefault();
      const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      const next = Array(6).fill("");
      for (let i = 0; i < text.length; i++) next[i] = text[i];
      setDigits(next);
      const focusIdx = Math.min(text.length, 5);
      inputRefs.current[focusIdx]?.focus();
    },
    [],
  );

  const code = digits.join("");

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (code.length === 6) onSubmit(code);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {devOtp && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800">
          Dev OTP: <span className="font-black tracking-widest">{devOtp}</span>
        </div>
      )}

      <div className="flex gap-2 justify-center">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className="h-12 w-10 rounded-xl border border-slate-200 text-center text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending || code.length < 6}
        className="w-full rounded-xl bg-teal-600 py-3 text-sm font-black text-white hover:bg-teal-700 transition disabled:opacity-60"
      >
        {isPending ? "Verifying..." : "Verify code"}
      </button>

      <div className="text-center text-sm text-slate-500">
        {seconds > 0 ? (
          <span>Resend in {seconds}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResendPending}
            className="text-teal-600 font-semibold hover:underline disabled:opacity-60"
          >
            Resend OTP
          </button>
        )}
      </div>
    </form>
  );
}
