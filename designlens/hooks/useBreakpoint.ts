"use client";

import { useState, useEffect } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

const QUERIES: [Breakpoint, string][] = [
  ["desktop", "(min-width: 1024px)"],
  ["tablet", "(min-width: 768px) and (max-width: 1023px)"],
];

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>("desktop"); // SSR-safe default

  useEffect(() => {
    const matchers = QUERIES.map(([name, query]) => ({
      name,
      mql: window.matchMedia(query),
    }));

    const update = () => {
      const match = matchers.find((m) => m.mql.matches);
      setBp(match ? match.name : "mobile");
    };

    update();
    matchers.forEach((m) => m.mql.addEventListener("change", update));
    return () => matchers.forEach((m) => m.mql.removeEventListener("change", update));
  }, []);

  return bp;
}
