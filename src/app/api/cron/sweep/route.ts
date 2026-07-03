import { NextRequest, NextResponse } from "next/server";

// On-time trigger for the daily leaderboard crawl.
//
// GitHub's `on: schedule` trigger is best-effort and routinely fires hours late
// (worst at the top of the UTC day). So instead we let Vercel Cron fire on time
// (see vercel.json) and dispatch the existing GitHub Actions workflow via the
// API — a `workflow_dispatch` runs immediately, with no schedule-queue delay.
// The heavy 40-60 min crawl still runs on GitHub's runner; this route just kicks
// it off. GitHub's 12:40-UTC schedule remains as a dedup-safe fallback.
//
// Required env (set in Vercel project settings):
//   CRON_SECRET       — Vercel injects this as `Authorization: Bearer <secret>`
//                       on cron invocations; we reject anything that lacks it.
//   GH_DISPATCH_TOKEN — fine-grained GitHub PAT scoped to this repo with
//                       "Actions: Read and write". Used to dispatch the workflow.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REPO = "VikornC/mapleboss";
const WORKFLOW_FILE = "exp-sweep.yml";
const REF = "master";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // Fail closed: if no secret is configured, never trigger.
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.GH_DISPATCH_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GH_DISPATCH_TOKEN not configured" }, { status: 500 });
  }

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "mapleboss-cron",
      },
      body: JSON.stringify({ ref: REF }),
    }
  );

  // GitHub returns 204 No Content on a successful dispatch.
  if (res.status !== 204) {
    const detail = await res.text().catch(() => "");
    return NextResponse.json(
      { error: "dispatch failed", status: res.status, detail: detail.slice(0, 500) },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, dispatched: WORKFLOW_FILE, at: new Date().toISOString() });
}
