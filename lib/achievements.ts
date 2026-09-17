import type { GameIconId } from "@/components/icons/GameIcons";

export interface Badge {
  id:          string;
  label:       string;
  labelRu:     string;
  description: string;
  descriptionRu: string;
  // Раньше тут был эмодзи прямо в данных — убрали эмодзи из продукта
  // целиком, теперь тут id иконки из components/icons/GameIcons.tsx.
  icon:        GameIconId;
  color:       string;
}

// Дата отсечки для бейджа "Первопроходец" (founding_member) — все, кто
// зарегистрировался ДО этой даты, получают его автоматически, ничего
// специально делать не нужно. ~2 недели после появления системы
// достижений в проде (2026-09-17): успеют узнать про фичу и застать
// момент запуска, но бейдж не превращается в "просто зарегистрировался
// когда-либо" для всех подряд и через год.
export const FOUNDING_MEMBER_CUTOFF = Date.parse("2026-10-01T00:00:00Z");

// ═══════════════════════════════════════════════════════════════════
// Достижения как статус (2026-09-17)
// ═══════════════════════════════════════════════════════════════════
// Раньше пул был из 14 бейджей, и вся эта функция была ЧИСТО живой:
// ничего никогда не писалось в таблицу achievements (она существовала в
// схеме, но не читалась и не писалась нигде — см. комментарии в
// PublicProfileView.tsx до этой правки). Из-за этого бейдж, завязанный
// на current_streak, буквально исчезал с публичного профиля при сбросе
// стрика, даже если он держался месяц.
//
// Теперь: checkAchievements() остаётся чистой функцией (та же сигнатура
// подхода — вход "сырая статистика", выход "id заработанных бейджей"),
// но вызывающий код на приватной странице (app/[locale]/profile/page.tsx)
// один раз ЗАПИСЫВАЕТ каждый новый заработанный id в achievements
// (upsert, ON CONFLICT DO NOTHING благодаря существующему
// UNIQUE(user_id, badge_id)) и дальше показывает ОБЪЕДИНЕНИЕ живого
// пересчёта с уже когда-либо записанными id — заработанное однажды
// больше не пропадает. Сама эта функция ничего не знает о базе, она
// как и раньше используется и на публичной странице профиля
// (PublicProfileView.tsx) с урезанным набором полей (там доступна
// только публичная streak-статистика, не избранное/рабочие столы/
// история инструментов чужого пользователя — расширять набор оттуда
// значило бы открывать новые публичные RLS-политики ради каждого поля).
//
// Новые поля во входе — все опциональны и все берутся из данных, уже
// существующих в проекте (без новых таблиц/запросов): избранное
// (useFavorites), рабочие столы (useWorkbenches), история инструментов
// (tool_history, уже читается на /profile), роль/сложность решённых
// задач (challenge_attempts join, уже читается там же), дата регистрации
// (user.created_at из auth-сессии).
export function checkAchievements(stats: {
  total_solved: number;
  total_points: number;
  current_streak: number;
  longest_streak?: number;
  qa_solved?: number;
  frontend_solved?: number;
  backend_solved?: number;
  hard_solved?: number;
  isPro?: boolean;
  favorites_count?: number;
  workbench_count?: number;
  workbench_tools_count?: number;
  distinct_tools_used?: number;
  max_single_tool_uses?: number;
  used_night_hours?: boolean;
  used_weekend?: boolean;
  account_created_at?: string | null;
}): string[] {
  const earned: string[] = [];

  // Стрики
  if (stats.total_solved >= 1)     earned.push("first_solve");
  if (stats.current_streak >= 3)   earned.push("streak_3");
  if (stats.current_streak >= 7)   earned.push("streak_7");
  if (stats.current_streak >= 30)  earned.push("streak_30");
  if (stats.current_streak >= 100) earned.push("streak_100");
  if ((stats.longest_streak ?? 0) >= 7 && stats.current_streak === 0 && stats.total_solved > 0) {
    earned.push("phoenix");
  }

  // Решённые задачи и очки
  if (stats.total_solved >= 10)   earned.push("solved_10");
  if (stats.total_solved >= 50)   earned.push("solved_50");
  if (stats.total_solved >= 100)  earned.push("solved_100");
  if (stats.total_solved >= 250)  earned.push("solved_250");
  if (stats.total_points >= 500)  earned.push("points_500");
  if (stats.total_points >= 1000) earned.push("points_1000");
  if (stats.total_points >= 5000) earned.push("points_5000");
  if (stats.total_solved === 42)   earned.push("the_answer");
  if (stats.total_points === 1337) earned.push("leet");

  // Роль/сложность
  if ((stats.qa_solved ?? 0) >= 10)       earned.push("qa_master");
  if ((stats.frontend_solved ?? 0) >= 10) earned.push("frontend_pro");
  if ((stats.backend_solved ?? 0) >= 10)  earned.push("backend_guru");
  if ((stats.qa_solved ?? 0) >= 1 && (stats.frontend_solved ?? 0) >= 1 && (stats.backend_solved ?? 0) >= 1) {
    earned.push("generalist");
  }
  if ((stats.hard_solved ?? 0) >= 5) earned.push("hard_mode");

  // Инструменты / рабочие столы / избранное
  if ((stats.distinct_tools_used ?? 0) >= 15)   earned.push("polyglot");
  if ((stats.max_single_tool_uses ?? 0) >= 20)  earned.push("one_trick_pony");
  if ((stats.workbench_count ?? 0) >= 3)        earned.push("workbench_architect");
  if ((stats.workbench_count ?? 0) >= 5)        earned.push("over_engineer");
  if ((stats.workbench_tools_count ?? 0) >= 15) earned.push("tool_belt");
  if ((stats.favorites_count ?? 0) >= 25)       earned.push("pack_rat");

  // Привычки
  if (stats.used_night_hours) earned.push("insomniac");
  if (stats.used_weekend)     earned.push("weekend_warrior");

  // Статус / прочее
  if (stats.isPro) earned.push("pro_member");
  if (stats.account_created_at && Date.parse(stats.account_created_at) < FOUNDING_MEMBER_CUTOFF) {
    earned.push("founding_member");
  }

  return earned;
}

