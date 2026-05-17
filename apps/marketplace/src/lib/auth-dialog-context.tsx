"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface OpenOptions {
  mode?: "login" | "signup";
  reason?: string;
  onSuccess?: () => void;
  redirectAfter?: string;
}

interface AuthDialogContextValue {
  isOpen: boolean;
  mode: "login" | "signup";
  reason: string | undefined;
  redirectAfter: string | undefined;
  onSuccess: (() => void) | undefined;
  open: (opts?: OpenOptions) => void;
  close: () => void;
  switchMode: (mode: "login" | "signup") => void;
}

const AuthDialogContext = createContext<AuthDialogContextValue>({
  isOpen: false,
  mode: "login",
  reason: undefined,
  redirectAfter: undefined,
  onSuccess: undefined,
  open: () => undefined,
  close: () => undefined,
  switchMode: () => undefined,
});

export function AuthDialogProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [reason, setReason] = useState<string | undefined>(undefined);
  const [redirectAfter, setRedirectAfter] = useState<string | undefined>(undefined);
  const [onSuccess, setOnSuccess] = useState<(() => void) | undefined>(undefined);

  const open = useCallback((opts?: OpenOptions): void => {
    setMode(opts?.mode ?? "login");
    setReason(opts?.reason);
    setRedirectAfter(opts?.redirectAfter);
    // Use setter function form to avoid stale closure issues with function state
    setOnSuccess(() => opts?.onSuccess);
    setIsOpen(true);
  }, []);

  const close = useCallback((): void => {
    setIsOpen(false);
  }, []);

  const switchMode = useCallback((m: "login" | "signup"): void => {
    setMode(m);
  }, []);

  return (
    <AuthDialogContext.Provider
      value={{ isOpen, mode, reason, redirectAfter, onSuccess, open, close, switchMode }}
    >
      {children}
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog(): AuthDialogContextValue {
  return useContext(AuthDialogContext);
}
