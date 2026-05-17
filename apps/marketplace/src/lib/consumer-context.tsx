"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { ConsumerResponse } from "@fh/portal-types";

const TOKEN_KEY = "mp_consumer_token";
const CONSUMER_KEY = "mp_consumer";

interface ConsumerContextValue {
  consumer: ConsumerResponse | null;
  token: string | null;
  isHydrated: boolean;
  favoriteIds: Set<string>;
  signIn: (token: string, consumer: ConsumerResponse) => void;
  signOut: () => void;
  setFavoriteIds: (ids: Set<string>) => void;
  toggleFavoriteId: (id: string, favorited: boolean) => void;
}

const ConsumerContext = createContext<ConsumerContextValue>({
  consumer: null,
  token: null,
  isHydrated: false,
  favoriteIds: new Set(),
  signIn: () => undefined,
  signOut: () => undefined,
  setFavoriteIds: () => undefined,
  toggleFavoriteId: () => undefined,
});

export function ConsumerProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [consumer, setConsumer] = useState<ConsumerResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [favoriteIds, setFavoriteIdsState] = useState<Set<string>>(new Set());

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedConsumer = localStorage.getItem(CONSUMER_KEY);
    if (storedToken) setToken(storedToken);
    if (storedConsumer) {
      try {
        setConsumer(JSON.parse(storedConsumer) as ConsumerResponse);
      } catch {
        // ignore malformed
      }
    }
    setIsHydrated(true);
  }, []);

  const signIn = useCallback((t: string, c: ConsumerResponse): void => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(CONSUMER_KEY, JSON.stringify(c));
    setToken(t);
    setConsumer(c);
  }, []);

  const signOut = useCallback((): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CONSUMER_KEY);
    setToken(null);
    setConsumer(null);
    setFavoriteIdsState(new Set());
  }, []);

  const setFavoriteIds = useCallback((ids: Set<string>): void => {
    setFavoriteIdsState(ids);
  }, []);

  const toggleFavoriteId = useCallback((id: string, favorited: boolean): void => {
    setFavoriteIdsState((prev) => {
      const next = new Set(prev);
      if (favorited) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  return (
    <ConsumerContext.Provider
      value={{ consumer, token, isHydrated, favoriteIds, signIn, signOut, setFavoriteIds, toggleFavoriteId }}
    >
      {children}
    </ConsumerContext.Provider>
  );
}

export function useConsumer(): ConsumerContextValue {
  return useContext(ConsumerContext);
}
