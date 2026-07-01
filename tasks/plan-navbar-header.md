# NavBar Header Rebrand — Plan

## Problem
The current logo splits "maple" and "boss" with a visible gap (`gap-1`), making it read as two separate words instead of one brand. Gaming tool sites (op.gg, u.gg, blitz.gg) all treat their name as a single, punchy unit.

## Change: One-word brand logo

**File**: `src/components/NavBar.tsx`

### Current
```tsx
<Link href="/" className="group flex items-baseline gap-1">
  <span className="...">maple</span>
  <span className="...">boss</span>
</Link>
```
Two spans with `gap-1` — visible space between words.

### New
```tsx
<Link href="/" className="group text-base font-bold tracking-tight">
  <span className="text-[var(--color-foreground)] transition-colors group-hover:text-[var(--color-accent)]">maple</span>
  <span className="text-[var(--color-accent)]">boss</span>
</Link>
```

Key changes:
- **Remove `flex` and `gap-1`** from the link — the two spans sit inline with zero space between them, reading as one word: `mapleboss`
- **Move shared styles** (font-bold, tracking-tight, text-base) to the parent Link to reduce repetition
- Keep the hover effect: "maple" turns amber on hover so the whole word glows
- No icon, no box, no `.com` suffix — just the name

### Why this works
- Reads as one brand name instantly
- Color break within the word is distinctive (like how Discord colors the "D" in their logo)
- Hover animation where both parts go amber gives satisfying interaction
- Minimal, clean — matches the dark theme aesthetic
- Works at any viewport size

## No other files changed
- layout.tsx, page.tsx, globals.css — untouched
- This is a surgical one-file, ~5 line change

## Verification
- `npm run build` passes
- Logo reads "mapleboss" with no gap in browser
- Hover turns full word amber
- Active nav link styling unaffected
