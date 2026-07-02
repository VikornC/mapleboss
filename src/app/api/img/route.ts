import { NextRequest, NextResponse } from "next/server";

// Same-origin proxy for MSU character sprites, so they can be captured to a
// canvas (MSU's CDN sends no CORS headers). Locked to MSU hosts to avoid being
// an open proxy. Used only by the character-card "copy image" feature.
const ALLOWED_HOSTS = new Set(["market-static.msu.io", "msu.io"]);

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u");
  if (!u) return new NextResponse("missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return new NextResponse("bad url", { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return new NextResponse("forbidden host", { status: 403 });
  }

  const res = await fetch(target.toString(), { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) return new NextResponse("upstream error", { status: 502 });

  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
