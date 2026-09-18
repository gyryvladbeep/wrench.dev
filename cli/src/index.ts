#!/usr/bin/env node

import { parseArgs } from "./lib/args";
import { runJson } from "./commands/json";
import { runBase64 } from "./commands/base64";
import { runJwt } from "./commands/jwt";
import { runUuid } from "./commands/uuid";
import { runHash } from "./commands/hash";
import { runUrl } from "./commands/url";
import { runTimestamp } from "./commands/timestamp";
import { runTools } from "./commands/tools";
import { runSalary } from "./commands/salary";
import { runMock } from "./commands/mock";
import { runWebhook } from "./commands/webhook";

const VERSION = "0.1.0";

const HELP = `wrench — CLI инструментов wrench-branch.vercel.app (пункт 9 из ROADMAP)

Локальные инструменты (работают офлайн, без сети):
  wrench json <format|minify|validate> [input] [--file <path>]
  wrench base64 <encode|decode> [input] [--file <path>]
  wrench jwt decode <token> [--file <path>]
  wrench uuid [--count <n>]
  wrench hash <md5|sha1|sha256|sha512> [input] [--file <path>]
  wrench url <encode|decode> [input] [--file <path>]
  wrench timestamp <value> [--file <path>]

  input передаётся позиционным аргументом, через --file <path> или
  пайпом (stdin): echo '{"a":1}' | wrench json format

Публичное API (нужна сеть, токен не нужен):
  wrench tools list
  wrench tools get <slug>
  wrench salary stats --role <role> [--seniority <level>] [--country <code>]
  wrench salary report

Запись (нужен личный токен — Profile -> Settings -> API tokens):
  wrench mock create --name <name> [--routes '<json>'] [--token <token>]
  wrench webhook create [--name <name>] [--token <token>]
  wrench webhook requests <slug> [--token <token>]

Общие флаги (для команд, которые ходят в сеть):
  --base-url <url>   По умолчанию https://wrench-branch.vercel.app,
                      либо переменная окружения WRENCH_BASE_URL
  --token <token>     Либо переменная окружения WRENCH_API_TOKEN

  wrench help, wrench --help    Показать эту справку
  wrench --version               Показать версию`;

async function main(): Promise<number> {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === "help" || argv.includes("--help") || argv.includes("-h")) {
    console.log(HELP);
    return 0;
  }
  if (argv[0] === "--version" || argv[0] === "-v") {
    console.log(VERSION);
    return 0;
  }

  const [command, ...rest] = argv;
  const args = parseArgs(rest);

  switch (command) {
    case "json":
      return runJson(args);
    case "base64":
      return runBase64(args);
    case "jwt":
      return runJwt(args);
    case "uuid":
      return runUuid(args);
    case "hash":
      return runHash(args);
    case "url":
      return runUrl(args);
    case "timestamp":
      return runTimestamp(args);
    case "tools":
      return runTools(args);
    case "salary":
      return runSalary(args);
    case "mock":
      return runMock(args);
    case "webhook":
      return runWebhook(args);
    default:
      console.error(`Неизвестная команда: ${command}\n`);
      console.log(HELP);
      return 1;
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
