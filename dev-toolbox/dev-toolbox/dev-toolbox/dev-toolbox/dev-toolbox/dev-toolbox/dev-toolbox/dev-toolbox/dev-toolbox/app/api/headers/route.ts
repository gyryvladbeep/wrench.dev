import { NextRequest, NextResponse } from "next/server";

/**
 * The Header Inspector is the one MVP tool that genuinely needs a server
 * hop: browsers block JS from reading most response headers on a
 * cross-origin fetch (CORS), but a server has no such restriction.
 * This route is intentionally tiny and stateless — no auth, no DB,
 * no logging of inspected URLs.
 */
export async function POST(req: NextRequest) {
  let targetUrl: string;
  try {
    const body = await req.json();
    targetUrl = body.url;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
    return NextResponse.json({ error: "Provide a valid http(s) URL." }, { status: 400 });
  }

  // Basic SSRF guard: block obviously-internal hosts. This is a best-effort
  // denylist, not a complete defense (it doesn't resolve DNS to catch
  // rebinding) — a production deployment of this endpoint should resolve
  // the hostname and check the resulting IP range before fetching.
  let hostname: string;
  try {
    hostname = new URL(targetUrl).hostname.toLowerCase();
  } catch {
    return NextResponse.json({ error: "Provide a valid http(s) URL." }, { status: 400 });
  }
  const blockedHosts = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|::1)/;
  if (blockedHosts.test(hostname) || hostname.endsWith(".local")) {
    return NextResponse.json({ error: "That host can't be inspected." }, { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return NextResponse.json({ status: res.status, statusText: res.statusText, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return NextResponse.json({ error: `Couldn't reach that URL: ${message}` }, { status: 502 });
  }
}
