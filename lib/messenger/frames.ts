export interface DecodedFrame {
  index: number;
  raw: string;
  protocol: "engine.io" | "socket.io" | "stomp" | "json-rpc" | "json" | "text";
  kind: string;
  summary: string;
  /** Человекочитаемое тело: pretty JSON или заголовки STOMP. */
  body: string;
}

const ENGINE_TYPES = ["open", "close", "ping", "pong", "message", "upgrade", "noop"];
const SOCKET_TYPES = ["CONNECT", "DISCONNECT", "EVENT", "ACK", "CONNECT_ERROR", "BINARY_EVENT", "BINARY_ACK"];
const STOMP_COMMANDS = ["CONNECT", "STOMP", "CONNECTED", "SEND", "SUBSCRIBE", "UNSUBSCRIBE", "ACK", "NACK", "BEGIN", "COMMIT", "ABORT", "DISCONNECT", "MESSAGE", "RECEIPT", "ERROR"];

function pretty(text: string): string {
  try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; }
}

function decodeSocketIo(index: number, raw: string): DecodedFrame | null {
  // Engine.IO: первый символ - тип пакета
  const et = Number(raw[0]);
  if (!/^[0-6]/.test(raw) || Number.isNaN(et)) return null;
  const rest = raw.slice(1);
  const engine = ENGINE_TYPES[et];
  if (et !== 4) {
    // без полезной нагрузки либо JSON handshake (open)
    if (et === 0 && rest.startsWith("{")) return { index, raw, protocol: "engine.io", kind: "open", summary: "handshake", body: pretty(rest) };
    if (rest !== "" && et !== 2 && et !== 3) return null;
    return { index, raw, protocol: "engine.io", kind: engine, summary: rest ? `payload "${rest}"` : "no payload", body: rest };
  }
  // Socket.IO: тип пакета, затем [вложения-][/namespace,][ackId][json]
  const st = Number(rest[0]);
  if (!/^[0-6]/.test(rest) || Number.isNaN(st)) return { index, raw, protocol: "engine.io", kind: "message", summary: "text message", body: rest };
  let tail = rest.slice(1);
  let attachments = "";
  if (st === 5 || st === 6) {
    const m = /^(\d+)-/.exec(tail);
    if (m) { attachments = m[1]; tail = tail.slice(m[0].length); }
  }
  let ns = "/";
  if (tail.startsWith("/")) {
    const comma = tail.indexOf(",");
    ns = comma === -1 ? tail : tail.slice(0, comma);
    tail = comma === -1 ? "" : tail.slice(comma + 1);
  }
  const ack = /^(\d+)/.exec(tail)?.[1] ?? "";
  const payload = tail.slice(ack.length);
  const type = SOCKET_TYPES[st];
  let summary = type;
  if ((st === 2 || st === 5) && payload.startsWith("[")) {
    try {
      const arr = JSON.parse(payload) as unknown[];
      summary = `EVENT "${String(arr[0])}" with ${arr.length - 1} argument${arr.length === 2 ? "" : "s"}`;
    } catch { summary = "EVENT (invalid JSON)"; }
  } else if (st === 3 || st === 6) summary = `ACK for id ${ack}`;
  else if (st === 0) summary = `CONNECT to ${ns}`;
  const extra = [ns !== "/" ? `namespace ${ns}` : "", ack && st !== 3 && st !== 6 ? `ack id ${ack}` : "", attachments ? `${attachments} attachment(s)` : ""].filter(Boolean).join(", ");
  return { index, raw, protocol: "socket.io", kind: type, summary: extra ? `${summary} (${extra})` : summary, body: pretty(payload) };
}

function decodeStompFrame(index: number, frame: string): DecodedFrame | null {
  const text = frame.replace(/^\n+/, "");
  const [head, ...bodyParts] = text.split(/\n\n/);
  const lines = head.split("\n");
  const command = lines[0].trim();
  if (!STOMP_COMMANDS.includes(command)) return null;
  const headers = lines.slice(1).filter(Boolean);
  const body = bodyParts.join("\n\n");
  const dest = headers.find((h) => h.startsWith("destination:"))?.slice(12);
  return {
    index, raw: frame, protocol: "stomp", kind: command,
    summary: `${command}${dest ? ` ${dest}` : ""}${headers.length ? ` (${headers.length} header${headers.length === 1 ? "" : "s"})` : ""}`,
    body: [...headers, body ? "" : null, body ? pretty(body) : null].filter((x) => x !== null).join("\n"),
  };
}

function decodeJson(index: number, raw: string): DecodedFrame | null {
  let v: unknown;
  try { v = JSON.parse(raw); } catch { return null; }
  if (v === null || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (o.jsonrpc === "2.0") {
    const kind = "method" in o ? ("id" in o ? "request" : "notification") : ("error" in o ? "error" : "response");
    return { index, raw, protocol: "json-rpc", kind, summary: `${kind}${o.method ? ` ${String(o.method)}` : ""}${"id" in o ? ` #${String(o.id)}` : ""}`, body: JSON.stringify(v, null, 2) };
  }
  const label = ["type", "event", "action", "op", "t", "method"].map((k) => (typeof o[k] === "string" ? `${k}=${String(o[k])}` : "")).find(Boolean) ?? (Array.isArray(v) ? `array of ${v.length}` : "object");
  return { index, raw, protocol: "json", kind: "json", summary: label, body: JSON.stringify(v, null, 2) };
}

export function decodeFrames(input: string): DecodedFrame[] {
  const text = input.replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  const first = text.split("\n", 1)[0].trim();
  if (STOMP_COMMANDS.includes(first)) {
    const frames = text.split(/\u0000|\^@/).map((f) => f.trim()).filter(Boolean);
    return frames.map((f, i) => decodeStompFrame(i + 1, f) ?? { index: i + 1, raw: f, protocol: "text", kind: "unknown", summary: "not a STOMP frame", body: f });
  }
  return text.split("\n").filter((l) => l.trim() !== "").map((line, i) => {
    const l = line.trim();
    return decodeJson(i + 1, l) ?? decodeSocketIo(i + 1, l) ?? { index: i + 1, raw: l, protocol: "text" as const, kind: "text", summary: l.length > 60 ? `${l.slice(0, 57)}...` : l, body: l };
  });
}

export function frameStats(frames: DecodedFrame[]): { total: number; pings: number; pongs: number; events: number; acks: number } {
  return {
    total: frames.length,
    pings: frames.filter((f) => f.protocol === "engine.io" && f.kind === "ping").length,
    pongs: frames.filter((f) => f.protocol === "engine.io" && f.kind === "pong").length,
    events: frames.filter((f) => f.kind === "EVENT" || f.kind === "MESSAGE").length,
    acks: frames.filter((f) => f.kind === "ACK").length,
  };
}

export const SAMPLE_FRAMES = `0{"sid":"abc123","upgrades":["websocket"],"pingInterval":25000,"pingTimeout":20000}
40
42["message:new",{"id":"m1","text":"hello","channel":"general"}]
4212["typing",{"user":"alex"}]
4312[{"ok":true}]
2
3
41`;
