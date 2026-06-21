"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "designlens:storage";

/**
 * A boolean persisted in localStorage, read hydration-safely via
 * useSyncExternalStore (SSR/first paint uses `serverDefault`).
 */
export function useStoredBoolean(
  key: string,
  serverDefault = false
): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(
    (onChange) => {
      const handler = () => onChange();
      window.addEventListener(EVENT, handler);
      window.addEventListener("storage", handler);
      return () => {
        window.removeEventListener(EVENT, handler);
        window.removeEventListener("storage", handler);
      };
    },
    () => localStorage.getItem(key) === "true",
    () => serverDefault
  );

  const setValue = useCallback(
    (next: boolean) => {
      localStorage.setItem(key, String(next));
      window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
    },
    [key]
  );

  return [value, setValue];
}
