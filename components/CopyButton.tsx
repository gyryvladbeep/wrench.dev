"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({
  value,
  label,
  copiedLabel = "Copied",
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can fail on insecure contexts; fail silently rather than crash the tool.
    }
  }

  return (
    <Button variant="secondary" onClick={handleCopy} disabled={!value} type="button">
      {copied ? copiedLabel : label ?? "Copy"}
    </Button>
  );
}
