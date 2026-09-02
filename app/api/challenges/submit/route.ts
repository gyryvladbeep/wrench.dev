import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Per-user rate limiting stored in DB — 20 attempts per minute per user
// In-memory fallback for IP-based limiting
const ipRateMap = new Map<string, { count: number; reset: number }>();

function checkIpRate(ip: string): boolean {
  const now = Date.now();
  const e   = ipRateMap.get(ip);
  if (!e || now > e.reset) { ipRateMap.set(ip, { count:1, reset: now + 60_000 }); return true; }
  if (e.count >= 30) return false;
  e.count++;
  return true;
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
  // IP rate limit (first line of defense)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkIpRate(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Body size check
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 10_000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { challenge_id, answer, time_seconds, hints_used } = body;
  if (!challenge_id || !answer) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Answer length check — prevent abuse
  if (typeof answer !== "string" || answer.length > 2000) {
    return NextResponse.json({ error: "Answer too long" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  // Per-user rate limit: max 20 submissions per minute
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count: recentCount } = await supabase
    .from("challenge_attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("completed_at", oneMinuteAgo);

  if ((recentCount ?? 0) >= 20) {
    return NextResponse.json({ error: "Too many submissions. Please slow down." }, { status: 429 });
  }

  // Get challenge (correct_answer never sent to client)
  const { data: challenge, error: cErr } = await supabase
    .from("challenges")
    .select("id,correct_answer,answer_type,points,explanation,explanation_ru")
    .eq("id", challenge_id)
    .eq("is_active", true)
    .single();

  if (cErr || !challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });

  // Check if already solved correctly
  const { data: existing } = await supabase
    .from("challenge_attempts")
    .select("id,is_correct,attempts_count")
    .eq("user_id", user.id)
    .eq("challenge_id", challenge_id)
    .single();

  if (existing?.is_correct) {
    return NextResponse.json({ already_solved: true, is_correct: true });
  }

  const attemptsCount = (existing?.attempts_count ?? 0) + 1;
  const isCorrect = checkAnswer(answer, challenge.correct_answer, challenge.answer_type);

  // Calculate points
  const hintPenalty    = Math.min(hints_used ?? 0, 3) * 5;
  const attemptPenalty = Math.max(0, attemptsCount - 1) * 3;
  const pointsEarned   = isCorrect
    ? Math.max(1, (challenge.points ?? 10) - hintPenalty - attemptPenalty)
    : 0;

  // Save attempt
  if (existing) {
    await supabase.from("challenge_attempts").update({
      is_correct:     isCorrect,
      attempts_count: attemptsCount,
      answer_given:   answer.slice(0, 500), // truncate stored answer
      time_seconds:   time_seconds ?? 0,
      points_earned:  pointsEarned,
      completed_at:   new Date().toISOString(),
    }).eq("id", existing.id);
  } else {
    await supabase.from("challenge_attempts").insert({
      user_id:        user.id,
      challenge_id:   challenge_id,
      is_correct:     isCorrect,
      attempts_count: attemptsCount,
      answer_given:   answer.slice(0, 500),
      time_seconds:   time_seconds ?? 0,
      points_earned:  pointsEarned,
      completed_at:   new Date().toISOString(),
    });
  }

  // Update streak if correct
  if (isCorrect) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: streak } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (streak) {
      const lastActive = streak.last_active?.slice(0, 10);
      const yesterday  = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newStreak  = lastActive === yesterday ? streak.current_streak + 1
                       : lastActive === today     ? streak.current_streak
                       : 1;

      await supabase.from("user_streaks").update({
        current_streak: newStreak,
        longest_streak: Math.max(streak.longest_streak ?? 0, newStreak),
        last_active:    today,
        total_solved:   (streak.total_solved ?? 0) + 1,
        total_points:   (streak.total_points ?? 0) + pointsEarned,
        updated_at:     new Date().toISOString(),
      }).eq("user_id", user.id);
    } else {
      await supabase.from("user_streaks").insert({
        user_id:        user.id,
        current_streak: 1,
        longest_streak: 1,
        last_active:    today,
        total_solved:   1,
        total_points:   pointsEarned,
      });
    }
  }

  // Never return correct_answer to client
  return NextResponse.json({
    is_correct:     isCorrect,
    points_earned:  pointsEarned,
    attempts_count: attemptsCount,
    explanation:    challenge.explanation,
    explanation_ru: challenge.explanation_ru,
  });
}