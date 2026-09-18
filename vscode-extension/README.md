# Wrench-Branch Toolbox

A handful of [wrench-branch.vercel.app](https://wrench-branch.vercel.app) tools, callable straight from the VS Code command palette — no browser tab needed. Everything runs locally, offline; nothing you select or type is sent anywhere.

Open the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and search "Wrench:" to see all commands.

## Commands

- **Wrench: Format JSON** — formats the selected JSON (2-space indent), replacing the selection.
- **Wrench: Minify JSON** — same, but strips whitespace.
- **Wrench: Validate JSON** — checks the selection is valid JSON and reports the parse error if not.
- **Wrench: Encode Base64** / **Decode Base64** — replaces the selection with the encoded/decoded value.
- **Wrench: Decode JWT** — decodes a token's header and payload (does not verify the signature) into a new document beside your editor.
- **Wrench: Generate UUID** — inserts a UUID v4 at the cursor.
- **Wrench: Generate Hash (MD5 / SHA-1 / SHA-256 / SHA-512)** — prompts for an algorithm, hashes the selection, replaces it and copies the result to the clipboard.
- **Wrench: URL Encode** / **URL Decode** — component-level (`encodeURIComponent`/`decodeURIComponent`), replacing the selection.
- **Wrench: Convert Timestamp** — auto-detects direction: a run of digits converts to ISO/UTC/local date, anything else parses as a date and converts to unix seconds/millis. Opens the result in a new document.

Every command works the same way: select some text first and it's used as input (and usually replaced with the result); with no selection, you'll be prompted for input instead.

## Why local, not the public API

[wrench-branch.vercel.app/docs#api](https://wrench-branch.vercel.app/docs#api) has a public read-only API, but it currently serves the tools *catalog* (names, descriptions, categories) — not tool execution. So this extension reimplements each tool's logic natively in TypeScript (see `src/tools/`), mirroring the corresponding web tool. There's no network call, no latency, and it works offline.

## Development

```
npm install
npm run typecheck     # tsc --noEmit
npm run test-units    # pure-logic unit tests (node:test), no VS Code host needed
npm run compile       # bundle to out/extension.js (esbuild)
npx vsce package      # produce a .vsix
```

To try it locally: `F5` in VS Code (with this folder open) launches an Extension Development Host with the extension loaded. To install a packaged build: Extensions view → `...` menu → **Install from VSIX...**.
