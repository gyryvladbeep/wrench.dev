# wrench (CLI)

Командная строка для инструментов [wrench-branch.vercel.app](https://wrench-branch.vercel.app) — те же JSON/Base64/JWT/UUID/hash/URL/timestamp, что и на сайте и в [VS Code-расширении](../vscode-extension), плюс команды поверх публичного API (`tools`, `salary`, `mock`, `webhook`).

Пакет на npm называется `wrench-branch` (имя `wrench` уже занято другим, устаревшим пакетом) — команда после установки всё равно называется `wrench`.

## Быстрый старт (без установки)

```bash
npx wrench-branch json format '{"a":1,"b":2}'
```

`npx` каждый раз скачивает пакет заново, если не запускать часто — для постоянного использования поставьте глобально:

```bash
npm install -g wrench-branch
wrench json format '{"a":1,"b":2}'
```

## Локальные инструменты (без сети)

Работают полностью офлайн — та же логика, что в веб-инструментах и VS Code-расширении.

```bash
wrench json format '{"a":1}'
wrench json minify '{"a": 1}'
wrench json validate '{"a": 1}'

wrench base64 encode "hello, мир"
wrench base64 decode aGVsbG8=

wrench jwt decode eyJhbGciOiJIUzI1NiJ9...

wrench uuid
wrench uuid --count 5

wrench hash sha256 "hello"
wrench hash md5 "hello"

wrench url encode "a b&c"
wrench url decode "a%20b%26c"

wrench timestamp 1700000000
wrench timestamp "2023-11-14T22:13:20.000Z"
```

Ввод можно передать тремя способами (в таком порядке приоритета):

```bash
wrench json format '{"a":1}'                 # позиционный аргумент
wrench json format --file payload.json        # из файла
cat payload.json | wrench json format          # через stdin (пайп)
```

## Публичное API (нужна сеть, токен не нужен)

```bash
wrench tools list
wrench tools get json-formatter

wrench salary stats --role qa --seniority middle --country us
wrench salary report
```

## Запись (нужен личный токен)

Токен создаётся на [wrench-branch.vercel.app/profile](https://wrench-branch.vercel.app/profile) во вкладке Settings -> API tokens (`wrb_...`).

```bash
export WRENCH_API_TOKEN=wrb_...

wrench mock create --name "ci-smoke" --routes '[{"method":"GET","path":"/ping","status_code":200,"response_body":"{\"ok\":true}"}]'

wrench webhook create --name "deploy-check"
wrench webhook requests <slug>
```

Токен и базовый URL можно задать флагом (`--token`, `--base-url`) вместо переменной окружения — флаг имеет приоритет.

## Переменные окружения

| Переменная          | Назначение                                              | По умолчанию                     |
|----------------------|----------------------------------------------------------|-----------------------------------|
| `WRENCH_API_TOKEN`   | Личный токен для команд `mock`/`webhook`                  | —                                  |
| `WRENCH_BASE_URL`    | Базовый URL API (для self-hosted/локальной разработки)    | `https://wrench-branch.vercel.app` |

## Справка

```bash
wrench help
wrench --version
```

## Разработка

```bash
npm install
npm run typecheck
npm run test-units
npm run build       # esbuild -> dist/index.js
node dist/index.js json format '{"a":1}'
```

## Лицензия

MIT — см. [LICENSE](./LICENSE).
