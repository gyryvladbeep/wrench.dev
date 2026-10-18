import { CommandDef, FieldDef, Values, defaultsFor, join, on, opt, req } from "./command-types";

export const simctlGlobalFields: FieldDef[] = [
  {
    key: "device", type: "text", default: "booted",
    label: "Target device (booted, UDID or name)",
    labelRu: "Целевое устройство (booted, UDID или имя)",
    placeholder: "booted",
  },
];

const PREFIX = "xcrun simctl";

export function simctlDevice(g: Values): string {
  return opt(g, "device") || "booted";
}

const bundleField: FieldDef = {
  key: "bundle", type: "text", default: "com.example.app",
  label: "Bundle identifier", labelRu: "Bundle identifier", placeholder: "com.example.app",
};

export const simctlCommands: CommandDef[] = [
  // ── Симулятор ───────────────────────────────────────────────────────────
  {
    id: "list", group: "Simulator", groupRu: "Симулятор",
    label: "List available simulators", labelRu: "Список доступных симуляторов",
    fields: [{ key: "booted", type: "check", default: false, label: "Only booted devices", labelRu: "Только запущенные устройства" }],
    build: (v) => [join(PREFIX, "list devices", on(v, "booted") ? "booted" : "available")],
  },
  {
    id: "boot", group: "Simulator", groupRu: "Симулятор",
    label: "Boot a simulator", labelRu: "Запустить симулятор",
    note: "Booting needs a concrete UDID or device name, not the word booted. The second command opens the Simulator window.",
    noteRu: "Для запуска нужен конкретный UDID или имя устройства, а не слово booted. Вторая команда открывает окно Simulator.",
    fields: [{ key: "target", type: "text", default: "", label: "UDID or device name", labelRu: "UDID или имя устройства", placeholder: "iPhone 15" }],
    build: (v) => [`${PREFIX} boot "${req(v, "target", "UDID-or-name").replace(/"/g, "")}"`, "open -a Simulator"],
  },
  {
    id: "shutdown", group: "Simulator", groupRu: "Симулятор",
    label: "Shut down a simulator", labelRu: "Выключить симулятор",
    fields: [],
    build: (_v, g) => [join(PREFIX, "shutdown", simctlDevice(g))],
  },
  {
    id: "erase", group: "Simulator", groupRu: "Симулятор",
    label: "Erase all content and settings", labelRu: "Стереть все данные и настройки",
    note: "The device must be shut down before erasing, so both steps are included.",
    noteRu: "Перед стиранием устройство должно быть выключено, поэтому в команду входят оба шага.",
    fields: [],
    build: (_v, g) => [join(PREFIX, "shutdown", simctlDevice(g)), join(PREFIX, "erase", simctlDevice(g))],
  },
  {
    id: "ui-appearance", group: "Simulator", groupRu: "Симулятор",
    label: "Switch light or dark appearance", labelRu: "Светлая или тёмная тема",
    fields: [{ key: "mode", type: "select", default: "dark", label: "Appearance", labelRu: "Тема",
      options: [{ value: "dark", label: "Dark", labelRu: "Тёмная" }, { value: "light", label: "Light", labelRu: "Светлая" }] }],
    build: (v, g) => [join(PREFIX, "ui", simctlDevice(g), "appearance", v.mode === "light" ? "light" : "dark")],
  },
  {
    id: "ui-content-size", group: "Simulator", groupRu: "Симулятор",
    label: "Change Dynamic Type text size", labelRu: "Изменить размер текста Dynamic Type",
    note: "The accessibility sizes are the ones that most often break layouts.",
    noteRu: "Именно размеры accessibility чаще всего ломают вёрстку.",
    fields: [{ key: "size", type: "select", default: "accessibility-extra-large", label: "Content size", labelRu: "Размер текста",
      options: [
        "extra-small", "small", "medium", "large", "extra-large", "extra-extra-large", "extra-extra-extra-large",
        "accessibility-medium", "accessibility-large", "accessibility-extra-large", "accessibility-extra-extra-large", "accessibility-extra-extra-extra-large",
      ].map((s) => ({ value: s, label: s })) }],
    build: (v, g) => [join(PREFIX, "ui", simctlDevice(g), "content_size", opt(v, "size") || "large")],
  },
  {
    id: "status-bar", group: "Simulator", groupRu: "Симулятор",
    label: "Override the status bar", labelRu: "Переопределить статус-бар",
    note: "Gives clean, reproducible screenshots (9:41, full battery, full signal).",
    noteRu: "Даёт чистые воспроизводимые скриншоты (9:41, полная батарея, полный сигнал).",
    fields: [
      { key: "action", type: "select", default: "override", label: "Action", labelRu: "Действие",
        options: [{ value: "override", label: "Override", labelRu: "Переопределить" }, { value: "clear", label: "Clear overrides", labelRu: "Сбросить" }] },
      { key: "time", type: "text", default: "9:41", label: "Time", labelRu: "Время", when: (v) => v.action !== "clear" },
      { key: "battery", type: "text", default: "100", label: "Battery level, %", labelRu: "Уровень заряда, %", when: (v) => v.action !== "clear" },
      { key: "bars", type: "select", default: "4", label: "Cellular bars", labelRu: "Деления сотовой сети", when: (v) => v.action !== "clear",
        options: ["0", "1", "2", "3", "4"].map((s) => ({ value: s, label: s })) },
    ],
    build: (v, g) => {
      const d = simctlDevice(g);
      if (v.action === "clear") return [join(PREFIX, "status_bar", d, "clear")];
      const level = Math.min(100, Math.max(0, parseInt(opt(v, "battery"), 10) || 0));
      return [join(PREFIX, "status_bar", d, "override", "--time", req(v, "time", "time"), "--batteryLevel", String(level), "--cellularBars", opt(v, "bars") || "4")];
    },
  },

  // ── Приложение ──────────────────────────────────────────────────────────
  {
    id: "install", group: "App", groupRu: "Приложение",
    label: "Install an app", labelRu: "Установить приложение",
    fields: [{ key: "path", type: "text", default: "MyApp.app", label: "Path to .app", labelRu: "Путь к .app" }],
    build: (v, g) => [join(PREFIX, "install", simctlDevice(g), req(v, "path", "path-to.app"))],
  },
  {
    id: "uninstall", group: "App", groupRu: "Приложение",
    label: "Uninstall an app", labelRu: "Удалить приложение",
    fields: [bundleField],
    build: (v, g) => [join(PREFIX, "uninstall", simctlDevice(g), req(v, "bundle", "bundle-id"))],
  },
  {
    id: "launch", group: "App", groupRu: "Приложение",
    label: "Launch an app", labelRu: "Запустить приложение",
    note: "--console streams the app's stdout and stderr into your terminal.",
    noteRu: "--console выводит stdout и stderr приложения прямо в терминал.",
    fields: [
      bundleField,
      { key: "console", type: "check", default: false, label: "Stream app output (--console)", labelRu: "Выводить логи приложения (--console)" },
      { key: "restart", type: "check", default: true, label: "Terminate a running copy first", labelRu: "Сначала завершить уже запущенный экземпляр" },
      { key: "args", type: "text", default: "", label: "Launch arguments (optional)", labelRu: "Аргументы запуска (необязательно)", placeholder: "-UITests YES" },
    ],
    build: (v, g) => [
      join(PREFIX, "launch", on(v, "console") && "--console", on(v, "restart") && "--terminate-running-process", simctlDevice(g), req(v, "bundle", "bundle-id"), opt(v, "args")),
    ],
  },
  {
    id: "terminate", group: "App", groupRu: "Приложение",
    label: "Terminate an app", labelRu: "Завершить приложение",
    fields: [bundleField],
    build: (v, g) => [join(PREFIX, "terminate", simctlDevice(g), req(v, "bundle", "bundle-id"))],
  },
  {
    id: "openurl", group: "App", groupRu: "Приложение",
    label: "Open a URL or deep link", labelRu: "Открыть URL или deep link",
    fields: [{ key: "url", type: "text", default: "myapp://product/42?ref=email", label: "URL", labelRu: "URL" }],
    build: (v, g) => [`${PREFIX} openurl ${simctlDevice(g)} "${req(v, "url", "url").replace(/(["`$\\])/g, "\\$1")}"`],
  },
  {
    id: "push", group: "App", groupRu: "Приложение",
    label: "Send a push notification", labelRu: "Отправить push-уведомление",
    note: "The payload file is JSON with an aps key. Without a Bundle ID inside the file, pass it on the command line.",
    noteRu: "Файл пейлоада — JSON с ключом aps. Bundle ID можно указать в самой команде.",
    fields: [bundleField, { key: "payload", type: "text", default: "payload.apns", label: "Payload file", labelRu: "Файл пейлоада" }],
    build: (v, g) => [join(PREFIX, "push", simctlDevice(g), req(v, "bundle", "bundle-id"), req(v, "payload", "payload.apns"))],
  },
  {
    id: "privacy", group: "App", groupRu: "Приложение",
    label: "Grant, revoke or reset a permission", labelRu: "Выдать, отозвать или сбросить разрешение",
    note: "simctl cannot change the camera permission; the camera is not in the list of supported services.",
    noteRu: "simctl не умеет менять разрешение камеры: её нет в списке поддерживаемых сервисов.",
    fields: [
      { key: "action", type: "select", default: "grant", label: "Action", labelRu: "Действие",
        options: [{ value: "grant", label: "Grant", labelRu: "Выдать" }, { value: "revoke", label: "Revoke", labelRu: "Отозвать" }, { value: "reset", label: "Reset", labelRu: "Сбросить" }] },
      { key: "service", type: "select", default: "location", label: "Service", labelRu: "Сервис",
        options: ["all", "calendar", "contacts-limited", "contacts", "location", "location-always", "photos-add", "photos", "media-library", "microphone", "motion", "reminders", "siri"].map((s) => ({ value: s, label: s })) },
      { ...bundleField, label: "Bundle identifier (optional for reset all)", labelRu: "Bundle identifier (для сброса всего можно пропустить)" },
    ],
    build: (v, g) => [join(PREFIX, "privacy", simctlDevice(g), opt(v, "action") || "grant", opt(v, "service") || "all", opt(v, "bundle"))],
  },
  {
    id: "container", group: "App", groupRu: "Приложение",
    label: "Find the app's folder on disk", labelRu: "Найти папку приложения на диске",
    fields: [
      bundleField,
      { key: "kind", type: "select", default: "data", label: "Container", labelRu: "Контейнер",
        options: [{ value: "data", label: "data (documents, caches)", labelRu: "data (документы, кэш)" }, { value: "app", label: "app (the bundle)", labelRu: "app (сам бандл)" }, { value: "groups", label: "groups (app groups)", labelRu: "groups (app groups)" }] },
    ],
    build: (v, g) => [join(PREFIX, "get_app_container", simctlDevice(g), req(v, "bundle", "bundle-id"), opt(v, "kind") || "data")],
  },

  // ── Данные и медиа ──────────────────────────────────────────────────────
  {
    id: "location", group: "Data and media", groupRu: "Данные и медиа",
    label: "Set or clear GPS location", labelRu: "Задать или сбросить геопозицию",
    fields: [
      { key: "action", type: "select", default: "set", label: "Action", labelRu: "Действие",
        options: [{ value: "set", label: "Set", labelRu: "Задать" }, { value: "clear", label: "Clear", labelRu: "Сбросить" }] },
      { key: "lat", type: "text", default: "40.1792", label: "Latitude", labelRu: "Широта", when: (v) => v.action !== "clear" },
      { key: "lon", type: "text", default: "44.4991", label: "Longitude", labelRu: "Долгота", when: (v) => v.action !== "clear" },
    ],
    build: (v, g) => {
      const d = simctlDevice(g);
      if (v.action === "clear") return [join(PREFIX, "location", d, "clear")];
      return [join(PREFIX, "location", d, "set", `${req(v, "lat", "lat")},${req(v, "lon", "lon")}`)];
    },
  },
  {
    id: "addmedia", group: "Data and media", groupRu: "Данные и медиа",
    label: "Add a photo or video to the library", labelRu: "Добавить фото или видео в галерею",
    fields: [{ key: "file", type: "text", default: "photo.jpg", label: "File", labelRu: "Файл" }],
    build: (v, g) => [join(PREFIX, "addmedia", simctlDevice(g), req(v, "file", "file"))],
  },
  {
    id: "keychain", group: "Data and media", groupRu: "Данные и медиа",
    label: "Reset the keychain", labelRu: "Сбросить keychain",
    note: "Clears saved credentials, which a fresh install does not always do on iOS.",
    noteRu: "Очищает сохранённые учётные данные, чего чистая установка на iOS не всегда делает.",
    fields: [],
    build: (_v, g) => [join(PREFIX, "keychain", simctlDevice(g), "reset")],
  },
  {
    id: "screenshot", group: "Data and media", groupRu: "Данные и медиа",
    label: "Take a screenshot", labelRu: "Сделать скриншот",
    fields: [{ key: "file", type: "text", default: "screen.png", label: "File name", labelRu: "Имя файла" }],
    build: (v, g) => [join(PREFIX, "io", simctlDevice(g), "screenshot", req(v, "file", "file.png"))],
  },
  {
    id: "record", group: "Data and media", groupRu: "Данные и медиа",
    label: "Record a video", labelRu: "Записать видео",
    note: "Stop the recording with Ctrl+C; the file is finalized when the command exits.",
    noteRu: "Остановите запись через Ctrl+C: файл финализируется, когда команда завершится.",
    fields: [{ key: "file", type: "text", default: "demo.mov", label: "File name", labelRu: "Имя файла" }],
    build: (v, g) => [join(PREFIX, "io", simctlDevice(g), "recordVideo", req(v, "file", "file.mov"))],
  },
  {
    id: "logs", group: "Data and media", groupRu: "Данные и медиа",
    label: "Stream system logs for an app", labelRu: "Следить за системными логами приложения",
    note: "The predicate filters by subsystem, which is normally the bundle identifier when the app uses os_log.",
    noteRu: "Предикат фильтрует по subsystem — это обычно bundle identifier, если приложение пишет через os_log.",
    fields: [{ ...bundleField, key: "subsystem", label: "Subsystem", labelRu: "Subsystem" }],
    build: (v, g) => [`${PREFIX} spawn ${simctlDevice(g)} log stream --level debug --predicate 'subsystem == "${opt(v, "subsystem").replace(/["']/g, "") || "<subsystem>"}"'`],
  },
];

export const simctlDefaults = (id: string): Values => defaultsFor(simctlCommands.find((c) => c.id === id)?.fields ?? []);
