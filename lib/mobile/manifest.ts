import { Finding, finding, sortFindings } from "./findings";

/** Минимальный разборщик XML: достаточно для AndroidManifest.xml (теги, атрибуты, вложенность). */
export interface XmlNode {
  name: string;
  attrs: Record<string, string>;
  children: XmlNode[];
}

const TAG_RE = /<(\/?)([A-Za-z_][\w.:-]*)((?:\s+[\w.:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;
const ATTR_RE = /([\w.:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

export function parseXml(text: string): { root?: XmlNode; error?: string } {
  const src = text.replace(/<!--[\s\S]*?-->/g, "").replace(/<\?[\s\S]*?\?>/g, "").replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");
  const stack: XmlNode[] = [];
  let root: XmlNode | undefined;
  for (const m of src.matchAll(TAG_RE)) {
    const [, closing, name, rawAttrs, selfClose] = m;
    if (closing) {
      const top = stack.pop();
      if (!top || top.name !== name) return { error: `Unexpected closing tag </${name}>` };
      continue;
    }
    const attrs: Record<string, string> = {};
    for (const a of rawAttrs.matchAll(ATTR_RE)) {
      const key = a[1].startsWith("android:") ? a[1].slice(8) : a[1];
      attrs[key] = a[2] ?? a[3] ?? "";
    }
    const node: XmlNode = { name, attrs, children: [] };
    if (stack.length) stack[stack.length - 1].children.push(node);
    else if (!root) root = node;
    else return { error: "More than one root element" };
    if (!selfClose) stack.push(node);
  }
  if (stack.length) return { error: `Tag <${stack[stack.length - 1].name}> is not closed` };
  if (!root) return { error: "No XML elements found" };
  return { root };
}

const P = "android.permission.";

/** Опасные (runtime) разрешения Android: пользователь выдаёт их диалогом. */
const DANGEROUS = new Set([
  "READ_CALENDAR", "WRITE_CALENDAR", "CAMERA", "READ_CONTACTS", "WRITE_CONTACTS", "GET_ACCOUNTS",
  "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "ACCESS_BACKGROUND_LOCATION", "RECORD_AUDIO",
  "READ_PHONE_STATE", "READ_PHONE_NUMBERS", "CALL_PHONE", "ANSWER_PHONE_CALLS", "READ_CALL_LOG",
  "WRITE_CALL_LOG", "ADD_VOICEMAIL", "USE_SIP", "PROCESS_OUTGOING_CALLS", "BODY_SENSORS",
  "BODY_SENSORS_BACKGROUND", "ACTIVITY_RECOGNITION", "SEND_SMS", "RECEIVE_SMS", "READ_SMS",
  "RECEIVE_WAP_PUSH", "RECEIVE_MMS", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE",
  "ACCESS_MEDIA_LOCATION", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO", "READ_MEDIA_AUDIO",
  "READ_MEDIA_VISUAL_USER_SELECTED", "POST_NOTIFICATIONS", "NEARBY_WIFI_DEVICES",
  "BLUETOOTH_CONNECT", "BLUETOOTH_SCAN", "BLUETOOTH_ADVERTISE", "UWB_RANGING",
]);

/** Разрешения особого доступа: магазины и пользователи смотрят на них пристально. */
const SPECIAL = new Set([
  "SYSTEM_ALERT_WINDOW", "MANAGE_EXTERNAL_STORAGE", "REQUEST_INSTALL_PACKAGES", "QUERY_ALL_PACKAGES",
  "SCHEDULE_EXACT_ALARM", "USE_EXACT_ALARM", "WRITE_SETTINGS", "USE_FULL_SCREEN_INTENT", "READ_LOGS",
  "BIND_ACCESSIBILITY_SERVICE", "BIND_DEVICE_ADMIN",
]);

export type PermissionKind = "dangerous" | "special" | "normal";

export function classifyPermission(name: string): PermissionKind {
  const short = name.startsWith(P) ? name.slice(P.length) : name.startsWith("com.android.voicemail.permission.") ? name.split(".").pop() ?? "" : "";
  if (!short) return "normal";
  if (SPECIAL.has(short)) return "special";
  if (DANGEROUS.has(short)) return "dangerous";
  return "normal";
}

export interface ManifestComponent {
  type: "activity" | "service" | "receiver" | "provider";
  name: string;
  exported: "true" | "false" | "unset";
  permission: string;
  filters: number;
  isLauncher: boolean;
}

export interface ManifestAnalysis {
  ok: boolean;
  error?: string;
  summary: { package: string; versionName: string; versionCode: string; minSdk: string; targetSdk: string; compileSdk: string };
  permissions: { name: string; kind: PermissionKind }[];
  components: ManifestComponent[];
  deepLinks: string[];
  findings: Finding[];
}

const EMPTY_SUMMARY = { package: "", versionName: "", versionCode: "", minSdk: "", targetSdk: "", compileSdk: "" };

function descend(node: XmlNode, name: string): XmlNode[] {
  return node.children.filter((c) => c.name === name);
}

export function analyzeManifest(text: string): ManifestAnalysis {
  const parsed = parseXml(text);
  if (parsed.error || !parsed.root) {
    return { ok: false, error: parsed.error ?? "Empty input", summary: EMPTY_SUMMARY, permissions: [], components: [], deepLinks: [], findings: [] };
  }
  const root = parsed.root;
  if (root.name !== "manifest") {
    return { ok: false, error: `Root element is <${root.name}>, expected <manifest>`, summary: EMPTY_SUMMARY, permissions: [], components: [], deepLinks: [], findings: [] };
  }

  const findings: Finding[] = [];
  const sdk = descend(root, "uses-sdk")[0];
  const targetNum = sdk?.attrs.targetSdkVersion ? parseInt(sdk.attrs.targetSdkVersion, 10) : NaN;
  const summary = {
    package: root.attrs.package ?? "",
    versionName: root.attrs.versionName ?? "",
    versionCode: root.attrs.versionCode ?? "",
    minSdk: sdk?.attrs.minSdkVersion ?? "",
    targetSdk: sdk?.attrs.targetSdkVersion ?? "",
    compileSdk: root.attrs.compileSdkVersion ?? "",
  };
  if (!sdk) {
    findings.push(finding("info", "no-uses-sdk",
      "No <uses-sdk> element. In Gradle projects minSdk and targetSdk live in build.gradle; paste the merged manifest to see them.",
      "Нет элемента <uses-sdk>. В Gradle-проектах minSdk и targetSdk задаются в build.gradle; вставьте merged manifest, чтобы увидеть их."));
  }

  // ── Разрешения ──
  const seen = new Set<string>();
  const permissions: ManifestAnalysis["permissions"] = [];
  for (const el of root.children.filter((c) => c.name === "uses-permission" || c.name === "uses-permission-sdk-23")) {
    const name = el.attrs.name;
    if (!name) continue;
    if (seen.has(name)) {
      findings.push(finding("info", "dup-permission", `Permission ${name} is declared more than once.`, `Разрешение ${name} объявлено больше одного раза.`));
      continue;
    }
    seen.add(name);
    const kind = classifyPermission(name);
    permissions.push({ name, kind });
    if (kind === "special") {
      findings.push(finding("warning", "special-permission", `${name} is a special-access permission that stores and users scrutinize; make sure it is justified.`, `${name} относится к особому доступу, на него пристально смотрят магазины и пользователи; убедитесь, что он нужен.`));
    }
    if (name === `${P}READ_EXTERNAL_STORAGE` && targetNum >= 33) {
      findings.push(finding("info", "legacy-storage", "READ_EXTERNAL_STORAGE has no effect for media on Android 13+; use READ_MEDIA_IMAGES, READ_MEDIA_VIDEO or the photo picker.", "READ_EXTERNAL_STORAGE не даёт доступа к медиа на Android 13+; используйте READ_MEDIA_IMAGES, READ_MEDIA_VIDEO или photo picker."));
    }
  }

  // ── Application ──
  const app = descend(root, "application")[0];
  const components: ManifestComponent[] = [];
  const deepLinks: string[] = [];
  if (app) {
    if (app.attrs.debuggable === "true") findings.push(finding("error", "debuggable", "android:debuggable=\"true\" must not ship in a release build: anyone can attach a debugger and read app data.", "android:debuggable=\"true\" нельзя выпускать в релиз: любой сможет подключить отладчик и читать данные приложения."));
    if (app.attrs.testOnly === "true") findings.push(finding("warning", "test-only", "android:testOnly=\"true\" apps cannot be installed from stores.", "Приложения с android:testOnly=\"true\" нельзя установить из магазинов."));
    if (app.attrs.usesCleartextTraffic === "true") findings.push(finding("warning", "cleartext", "usesCleartextTraffic=\"true\" allows unencrypted HTTP traffic.", "usesCleartextTraffic=\"true\" разрешает незашифрованный HTTP-трафик."));
    if (app.attrs.allowBackup === "true") findings.push(finding("warning", "allow-backup", "allowBackup=\"true\" lets app data be backed up; disable it or define backup rules if the data is sensitive.", "allowBackup=\"true\" позволяет делать резервную копию данных; отключите или задайте правила, если данные чувствительные."));
    else if (app.attrs.allowBackup === undefined) findings.push(finding("info", "backup-default", "allowBackup is not set and defaults to true.", "allowBackup не задан и по умолчанию равен true."));

    for (const type of ["activity", "activity-alias", "service", "receiver", "provider"] as const) {
      for (const el of descend(app, type)) {
        const kind = (type === "activity-alias" ? "activity" : type) as ManifestComponent["type"];
        const name = el.attrs.name ?? el.attrs.targetActivity ?? "(unnamed)";
        const filters = descend(el, "intent-filter");
        const exported = el.attrs.exported === "true" ? "true" : el.attrs.exported === "false" ? "false" : "unset";
        const permission = el.attrs.permission ?? "";
        let isLauncher = false;
        for (const f of filters) {
          const actions = descend(f, "action").map((a) => a.attrs.name);
          const cats = descend(f, "category").map((c) => c.attrs.name);
          if (cats.includes("android.intent.category.LAUNCHER")) isLauncher = true;
          if (actions.includes("android.intent.action.VIEW") && cats.includes("android.intent.category.BROWSABLE")) {
            const datas = descend(f, "data");
            const schemes = datas.map((d) => d.attrs.scheme).filter(Boolean) as string[];
            const hosts = datas.map((d) => d.attrs.host).filter(Boolean) as string[];
            const paths = datas.map((d) => d.attrs.path ? d.attrs.path : d.attrs.pathPrefix ? `${d.attrs.pathPrefix}*` : d.attrs.pathPattern ? d.attrs.pathPattern : "").filter(Boolean);
            const web = schemes.some((s) => s === "http" || s === "https");
            if (web && f.attrs.autoVerify !== "true") {
              findings.push(finding("info", "no-autoverify", `${name}: http/https filter without autoVerify, so it opens a chooser instead of verified App Links.`, `${name}: фильтр http/https без autoVerify, поэтому вместо проверенных App Links откроется окно выбора приложения.`));
            }
            for (const s of schemes.length ? schemes : [""]) {
              for (const h of hosts.length ? hosts : [""]) {
                for (const p of paths.length ? paths : [""]) {
                  if (!s) continue;
                  const link = `${s}://${h}${p ? (p.startsWith("/") ? p : "/" + p) : ""}`;
                  if (!deepLinks.includes(link) && deepLinks.length < 40) deepLinks.push(link);
                }
              }
            }
          }
        }
        components.push({ type: kind, name, exported, permission, filters: filters.length, isLauncher });

        if (filters.length > 0 && exported === "unset") {
          findings.push(finding(targetNum >= 31 ? "error" : "info", "exported-missing",
            `${name} has an intent filter but no android:exported. Apps targeting API 31+ fail to build or install without it.`,
            `${name} имеет intent-фильтр, но не задан android:exported. Приложения с target API 31+ не соберутся или не установятся без него.`));
        }
        if (kind === "provider" && exported === "true" && !permission && !el.attrs.readPermission && !el.attrs.writePermission) {
          findings.push(finding("error", "provider-open", `Provider ${name} is exported without any permission: other apps can read its data.`, `Provider ${name} экспортирован без разрешений: другие приложения могут читать его данные.`));
        } else if ((kind === "service" || kind === "receiver") && exported === "true" && !permission) {
          findings.push(finding("warning", `${kind}-open`, `${kind === "service" ? "Service" : "Receiver"} ${name} is exported without a permission: any app can call it.`, `${kind === "service" ? "Service" : "Receiver"} ${name} экспортирован без разрешения: его может вызвать любое приложение.`));
        }
      }
    }
    if (!components.some((c) => c.isLauncher)) {
      findings.push(finding("info", "no-launcher", "No launcher activity found (MAIN + LAUNCHER intent filter).", "Не найдена launcher-activity (intent-фильтр MAIN + LAUNCHER)."));
    }
  } else {
    findings.push(finding("warning", "no-application", "No <application> element found.", "Элемент <application> не найден."));
  }

  const dangerous = permissions.filter((p) => p.kind === "dangerous").length;
  if (dangerous > 0) {
    findings.push(finding("info", "dangerous-count", `${dangerous} runtime (dangerous) permission${dangerous === 1 ? "" : "s"} declared: each needs a permission-flow test (grant, deny, deny and do not ask again).`, `Объявлено runtime-разрешений: ${dangerous}. Для каждого нужен тест сценария выдачи (разрешить, отклонить, отклонить без повторных запросов).`));
  }

  return { ok: true, summary, permissions, components, deepLinks, findings: sortFindings(findings) };
}
