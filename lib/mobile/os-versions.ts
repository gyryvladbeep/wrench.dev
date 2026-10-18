/**
 * Справочник версий Android и iOS для тестировщика.
 * Данные собраны из официальных заметок о выпусках; дата указана с точностью,
 * в которой она проверена (год или месяц). Проверяйте детали в документации
 * платформы перед принятием решений по поддержке версий.
 */
export interface OsVersion {
  platform: "android" | "ios";
  /** Версия для показа: "14", "12L", "26". */
  version: string;
  /** Для Android - уровень API. */
  api?: number;
  name?: string;
  released: string;
  notes: { en: string; ru: string }[];
}

const n = (en: string, ru: string) => ({ en, ru });

export const OS_VERSIONS: OsVersion[] = [
  // ── Android ─────────────────────────────────────────────────────────────
  { platform: "android", version: "17", api: 37, released: "2026-06", notes: [
    n("Local network access is blocked by default for apps targeting API 37 and needs the ACCESS_LOCAL_NETWORK permission.", "Доступ к локальной сети по умолчанию закрыт для приложений с target API 37 и требует разрешения ACCESS_LOCAL_NETWORK."),
    n("Apps targeting API 37 can no longer opt out of orientation and resizability rules on large screens (games are exempt).", "Приложения с target API 37 больше не могут отказаться от правил ориентации и изменения размера на больших экранах (игры исключены)."),
    n("System-enforced memory limits can terminate an app; the exit reason shows MemoryLimiter:AnonSwap.", "Системные лимиты памяти могут завершать приложение; причина выхода содержит MemoryLimiter:AnonSwap."),
    n("Certificate Transparency is on by default; SMS OTP delivery to non-intended recipients is delayed.", "Certificate Transparency включён по умолчанию; доставка SMS с одноразовыми кодами непредназначенным получателям задерживается."),
  ] },
  { platform: "android", version: "16", api: 36, released: "2025-06", notes: [
    n("For apps targeting API 36 the opt-out from edge-to-edge is removed.", "Для приложений с target API 36 убрана возможность отказаться от edge-to-edge."),
    n("Predictive back gesture is enabled by default for apps targeting API 36.", "Жест predictive back включён по умолчанию для приложений с target API 36."),
  ] },
  { platform: "android", version: "15", api: 35, released: "2024", notes: [
    n("Edge-to-edge is enforced for apps targeting API 35: content draws under system bars unless you handle insets.", "Edge-to-edge принудителен для приложений с target API 35: контент рисуется под системными панелями, если не обработать insets."),
    n("Check layouts with the status bar, navigation bar and display cutouts.", "Проверяйте вёрстку с учётом строки состояния, панели навигации и вырезов экрана."),
  ] },
  { platform: "android", version: "14", api: 34, released: "2023", notes: [
    n("Foreground services must declare a service type.", "Foreground-сервисы обязаны объявлять тип сервиса."),
    n("Partial photo and video access: users can grant access to selected items only.", "Частичный доступ к фото и видео: пользователь может открыть только выбранные файлы."),
  ] },
  { platform: "android", version: "13", api: 33, released: "2022", notes: [
    n("Notifications need the POST_NOTIFICATIONS runtime permission.", "Для уведомлений нужно runtime-разрешение POST_NOTIFICATIONS."),
    n("Per-app language preferences; granular media permissions (READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, READ_MEDIA_AUDIO) and the photo picker.", "Язык для отдельного приложения; детальные медиа-разрешения (READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, READ_MEDIA_AUDIO) и photo picker."),
  ] },
  { platform: "android", version: "12L", api: 32, released: "2022", notes: [
    n("Feature drop for large screens and foldables: taskbar and improved multi-window.", "Обновление для больших экранов и складных устройств: панель задач и улучшенный multi-window."),
  ] },
  { platform: "android", version: "12", api: 31, released: "2021", notes: [
    n("android:exported must be set explicitly on every component with an intent filter, otherwise the build or install fails.", "android:exported нужно явно задавать у каждого компонента с intent-фильтром, иначе сборка или установка падает."),
    n("Approximate location option and the splash screen API.", "Выбор примерной геопозиции и API splash screen."),
  ] },
  { platform: "android", version: "11", api: 30, released: "2020", notes: [
    n("Scoped storage is enforced; one-time permissions; package visibility filtering (queries element).", "Принудительный scoped storage; разовые разрешения; фильтрация видимости пакетов (элемент queries)."),
  ] },
  { platform: "android", version: "10", api: 29, released: "2019", notes: [
    n("Scoped storage introduced; background location is a separate permission; system-wide dark theme.", "Появился scoped storage; фоновая геопозиция стала отдельным разрешением; системная тёмная тема."),
  ] },
  { platform: "android", version: "9", api: 28, released: "2018", notes: [
    n("Cleartext HTTP is blocked by default for apps targeting API 28.", "Cleartext HTTP заблокирован по умолчанию для приложений с target API 28."),
    n("Display cutout support: check notches.", "Поддержка вырезов экрана: проверяйте челки."),
  ] },
  { platform: "android", version: "8.1", api: 27, released: "2017", notes: [
    n("Maintenance release of Android 8.0.", "Сервисный выпуск Android 8.0."),
  ] },
  { platform: "android", version: "8.0", api: 26, released: "2017", notes: [
    n("Notification channels are required for notifications; background execution limits apply.", "Для уведомлений обязательны каналы; действуют ограничения фоновой работы."),
  ] },

  // ── iOS ─────────────────────────────────────────────────────────────────
  { platform: "ios", version: "27", released: "2026-09", notes: [
    n("Released on September 14, 2026. Requires iPhone 11 or newer.", "Выпущена 14 сентября 2026. Требует iPhone 11 или новее."),
  ] },
  { platform: "ios", version: "26", released: "2025-09", notes: [
    n("Liquid Glass redesign: recheck custom bars, tab bars, icons and contrast. Version numbers now follow the year, after iOS 18.", "Редизайн Liquid Glass: перепроверьте кастомные панели, таббары, иконки и контраст. Нумерация теперь по году, после iOS 18."),
  ] },
  { platform: "ios", version: "18", released: "2024-09", notes: [
    n("Customizable Home Screen icons (tinted, dark) and Control Center; limited contacts access.", "Настраиваемые иконки домашнего экрана (тонированные, тёмные) и Пункт управления; ограниченный доступ к контактам."),
  ] },
  { platform: "ios", version: "17", released: "2023", notes: [
    n("Interactive widgets and StandBy mode.", "Интерактивные виджеты и режим StandBy."),
  ] },
  { platform: "ios", version: "16", released: "2022", notes: [
    n("Lock Screen widgets and Live Activities (from 16.1); paste permission prompt.", "Виджеты экрана блокировки и Live Activities (с 16.1); запрос разрешения на вставку."),
  ] },
  { platform: "ios", version: "15", released: "2021", notes: [
    n("Focus modes and notification interruption levels, including time-sensitive.", "Режимы фокусировки и уровни важности уведомлений, включая time-sensitive."),
  ] },
  { platform: "ios", version: "14", released: "2020", notes: [
    n("Local network permission prompt, limited photo library access, approximate location, Home Screen widgets and App Clips.", "Запрос разрешения на локальную сеть, ограниченный доступ к фотографиям, примерная геопозиция, виджеты домашнего экрана и App Clips."),
    n("App Tracking Transparency prompt arrived in iOS 14.5.", "Запрос App Tracking Transparency появился в iOS 14.5."),
  ] },
  { platform: "ios", version: "13", released: "2019", notes: [
    n("Dark Mode, Sign in with Apple and the new card-style modal presentation.", "Тёмная тема, Sign in with Apple и новый карточный стиль модальных экранов."),
  ] },
];

export function filterVersions(platform: "android" | "ios", query: string): OsVersion[] {
  const q = query.trim().toLowerCase();
  return OS_VERSIONS.filter((v) => {
    if (v.platform !== platform) return false;
    if (!q) return true;
    const hay = [v.version, v.api ? `api ${v.api}` : "", String(v.api ?? ""), v.released, ...v.notes.flatMap((x) => [x.en, x.ru])].join(" ").toLowerCase();
    return hay.includes(q);
  });
}
