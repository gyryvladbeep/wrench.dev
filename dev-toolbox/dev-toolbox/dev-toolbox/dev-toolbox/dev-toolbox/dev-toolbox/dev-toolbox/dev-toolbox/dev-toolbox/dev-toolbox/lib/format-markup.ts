/**
 * Lightweight, dependency-free tag-based indenter shared by the XML and
 * HTML formatter tools. This is intentionally a regex-based formatter,
 * not a full parser — it's the same approach most "format my markup"
 * tools use, and it's enough for the common case of "I have minified or
 * messy markup, make it readable." It is not a substitute for a real
 * parser when correctness (not just readability) matters.
 */
export function formatMarkup(
  input: string,
  options: { indentSize?: number; voidElements?: Set<string> } = {}
): string {
  const indentSize = options.indentSize ?? 2;
  const voidElements = options.voidElements ?? new Set<string>();
  const tab = " ".repeat(indentSize);

  const collapsed = input.trim().replace(/>\s*</g, "><");
  const nodes = collapsed.split(/(?=<)/).filter(Boolean);

  let indent = "";
  const lines: string[] = [];

  for (const node of nodes) {
    const trimmed = node.trim();
    if (!trimmed) continue;

    const isComment = trimmed.startsWith("<!--");
    const isDoctypeOrPI = trimmed.startsWith("<!") || trimmed.startsWith("<?");
    const isClosingTag = /^<\/\w/.test(trimmed);
    const tagNameMatch = trimmed.match(/^<\/?\s*([a-zA-Z0-9:-]+)/);
    const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : "";
    const isSelfClosing = /\/>\s*$/.test(trimmed) || voidElements.has(tagName);
    const isOpeningTag = /^<[a-zA-Z]/.test(trimmed) && !isClosingTag;

    if (isClosingTag) {
      indent = indent.slice(tab.length);
    }

    lines.push(indent + trimmed);

    if (isOpeningTag && !isSelfClosing && !isComment && !isDoctypeOrPI) {
      indent += tab;
    }
  }

  return lines.join("\n");
}

export const HTML_VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);
