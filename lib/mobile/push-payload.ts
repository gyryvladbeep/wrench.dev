import { Finding, finding, sortFindings } from "./findings";

export type PushPlatform = "apns" | "fcm";

export interface PushResult {
  jsonOk: boolean;
  /** Размер в байтах (UTF-8) после минификации JSON. */
  size: number;
  limit: number;
  findings: Finding[];
}

export const APNS_LIMIT = 4096;
export const APNS_VOIP_LIMIT = 5120;
export const FCM_LIMIT = 4096;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

const APS_KEYS = new Set([
  "alert", "badge", "sound", "thread-id", "category", "content-available", "mutable-content",
  "target-content-id", "interruption-level", "relevance-score", "filter-criteria", "stale-date",
  "content-state", "timestamp", "event", "dismissal-date", "attributes-type", "attributes",
]);
const ALERT_KEYS = new Set([
  "title", "subtitle", "body", "launch-image", "title-loc-key", "title-loc-args",
  "subtitle-loc-key", "subtitle-loc-args", "loc-key", "loc-args",
]);
const INTERRUPTION = new Set(["passive", "active", "time-sensitive", "critical"]);
const LIVE_KEYS = ["stale-date", "content-state", "timestamp", "event", "dismissal-date", "attributes-type", "attributes"];

export function byteSize(text: string): number {
  return new TextEncoder().encode(text).length;
}

function checkAps(aps: unknown, out: Finding[]): void {
  if (!isObj(aps)) {
    out.push(finding("error", "aps-missing", "The payload needs an \"aps\" dictionary.", "В пейлоаде нужен словарь \"aps\"."));
    return;
  }
  const keys = Object.keys(aps);
  for (const k of keys) {
    if (!APS_KEYS.has(k)) out.push(finding("warning", "aps-unknown-key", `Key "${k}" inside "aps" is not an Apple-defined key and APNs ignores it. Put custom keys next to "aps", not inside it.`, `Ключ "${k}" внутри "aps" не определён Apple, и APNs его игнорирует. Кастомные ключи кладите рядом с "aps", а не внутрь.`));
  }
  const alert = aps.alert;
  if (alert !== undefined) {
    if (typeof alert === "string") {
      /* строка допустима: показывается как body */
    } else if (isObj(alert)) {
      for (const k of Object.keys(alert)) {
        if (!ALERT_KEYS.has(k)) out.push(finding("warning", "alert-unknown-key", `Key "${k}" inside "alert" is not an Apple-defined key.`, `Ключ "${k}" внутри "alert" не определён Apple.`));
      }
      for (const argKey of ["title-loc-args", "subtitle-loc-args", "loc-args"]) {
        const v = alert[argKey];
        if (v !== undefined && !(Array.isArray(v) && v.every((x) => typeof x === "string"))) {
          out.push(finding("error", "loc-args-type", `"${argKey}" must be an array of strings.`, `"${argKey}" должен быть массивом строк.`));
        }
      }
    } else {
      out.push(finding("error", "alert-type", "\"alert\" must be a dictionary or a string.", "\"alert\" должен быть словарём или строкой."));
    }
  }
  if (aps.badge !== undefined && typeof aps.badge !== "number") out.push(finding("error", "badge-type", "\"badge\" must be a number (0 removes the badge).", "\"badge\" должен быть числом (0 убирает бейдж)."));
  if (aps.sound !== undefined) {
    if (isObj(aps.sound)) {
      if (aps.sound.critical !== 1) out.push(finding("warning", "sound-critical", "A \"sound\" dictionary is for critical alerts: set \"critical\": 1.", "Словарь \"sound\" нужен для critical alerts: задайте \"critical\": 1."));
      const vol = aps.sound.volume;
      if (vol !== undefined && (typeof vol !== "number" || vol < 0 || vol > 1)) out.push(finding("error", "sound-volume", "Critical sound \"volume\" must be a number from 0 to 1.", "\"volume\" критического звука должен быть числом от 0 до 1."));
    } else if (typeof aps.sound !== "string") {
      out.push(finding("error", "sound-type", "\"sound\" must be a string (or a dictionary for critical alerts).", "\"sound\" должен быть строкой (или словарём для critical alerts)."));
    }
  }
  for (const flag of ["content-available", "mutable-content"] as const) {
    const v = aps[flag];
    if (v !== undefined && v !== 1 && v !== 0) out.push(finding("warning", `${flag}-value`, `"${flag}" should be 1 (or 0/absent).`, `"${flag}" должен быть 1 (или 0/отсутствовать).`));
  }
  if (aps["content-available"] === 1 && (aps.alert !== undefined || aps.badge !== undefined || aps.sound !== undefined)) {
    out.push(finding("info", "not-silent", "\"content-available\": 1 together with alert, badge or sound is not a silent push: Apple recommends omitting them for a background update.", "\"content-available\": 1 вместе с alert, badge или sound не является silent push: для фонового обновления Apple советует их не указывать."));
  }
  if (aps["interruption-level"] !== undefined && !(typeof aps["interruption-level"] === "string" && INTERRUPTION.has(aps["interruption-level"]))) {
    out.push(finding("error", "interruption-level", "\"interruption-level\" must be passive, active, time-sensitive or critical.", "\"interruption-level\" должен быть passive, active, time-sensitive или critical."));
  }
  const rel = aps["relevance-score"];
  if (rel !== undefined && (typeof rel !== "number" || rel < 0 || rel > 1)) {
    out.push(finding("warning", "relevance-score", "\"relevance-score\" should be a number from 0 to 1 (other values are only for Live Activities).", "\"relevance-score\" должен быть числом от 0 до 1 (другие значения допустимы только для Live Activities)."));
  }
  for (const k of ["thread-id", "category", "target-content-id"]) {
    if (aps[k] !== undefined && typeof aps[k] !== "string") out.push(finding("error", `${k}-type`, `"${k}" must be a string.`, `"${k}" должен быть строкой.`));
  }
  const hasUser = aps.alert !== undefined || aps.badge !== undefined || aps.sound !== undefined;
  const hasBackground = aps["content-available"] !== undefined;
  const hasLive = LIVE_KEYS.some((k) => aps[k] !== undefined);
  if (!hasUser && !hasBackground && !hasLive) {
    out.push(finding("warning", "aps-empty", "\"aps\" has no alert, badge, sound or content-available, so nothing happens on the device.", "В \"aps\" нет alert, badge, sound или content-available, поэтому на устройстве ничего не произойдёт."));
  }
}

