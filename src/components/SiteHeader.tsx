"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { themeStore } from "@/lib/clientStore";

const NAV = [
  { href: "/journal/", label: "Log a trade", match: "/journal" },
  { href: "/learn/", label: "Learn", match: "/learn" },
  { href: "/drills/", label: "Drills", match: "/drills" },
  { href: "/tools/", label: "Calculators", match: "/tools" },
  { href: "/glossary/", label: "Glossary", match: "/glossary" },
];

function ThemeToggle() {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.snapshot,
    themeStore.serverSnapshot,
  );

  return (
    <button
      type="button"
      onClick={themeStore.toggle}
      aria-label={
        theme === "dark"
          ? "Switch to light theme"
          : theme === "light"
            ? "Switch to dark theme"
            : "Toggle light and dark theme"
      }
      className="rounded-lg border border-border px-2.5 py-1.5 text-sm text-muted transition-colors hover:text-fg"
    >
      <span aria-hidden>{theme === "dark" ? "☾" : theme === "light" ? "☀" : "◐"}</span>
    </button>
  );
}

export default function SiteHeader() {
  const pathname = usePathname() || "/";

  /*
   * The mobile menu is derived rather than synchronised: storing the path it was
   * opened on means navigating away closes it, with no effect required.
   */
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="font-display text-[15px] font-bold tracking-tight">
          <span className="text-accent">◆</span> Trade School
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.match);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-accent-soft font-medium text-accent"
                    : "text-muted hover:text-fg"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpenedAt(open ? null : pathname)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="rounded-lg border border-border px-2.5 py-1.5 text-sm md:hidden"
          >
            Menu
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="border-t border-border bg-surface px-4 py-2 md:hidden"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-2 py-2.5 text-sm text-muted hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
