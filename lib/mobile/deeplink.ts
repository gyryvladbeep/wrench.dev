export type LinkKind = "custom" | "https";

export interface QueryParam {
  key: string;
  value: string;
}

export interface DeepLinkInput {
  kind: LinkKind;
  scheme: string;
  host: string;
  path: string;
  params: QueryParam[];
  fragment: string;
}

export interface DeepLinkResult {
  url: string;
  warnings: string[];
}

const SCHEME_RE = /^[a-z][a-z0-9+.-]*$/i;
const HOST_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*(:\d{1,5})?$/i;

/** Кодирует каждый сегмент пути отдельно, сохраняя разделители "/". */
function encodePath(path: string): string {
  return path
    .split("/")
    .filter((seg, i, arr) => seg !== "" || i === arr.length - 1)
    .map((seg) => encodeURIComponent(seg).replace(/'/g, "%27"))
    .join("/");
}

export function buildDeepLink(input: DeepLinkInput): DeepLinkResult {
  const warnings: string[] = [];
  const scheme = input.kind === "https" ? "https" : input.scheme.trim().replace(/:\/*$/, "");
  const host = input.host.trim();
  const path = input.path.trim().replace(/^\/+/, "");

  if (!scheme) warnings.push("scheme-missing");
  else if (!SCHEME_RE.test(scheme)) warnings.push("scheme-invalid");
  if (input.kind === "https" && !host) warnings.push("host-required");
  if (host && !HOST_RE.test(host)) warnings.push("host-invalid");
  if (input.kind === "custom" && !host && !path) warnings.push("empty-target");

  const params = input.params.filter((p) => p.key.trim() !== "");
  const keys = params.map((p) => p.key.trim());
  if (new Set(keys).size !== keys.length) warnings.push("duplicate-keys");

  const query = params
    .map((p) => `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value).replace(/'/g, "%27")}`)
    .join("&");

  let url = `${scheme || "<scheme>"}://${host}`;
  const encodedPath = encodePath(path);
  if (encodedPath) url += `/${encodedPath}`;
  if (query) url += `?${query}`;
  const fragment = input.fragment.trim().replace(/^#/, "");
  if (fragment) url += `#${encodeURIComponent(fragment).replace(/'/g, "%27")}`;

  if (url.length > 2000) warnings.push("too-long");
  return { url, warnings };
}

export function adbCommand(url: string, pkg: string): string {
  const safe = url.replace(/'/g, "%27");
  const target = pkg.trim() ? ` ${pkg.trim()}` : "";
  return `adb shell "am start -W -a android.intent.action.VIEW -d '${safe}'${target}"`;
}

export function simctlCommand(url: string): string {
  return `xcrun simctl openurl booted "${url.replace(/(["`$\\])/g, "\\$1")}"`;
}

/** Содержимое intent-filter, которое нужно приложению, чтобы принять эту ссылку. */
export function intentFilterXml(kind: LinkKind, scheme: string, host: string, path: string): string {
  const sch = kind === "https" ? "https" : scheme.trim().replace(/:\/*$/, "") || "myapp";
  const p = path.trim().replace(/^\/+/, "");
  const lines = [
    "<intent-filter" + (kind === "https" ? ' android:autoVerify="true"' : "") + ">",
    '    <action android:name="android.intent.action.VIEW" />',
    '    <category android:name="android.intent.category.DEFAULT" />',
    '    <category android:name="android.intent.category.BROWSABLE" />',
    `    <data android:scheme="${sch}"` + (host.trim() ? ` android:host="${host.trim()}"` : "") + (p ? ` android:pathPrefix="/${p.split("/")[0]}"` : "") + " />",
    "</intent-filter>",
  ];
  return lines.join("\n");
}
