"use client";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

// ═══════════════════════════════════════════════════════════════
// Провайдеры и их реальные схемы подписи (упрощённо, но верно):
//  - generic: свободная HMAC-подпись самого тела, hex или base64,
//    с необязательным префиксом вида "sha256=".
//  - github:  X-Hub-Signature-256: "sha256=<hex>" поверх сырого тела.
//  - stripe:  Stripe-Signature: "t=<unix ts>,v1=<hex>[,v0=...]" —
//    подписывается не само тело, а строка "<ts>.<тело>" (защита от
//    replay: секунда изменилась — подпись уже другая).
//  - shopify: X-Shopify-Hmac-Sha256: "<base64>" поверх сырого тела.
// Все вычисления — через Web Crypto API, ничего никуда не уходит.
// ═══════════════════════════════════════════════════════════════

type Provider = "generic" | "github" | "stripe" | "shopify";
type Algo = "SHA-1" | "SHA-256" | "SHA-512";
type Encoding = "hex" | "base64";

interface ProviderConfig {
  algo: Algo;
  encoding: Encoding;
  headerName: string;
}

const PROVIDER_CONFIG: Record<Provider, ProviderConfig> = {
  generic: { algo: "SHA-256", encoding: "hex", headerName: "" },
  github: { algo: "SHA-256", encoding: "hex", headerName: "X-Hub-Signature-256" },
  stripe: { algo: "SHA-256", encoding: "hex", headerName: "Stripe-Signature" },
  shopify: { algo: "SHA-256", encoding: "base64", headerName: "X-Shopify-Hmac-Sha256" },
};

const PROVIDERS: Provider[] = ["generic", "github", "stripe", "shopify"];

const EXAMPLES: Record<Provider, { secret: string; payload: string; signature: string }> = {
  generic: {
    secret: "my-webhook-secret",
    payload: `{"event":"ping","id":"evt_001"}`,
    signature: "sha256=23d089279269d66511a06ba4a22818b30402273be0749edb41bc2da04e385124",
  },
  github: {
    secret: "mySecret123",
    payload: `{"action":"opened","number":1,"repository":{"full_name":"octocat/Hello-World"}}`,
    signature: "sha256=9a034be317f34687d849856c136e4fd242ed266bb8d8e97cd8f58da804244289",
  },
  stripe: {
    secret: "whsec_test_123",
    payload: `{"id":"evt_1NrX2x2eZvKYlo2C","object":"event","type":"payment_intent.succeeded"}`,
    signature: "t=1694700000,v1=6b66ae3aa0b4b612338af3c6b810be201244abe4cf670837c7ba400aa737c154",
  },
  shopify: {
    secret: "shpss_test_123",
    payload: `{"id":123456789,"email":"customer@example.com"}`,
    signature: "c17SztAubFecuB40T8/V9n1fYSGBLx4QylHhmn6YIHM=",
  },
};

async function hmacDigest(secret: string, message: string, algo: Algo): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: algo },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

// Сравнение постоянного времени — на бэкенде это защищает от timing-атак;
// здесь, в браузере, это скорее демонстрация правильной практики (см. FAQ),
// чем реальная защита, но сам паттерн — то, что стоит переносить в код.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

interface ParsedExpectation {
  message: string;
  expected: string;
  error?: string;
}

