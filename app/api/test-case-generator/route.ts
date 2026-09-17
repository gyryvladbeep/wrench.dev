import { NextRequest } from "next/server";

export const runtime = "nodejs";

// ═══════════════════════════════════════════════════════
// AI-генерация временно отключена (2026-09) — по решению владельца
// продукта, не по техническим причинам. Ни один вызов Anthropic API
// отсюда больше не происходит: ни checkAiLimit()/incrementAiUsage()
// (см. lib/rate-limit.ts — сам модуль не тронут, просто больше не
// импортируется здесь), ни streamText(). Причина: нормальная
// pay-per-use модель оплаты AI ещё не построена (см. обсуждение
// Pro-плана и AI-лимитов), а держать это живым без нее — значит
// платить за токены из своего кармана без единого реального
// пользователя, который бы это окупал.
//
// Полная прежняя реализация (сборка промпта, стриминг ответа Claude)
// осталась в истории git — откат этого файла к коммиту перед этой
// заглушкой восстанавливает её один в один.
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  let language = "en";
  try {
    const body = await req.json();
    if (body?.language === "ru") language = "ru";
  } catch {
    // Тело могло быть невалидным JSON или отсутствовать — неважно,
    // заглушка отвечает одинаково в любом случае.
  }

  return new Response(
    JSON.stringify({
      error:
        language === "ru"
          ? "Генерация тест-кейсов с помощью ИИ временно отключена — скоро вернём. Ничего не было списано."
          : "AI test-case generation is temporarily disabled for now — it'll be back soon. Nothing was charged.",
    }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
}
