import { NextRequest, NextResponse } from "next/server";
import { isIP } from "node:net";
import { lookup as dnsLookup } from "node:dns/promises";

/**
 * The Header Inspector is the one MVP tool that genuinely needs a server
 * hop: browsers block JS from reading most response headers on a
 * cross-origin fetch (CORS), but a server has no such restriction.
 * This route is intentionally tiny and stateless — no auth, no DB,
 * no logging of inspected URLs.
 *
 * SSRF guard: the original version only denylisted hostnames by regex
 * (localhost, 127., 10., 192.168., 169.254., ::1, *.local) and then called
 * fetch(..., { redirect: "follow" }). Both halves were bypassable:
 *  - A hostname like "attacker.example" that simply *resolves* to
 *    127.0.0.1 / 169.254.169.254 (cloud metadata) / a 172.16-31.x.x RFC
 *    1918 address never matched the regex at all (DNS rebinding / attacker-
 *    controlled DNS), and IPv6 ULA/link-local ranges (fc00::/7, fe80::/10)
 *    weren't covered either.
 *  - Even a hostname that passed the check could 302 to an internal URL,
 *    and redirect: "follow" would silently fetch it — the destination is
 *    never re-validated.
 * Fixed by resolving the hostname ourselves and checking the resulting
 * IP(s) against the private/reserved ranges, then following redirects
 * manually so every hop gets the same validation.
 */
const MAX_REDIRECTS = 5;

function isPrivateOrReservedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 127) return true; // loopback
    if (a === 10) return true; // RFC1918
    if (a === 0) return true; // "this" network
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
    if (a === 192 && b === 168) return true; // RFC1918
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT (RFC6598)
    if (a >= 224) return true; // multicast + reserved
    return false;
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true; // loopback
    if (lower === "::") return true; // unspecified
    if (lower.startsWith("::ffff:")) {
      // IPv4-mapped IPv6 — validate the embedded IPv4 address too.
      const embedded = lower.slice("::ffff:".length);
      if (isIP(embedded) === 4) return isPrivateOrReservedIp(embedded);
    }
    if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true; // fc00::/7 unique local
    if (/^fe[89ab][0-9a-f]:/.test(lower)) return true; // fe80::/10 link-local
    return false;
  }
  return true; // couldn't parse — treat as unsafe
}

async function resolvesToPrivateIp(hostname: string): Promise<boolean> {
  if (isIP(hostname)) return isPrivateOrReservedIp(hostname);
  try {
    const results = await dnsLookup(hostname, { all: true, verbatim: true });
    if (results.length === 0) return true; // couldn't resolve — refuse
    return results.some((r) => isPrivateOrReservedIp(r.address));
  } catch {
    return true; // resolution failed — refuse rather than risk it
  }
}

async function validateTargetUrl(rawUrl: string): Promise<URL | null> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) return null;
  if (await resolvesToPrivateIp(hostname)) return null;
  return url;
}

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

  let currentUrl = await validateTargetUrl(targetUrl);
  if (!currentUrl) {
    return NextResponse.json({ error: "That host can't be inspected." }, { status: 400 });
  }

  try {
    let res: Response;
    for (let hop = 0; ; hop++) {
      res = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
      });

      const isRedirect = res.status >= 300 && res.status < 400;
      const location = res.headers.get("location");
      if (!isRedirect || !location) break;
      if (hop >= MAX_REDIRECTS) {
        return NextResponse.json({ error: "Too many redirects." }, { status: 502 });
      }

      const nextUrl = await validateTargetUrl(new URL(location, currentUrl).toString());
      if (!nextUrl) {
        return NextResponse.json({ error: "Redirect target can't be inspected." }, { status: 400 });
      }
      currentUrl = nextUrl;
    }

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