function checkApns(root: unknown, out: Finding[]): void {
  if (!isObj(root)) {
    out.push(finding("error", "root-type", "The payload must be a JSON object.", "Пейлоад должен быть JSON-объектом."));
    return;
  }
  checkAps(root.aps, out);
}

const FCM_MESSAGE_KEYS = new Set(["name", "data", "notification", "android", "webpush", "apns", "fcm_options", "token", "topic", "condition"]);

function checkFcm(root: unknown, out: Finding[]): void {
  if (!isObj(root)) {
    out.push(finding("error", "root-type", "The payload must be a JSON object.", "Пейлоад должен быть JSON-объектом."));
    return;
  }
  const msg = root.message;
  if (!isObj(msg)) {
    out.push(finding("error", "fcm-no-message", "HTTP v1 requests wrap everything in a \"message\" object.", "Запросы HTTP v1 оборачивают всё в объект \"message\"."));
    return;
  }
  for (const k of Object.keys(msg)) {
    if (!FCM_MESSAGE_KEYS.has(k)) out.push(finding("warning", "fcm-unknown-key", `Unknown key "${k}" in "message".`, `Неизвестный ключ "${k}" в "message".`));
  }
  const targets = ["token", "topic", "condition"].filter((k) => msg[k] !== undefined);
  if (targets.length === 0) out.push(finding("error", "fcm-no-target", "Set exactly one target: token, topic or condition.", "Укажите ровно одну цель: token, topic или condition."));
  else if (targets.length > 1) out.push(finding("error", "fcm-multi-target", `Only one target is allowed, found: ${targets.join(", ")}.`, `Допустима только одна цель, найдено: ${targets.join(", ")}.`));

  if (msg.data !== undefined) {
    if (!isObj(msg.data)) out.push(finding("error", "fcm-data-type", "\"data\" must be an object of string keys and string values.", "\"data\" должен быть объектом со строковыми ключами и значениями."));
    else {
      for (const [k, v] of Object.entries(msg.data)) {
        if (typeof v !== "string") out.push(finding("error", "fcm-data-value", `data["${k}"] must be a string, got ${Array.isArray(v) ? "array" : typeof v}. Serialize objects to a JSON string.`, `data["${k}"] должно быть строкой, получено: ${Array.isArray(v) ? "массив" : typeof v}. Объекты сериализуйте в JSON-строку.`));
        if (k === "from" || k === "message_type" || k.startsWith("google.") || k.startsWith("gcm.")) {
          out.push(finding("error", "fcm-reserved-key", `Data key "${k}" is reserved by FCM. Avoid "from", "message_type" and keys starting with "google." or "gcm.".`, `Ключ данных "${k}" зарезервирован FCM. Избегайте "from", "message_type" и ключей, начинающихся с "google." или "gcm.".`));
        }
      }
    }
  }
  if (msg.notification !== undefined && !isObj(msg.notification)) {
    out.push(finding("error", "fcm-notification-type", "\"notification\" must be an object (title, body, image).", "\"notification\" должен быть объектом (title, body, image)."));
  }
  if (msg.notification === undefined && msg.data === undefined && msg.android === undefined && msg.apns === undefined && msg.webpush === undefined) {
    out.push(finding("warning", "fcm-empty", "The message has no notification, data or platform block.", "В сообщении нет notification, data или платформенного блока."));
  }
  if (isObj(msg.android)) {
    const a = msg.android;
    if (a.priority !== undefined && a.priority !== "NORMAL" && a.priority !== "HIGH") out.push(finding("warning", "fcm-priority", "android.priority should be NORMAL or HIGH (uppercase).", "android.priority должен быть NORMAL или HIGH (заглавными)."));
    if (a.ttl !== undefined && !(typeof a.ttl === "string" && /^\d+(\.\d{1,9})?s$/.test(a.ttl))) out.push(finding("error", "fcm-ttl", "android.ttl must be a string in seconds with an \"s\" suffix, for example \"3600s\".", "android.ttl должен быть строкой в секундах с суффиксом \"s\", например \"3600s\"."));
    if (isObj(a.notification) && a.notification.channel_id === undefined) out.push(finding("info", "fcm-channel", "Set android.notification.channel_id to control which notification channel is used on Android 8+.", "Задайте android.notification.channel_id, чтобы управлять каналом уведомлений на Android 8+."));
  }
  if (isObj(msg.apns) && isObj(msg.apns.payload)) checkAps(msg.apns.payload.aps, out);
}

