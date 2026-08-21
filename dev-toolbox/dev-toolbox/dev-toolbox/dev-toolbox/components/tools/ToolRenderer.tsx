"use client";

import { Dictionary } from "@/lib/i18n/dictionary-types";
import { Locale } from "@/lib/i18n/config";
import { Tool } from "@/lib/types";

// ── Existing tools ─────────────────────────────────────────────────────────
import { JsonFormatterTool }        from "./JsonFormatterTool";
import { JsonValidatorTool }        from "./JsonValidatorTool";
import { Base64Tool }               from "./Base64Tool";
import { UuidGeneratorTool }        from "./UuidGeneratorTool";
import { JwtDecoderTool }           from "./JwtDecoderTool";
import { TimestampConverterTool }   from "./TimestampConverterTool";
import { UrlEncodeDecodeTool }      from "./UrlEncodeDecodeTool";
import { RandomPasswordGeneratorTool } from "./RandomPasswordGeneratorTool";
import { CurlGeneratorTool }        from "./CurlGeneratorTool";
import { XmlFormatterTool }         from "./XmlFormatterTool";
import { HtmlFormatterTool }        from "./HtmlFormatterTool";
import { RegexTesterTool }          from "./RegexTesterTool";
import { HeaderInspectorTool }      from "./HeaderInspectorTool";
import { SqlFormatterTool }         from "./SqlFormatterTool";
import { FakeDataGeneratorTool }    from "./FakeDataGeneratorTool";
import { XpathGeneratorTool }       from "./XpathGeneratorTool";
import { CssSelectorGeneratorTool } from "./CssSelectorGeneratorTool";
import { ApiRequestBuilderTool }    from "./ApiRequestBuilderTool";
import { RestRequestBuilderTool }   from "./RestRequestBuilderTool";

// ── New tools ──────────────────────────────────────────────────────────────
import { JsonSortTool }             from "./JsonSortTool";
import { JsonCompareTool }          from "./JsonCompareTool";
import { JsonEscapeTool }           from "./JsonEscapeTool";
import { JsonMinifyTool }           from "./JsonMinifyTool";
import { JsonToYamlTool }           from "./JsonToYamlTool";
import { HashGeneratorTool }        from "./HashGeneratorTool";
import { TextDiffTool }             from "./TextDiffTool";
import { MarkdownPreviewTool }      from "./MarkdownPreviewTool";
import { QrCodeGeneratorTool }      from "./QrCodeGeneratorTool";
import { HtmlEncodeDecodeTool }      from "./HtmlEncodeDecodeTool";
import {
  HexEncodeDecodeTool,
  BinaryConverterTool,
  Rot13Tool,
} from "./EncodingTools";
import {
  WordCounterTool,
  CaseConverterTool,
  SlugGeneratorTool,
  SortLinesTool,
  RemoveDuplicatesTool,
  RemoveEmptyLinesTool,
} from "./TextTools";
import {
  LoremIpsumTool,
  RandomColorTool,
  NanoIdTool,
} from "./GeneratorTools";
import {
  AgeCalculatorTool,
  DateDifferenceTool,
  CronExpressionTool,
} from "./DateTimeTools";
import { ComingSoonTool }           from "./ComingSoonTool";
import { JsonSchemaValidatorTool } from "./JsonSchemaValidatorTool";
import { YamlFormatterTool }       from "./YamlFormatterTool";
import { UrlParserTool }           from "./UrlParserTool";
import { CronExpressionTool as CronBuilderTool } from "./CronExpressionTool";
import { StringEscapeTool }        from "./StringEscapeTool";
import { ChmodCalculatorTool }     from "./ChmodCalculatorTool";
import { PasswordStrengthTool }    from "./PasswordStrengthTool";
import { HttpStatusCodesTool }     from "./HttpStatusCodesTool";
import { JsonToTypescriptTool }      from "./JsonToTypescriptTool";
import { ColorConverterTool }         from "./ColorConverterTool";
import { NumberBaseConverterTool }    from "./NumberBaseConverterTool";
import { HtmlToMarkdownTool }         from "./HtmlToMarkdownTool";
import { AsciiArtTool }               from "./AsciiArtTool";
import { JwtGeneratorTool }           from "./JwtGeneratorTool";
import { RegexGeneratorClient as RegexGeneratorTool } from "./RegexGeneratorClient";
import { TestCaseGeneratorClient as TestCaseGeneratorTool } from "./TestCaseGeneratorClient";
import { BugReportGeneratorClient as BugReportGeneratorTool } from "./BugReportGeneratorClient";

/**
 * Single "use client" boundary for all interactive tool components.
 * The server passes only serializable props (slug, dict, locale, tool
 * metadata) — no component references cross the server/client boundary.
 */