function parseExpectation(provider: Provider, payload: string, sigInput: string): ParsedExpectation {
  const raw = sigInput.trim();

  if (provider === "generic") {
    if (!raw) return { message: payload, expected: "", error: "empty" };
    const stripped = raw.replace(/^(sha1|sha256|sha512)=/i, "");
    return { message: payload, expected: stripped };
  }

  if (provider === "github") {
    if (!raw) return { message: payload, expected: "", error: "empty" };
    const noHeaderName = raw.replace(/^x-hub-signature-256:\s*/i, "");
    const stripped = noHeaderName.replace(/^sha256=/i, "");
    return { message: payload, expected: stripped };
  }

  if (provider === "shopify") {
    if (!raw) return { message: payload, expected: "", error: "empty" };
    const stripped = raw.replace(/^x-shopify-hmac-sha256:\s*/i, "");
    return { message: payload, expected: stripped };
  }

  // stripe
  if (!raw) return { message: payload, expected: "", error: "empty" };
  const noHeaderName = raw.replace(/^stripe-signature:\s*/i, "");
  const parts = noHeaderName.split(",").map((p) => p.trim());
  const map: Record<string, string> = {};
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    map[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  if (!map.t) return { message: payload, expected: "", error: "missing-t" };
  if (!map.v1) return { message: payload, expected: "", error: "missing-v1" };
  return { message: `${map.t}.${payload}`, expected: map.v1 };
}

export function WebhookSignatureVerifierTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Скопировать";

  const [provider, setProvider] = useState<Provider>("generic");
  const [secret, setSecret] = useState("");
  const [payload, setPayload] = useState("");
  const [sigInput, setSigInput] = useState("");
  const [computed, setComputed] = useState("");
  const [loading, setLoading] = useState(false);

  function loadExample(p: Provider) {
    setProvider(p);
    const ex = EXAMPLES[p];
    setSecret(ex.secret);
    setPayload(ex.payload);
    setSigInput(ex.signature);
  }

  const config = PROVIDER_CONFIG[provider];
  const { message, expected, error } = parseExpectation(provider, payload, sigInput);

  useEffect(() => {
    if (!secret || !payload) {
      setComputed("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const digest = await hmacDigest(secret, message, config.algo);
      const encoded = config.encoding === "hex" ? toHex(digest) : toBase64(digest);
      if (!cancelled) {
        setComputed(encoded);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret, message, config.algo, config.encoding]);

  const hasInput = Boolean(secret && payload && sigInput.trim());
  const matches =
    hasInput && !error && computed
      ? config.encoding === "hex"
        ? timingSafeEqual(computed.toLowerCase(), expected.toLowerCase())
        : timingSafeEqual(computed, expected)
      : false;

  const errorMessage =
    error === "missing-t"
      ? isRu ? "В заголовке нет t= (timestamp) — это не похоже на Stripe-Signature." : "No t= (timestamp) in the header — this doesn't look like a Stripe-Signature value."
      : error === "missing-v1"
      ? isRu ? "В заголовке нет v1= — это не похоже на Stripe-Signature." : "No v1= in the header — this doesn't look like a Stripe-Signature value."
      : null;

  const PROVIDER_LABEL: Record<Provider, string> = {
    generic: isRu ? "Обычный HMAC" : "Generic HMAC",
    github: "GitHub",
    stripe: "Stripe",
    shopify: "Shopify",
  };

  const sigPlaceholder: Record<Provider, string> = {
    generic: isRu ? "sha256=<hex> или просто digest" : "sha256=<hex-digest> or just the digest",
    github: "sha256=<hex-digest>",
    stripe: "t=1694700000,v1=<hex-digest>",
    shopify: "<base64-digest>",
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="input-label">{isRu ? "Провайдер" : "Provider"}</label>
        <div className="flex flex-wrap gap-1">
          {PROVIDERS.map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={`rounded-[8px] px-3 py-1.5 text-xs transition-colors ${
                provider === p
                  ? "bg-accent text-accent-fg"
                  : "border border-border bg-surface text-text-muted hover:bg-surface-hover"
              }`}
            >
              {PROVIDER_LABEL[p]}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-text-muted">
          {isRu
            ? `Алгоритм: HMAC-${config.algo}, кодировка: ${config.encoding}${config.headerName ? `, заголовок: ${config.headerName}` : ""}.`
            : `Algorithm: HMAC-${config.algo}, encoding: ${config.encoding}${config.headerName ? `, header: ${config.headerName}` : ""}.`}
          {" "}
          <button onClick={() => loadExample(provider)} className="text-text-muted underline hover:text-text-primary transition-colors">
            {isRu ? "загрузить пример" : "load example"}
          </button>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-3">
          <div>
            <label className="input-label">{isRu ? "Секрет" : "Secret"}</label>
            <input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              type="password"
              spellCheck={false}
              placeholder={isRu ? "webhook signing secret" : "webhook signing secret"}
              className="code-surface w-full rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none"
            />
          </div>

          <div>
            <label className="input-label">{isRu ? "Тело запроса (сырое, как пришло)" : "Request body (raw, exactly as received)"}</label>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={6}
              spellCheck={false}
              placeholder={isRu ? "Вставьте точное тело запроса…" : "Paste the exact request body…"}
              className="code-surface w-full rounded-lg p-3 font-mono text-xs text-text-primary outline-none"
            />
            <p className="mt-1 text-[11px] text-text-muted">
              {isRu
                ? "Подпись считается по сырым байтам тела. Если вставить тело из «красиво отформатированного» JSON-просмотрщика, пробелы будут другими и подпись не сойдётся, даже если данные те же."
                : "The signature is computed over the raw body bytes. Pasting the body from a pretty-printed JSON viewer changes the whitespace and breaks verification, even though the data is the same."}
            </p>
          </div>

          <div>
            <label className="input-label">
              {isRu ? `Подпись из заголовка${config.headerName ? ` ${config.headerName}` : ""}` : `Signature from the${config.headerName ? ` ${config.headerName}` : ""} header`}
            </label>
            <input
              value={sigInput}
              onChange={(e) => setSigInput(e.target.value)}
              spellCheck={false}
              placeholder={sigPlaceholder[provider]}
              className="code-surface w-full rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary outline-none"
            />
          </div>
        </div>

        {/* Verdict */}
        <div className="space-y-3">
          <div
            className={`rounded-xl border px-4 py-3 flex items-center justify-between ${
              !hasInput
                ? "border-border bg-surface"
                : errorMessage
                ? "border-amber-500/30 bg-amber-500/5"
                : matches
                ? "border-green-500/30 bg-green-500/5"
                : "border-red-500/30 bg-red-500/5"
            }`}
          >
            <div>
              <p className="text-xs text-text-muted">{isRu ? "Вердикт" : "Verdict"}</p>
              <p
                className={`text-xl font-bold ${
                  !hasInput
                    ? "text-text-muted"
                    : errorMessage
                    ? "text-amber-400"
                    : matches
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {!hasInput
                  ? (isRu ? "Заполните поля" : "Fill in the fields")
                  : errorMessage
                  ? (isRu ? "Не удалось разобрать" : "Couldn't parse")
                  : loading
                  ? (isRu ? "Считаю…" : "Computing…")
                  : matches
                  ? (isRu ? "Подпись верна" : "Signature valid")
                  : (isRu ? "Подпись неверна" : "Signature invalid")}
              </p>
            </div>
          </div>

          {errorMessage && <p className="text-sm text-amber-400">{errorMessage}</p>}

          {!errorMessage && hasInput && (
            <div className="space-y-2">
              <div className="code-surface rounded-[10px] p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] text-text-muted">{isRu ? "Вычисленная подпись" : "Computed signature"}</span>
                  <CopyButton value={computed} iconOnly />
                </div>
                <p className="break-all font-mono text-xs text-text-primary">{loading ? "…" : computed || "—"}</p>
              </div>
              <div className="code-surface rounded-[10px] p-3">
                <span className="text-[11px] text-text-muted">{isRu ? "Ожидалось (из вставленной подписи)" : "Expected (from the pasted signature)"}</span>
                <p className="mt-1 break-all font-mono text-xs text-text-primary">{expected || "—"}</p>
              </div>
              {provider === "stripe" && (
                <div className="code-surface rounded-[10px] p-3">
                  <span className="text-[11px] text-text-muted">{isRu ? "Подписанная строка (timestamp.тело)" : "Signed string (timestamp.body)"}</span>
                  <p className="mt-1 break-all font-mono text-xs text-text-primary">{message}</p>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-text-muted">
            {isRu
              ? "Всё считается локально в браузере через Web Crypto API — секрет и тело никуда не отправляются."
              : "Everything runs locally in your browser via the Web Crypto API — the secret and body are never sent anywhere."}
          </p>
        </div>
      </div>
    </div>
  );
}
