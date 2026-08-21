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

function checkAnswer(given: string, correct: string, type: string): boolean {
  const g = given.trim().toLowerCase();
  const c = correct.trim().toLowerCase();
  if (type === "exact")    return g === c;
  if (type === "contains") return g.includes(c) || c.includes(g);
  if (type === "regex") { try { return new RegExp(c, "i").test(g); } catch { return false; } }
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
