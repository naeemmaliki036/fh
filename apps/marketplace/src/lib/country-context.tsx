"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

const LS_KEY = "mp_country";

interface CountryContextValue {
  country: string | null;
  setCountry: (code: string) => void;
  isHydrated: boolean;
}

const CountryContext = createContext<CountryContextValue>({
  country: null,
  setCountry: () => undefined,
  isHydrated: false,
});

export function CountryProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [country, setCountryState] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) setCountryState(stored);
    setIsHydrated(true);
  }, []);

  const setCountry = useCallback((code: string): void => {
    localStorage.setItem(LS_KEY, code);
    setCountryState(code);
  }, []);

  return (
    <CountryContext.Provider value={{ country, setCountry, isHydrated }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry(): CountryContextValue {
  return useContext(CountryContext);
}
