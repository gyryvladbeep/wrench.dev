import { checkAiLimit, incrementAiUsage } from "@/lib/rate-limit";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const rateMap = new Map<string, { count: number; reset: number }>();
function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) { rateMap.set(ip, { count: 1, reset: now + 60_000 }); return true; }
  if (entry.count >= 5) return false;
  entry.count++; return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRate(ip)) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a minute." }), { status: 429 });

  // Server-side AI limit check (works across all Vercel instances) — this
  // was missing here even though the Free plan is documented as 3
  // AI generations/day (see PLANS.free in lib/stripe.ts) and the sibling
  // test-case-generator route already enforces it. Without this, any
  // unauthenticated caller could generate unlimited Anthropic completions,
  // limited only by a spoofable per-IP, per-instance in-memory counter —
  // a real billing/cost-abuse exposure.
  const limit = await checkAiLimit();
  if (!limit.allowed) {
    return new Response(
      JSON.stringify({ error: "Daily AI limit reached. Upgrade to Pro for unlimited access.", remaining: 0 }),
      { status: 429 }
    );
  }

  const { title, steps, expected, actual, environment, severity, format, language } = await req.json();
  if (!steps?.trim()) return new Response(JSON.stringify({ error: "Steps to reproduce are required." }), { status: 400 });

  const isRu = language === "ru";
  const lang = isRu ? "Russian" : "English";

  const system = `You are a senior QA engineer writing professional bug reports.
Your bug reports are:
- Clear and reproducible — anyone can follow the steps
- Complete — include all relevant context
- Professional — follow industry standards
- Written in ${lang}

Output ONLY the bug report, no preamble or explanation.`;

  const formatGuide = format === "Markdown" ? `Use this Markdown structure:
# Bug Report: [Title]
**ID:** BUG-[random 3 digit number]
**Severity:** ${severity}
**Priority:** [High/Medium/Low]
**Status:** Open
**Reported:** ${new Date().toISOString().slice(0, 10)}

## Environment
[list env details]

## Description
[clear one-paragraph description]

## Steps to Reproduce
1. ...
2. ...
3. ...

## Expected Result
[what should happen]

## Actual Result
[what actually happens]

## Impact
[who is affected and how]

## Possible Root Cause
[optional hypothesis]

## Attachments
[screenshots, logs — list what to attach]` :
format === "Jira" ? "Use Jira-style plain text with *bold* for labels." :
"Output a valid JSON object with fields: id, title, severity, priority, environment, description, stepsToReproduce (array), expectedResult, actualResult, impact, possibleRootCause, status, reportedDate";

  const userPrompt = `Write a professional bug report for the following issue:

Title: ${title || "Untitled Bug"}
Severity: ${severity}
Steps to reproduce: ${steps}
Expected result: ${expected || "Not specified"}
Actual result: ${actual || "Not specified"}
Environment: ${environment || "Not specified"}

${formatGuide}`;

  await incrementAiUsage();

  const result = await streamText({
    model: anthropic("claude-sonnet-4-6"),
    system,
    messages: [{ role: "user", content: userPrompt }],
    temperature: 0.2,
  });

  return result.toTextStreamResponse();
}
