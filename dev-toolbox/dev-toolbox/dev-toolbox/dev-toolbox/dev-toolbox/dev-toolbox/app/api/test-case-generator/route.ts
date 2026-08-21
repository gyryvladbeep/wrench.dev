import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export const runtime = "edge";
export const maxDuration = 60;

// Simple in-memory rate limit (per edge instance)
const rateMap = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 60_000; // 1 minute
  const limit  = 5;      // 5 requests per minute per IP
  const entry  = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + window });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please wait a minute." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await req.json();
  const {
    description, testType, outputFormat, count,
    includeEdgeCases, includePriority, includePreconditions, language,
  } = body;

  if (!description?.trim()) {
    return new Response(
      JSON.stringify({ error: "Description is required." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const systemPrompt = buildSystemPrompt(outputFormat, language);
  const userPrompt   = buildUserPrompt({
    description, testType, outputFormat, count,
    includeEdgeCases, includePriority, includePreconditions,
  });

  const result = await streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    temperature: 0.3,
  });

  return result.toTextStreamResponse();
}

function buildSystemPrompt(format: string, language: string): string {
  const lang = language === "ru" ? "Russian" : "English";
  return `You are a senior QA engineer with 10+ years of experience writing test cases for enterprise software.

Your test cases are:
- Precise and actionable — every step has exactly one action
- Complete — cover happy path, negative, boundary and edge cases
- Professional — follow industry standards (IEEE 829, ISTQB)
- Written in ${lang} — match the language of the user's input

Output format: ${format}

Rules:
- Never write vague steps like "verify the system works correctly"
- Always write specific expected results with exact values when possible
- For API tests: include method, endpoint, headers, request body, and expected status codes
- For UI tests: describe user actions, not CSS selectors or XPaths
- Do not add preamble, explanations or summaries — output ONLY the test cases
- Start immediately with the first test case`;
}

function buildUserPrompt({
  description, testType, outputFormat, count,
  includeEdgeCases, includePriority, includePreconditions,
}: Record<string, unknown>): string {
  const parts: string[] = [
    `Generate exactly ${count} test cases for the following feature:`,
    `"""\n${description}\n"""`,
    `Test type: ${testType}`,
    `Output format: ${outputFormat}`,
  ];

  if (includeEdgeCases) parts.push("Include negative scenarios, boundary values, and edge cases.");
  if (includePriority)  parts.push("Add Priority (High/Medium/Low) and Severity (Critical/Major/Minor/Trivial) for each test case.");
  if (includePreconditions) parts.push("Add Preconditions and Test Data sections for each test case.");

  if (outputFormat === "Markdown") {
    parts.push(`
Use this structure for each test case:
## TC-XXX: [Title]
**Priority:** High/Medium/Low
**Type:** ${testType}
**Preconditions:** ...
**Test Data:** ...
### Steps:
1. ...
2. ...
**Expected Result:** ...
---`);
  } else if (outputFormat === "Gherkin") {
    parts.push("Use Given-When-Then format. Add Scenario Outline with Examples where applicable.");
  } else if (outputFormat === "JSON") {
    parts.push(`Output a valid JSON array. Each object: { "id", "title", "priority", "type", "preconditions", "testData", "steps": [], "expectedResult" }`);
  } else if (outputFormat === "Table") {
    parts.push("Output a Markdown table with columns: ID | Title | Priority | Steps | Expected Result");
  }

  return parts.join("\n\n");
}
