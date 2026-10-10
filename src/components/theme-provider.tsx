"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * DAY ⇄ NIGHT provider.
 *
 * attribute="class" puts .light/.dark on <html>; globals.css resolves the
 * palette from that class (:root tokens ARE the night terminal, so dark needs
 * no extra block — html.light overrides them, with a deeper override for
 * html.light [data-mode="road"]).
 *
 * defaultTheme="dark" keeps the branded Night Terminal as first paint and
 * makes the very first render deterministic (no system-preference roulette on
 * demo day). The visitor's choice persists in localStorage.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
