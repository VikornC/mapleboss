"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavChild {
  label: string;
  href: string;
}
interface NavItem {
  label: string;
  href?: string;
  children?: NavChild[];
}

const NAV: NavItem[] = [
  {
    label: "EXP Tracker",
    children: [
      { label: "Leaderboard", href: "/tools/exp-tracker" },
      { label: "Compare", href: "/tools/exp-tracker/compare" },
      { label: "Activity", href: "/tools/exp-tracker/activity" },
      { label: "Class Stats", href: "/tools/exp-tracker/stats" },
    ],
  },
  {
    label: "Tools",
    children: [
      { label: "Battle Calculator", href: "/tools/battle-calc" },
      { label: "Hungry Muto", href: "/tools/muto" },
    ],
  },
];

// A child is active when it's the longest-prefix match of the current path
// (so /tools/exp-tracker/compare highlights Compare, not Leaderboard).
function childActive(pathname: string, child: NavChild, siblings: NavChild[]) {
  if (!pathname.startsWith(child.href)) return false;
  // A longer sibling prefix wins (Compare beats Leaderboard on /tools/exp-tracker/compare).
  return !siblings.some(
    (s) => s.href.length > child.href.length && pathname.startsWith(s.href)
  );
}

const triggerBase = "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[var(--color-accent)]">
            <path d="M12 2C12 2 9.5 5.5 8 7C6.5 8.5 4 9 2 9C2 9 3 12 5 13.5C5 13.5 3 15 2 17C4 17 6.5 16.5 8 15.5C8 15.5 9 18 10 20L12 22L14 20C15 18 16 15.5 16 15.5C17.5 16.5 20 17 22 17C21 15 19 13.5 19 13.5C21 12 22 9 22 9C20 9 17.5 8.5 16 7C14.5 5.5 12 2 12 2Z" fill="currentColor" />
          </svg>
          <span className="text-lg font-bold tracking-tight text-[var(--color-foreground)]">MapleBoss</span>
        </Link>

        {/* Nav */}
        <div className="flex items-center gap-1">
          {NAV.map((item) => {
            if (!item.children) {
              const active = pathname.startsWith(item.href!);
              return (
                <Link
                  key={item.label}
                  href={item.href!}
                  className={`${triggerBase} ${active ? "text-[var(--color-foreground)]" : "text-[var(--color-muted)] hover:text-[var(--color-secondary)]"}`}
                >
                  {item.label}
                </Link>
              );
            }
            const parentActive = item.children.some((c) => childActive(pathname, c, item.children!));
            return (
              <div key={item.label} className="group relative">
                <button
                  className={`${triggerBase} ${parentActive ? "text-[var(--color-foreground)]" : "text-[var(--color-muted)] group-hover:text-[var(--color-secondary)]"}`}
                >
                  {item.label}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="transition-transform duration-200 group-hover:rotate-180"
                  >
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {/* Menu (pt-2 bridge keeps hover alive across the gap) */}
                <div className="absolute left-0 top-full hidden min-w-[190px] pt-2 group-hover:block group-focus-within:block">
                  <div
                    className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl"
                    style={{ transformOrigin: "top", animation: "dropdown 0.15s ease" }}
                  >
                    {item.children.map((c) => {
                      const active = childActive(pathname, c, item.children!);
                      return (
                        <Link
                          key={c.href}
                          href={c.href}
                          className={`block rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-[var(--color-elevated)] text-[var(--color-foreground)]" : "text-[var(--color-secondary)] hover:bg-[var(--color-elevated)] hover:text-[var(--color-foreground)]"}`}
                        >
                          {c.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
