"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { FIVE_MB, fmtBytes, fmtDuration, planCompression, suggestResolution } from "@/lib/video/bitrate";
import { Field, NumberField, Panel, Stat, btnClass, inputClass, primaryBtn } from "./messenger/ui";

interface Format { id: string; label: string; mime: string; ext: string }
const CANDIDATES: Format[] = [
  { id: "webm-vp9", label: "WebM (VP9 + Opus)", mime: "video/webm;codecs=vp9,opus", ext: "webm" },
  { id: "webm-vp8", label: "WebM (VP8 + Opus)", mime: "video/webm;codecs=vp8,opus", ext: "webm" },
  { id: "mp4", label: "MP4 (H.264 + AAC)", mime: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", ext: "mp4" },
];

interface Meta { duration: number; width: number; height: number }
interface EncodeOptions { width: number; height: number; fps: number; videoBps: number; audioBps: number; audio: boolean; mime: string }
type VideoWithRvfc = HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number };

async function probe(file: File): Promise<Meta> {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    await new Promise<void>((res, rej) => { v.onloadedmetadata = () => res(); v.onerror = () => rej(new Error("metadata")); });
    if (!Number.isFinite(v.duration)) {
      // У WebM без длительности в заголовке: перемотка в конец заставляет браузер её вычислить.
      await new Promise<void>((res) => { v.ontimeupdate = () => { v.ontimeupdate = null; res(); }; v.currentTime = 1e101; });
    }
    return { duration: v.duration, width: v.videoWidth, height: v.videoHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function encode(url: string, o: EncodeOptions, onProgress: (p: number) => void, duration: number, state: { cancelled: boolean }): Promise<Blob> {
  const video = document.createElement("video") as VideoWithRvfc;
  video.src = url;
  video.playsInline = true;
  video.muted = !o.audio;
  await new Promise<void>((res, rej) => { video.onloadeddata = () => res(); video.onerror = () => rej(new Error("decode")); });

  const canvas = document.createElement("canvas");
  canvas.width = o.width;
  canvas.height = o.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  const stream = canvas.captureStream(o.fps);
  let ac: AudioContext | null = null;
  if (o.audio) {
    try {
      ac = new AudioContext();
      const src = ac.createMediaElementSource(video);
      const dest = ac.createMediaStreamDestination();
      src.connect(dest); // не подключаем к колонкам: во время сжатия звука не слышно
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      if (ac.state === "suspended") await ac.resume();
    } catch { ac = null; }
  }
  const rec = new MediaRecorder(stream, { mimeType: o.mime, videoBitsPerSecond: o.videoBps, audioBitsPerSecond: o.audio ? o.audioBps : undefined });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const finished = new Promise<Blob>((res, rej) => {
    rec.onstop = () => res(new Blob(chunks, { type: o.mime.split(";")[0] }));
    rec.onerror = () => rej(new Error("recorder"));
  });

  const draw = () => {
    ctx.drawImage(video, 0, 0, o.width, o.height);
    onProgress(duration > 0 ? Math.min(1, video.currentTime / duration) : 0);
    if (!video.ended && !state.cancelled) schedule();
  };
  const schedule = () => { if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(draw); else requestAnimationFrame(draw); };

  try {
    rec.start(1000);
    const ended = new Promise<void>((res) => { video.onended = () => res(); });
    await video.play();
    schedule();
    await Promise.race([ended, new Promise<void>((res) => { const t = setInterval(() => { if (state.cancelled) { clearInterval(t); res(); } }, 200); ended.then(() => clearInterval(t)); })]);
    if (!state.cancelled) ctx.drawImage(video, 0, 0, o.width, o.height);
    video.pause();
    if (rec.state !== "inactive") rec.stop();
    return await finished;
  } finally {
    stream.getTracks().forEach((t) => t.stop());
    if (ac) void ac.close();
    video.removeAttribute("src");
    video.load();
  }
}

export function VideoCompressorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [supported, setSupported] = useState<boolean | null>(null);
  const [formats, setFormats] = useState<Format[]>([]);
  const [formatId, setFormatId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [target, setTarget] = useState("5");
  const [audio, setAudio] = useState(true);
  const [audioKbps, setAudioKbps] = useState("64");
  const [duration, setDuration] = useState("60");
  const [maxHeight, setMaxHeight] = useState("auto");
  const [autoRetry, setAutoRetry] = useState(true);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ url: string; size: number; name: string } | null>(null);
  const [hidden, setHidden] = useState(false);
  const cancel = useRef({ cancelled: false });

  useEffect(() => {
    const ok = typeof MediaRecorder !== "undefined" && typeof HTMLCanvasElement !== "undefined" && "captureStream" in HTMLCanvasElement.prototype;
    setSupported(ok);
    if (ok) {
      const list = CANDIDATES.filter((c) => MediaRecorder.isTypeSupported(c.mime));
      setFormats(list);
      if (list[0]) setFormatId(list[0].id);
    }
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);

  const targetBytes = Math.round(Number(target) * 1048576);
  const durationSec = Number(duration);
  const plan = useMemo(() => planCompression({ durationSec, targetBytes, audio, audioKbps: Number(audioKbps) || 0 }), [durationSec, targetBytes, audio, audioKbps]);
  const dims = useMemo(() => {
    if (!meta || !plan.ok) return null;
    const auto = suggestResolution(meta.width, meta.height, plan.videoKbps);
    if (maxHeight === "auto") return auto;
    const cap = Number(maxHeight);
    const scale = Math.min(1, cap / meta.height);
    return { width: Math.max(2, Math.floor((meta.width * scale) / 2) * 2), height: Math.max(2, Math.floor((meta.height * scale) / 2) * 2), fps: auto.fps };
  }, [meta, plan, maxHeight]);

  const onFile = async (f: File | null) => {
    setResult(null); setStatus("idle"); setError(""); setProgress(0); setMeta(null); setFile(f);
    if (!f) return;
    try {
      const m = await probe(f);
      setMeta(m);
      if (Number.isFinite(m.duration) && m.duration > 0) setDuration(String(Math.round(m.duration * 10) / 10));
    } catch {
      setError(isRu ? "Браузер не смог прочитать видео. Попробуйте MP4 или WebM." : "The browser could not read this video. Try an MP4 or WebM file.");
      setStatus("error");
    }
  };

  const run = async () => {
    if (!file || !meta || !dims || !plan.ok) return;
    const fmt = formats.find((f) => f.id === formatId);
    if (!fmt) return;
    cancel.current = { cancelled: false };
    setStatus("running"); setError(""); setResult(null);
    const url = URL.createObjectURL(file);
    try {
      let videoBps = plan.videoKbps * 1000;
      let best: Blob | null = null;
      const maxAttempts = autoRetry ? 3 : 1;
      for (let i = 1; i <= maxAttempts; i++) {
        setAttempt(i); setProgress(0);
        const blob = await encode(url, { ...dims, videoBps, audioBps: plan.audioKbps * 1000, audio, mime: fmt.mime }, setProgress, meta.duration, cancel.current);
        if (cancel.current.cancelled) { setStatus("idle"); return; }
        if (!best || blob.size < best.size) best = blob;
        if (blob.size <= targetBytes) break;
        videoBps = Math.max(50_000, videoBps * (targetBytes / blob.size) * 0.92);
      }
      if (best) {
        const base = file.name.replace(/\.[^.]+$/, "");
        setResult({ url: URL.createObjectURL(best), size: best.size, name: `${base}-compressed.${fmt.ext}` });
        setStatus("done");
      }
    } catch (e) {
      setError(isRu ? "Сжатие не удалось: " + (e as Error).message : "Compression failed: " + (e as Error).message);
      setStatus("error");
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const warnText = plan.warning === "very-low" ? (isRu ? "Битрейт видео ниже 100 кбит/с: картинка будет сильно потеряна. Обрежьте ролик или увеличьте лимит." : "Video bitrate is below 100 kbps: the picture will be heavily degraded. Trim the clip or raise the limit.")
    : plan.warning === "too-low" ? (isRu ? "Битрейт видео ниже 250 кбит/с: ожидайте заметные артефакты." : "Video bitrate is below 250 kbps: expect visible artifacts.") : "";

  return (
    <div className="space-y-5 max-w-4xl">
      {supported === false ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-300" data-testid="vc-unsupported">
          {isRu ? "Этот браузер не поддерживает MediaRecorder и canvas.captureStream. Откройте инструмент в Chrome, Edge или Firefox." : "This browser lacks MediaRecorder or canvas.captureStream. Open the tool in Chrome, Edge or Firefox."}
        </p>
      ) : null}
      <Panel cols="sm:grid-cols-2">
        <Field id="vc-file" label={isRu ? "Видеофайл" : "Video file"}>
          <input id="vc-file" type="file" accept="video/*" data-testid="vc-file" onChange={(e) => void onFile(e.target.files?.[0] ?? null)} className={inputClass} />
        </Field>
        <NumberField id="vc-target" label={isRu ? "Целевой размер, МБ" : "Target size, MB"} value={target} onChange={setTarget} min={0.1} step="0.1" hint={isRu ? "5 МБ по умолчанию (лимит вложений YouTrack). Проверьте лимит вашего трекера." : "5 MB by default (the YouTrack attachment limit). Check your tracker's limit."} />
        <NumberField id="vc-duration" label={isRu ? "Длительность, с" : "Duration, s"} value={duration} onChange={setDuration} min={1} hint={isRu ? "Подставляется из файла. Без файла можно использовать как калькулятор битрейта." : "Filled from the file. Without a file this works as a bitrate calculator."} />
        <Field id="vc-audio-kbps" label={isRu ? "Битрейт звука, кбит/с" : "Audio bitrate, kbps"}>
          <input id="vc-audio-kbps" type="number" min={16} value={audioKbps} onChange={(e) => setAudioKbps(e.target.value)} className={inputClass} />
        </Field>
        <Field id="vc-height" label={isRu ? "Разрешение" : "Resolution"}>
          <select id="vc-height" value={maxHeight} onChange={(e) => setMaxHeight(e.target.value)} className={inputClass}>
            <option value="auto">{isRu ? "Авто по битрейту" : "Auto by bitrate"}</option>
            <option value="1080">1080p max</option><option value="720">720p max</option><option value="480">480p max</option><option value="360">360p max</option>
          </select>
        </Field>
        <Field id="vc-format" label={isRu ? "Формат" : "Format"}>
          <select id="vc-format" value={formatId} onChange={(e) => setFormatId(e.target.value)} className={inputClass} disabled={formats.length === 0}>
            {formats.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm text-text-secondary"><input id="vc-audio" type="checkbox" checked={audio} onChange={(e) => setAudio(e.target.checked)} /> {isRu ? "Сохранить звук" : "Keep audio"}</label>
        <label className="flex items-center gap-2 text-sm text-text-secondary"><input id="vc-retry" type="checkbox" checked={autoRetry} onChange={(e) => setAutoRetry(e.target.checked)} /> {isRu ? "Повторять с меньшим битрейтом, если не уложились" : "Retry at a lower bitrate if over the target"}</label>
      </Panel>

      {plan.ok ? (
        <div className="space-y-3" data-testid="vc-plan" data-warning={plan.warning}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat id="vc-video-kbps" label={isRu ? "Видео, кбит/с" : "Video, kbps"} value={Math.round(plan.videoKbps)} />
            <Stat id="vc-audio-out" label={isRu ? "Звук, кбит/с" : "Audio, kbps"} value={Math.round(plan.audioKbps)} />
            <Stat id="vc-total-kbps" label={isRu ? "Всего, кбит/с" : "Total, kbps"} value={Math.round(plan.totalKbps)} />
            <Stat id="vc-expected" label={isRu ? "Ожидаемый размер" : "Expected size"} value={fmtBytes(plan.expectedBytes)} />
          </div>
          {warnText ? <p className="text-sm text-amber-300" data-testid="vc-warning">{warnText}</p> : null}
          {dims && meta ? <p className="text-sm text-text-muted" data-testid="vc-dims">{meta.width}x{meta.height} - {dims.width}x{dims.height}, {dims.fps} fps, {fmtDuration(meta.duration)}</p> : null}
        </div>
      ) : (
        <p className="text-sm text-text-muted" data-testid="vc-invalid">{isRu ? "Укажите длительность и целевой размер больше нуля." : "Enter a duration and a target size above zero."}</p>
      )}

      {file ? <p className="text-sm text-text-muted" data-testid="vc-source">{file.name} - {fmtBytes(file.size)}{file.size <= targetBytes ? (isRu ? " - уже укладывается в лимит" : " - already within the limit") : ""}</p> : null}
      {hidden && status === "running" ? <p className="text-sm text-amber-300">{isRu ? "Вкладка в фоне: браузер замедляет кадры. Вернитесь на эту вкладку, пока идёт сжатие." : "The tab is in the background and the browser throttles frames. Keep this tab visible while compressing."}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" data-testid="vc-start" className={primaryBtn} disabled={!file || !meta || !dims || !plan.ok || status === "running" || formats.length === 0} onClick={() => void run()}>
          {isRu ? "Сжать" : "Compress"}
        </button>
        {status === "running" ? <button type="button" className={btnClass} data-testid="vc-cancel" onClick={() => { cancel.current.cancelled = true; }}>{isRu ? "Отменить" : "Cancel"}</button> : null}
        <span className="text-sm text-text-muted" data-testid="vc-status" data-status={status}>
          {status === "running" ? `${isRu ? "Идёт сжатие" : "Compressing"} (${attempt}) ${Math.round(progress * 100)}%` : status === "done" ? (isRu ? "Готово" : "Done") : ""}
        </span>
      </div>
      {status === "running" ? <progress className="w-full" value={progress} max={1} data-testid="vc-progress" /> : null}
      {error ? <p className="text-sm text-red-300" data-testid="vc-error">{error}</p> : null}

      {result ? (
        <div className="space-y-3 rounded-lg border border-border bg-surface p-4" data-testid="vc-result">
          <p className="text-sm" data-testid="vc-result-size" data-bytes={result.size}>
            {isRu ? "Результат" : "Result"}: <span className="font-mono">{fmtBytes(result.size)}</span>{" "}
            {result.size <= targetBytes ? <span className="text-emerald-400">({isRu ? "в пределах лимита" : "within the limit"})</span> : <span className="text-amber-300">({isRu ? "больше лимита: уменьшите разрешение или обрежьте ролик" : "over the limit: lower the resolution or trim the clip"})</span>}
          </p>
          <video src={result.url} controls className="max-h-64 w-full rounded-lg bg-black" />
          <a href={result.url} download={result.name} data-testid="vc-download" className={`${primaryBtn} inline-block`}>{isRu ? "Скачать" : "Download"} {result.name}</a>
        </div>
      ) : null}
      <p className="text-xs text-text-muted">
        {isRu
          ? "Видео перекодируется в вашем браузере и никуда не загружается. Сжатие идёт в реальном времени: 2-минутный ролик обрабатывается около 2 минут. Лучше всего работает в Chrome и Edge. Если плеер не показывает длительность WebM, выберите MP4."
          : "The video is re-encoded in your browser and never uploaded. Compression runs in real time: a 2 minute clip takes about 2 minutes. It works best in Chrome and Edge. If a player shows no duration for a WebM, choose MP4."}
      </p>
    </div>
  );
}
