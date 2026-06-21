"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribe to a CSS media query. SSR/first paint returns `serverDefault`,
 * then reconciles to the real match after hydration without a layout effect.
 */
export function useMediaQuery(query: string, serverDefault = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverDefault
  );
}
