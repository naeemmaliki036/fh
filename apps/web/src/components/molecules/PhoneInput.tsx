"use client";

import { forwardRef, useRef, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { sanitizePhone, isValidPhone } from "@/lib/utils/phone";

export interface PhoneInputProps {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  id?: string;
  className?: string;
  /** Optional inline error to display below the input */
  error?: string;
}

// Keys that are always allowed regardless of character set
const NAV_KEYS = new Set([
  "Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab",
  "Home", "End", "Enter",
]);

// Characters allowed in a phone number
const ALLOWED_CHARS = new Set([..."0123456789+-() "]);

function isAllowedKey(e: React.KeyboardEvent<HTMLInputElement>): boolean {
  if (NAV_KEYS.has(e.key)) return true;
  if (e.ctrlKey || e.metaKey) return true; // allow copy/paste shortcuts
  if (e.key.length !== 1) return true; // function keys, etc.
  if (!ALLOWED_CHARS.has(e.key)) return false;
  // "+" is only allowed at position 0
  if (e.key === "+") {
    const input = e.currentTarget;
    return input.selectionStart === 0 && input.selectionEnd === 0;
  }
  return true;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    { value, onChange, required, placeholder = "+971 50 123 4567", id, className, error },
    _ref,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (!isAllowedKey(e)) {
          e.preventDefault();
        }
      },
      [],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>): void => {
        onChange(sanitizePhone(e.target.value));
      },
      [onChange],
    );

    const handlePaste = useCallback(
      (e: React.ClipboardEvent<HTMLInputElement>): void => {
        e.preventDefault();
        const raw = e.clipboardData.getData("text");
        const sanitized = sanitizePhone(raw);
        // Insert at cursor position within current value
        const input = inputRef.current ?? e.currentTarget;
        const start = input.selectionStart ?? value.length;
        const end = input.selectionEnd ?? value.length;
        const next = sanitizePhone(value.slice(0, start) + sanitized + value.slice(end));
        onChange(next);
      },
      [onChange, value],
    );

    const showInlineError = value.length > 0 && !isValidPhone(value);
    const displayError = error ?? (showInlineError ? "Invalid phone number" : undefined);

    return (
      <div className="w-full">
        <input
          ref={(node) => {
            // Merge forwarded ref (unused externally but kept for composability) and local ref
            (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            if (typeof _ref === "function") _ref(node);
            else if (_ref) (_ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
          }}
          id={id}
          type="tel"
          inputMode="tel"
          value={value}
          required={required}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          onPaste={handlePaste}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            displayError && "border-destructive focus-visible:ring-destructive",
            className,
          )}
        />
        {displayError && (
          <p className="mt-1 text-xs text-destructive">{displayError}</p>
        )}
      </div>
    );
  },
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