export const BADGES: Badge[] = [
  // ─── Исходные 14 — без изменений ───
  { id: "first_solve",   label: "First Blood",     labelRu: "Первая кровь",     description: "Solved your first challenge",          descriptionRu: "Решил первую задачу",            icon: "lightning", color: "amber" },
  { id: "streak_3",      label: "On Fire",         labelRu: "В огне",           description: "3-day streak",                         descriptionRu: "Серия 3 дня",                    icon: "fire",      color: "orange" },
  { id: "streak_7",      label: "Week Warrior",    labelRu: "Воин недели",      description: "7-day streak",                         descriptionRu: "Серия 7 дней",                   icon: "flag",      color: "red" },
  { id: "streak_30",     label: "Unstoppable",     labelRu: "Неостановимый",    description: "30-day streak",                        descriptionRu: "Серия 30 дней",                  icon: "diamond",   color: "violet" },
  { id: "solved_10",     label: "Getting Started", labelRu: "Хорошее начало",   description: "Solved 10 challenges",                 descriptionRu: "10 решённых задач",              icon: "target",    color: "blue" },
  { id: "solved_50",     label: "Challenger",      labelRu: "Претендент",       description: "Solved 50 challenges",                 descriptionRu: "50 решённых задач",              icon: "trophy",    color: "gold" },
  { id: "solved_100",    label: "Champion",        labelRu: "Чемпион",          description: "Solved 100 challenges",                descriptionRu: "100 решённых задач",             icon: "crown",     color: "amber" },
  { id: "points_500",    label: "Point Hunter",    labelRu: "Охотник за очками",description: "Earned 500 points",                    descriptionRu: "500 очков",                      icon: "star",      color: "yellow" },
  { id: "points_1000",   label: "High Scorer",     labelRu: "Высокий балл",     description: "Earned 1000 points",                   descriptionRu: "1000 очков",                     icon: "sparkle",   color: "amber" },
  { id: "qa_master",     label: "QA Master",       labelRu: "Мастер QA",        description: "Solved 10 QA challenges",              descriptionRu: "10 задач QA",                    icon: "magnifier", color: "green" },
  { id: "frontend_pro",  label: "Frontend Pro",    labelRu: "Frontend Pro",     description: "Solved 10 Frontend challenges",        descriptionRu: "10 задач Frontend",              icon: "brackets",  color: "blue" },
  { id: "backend_guru",  label: "Backend Guru",    labelRu: "Backend Guru",     description: "Solved 10 Backend challenges",         descriptionRu: "10 задач Backend",               icon: "gear",      color: "slate" },
  { id: "speed_demon",   label: "Speed Demon",     labelRu: "Скоростной демон", description: "Solved a hard challenge in under 60s", descriptionRu: "Решил сложную задачу за 60 сек", icon: "lightning", color: "cyan" },
  { id: "pro_member",    label: "Pro Member",      labelRu: "Pro участник",     description: "Upgraded to Pro plan",                 descriptionRu: "Перешёл на Pro план",            icon: "medal",     color: "violet" },

  // ─── Новые серьёзные ───
  { id: "streak_100",           label: "Marathoner",       labelRu: "Марафонец",              description: "100-day streak",                                                    descriptionRu: "Серия 100 дней",                                            icon: "diamond",   color: "gold" },
  { id: "solved_250",           label: "Grandmaster",      labelRu: "Гроссмейстер",           description: "Solved 250 challenges",                                             descriptionRu: "250 решённых задач",                                        icon: "crown",     color: "violet" },
  { id: "points_5000",          label: "Score Legend",     labelRu: "Легенда по очкам",       description: "Earned 5000 points",                                                descriptionRu: "5000 очков",                                                icon: "sparkle",   color: "gold" },
  { id: "generalist",           label: "Renaissance Dev",  labelRu: "Универсал",              description: "Solved at least one challenge in every role — QA, Frontend, Backend", descriptionRu: "Решил хотя бы одну задачу в каждой роли — QA, Frontend, Backend", icon: "palette",   color: "cyan" },
  { id: "hard_mode",            label: "Hard Mode",        labelRu: "Хардкор",                description: "Solved 5 hard-difficulty challenges",                              descriptionRu: "Решил 5 задач сложного уровня",                             icon: "flask",     color: "red" },
  { id: "workbench_architect",  label: "The Architect",    labelRu: "Архитектор",             description: "Built 3 or more Workbenches",                                       descriptionRu: "Собрал 3 и более рабочих стола",                            icon: "rocket",    color: "blue" },
  { id: "tool_belt",            label: "Tool Belt",        labelRu: "Пояс с инструментами",   description: "Pinned 15 or more tools across your Workbenches",                  descriptionRu: "Закрепил 15 и более инструментов в рабочих столах",         icon: "wrench",    color: "amber" },
  { id: "founding_member",      label: "Pioneer",          labelRu: "Первопроходец",          description: "Joined before the Achievements system launched",                   descriptionRu: "Зарегистрировался до запуска системы достижений",          icon: "flag",      color: "violet" },
  { id: "polyglot",             label: "Polyglot",         labelRu: "Полиглот",               description: "Used 15 or more different tools",                                   descriptionRu: "Воспользовался 15 и более разными инструментами",           icon: "gear",      color: "blue" },
  { id: "phoenix",              label: "Phoenix",          labelRu: "Феникс",                 description: "Streak broke after 7+ days, but you're still here",                descriptionRu: "Серия прервалась после 7+ дней, но ты всё ещё здесь",       icon: "fire",      color: "orange" },

  // ─── Новые шуточные ───
  { id: "the_answer",     label: "The Answer",      labelRu: "Ответ на главный вопрос", description: "Solved exactly 42 challenges",                     descriptionRu: "Решил ровно 42 задачи",                             icon: "sparkle",   color: "cyan" },
  { id: "leet",            label: "1337",            labelRu: "1337",                    description: "Scored exactly 1337 points",                       descriptionRu: "Набрал ровно 1337 очков",                           icon: "lightning", color: "green" },
  { id: "pack_rat",        label: "Pack Rat",        labelRu: "Барахольщик",             description: "Favorited 25 or more tools",                       descriptionRu: "Добавил в избранное 25 и более инструментов",       icon: "star",      color: "yellow" },
  { id: "insomniac",       label: "Insomniac",       labelRu: "Сова",                     description: "Used a tool between midnight and 5am UTC",         descriptionRu: "Пользовался инструментом с полуночи до 5 утра по UTC", icon: "gamepad",  color: "slate" },
  { id: "weekend_warrior", label: "Weekend Warrior", labelRu: "Герой выходных",           description: "Used a tool on a weekend",                          descriptionRu: "Пользовался инструментом в выходной",               icon: "target",    color: "orange" },
  { id: "over_engineer",   label: "Over-Engineer",   labelRu: "Оверинженер",              description: "Built 5 or more Workbenches — why use one when you can have five?", descriptionRu: "Собрал 5 и более рабочих столов — зачем один, если можно пять?", icon: "gear", color: "slate" },
  { id: "one_trick_pony",  label: "One-Trick Pony",  labelRu: "Мастер одного приёма",     description: "Used the same tool 20+ times recently",            descriptionRu: "Использовал один и тот же инструмент 20+ раз подряд", icon: "magnifier", color: "cyan" },
];

export const BADGE_COLOR: Record<string, string> = {
  amber:  "border-amber-500/30 bg-amber-500/10 text-amber-400",
  orange: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  red:    "border-red-500/30 bg-red-500/10 text-red-400",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-400",
  blue:   "border-blue-500/30 bg-blue-500/10 text-blue-400",
  gold:   "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  green:  "border-green-500/30 bg-green-500/10 text-green-400",
  cyan:   "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  slate:  "border-slate-500/30 bg-slate-500/10 text-slate-400",
};
