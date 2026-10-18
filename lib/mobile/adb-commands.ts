import { CommandDef, FieldDef, Values, defaultsFor, join, on, opt, req } from "./command-types";

export const adbGlobalFields: FieldDef[] = [
  {
    key: "serial", type: "text", default: "",
    label: "Device serial (optional, adds -s)",
    labelRu: "Серийный номер устройства (необязательно, добавляет -s)",
    placeholder: "emulator-5554",
  },
];

export function adbPrefix(g: Values): string {
  const serial = opt(g, "serial");
  return serial ? `adb -s ${serial}` : "adb";
}

const pkgField: FieldDef = {
  key: "pkg", type: "text", default: "com.example.app",
  label: "Package name", labelRu: "Имя пакета", placeholder: "com.example.app",
};

export const adbCommands: CommandDef[] = [
  // ── Приложение ──────────────────────────────────────────────────────────
  {
    id: "install", group: "App", groupRu: "Приложение",
    label: "Install APK", labelRu: "Установить APK",
    fields: [
      { key: "apk", type: "text", default: "app-debug.apk", label: "APK path", labelRu: "Путь к APK" },
      { key: "replace", type: "check", default: true, label: "Replace existing app (-r)", labelRu: "Заменить установленное приложение (-r)" },
      { key: "downgrade", type: "check", default: false, label: "Allow version downgrade (-d)", labelRu: "Разрешить понижение версии (-d)" },
      { key: "grant", type: "check", default: false, label: "Grant all runtime permissions (-g)", labelRu: "Выдать все runtime-разрешения (-g)" },
    ],
    build: (v, g) => [
      join(adbPrefix(g), "install", on(v, "replace") && "-r", on(v, "downgrade") && "-d", on(v, "grant") && "-g", req(v, "apk", "path-to.apk")),
    ],
  },
  {
    id: "uninstall", group: "App", groupRu: "Приложение",
    label: "Uninstall app", labelRu: "Удалить приложение",
    fields: [pkgField, { key: "keep", type: "check", default: false, label: "Keep data and cache (-k)", labelRu: "Сохранить данные и кэш (-k)" }],
    build: (v, g) => [join(adbPrefix(g), "uninstall", on(v, "keep") && "-k", req(v, "pkg", "package"))],
  },
  {
    id: "clear", group: "App", groupRu: "Приложение",
    label: "Clear app data", labelRu: "Очистить данные приложения",
    note: "Resets the app to a fresh-install state without reinstalling it.",
    noteRu: "Возвращает приложение к состоянию после чистой установки без переустановки.",
    fields: [pkgField],
    build: (v, g) => [join(adbPrefix(g), "shell pm clear", req(v, "pkg", "package"))],
  },
  {
    id: "launch", group: "App", groupRu: "Приложение",
    label: "Launch app", labelRu: "Запустить приложение",
    note: "The first command starts a specific activity; the second starts the launcher activity without knowing its name.",
    noteRu: "Первая команда запускает конкретную activity, вторая — стартовую activity без знания её имени.",
    fields: [pkgField, { key: "activity", type: "text", default: ".MainActivity", label: "Activity", labelRu: "Activity" }],
    build: (v, g) => {
      const p = adbPrefix(g);
      const pkg = req(v, "pkg", "package");
      return [
        join(p, "shell am start -n", `${pkg}/${req(v, "activity", "activity")}`),
        join(p, "shell monkey -p", pkg, "-c android.intent.category.LAUNCHER 1"),
      ];
    },
  },
  {
    id: "force-stop", group: "App", groupRu: "Приложение",
    label: "Force stop app", labelRu: "Принудительно остановить приложение",
    fields: [pkgField],
    build: (v, g) => [join(adbPrefix(g), "shell am force-stop", req(v, "pkg", "package"))],
  },
  {
    id: "deeplink", group: "App", groupRu: "Приложение",
    label: "Open deep link", labelRu: "Открыть deep link",
    note: "The URL is wrapped in single quotes inside double quotes, so & and ? survive the device shell.",
    noteRu: "URL обёрнут в одинарные кавычки внутри двойных, чтобы & и ? дошли до оболочки устройства без искажений.",
    fields: [
      { key: "url", type: "text", default: "myapp://product/42?ref=email", label: "URL", labelRu: "URL" },
      { key: "pkg", type: "text", default: "", label: "Package (optional, forces this app)", labelRu: "Пакет (необязательно, форсирует это приложение)", placeholder: "com.example.app" },
    ],
    build: (v, g) => {
      const url = req(v, "url", "url").replace(/'/g, "%27");
      return [`${adbPrefix(g)} shell "am start -W -a android.intent.action.VIEW -d '${url}'${opt(v, "pkg") ? " " + opt(v, "pkg") : ""}"`];
    },
  },
  {
    id: "permission", group: "App", groupRu: "Приложение",
    label: "Grant or revoke permission", labelRu: "Выдать или отозвать разрешение",
    fields: [
      pkgField,
      { key: "perm", type: "text", default: "android.permission.CAMERA", label: "Permission", labelRu: "Разрешение" },
      { key: "action", type: "select", default: "grant", label: "Action", labelRu: "Действие",
        options: [{ value: "grant", label: "Grant", labelRu: "Выдать" }, { value: "revoke", label: "Revoke", labelRu: "Отозвать" }] },
    ],
    build: (v, g) => [join(adbPrefix(g), "shell pm", opt(v, "action") || "grant", req(v, "pkg", "package"), req(v, "perm", "permission"))],
  },
  {
    id: "packages", group: "App", groupRu: "Приложение",
    label: "List installed packages", labelRu: "Список установленных пакетов",
    fields: [
      { key: "third", type: "check", default: true, label: "Third-party apps only (-3)", labelRu: "Только сторонние приложения (-3)" },
      { key: "filter", type: "text", default: "", label: "Filter (optional)", labelRu: "Фильтр (необязательно)", placeholder: "example" },
    ],
    build: (v, g) => {
      const filter = opt(v, "filter").replace(/[^A-Za-z0-9._-]/g, "");
      const list = join("pm list packages", on(v, "third") && "-3");
      return [filter ? `${adbPrefix(g)} shell "${list} | grep ${filter}"` : join(adbPrefix(g), "shell", list)];
    },
  },
  {
    id: "current-activity", group: "App", groupRu: "Приложение",
    label: "Show current activity", labelRu: "Показать текущую activity",
    note: "Handy for finding the activity name to use in a launch command or a locator.",
    noteRu: "Удобно, чтобы узнать имя activity для команды запуска или локатора.",
    fields: [],
    build: (_v, g) => [`${adbPrefix(g)} shell "dumpsys activity activities | grep -E 'mResumedActivity|topResumedActivity'"`],
  },

  // ── Экран и ввод ────────────────────────────────────────────────────────
  {
    id: "screenshot", group: "Screen and input", groupRu: "Экран и ввод",
    label: "Take screenshot", labelRu: "Сделать скриншот",
    note: "Saved on the device first, then pulled, so it also works in PowerShell where redirecting binary output corrupts the PNG.",
    noteRu: "Сначала сохраняется на устройстве, затем скачивается — так работает и в PowerShell, где перенаправление бинарного вывода портит PNG.",
    fields: [{ key: "file", type: "text", default: "screen.png", label: "File name", labelRu: "Имя файла" }],
    build: (v, g) => {
      const p = adbPrefix(g);
      const f = req(v, "file", "file.png");
      return [join(p, "shell screencap -p", `/sdcard/${f}`), join(p, "pull", `/sdcard/${f}`, "."), join(p, "shell rm", `/sdcard/${f}`)];
    },
  },
  {
    id: "record", group: "Screen and input", groupRu: "Экран и ввод",
    label: "Record screen", labelRu: "Записать видео экрана",
    note: "screenrecord stops after the time limit (180 seconds is the maximum) or on Ctrl+C.",
    noteRu: "screenrecord останавливается по лимиту времени (максимум 180 секунд) или по Ctrl+C.",
    fields: [
      { key: "file", type: "text", default: "demo.mp4", label: "File name", labelRu: "Имя файла" },
      { key: "limit", type: "text", default: "30", label: "Time limit, seconds", labelRu: "Лимит времени, секунд" },
      { key: "size", type: "text", default: "", label: "Size (optional)", labelRu: "Размер (необязательно)", placeholder: "720x1280" },
    ],
    build: (v, g) => {
      const p = adbPrefix(g);
      const f = req(v, "file", "file.mp4");
      const limit = Math.min(180, Math.max(1, parseInt(opt(v, "limit"), 10) || 30));
      return [
        join(p, "shell screenrecord", `--time-limit ${limit}`, opt(v, "size") && `--size ${opt(v, "size")}`, `/sdcard/${f}`),
        join(p, "pull", `/sdcard/${f}`, "."),
        join(p, "shell rm", `/sdcard/${f}`),
      ];
    },
  },
  {
    id: "input", group: "Screen and input", groupRu: "Экран и ввод",
    label: "Tap, type or press a key", labelRu: "Тап, ввод текста или нажатие клавиши",
    fields: [
      { key: "kind", type: "select", default: "tap", label: "Input type", labelRu: "Тип ввода",
        options: [{ value: "tap", label: "Tap", labelRu: "Тап" }, { value: "text", label: "Type text", labelRu: "Ввод текста" }, { value: "key", label: "Key event", labelRu: "Клавиша" }] },
      { key: "x", type: "text", default: "540", label: "X", labelRu: "X", when: (v) => v.kind === "tap" },
      { key: "y", type: "text", default: "960", label: "Y", labelRu: "Y", when: (v) => v.kind === "tap" },
      { key: "text", type: "text", default: "hello world", label: "Text", labelRu: "Текст", when: (v) => v.kind === "text" },
      { key: "key", type: "select", default: "KEYCODE_BACK", label: "Key", labelRu: "Клавиша", when: (v) => v.kind === "key",
        options: [
          { value: "KEYCODE_BACK", label: "Back (4)", labelRu: "Назад (4)" },
          { value: "KEYCODE_HOME", label: "Home (3)", labelRu: "Домой (3)" },
          { value: "KEYCODE_APP_SWITCH", label: "App switcher (187)", labelRu: "Переключатель приложений (187)" },
          { value: "KEYCODE_ENTER", label: "Enter (66)", labelRu: "Enter (66)" },
          { value: "KEYCODE_POWER", label: "Power (26)", labelRu: "Питание (26)" },
          { value: "KEYCODE_VOLUME_UP", label: "Volume up (24)", labelRu: "Громкость вверх (24)" },
        ] },
    ],
    build: (v, g) => {
      const p = adbPrefix(g);
      if (v.kind === "text") {
        // input text не принимает пробелы, их заменяют на %s; метасимволы оболочки убираем.
        const t = opt(v, "text").replace(/\s+/g, "%s").replace(/[^A-Za-z0-9%._@-]/g, "");
        return [join(p, "shell input text", t || "<text>")];
      }
      if (v.kind === "key") return [join(p, "shell input keyevent", opt(v, "key") || "KEYCODE_BACK")];
      return [join(p, "shell input tap", req(v, "x", "x"), req(v, "y", "y"))];
    },
  },
  {
    id: "display", group: "Screen and input", groupRu: "Экран и ввод",
    label: "Change screen size and density", labelRu: "Изменить размер и плотность экрана",
    note: "Useful for reproducing layouts on small screens. Always reset afterwards.",
    noteRu: "Полезно для проверки вёрстки на маленьких экранах. После проверки обязательно сбросьте.",
    fields: [
      { key: "reset", type: "check", default: false, label: "Reset to the device defaults", labelRu: "Сбросить к значениям устройства" },
      { key: "size", type: "text", default: "720x1280", label: "Size", labelRu: "Размер", when: (v) => v.reset !== true },
      { key: "density", type: "text", default: "320", label: "Density, dpi", labelRu: "Плотность, dpi", when: (v) => v.reset !== true },
    ],
    build: (v, g) => {
      const p = adbPrefix(g);
      if (on(v, "reset")) return [join(p, "shell wm size reset"), join(p, "shell wm density reset")];
      return [join(p, "shell wm size", req(v, "size", "WxH")), join(p, "shell wm density", req(v, "density", "dpi"))];
    },
  },
  {
    id: "font-scale", group: "Screen and input", groupRu: "Экран и ввод",
    label: "Change system font scale", labelRu: "Изменить масштаб шрифта системы",
    note: "1.0 is the default. Accessibility settings usually go up to about 1.3 to 2.0.",
    noteRu: "1.0 — значение по умолчанию. В настройках доступности обычно доступны значения примерно от 1.3 до 2.0.",
    fields: [{ key: "scale", type: "text", default: "1.3", label: "Font scale", labelRu: "Масштаб шрифта" }],
    build: (v, g) => [join(adbPrefix(g), "shell settings put system font_scale", req(v, "scale", "scale"))],
  },
  {
    id: "animations", group: "Screen and input", groupRu: "Экран и ввод",
    label: "Disable or enable animations", labelRu: "Отключить или включить анимации",
    note: "Turning animations off makes UI automation noticeably faster and less flaky.",
    noteRu: "Без анимаций UI-автоматизация работает заметно быстрее и стабильнее.",
    fields: [{ key: "state", type: "select", default: "off", label: "Animations", labelRu: "Анимации",
      options: [{ value: "off", label: "Off", labelRu: "Выключить" }, { value: "on", label: "On", labelRu: "Включить" }] }],
    build: (v, g) => {
      const n = v.state === "on" ? "1" : "0";
      const p = adbPrefix(g);
      return ["window_animation_scale", "transition_animation_scale", "animator_duration_scale"].map((k) => join(p, "shell settings put global", k, n));
    },
  },

  // ── Сеть, батарея, язык ─────────────────────────────────────────────────
  {
    id: "network", group: "Network, battery, language", groupRu: "Сеть, батарея, язык",
    label: "Toggle Wi-Fi, mobile data or airplane mode", labelRu: "Wi-Fi, мобильные данные или авиарежим",
    note: "The airplane-mode command needs Android 11 or newer.",
    noteRu: "Команда авиарежима требует Android 11 или новее.",
    fields: [
      { key: "target", type: "select", default: "wifi", label: "Switch", labelRu: "Что переключаем",
        options: [{ value: "wifi", label: "Wi-Fi", labelRu: "Wi-Fi" }, { value: "data", label: "Mobile data", labelRu: "Мобильные данные" }, { value: "airplane", label: "Airplane mode", labelRu: "Авиарежим" }] },
      { key: "state", type: "select", default: "disable", label: "State", labelRu: "Состояние",
        options: [{ value: "enable", label: "Enable", labelRu: "Включить" }, { value: "disable", label: "Disable", labelRu: "Выключить" }] },
    ],
    build: (v, g) => {
      const p = adbPrefix(g);
      const state = v.state === "enable" ? "enable" : "disable";
      if (v.target === "airplane") return [join(p, "shell cmd connectivity airplane-mode", state)];
      return [join(p, "shell svc", v.target === "data" ? "data" : "wifi", state)];
    },
  },
  {
    id: "battery", group: "Network, battery, language", groupRu: "Сеть, батарея, язык",
    label: "Simulate battery level", labelRu: "Имитировать уровень заряда",
    fields: [
      { key: "reset", type: "check", default: false, label: "Reset to the real battery state", labelRu: "Вернуть реальное состояние батареи" },
      { key: "level", type: "text", default: "15", label: "Battery level, %", labelRu: "Уровень заряда, %", when: (v) => v.reset !== true },
    ],
    build: (v, g) => {
      const p = adbPrefix(g);
      if (on(v, "reset")) return [join(p, "shell dumpsys battery reset")];
      const level = Math.min(100, Math.max(0, parseInt(opt(v, "level"), 10) || 0));
      return [join(p, "shell dumpsys battery unplug"), join(p, "shell dumpsys battery set level", String(level))];
    },
  },
  {
    id: "locale", group: "Network, battery, language", groupRu: "Сеть, батарея, язык",
    label: "Set per-app language", labelRu: "Задать язык для одного приложения",
    note: "Needs Android 13 (API 33) or newer.",
    noteRu: "Требует Android 13 (API 33) или новее.",
    fields: [pkgField, { key: "tag", type: "text", default: "ru-RU", label: "Language tag", labelRu: "Языковой тег", placeholder: "ru-RU" }],
    build: (v, g) => [join(adbPrefix(g), "shell cmd locale set-app-locales", req(v, "pkg", "package"), "--locales", req(v, "tag", "language-tag"))],
  },
  {
    id: "logcat", group: "Network, battery, language", groupRu: "Сеть, батарея, язык",
    label: "Read logcat", labelRu: "Читать logcat",
    note: "Clearing first makes the log contain only the steps you are about to reproduce.",
    noteRu: "Предварительная очистка оставит в логе только шаги, которые вы сейчас воспроизведёте.",
    fields: [
      { key: "tag", type: "text", default: "", label: "Tag (optional)", labelRu: "Тег (необязательно)", placeholder: "MyApp" },
      { key: "prio", type: "select", default: "E", label: "Minimum priority", labelRu: "Минимальный приоритет",
        options: [
          { value: "V", label: "Verbose" }, { value: "D", label: "Debug" }, { value: "I", label: "Info" },
          { value: "W", label: "Warning" }, { value: "E", label: "Error" }, { value: "F", label: "Fatal" },
        ] },
      { key: "dump", type: "check", default: false, label: "Dump and exit (-d)", labelRu: "Вывести и завершиться (-d)" },
      { key: "clear", type: "check", default: true, label: "Clear the log first", labelRu: "Сначала очистить лог" },
    ],
    build: (v, g) => {
      const p = adbPrefix(g);
      const prio = opt(v, "prio") || "E";
      const tag = opt(v, "tag").replace(/[^A-Za-z0-9._-]/g, "");
      const filter = tag ? `${tag}:${prio} *:S` : `*:${prio}`;
      const lines: string[] = [];
      if (on(v, "clear")) lines.push(join(p, "logcat -c"));
      lines.push(join(p, "logcat -v time", on(v, "dump") && "-d", filter));
      return lines;
    },
  },
];

export const adbDefaults = (id: string): Values => defaultsFor(adbCommands.find((c) => c.id === id)?.fields ?? []);