export function validatePush(text: string, platform: PushPlatform, voip = false): PushResult {
  const limit = platform === "apns" ? (voip ? APNS_VOIP_LIMIT : APNS_LIMIT) : FCM_LIMIT;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { jsonOk: false, size: byteSize(text.trim()), limit, findings: [finding("error", "json-invalid", `Invalid JSON: ${(e as Error).message}`, `Некорректный JSON: ${(e as Error).message}`)] };
  }
  const size = byteSize(JSON.stringify(parsed));
  const findings: Finding[] = [];
  if (size > limit) findings.push(finding("error", "too-large", `Payload is ${size} bytes, over the ${limit}-byte limit. The push will be rejected.`, `Пейлоад весит ${size} байт и превышает лимит ${limit} байт. Push будет отклонён.`));
  else if (size > limit * 0.9) findings.push(finding("warning", "near-limit", `Payload is ${size} of ${limit} bytes: little room left for longer localized text.`, `Пейлоад занимает ${size} из ${limit} байт: мало места для более длинных локализованных строк.`));
  if (platform === "apns") checkApns(parsed, findings);
  else checkFcm(parsed, findings);
  return { jsonOk: true, size, limit, findings: sortFindings(findings) };
}

export const SAMPLE_APNS = `{
  "aps": {
    "alert": { "title": "Order shipped", "body": "Your order #1042 is on its way" },
    "badge": 1,
    "sound": "default",
    "mutable-content": 1
  },
  "orderId": "1042"
}`;

export const SAMPLE_FCM = `{
  "message": {
    "token": "DEVICE_REGISTRATION_TOKEN",
    "notification": { "title": "Order shipped", "body": "Your order #1042 is on its way" },
    "data": { "orderId": "1042" },
    "android": { "priority": "HIGH", "ttl": "3600s", "notification": { "channel_id": "orders" } }
  }
}`;
