"use client";
import { useMemo, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { CopyButton } from "@/components/CopyButton";
import { SAMPLE_FRAMES, decodeFrames, frameStats } from "@/lib/messenger/frames";
import { Field, Stat, areaClass } from "./messenger/ui";

export function RealtimeFrameDecoderTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [text, setText] = useState(SAMPLE_FRAMES);
  const frames = useMemo(() => decodeFrames(text), [text]);
  const s = useMemo(() => frameStats(frames), [frames]);

  return (
    <div className="space-y-5 max-w-4xl">
      <Field id="rf-input" label={isRu ? "Кадры WebSocket, по одному в строке" : "WebSocket frames, one per line"} hint={isRu ? "Скопируйте кадры из вкладки Network → WS в DevTools. Поддерживаются Engine.IO, Socket.IO, STOMP, JSON-RPC и обычный JSON." : "Copy frames from DevTools Network → WS. Engine.IO, Socket.IO, STOMP, JSON-RPC and plain JSON are supported."}>
        <textarea id="rf-input" value={text} onChange={(e) => setText(e.target.value)} className={`${areaClass} min-h-[160px]`} spellCheck={false} />
      </Field>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat id="rf-total" label={isRu ? "Кадров" : "Frames"} value={s.total} />
        <Stat id="rf-events" label={isRu ? "События" : "Events"} value={s.events} />
        <Stat id="rf-acks" label="ACK" value={s.acks} />
        <Stat id="rf-pings" label="Ping" value={s.pings} />
        <Stat id="rf-pongs" label="Pong" value={s.pongs} />
      </div>
      <ul className="space-y-2" data-testid="rf-frames">
        {frames.map((f) => (
          <li key={f.index} data-protocol={f.protocol} data-kind={f.kind} className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm"><span className="mr-2 font-mono text-text-muted">#{f.index + 1}</span><span className="font-medium text-text-primary">{f.protocol} / {f.kind}</span> <span className="text-text-muted">{f.summary}</span></div>
              <CopyButton value={f.body} iconOnly />
            </div>
            {f.body ? <pre className="code-surface mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-lg px-3 py-2 font-mono text-xs text-text-primary">{f.body}</pre> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
