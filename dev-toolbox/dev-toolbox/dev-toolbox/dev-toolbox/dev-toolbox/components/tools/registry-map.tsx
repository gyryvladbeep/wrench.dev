/**
 * Maps tool slug → interactive component.
 * This file is a plain module (no "use client") — individual tool
 * components mark themselves as "use client" since they use state/effects.
 *
 * The dict/locale is delivered to each tool via DictProvider (set in
 * [locale]/tools/[slug]/page.tsx) and consumed with useDict().
 */
import { ComponentType } from "react";
import { JsonFormatterTool } from "./JsonFormatterTool";
import { JsonValidatorTool } from "./JsonValidatorTool";
import { Base64Tool } from "./Base64Tool";
import { UuidGeneratorTool } from "./UuidGeneratorTool";
import { JwtDecoderTool } from "./JwtDecoderTool";
import { TimestampConverterTool } from "./TimestampConverterTool";
import { UrlEncodeDecodeTool } from "./UrlEncodeDecodeTool";
import { RandomPasswordGeneratorTool } from "./RandomPasswordGeneratorTool";
import { CurlGeneratorTool } from "./CurlGeneratorTool";
import { XmlFormatterTool } from "./XmlFormatterTool";
import { HtmlFormatterTool } from "./HtmlFormatterTool";
import { RegexTesterTool } from "./RegexTesterTool";
import { HeaderInspectorTool } from "./HeaderInspectorTool";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registryMap: Record<string, any> = {
  "json-formatter":            JsonFormatterTool,
  "json-validator":            JsonValidatorTool,
  "base64-encode-decode":      Base64Tool,
  "uuid-generator":            UuidGeneratorTool,
  "jwt-decoder":               JwtDecoderTool,
  "timestamp-converter":       TimestampConverterTool,
  "url-encode-decode":         UrlEncodeDecodeTool,
  "random-password-generator": RandomPasswordGeneratorTool,
  "curl-generator":            CurlGeneratorTool,
  "xml-formatter":             XmlFormatterTool,
  "html-formatter":            HtmlFormatterTool,
  "regex-tester":              RegexTesterTool,
  "header-inspector":          HeaderInspectorTool,
};
