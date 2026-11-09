import { Finding, finding, sortFindings } from "../mobile/findings";

export interface Sniffed {
  type: string;
  mime: string;
  exts: string[];
  note?: string;
}

const bytesAt = (b: Uint8Array, off: number, sig: number[]) => sig.every((v, i) => b[off + i] === v);
const ascii = (b: Uint8Array, off: number, len: number) => String.fromCharCode(...Array.from(b.subarray(off, off + len)));

export function sniff(b: Uint8Array): Sniffed | null {
  if (b.length >= 8 && bytesAt(b, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { type: "PNG", mime: "image/png", exts: ["png"] };
  if (b.length >= 3 && bytesAt(b, 0, [0xff, 0xd8, 0xff])) return { type: "JPEG", mime: "image/jpeg", exts: ["jpg", "jpeg"] };
  if (b.length >= 6 && (ascii(b, 0, 6) === "GIF87a" || ascii(b, 0, 6) === "GIF89a")) return { type: "GIF", mime: "image/gif", exts: ["gif"] };
  if (b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return { type: "WebP", mime: "image/webp", exts: ["webp"] };
  if (b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WAVE") return { type: "WAV", mime: "audio/wav", exts: ["wav"] };
  if (b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "AVI ") return { type: "AVI", mime: "video/x-msvideo", exts: ["avi"] };
  if (b.length >= 5 && ascii(b, 0, 5) === "%PDF-") return { type: "PDF", mime: "application/pdf", exts: ["pdf"] };
  if (b.length >= 4 && bytesAt(b, 0, [0x50, 0x4b, 0x03, 0x04])) return { type: "ZIP container", mime: "application/zip", exts: ["zip", "docx", "xlsx", "pptx", "jar", "apk", "odt"], note: "docx, xlsx, pptx, apk and jar files are ZIP archives inside" };
  if (b.length >= 4 && bytesAt(b, 0, [0x50, 0x4b, 0x05, 0x06])) return { type: "ZIP (empty archive)", mime: "application/zip", exts: ["zip"] };
  if (b.length >= 2 && bytesAt(b, 0, [0x1f, 0x8b])) return { type: "GZIP", mime: "application/gzip", exts: ["gz", "tgz"] };
  if (b.length >= 6 && bytesAt(b, 0, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) return { type: "7-Zip", mime: "application/x-7z-compressed", exts: ["7z"] };
  if (b.length >= 7 && ascii(b, 0, 4) === "Rar!") return { type: "RAR", mime: "application/vnd.rar", exts: ["rar"] };
  if (b.length >= 2 && ascii(b, 0, 2) === "MZ") return { type: "Windows executable", mime: "application/vnd.microsoft.portable-executable", exts: ["exe", "dll", "scr"] };
  if (b.length >= 4 && bytesAt(b, 0, [0x7f, 0x45, 0x4c, 0x46])) return { type: "ELF executable", mime: "application/x-elf", exts: ["", "so", "elf"] };
  if (b.length >= 12 && ascii(b, 4, 4) === "ftyp") {
    const brand = ascii(b, 8, 4);
    if (["heic", "heix", "hevc", "mif1", "msf1"].includes(brand)) return { type: "HEIC image", mime: "image/heic", exts: ["heic", "heif"] };
    if (brand === "qt  ") return { type: "QuickTime video", mime: "video/quicktime", exts: ["mov"] };
    if (brand.startsWith("M4A")) return { type: "M4A audio", mime: "audio/mp4", exts: ["m4a"] };
    return { type: "MP4 video", mime: "video/mp4", exts: ["mp4", "m4v"] };
  }
  if (b.length >= 4 && bytesAt(b, 0, [0x1a, 0x45, 0xdf, 0xa3])) return { type: "WebM or Matroska video", mime: "video/webm", exts: ["webm", "mkv"] };
  if (b.length >= 4 && ascii(b, 0, 4) === "OggS") return { type: "Ogg", mime: "audio/ogg", exts: ["ogg", "oga", "ogv"] };
  if (b.length >= 3 && ascii(b, 0, 3) === "ID3") return { type: "MP3 (ID3 tag)", mime: "audio/mpeg", exts: ["mp3"] };
  if (b.length >= 2 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0) return { type: "MP3 frame", mime: "audio/mpeg", exts: ["mp3"] };
  if (b.length >= 4 && bytesAt(b, 0, [0x00, 0x00, 0x01, 0x00])) return { type: "ICO icon", mime: "image/x-icon", exts: ["ico"] };
  if (b.length >= 2 && ascii(b, 0, 2) === "BM") return { type: "BMP", mime: "image/bmp", exts: ["bmp"] };
  if (b.length >= 4 && (bytesAt(b, 0, [0x49, 0x49, 0x2a, 0x00]) || bytesAt(b, 0, [0x4d, 0x4d, 0x00, 0x2a]))) return { type: "TIFF", mime: "image/tiff", exts: ["tif", "tiff"] };
  if (b.length >= 4 && ascii(b, 0, 4) === "8BPS") return { type: "Photoshop PSD", mime: "image/vnd.adobe.photoshop", exts: ["psd"] };
  // Текстовые форматы: смотрим на начало без BOM и пробелов.
  const head = new TextDecoder("utf-8", { fatal: false }).decode(b.subarray(0, 512)).replace(/^﻿/, "").trimStart().toLowerCase();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return { type: "SVG image", mime: "image/svg+xml", exts: ["svg"], note: "SVG can contain scripts" };
  if (head.startsWith("<!doctype html") || head.startsWith("<html")) return { type: "HTML page", mime: "text/html", exts: ["html", "htm"], note: "HTML can contain scripts" };
  if (head.startsWith("<?xml")) return { type: "XML", mime: "application/xml", exts: ["xml"] };
  return null;
}

export function hexDump(b: Uint8Array, n = 32): string {
  return Array.from(b.subarray(0, n)).map((x) => x.toString(16).padStart(2, "0")).join(" ");
}

const EXEC_EXTS = ["exe", "dll", "scr", "bat", "cmd", "com", "msi", "js", "vbs", "ps1", "sh", "jar", "apk", "lnk"];

export function analyzeFile(name: string, declaredMime: string, b: Uint8Array): { sniffed: Sniffed | null; findings: Finding[] } {
  const f: Finding[] = [];
  const sniffed = sniff(b);
  const parts = name.split(".");
  const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  if (b.length === 0) f.push(finding("warning", "empty", "The file is empty (0 bytes).", "Файл пустой (0 байт)."));
  if (/[‮‭⁦-⁩]/.test(name)) f.push(finding("error", "rtl-override", "The file name contains a bidirectional control character: the displayed extension can differ from the real one.", "В имени файла есть символ управления направлением текста: показанное расширение может отличаться от настоящего."));
  if (parts.length > 2 && EXEC_EXTS.includes(ext)) f.push(finding("error", "double-extension", `Double extension ".${parts[parts.length - 2]}.${ext}": the file looks like a document but runs as ${ext}.`, `Двойное расширение ".${parts[parts.length - 2]}.${ext}": файл выглядит как документ, а запускается как ${ext}.`));
  if (sniffed) {
    if (ext && !sniffed.exts.includes(ext)) f.push(finding("error", "extension-mismatch", `The extension is ".${ext}" but the content is ${sniffed.type}.`, `Расширение ".${ext}", а содержимое — ${sniffed.type}.`));
    if (declaredMime && declaredMime !== sniffed.mime && !(sniffed.type.startsWith("ZIP") && declaredMime.includes("officedocument"))) f.push(finding("warning", "mime-mismatch", `The browser reported "${declaredMime}" but the content looks like "${sniffed.mime}".`, `Браузер сообщил "${declaredMime}", а содержимое похоже на "${sniffed.mime}".`));
    if (sniffed.type === "Windows executable" || sniffed.type === "ELF executable") f.push(finding("error", "executable", `The content is a ${sniffed.type}. Most messengers should block or warn.`, `Содержимое — ${sniffed.type}. Большинство мессенджеров должны блокировать или предупреждать.`));
    if (sniffed.note) f.push(finding("info", "note", sniffed.note + ".", sniffed.note + "."));
  } else if (b.length > 0) {
    f.push(finding("info", "unknown", "The content does not match a known signature (it may be plain text or an unsupported type).", "Содержимое не совпало с известной сигнатурой (возможно, обычный текст или неподдерживаемый тип)."));
  }
  if (f.length === 0) f.push(finding("info", "ok", "The extension, the reported type and the content agree.", "Расширение, сообщённый тип и содержимое согласуются."));
  return { sniffed, findings: sortFindings(f) };
}
