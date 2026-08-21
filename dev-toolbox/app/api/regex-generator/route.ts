import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export const runtime = "edge";
export const maxDuration = 30;

const rateMap = new Map<string, { count: number; reset: number }>();
function checkRate(ip: string): boolean {
  const now = Date.now();
  const e   = rateMap.get(ip);
  if (!e || now > e.reset) { rateMap.set(ip, { count: 1, reset: now + 60_000 }); return true; }
  if (e.count >= 10) return false;
  e.count++; return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRate(ip)) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429 });

  const { description, flavor, flags, testString, language } = await req.json();
  if (!description?.trim()) return new Response(JSON.stringify({ error: "Description is required." }), { status: 400 });

  const isRu = language === "ru";
  const lang = isRu ? "Russian" : "English";

  const system = `You are a regex expert. You write precise, correct, well-commented regular expressions.
Always respond in ${lang}.
Never use unnecessary complexity. Prefer readable patterns over clever ones.`;

  const userPrompt = `Write a regular expression for the following requirement:

"${description}"

Regex flavor: ${flavor}
Flags requested: ${flags || "none"}
${testString ? `Test string to validate against:\n"""\n${testString}\n"""` : ""}

Respond with EXACTLY this structure (no extra text):

REGEX:
\`your_regex_here\`

EXPLANATION:
[explain each part of the regex in plain language, one line per component]

EXAMPLES:
[3-5 example strings that MATCH]

NON-MATCHES:
[3-5 example strings that do NOT match]

${testString ? "TEST RESULT:\n[does the regex match the provided test string? yes/no and why]" : ""}

TIPS:
[1-2 practical tips for using this regex]`;

  const result = await streamText({
    model: anthropic("claude-sonnet-4-6"),
    system,
    messages: [{ role: "user", content: userPrompt }],
    temperature: 0.1,
  });

  return result.toTextStreamResponse();
}
