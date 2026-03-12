"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/tools/battle-calc", label: "Calculator" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-8 px-4 md:px-8">

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            className="text-[var(--color-accent)]"
          >
            <path
              d="M12 2C12 2 9.5 5.5 8 7C6.5 8.5 4 9 2 9C2 9 3 12 5 13.5C5 13.5 3 15 2 17C4 17 6.5 16.5 8 15.5C8 15.5 9 18 10 20L12 22L14 20C15 18 16 15.5 16 15.5C17.5 16.5 20 17 22 17C21 15 19 13.5 19 13.5C21 12 22 9 22 9C20 9 17.5 8.5 16 7C14.5 5.5 12 2 12 2Z"
              fill="currentColor"
            />
          </svg>
          <span className="text-lg font-bold tracking-tight text-[var(--color-foreground)]">
            mapleboss
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-1 py-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--color-elevated)] text-[var(--color-foreground)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-secondary)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

      </div>
    </nav>
  );
}
