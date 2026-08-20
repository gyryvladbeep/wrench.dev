"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { ToolShell } from "./ToolShell";

const SAMPLE_JSON = `{
  "name": "Ada Lovelace",
  "age": 28,
  "email": "ada@example.com",
  "active": true
}`;

const SAMPLE_SCHEMA = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "age", "email"],
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "age": { "type": "integer", "minimum": 0, "maximum": 150 },
    "email": { "type": "string", "format": "email" },
    "active": { "type": "boolean" }
  },
  "additionalProperties": false
}`;

interface ValidationError { path: string; message: string; }

function validateJsonSchema(data: unknown, schema: Record<string, unknown>, path = ""): ValidationError[] {
  const errors: ValidationError[] = [];
  const p = path || "root";

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actualType = data === null ? "null" : Array.isArray(data) ? "array" : typeof data;
    const intMatch = types.includes("integer") && Number.isInteger(data);
    if (!types.includes(actualType) && !intMatch) {
      errors.push({ path: p, message: `Expected type ${types.join("|")}, got ${actualType}` });
      return errors;
    }
  }

  if (schema.required && typeof data === "object" && data !== null && !Array.isArray(data)) {
    for (const req of schema.required as string[]) {
      if (!(req in (data as Record<string, unknown>))) {
        errors.push({ path: p, message: `Missing required property: "${req}"` });
      }
    }
  }

  if (schema.properties && typeof data === "object" && data !== null && !Array.isArray(data)) {
    const props = schema.properties as Record<string, Record<string, unknown>>;
    for (const [key, propSchema] of Object.entries(props)) {
      if (key in (data as Record<string, unknown>)) {
        errors.push(...validateJsonSchema((data as Record<string, unknown>)[key], propSchema, `${p}.${key}`));
      }
    }
  }

  if (schema.additionalProperties === false && typeof data === "object" && data !== null && !Array.isArray(data)) {
    const allowed = new Set(Object.keys((schema.properties as Record<string, unknown>) ?? {}));
    for (const key of Object.keys(data as Record<string, unknown>)) {
      if (!allowed.has(key)) errors.push({ path: `${p}.${key}`, message: `Additional property not allowed: "${key}"` });
    }
  }

  if (typeof data === "string") {
    if (typeof schema.minLength === "number" && data.length < schema.minLength)
      errors.push({ path: p, message: `String too short (min ${schema.minLength})` });
    if (typeof schema.maxLength === "number" && data.length > schema.maxLength)
      errors.push({ path: p, message: `String too long (max ${schema.maxLength})` });
    if (schema.pattern && !new RegExp(schema.pattern as string).test(data))
      errors.push({ path: p, message: `Does not match pattern: ${schema.pattern}` });
    if (schema.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data))
      errors.push({ path: p, message: `Invalid email format` });
    if (schema.format === "uri" && !/^https?:\/\/.+/.test(data))
      errors.push({ path: p, message: `Invalid URI format` });
  }

  if (typeof data === "number") {
    if (typeof schema.minimum === "number" && data < schema.minimum)
      errors.push({ path: p, message: `Value ${data} < minimum ${schema.minimum}` });
    if (typeof schema.maximum === "number" && data > schema.maximum)
      errors.push({ path: p, message: `Value ${data} > maximum ${schema.maximum}` });
  }

  if (Array.isArray(data)) {
    if (typeof schema.minItems === "number" && data.length < schema.minItems)
      errors.push({ path: p, message: `Array too short (min ${schema.minItems} items)` });
    if (typeof schema.maxItems === "number" && data.length > schema.maxItems)
      errors.push({ path: p, message: `Array too long (max ${schema.maxItems} items)` });
    if (schema.items) {
      data.forEach((item, i) => {
        errors.push(...validateJsonSchema(item, schema.items as Record<string, unknown>, `${p}[${i}]`));
      });
    }
  }

  return errors;
}

export function JsonSchemaValidatorTool({ dict }: { dict: Dictionary }) {
  const [json,   setJson]   = useState(SAMPLE_JSON);
  const [schema, setSchema] = useState(SAMPLE_SCHEMA);
  const isRu = dict.common.copy === "Копировать";

  const result = useMemo(() => {
    try {
      const parsedJson   = JSON.parse(json);
      const parsedSchema = JSON.parse(schema);
      const errors       = validateJsonSchema(parsedJson, parsedSchema);
      return { ok: true as const, errors };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : "Parse error" };
    }
  }, [json, schema]);

  return (
    <ToolShell onClear={() => { setJson(""); setSchema(""); }}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="input-label">JSON</label>
          <textarea value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} rows={14}
            className="code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="input-label">JSON Schema</label>
          <textarea value={schema} onChange={(e) => setSchema(e.target.value)} spellCheck={false} rows={14}
            className="code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none" />
        </div>
      </div>

      <div className="mt-4">
        {!result.ok ? (
          <div className="rounded-lg border border-red-800/40 bg-red-900/10 p-4">
            <p className="text-sm font-medium text-red-400">{isRu ? "Ошибка парсинга" : "Parse error"}</p>
            <p className="mt-1 font-mono text-xs text-red-400">{result.message}</p>
          </div>
        ) : result.errors.length === 0 ? (
          <div className="rounded-lg border border-green-800/40 bg-green-900/10 p-4">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" className="text-success"/>
                <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="text-success"/>
              </svg>
              <p className="text-sm font-medium text-success">{isRu ? "JSON соответствует схеме" : "JSON is valid against the schema"}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-red-800/40 bg-red-900/10 p-4 space-y-2">
            <p className="text-sm font-medium text-red-400">
              {result.errors.length} {isRu ? "ошибок валидации" : "validation error(s)"}
            </p>
            {result.errors.map((err, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <span className="font-mono text-text-muted shrink-0">{err.path}</span>
                <span className="text-red-400">{err.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