export function ToolRenderer({
  slug, tool, dict, locale,
}: {
  slug: string; tool: Tool; dict: Dictionary; locale: Locale;
}) {
  switch (slug) {
    // ── Formatting ──────────────────────────────────────────────────────────
    case "json-formatter":            return <JsonFormatterTool dict={dict} />;
    case "json-validator":            return <JsonValidatorTool dict={dict} />;
    case "json-minify":               return <JsonMinifyTool dict={dict} />;
    case "json-sort":                 return <JsonSortTool dict={dict} />;
    case "json-compare":              return <JsonCompareTool dict={dict} />;
    case "json-escape":               return <JsonEscapeTool dict={dict} />;
    case "json-to-yaml":              return <JsonToYamlTool dict={dict} />;
    case "xml-formatter":             return <XmlFormatterTool dict={dict} />;
    case "html-formatter":            return <HtmlFormatterTool dict={dict} />;
    case "sql-formatter":             return <SqlFormatterTool dict={dict} />;
    // ── Encoding ────────────────────────────────────────────────────────────
    case "base64-encode-decode":      return <Base64Tool dict={dict} />;
    case "url-encode-decode":         return <UrlEncodeDecodeTool dict={dict} />;
    case "jwt-decoder":               return <JwtDecoderTool dict={dict} />;
    case "html-encode-decode":        return <HtmlEncodeDecodeTool dict={dict} />;
    case "hex-encode-decode":         return <HexEncodeDecodeTool dict={dict} />;
    case "binary-converter":          return <BinaryConverterTool dict={dict} />;
    case "rot13":                     return <Rot13Tool dict={dict} />;
    // ── Text ────────────────────────────────────────────────────────────────
    case "text-diff":                 return <TextDiffTool dict={dict} />;
    case "word-counter":              return <WordCounterTool dict={dict} />;
    case "case-converter":            return <CaseConverterTool dict={dict} />;
    case "slug-generator":            return <SlugGeneratorTool dict={dict} />;
    case "sort-lines":                return <SortLinesTool dict={dict} />;
    case "remove-duplicates":         return <RemoveDuplicatesTool dict={dict} />;
    case "remove-empty-lines":        return <RemoveEmptyLinesTool dict={dict} />;
    case "markdown-preview":          return <MarkdownPreviewTool dict={dict} />;
    // ── Hash ────────────────────────────────────────────────────────────────
    case "hash-generator":            return <HashGeneratorTool dict={dict} />;
    // ── Generators ──────────────────────────────────────────────────────────
    case "uuid-generator":            return <UuidGeneratorTool dict={dict} />;
    case "nanoid-generator":          return <NanoIdTool dict={dict} />;
    case "random-password-generator": return <RandomPasswordGeneratorTool dict={dict} />;
    case "lorem-ipsum-generator":     return <LoremIpsumTool dict={dict} />;
    case "random-color-generator":    return <RandomColorTool dict={dict} />;
    case "fake-test-data-generator":  return <FakeDataGeneratorTool dict={dict} />;
    // ── Date & Time ─────────────────────────────────────────────────────────
    case "timestamp-converter":       return <TimestampConverterTool dict={dict} locale={locale} />;
    case "date-difference":           return <DateDifferenceTool dict={dict} />;
    case "age-calculator":            return <AgeCalculatorTool dict={dict} />;
    case "cron-expression":           return <CronBuilderTool dict={dict} />;
    // ── Web ─────────────────────────────────────────────────────────────────
    case "qr-code-generator":         return <QrCodeGeneratorTool dict={dict} />;
    case "header-inspector":          return <HeaderInspectorTool dict={dict} />;
    // ── QA ──────────────────────────────────────────────────────────────────
    case "regex-tester":              return <RegexTesterTool dict={dict} />;
    case "xpath-generator":           return <XpathGeneratorTool dict={dict} />;
    case "css-selector-generator":    return <CssSelectorGeneratorTool dict={dict} />;
    case "api-request-builder":       return <ApiRequestBuilderTool dict={dict} />;
    // ── API ─────────────────────────────────────────────────────────────────
    case "curl-generator":            return <CurlGeneratorTool dict={dict} />;
    case "rest-request-builder":      return <RestRequestBuilderTool dict={dict} />;
    case "json-schema-validator":     return <JsonSchemaValidatorTool dict={dict} />;
    case "yaml-formatter":            return <YamlFormatterTool dict={dict} />;
    case "url-parser":                return <UrlParserTool dict={dict} />;
    case "cron-expression":           return <CronBuilderTool dict={dict} />;
    case "string-escape":             return <StringEscapeTool dict={dict} />;
    case "chmod-calculator":          return <ChmodCalculatorTool dict={dict} />;
    case "password-strength":         return <PasswordStrengthTool dict={dict} />;
    case "http-status-codes":         return <HttpStatusCodesTool dict={dict} />;
    // ── New tools ────────────────────────────────────────────────────────────
    case "json-to-typescript":         return <JsonToTypescriptTool dict={dict} />;
    case "color-converter":            return <ColorConverterTool dict={dict} />;
    case "number-base-converter":      return <NumberBaseConverterTool dict={dict} />;
    case "html-to-markdown":           return <HtmlToMarkdownTool dict={dict} />;
    case "text-to-ascii":              return <AsciiArtTool dict={dict} />;
    case "jwt-generator":              return <JwtGeneratorTool dict={dict} />;
    case "regex-generator":            return <RegexGeneratorTool locale={locale} />;
    case "test-case-generator":        return <TestCaseGeneratorTool locale={locale} />;
    case "bug-report-generator":       return <BugReportGeneratorTool locale={locale} />;
    // ── Default ─────────────────────────────────────────────────────────────
    default:                          return <ComingSoonTool tool={tool} dict={dict} />;
  }
}
