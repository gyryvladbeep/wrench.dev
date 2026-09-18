// ═══════════════════════════════════════════════════════════════
// Минимальный ручной разбор argv — без зависимости вроде commander/
// yargs. Команд немного и они простые (см. src/index.ts), а `npx
// wrench-branch ...` должен стартовать быстро — каждая лишняя
// транзитивная зависимость это время скачивания npx при холодном
// старте, тот же принцип экономии, что уже применён в
// vscode-extension (esbuild-бандл вместо тяжёлых либ).
// ═══════════════════════════════════════════════════════════════

export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

// Поддерживает: "value", "--flag value", "--flag=value", "--bool-flag"
// (без значения — true). Одиночные дефисы ("-f") не поддерживаются —
// у команд ниже нет коротких алиасов, поэтому не нужны.
export function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq !== -1) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
        continue;
      }
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
      continue;
    }
    positionals.push(arg);
  }

  return { positionals, flags };
}

export function flagString(flags: Record<string, string | boolean>, key: string): string | undefined {
  const v = flags[key];
  return typeof v === "string" ? v : undefined;
}
