import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const rateMap = new Map<string, { count: number; reset: number }>();
function checkRate(key: string): boolean {
  const now = Date.now();
  const e = rateMap.get(key);
  if (!e || now > e.reset) { rateMap.set(key, { count:1, reset: now+60_000 }); return true; }
  if (e.count >= 20) return false;
  e.count++; return true;
}

// ─────────────────────────────────────────────────────────────
// Answer validation — rewritten to tolerate real human variation
// ─────────────────────────────────────────────────────────────
// Problems with the old version:
// 1. `c.includes(g)` (reversed direction) let short wrong answers pass —
//    e.g. answer "de" would satisfy correct_answer "delete" because
//    "delete".includes("de") is true. Removed.
// 2. No tolerance for typos, punctuation, or extra whitespace.
// 3. No way to accept multiple valid phrasings of the same correct idea
//    (e.g. "DELETE", "use DELETE method", "HTTP DELETE").
// 4. No way to require several distinct keywords for genuinely
//    open-ended questions (e.g. "name the REST violations").

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"()]/g, "")
    .replace(/\s+/g, " ");
}

// Classic edit-distance algorithm — counts the minimum number of
// single-character insert/delete/substitute operations to turn one
// string into another. Used to tolerate small typos.
function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function fuzzyEquals(a: string, b: string): boolean {
  if (a === b) return true;
  // Allowed typo budget scales with answer length — stricter for short
  // answers (so "GET" vs "SET" still fails), lenient for longer phrases.
  const maxDist = b.length <= 4 ? 1 : b.length <= 8 ? 2 : 3;
  return levenshtein(a, b) <= maxDist;
}

function checkAnswer(given: string, correctRaw: string, type: string): boolean {
  const g = normalize(given);

  // correct_answer may hold several acceptable phrasings separated by "|",
  // e.g. "DELETE|use delete method|http delete instead of get"
  const variants = correctRaw.split("|").map(normalize).filter(Boolean);

  if (type === "exact") {
    return variants.some((c) => fuzzyEquals(g, c));
  }
  if (type === "contains") {
    // One-directional only: the user's answer must contain an accepted
    // variant — not the other way around.
    return variants.some((c) => g.includes(c));
  }
  if (type === "keywords") {
    // For genuinely open-ended questions with multiple expected points.
    // correct_answer holds comma-separated required keywords; the
    // learner's answer must mention ALL of them (in any order, any
    // phrasing around them) to count as correct.
    const required = correctRaw.split(",").map(normalize).filter(Boolean);
    return required.every((k) => g.includes(k));
  }
  if (type === "regex") {
    try { return new RegExp(correctRaw, "i").test(given); } catch { return false; }
  }
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRate(ip)) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { challenge_id, answer, time_seconds, hints_used } = await req.json();
  if (!challenge_id || !answer) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { data: challenge, error: cErr } = await supabase
    .from("challenges").select("id,correct_answer,answer_type,points,explanation,explanation_ru")
    .eq("id", challenge_id).eq("is_active", true).single();
  if (cErr || !challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

  const { data: existing } = await supabase.from("challenge_attempts")
    .select("id,is_correct,attempts_count").eq("user_id", user.id).eq("challenge_id", challenge_id).single();

  if (existing?.is_correct) return NextResponse.json({ error: "Already solved", already_solved: true }, { status: 409 });

  const is_correct     = checkAnswer(answer, challenge.correct_answer, challenge.answer_type);
  const attempts_count = (existing?.attempts_count ?? 0) + 1;
  const points_earned  = is_correct
    ? Math.max(challenge.points - (attempts_count-1)*3 - (hints_used??0)*5, Math.floor(challenge.points*0.2))
    : 0;

  await supabase.from("challenge_attempts").upsert({
    user_id: user.id, challenge_id, is_correct,
    answer_given: answer.slice(0,500), time_seconds: time_seconds??null,
    attempts_count, hints_used: hints_used??0, points_earned,
    completed_at: new Date().toISOString(),
  }, { onConflict: "user_id,challenge_id" });

  if (is_correct) {
    const today     = new Date().toISOString().slice(0,10);
    const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
    const { data: streak } = await supabase.from("user_streaks").select("*").eq("user_id", user.id).single();
    const newStreak = streak?.last_active === yesterday ? (streak.current_streak+1)
      : streak?.last_active === today ? streak.current_streak : 1;
    await supabase.from("user_streaks").upsert({
      user_id: user.id, current_streak: newStreak,
      longest_streak: Math.max(newStreak, streak?.longest_streak??0),
      last_active: today, total_solved: (streak?.total_solved??0)+1,
      total_points: (streak?.total_points??0)+points_earned, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  }

  return NextResponse.json({ is_correct, points_earned, attempts_count, explanation: challenge.explanation, explanation_ru: challenge.explanation_ru });
}