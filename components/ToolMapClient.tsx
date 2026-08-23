"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { allTools } from "@/lib/tools-registry";
import { Locale, localePath } from "@/lib/i18n/config";
import { CategoryIcon } from "@/components/CategoryIcon";

const CATEGORY_COLORS: Record<string, string> = {
  formatting: "#f59e0b",
  encoding:   "#3b82f6",
  text:       "#8b5cf6",
  hash:       "#ef4444",
  generators: "#10b981",
  datetime:   "#06b6d4",
  web:        "#f97316",
  data:       "#ec4899",
  qa:         "#22c55e",
  api:        "#a78bfa",
};

interface Node {
  id:       string;
  name:     string;
  category: string;
  slug:     string;
  x:        number;
  y:        number;
  vx:       number;
  vy:       number;
  r:        number;
  isPopular?: boolean;
}

interface Edge { source: string; target: string; }

function initNodes(width: number, height: number): Node[] {
  const tools = allTools.filter(t => t.isImplemented);
  return tools.map(t => ({
    id:       t.slug,
    name:     t.name,
    category: t.category,
    slug:     t.slug,
    x:        width  * 0.1 + Math.random() * width  * 0.8,
    y:        height * 0.1 + Math.random() * height * 0.8,
    vx: 0, vy: 0,
    r:  t.isPopular ? 22 : 16,
    isPopular: t.isPopular,
  }));
}

function initEdges(): Edge[] {
  const tools  = allTools.filter(t => t.isImplemented);
  const edges: Edge[] = [];
  const seen   = new Set<string>();
  for (const t of tools) {
    for (const rel of (t.relatedSlugs ?? [])) {
      const key = [t.slug, rel].sort().join("--");
      if (!seen.has(key) && tools.find(x => x.slug === rel)) {
        edges.push({ source: t.slug, target: rel });
        seen.add(key);
      }
    }
  }
  return edges;
}

export function ToolMapClient({ locale }: { locale: Locale }) {
  const isRu    = locale === "ru";
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const nodesRef   = useRef<Node[]>([]);
  const edgesRef   = useRef<Edge[]>([]);
  const animRef    = useRef<number>(0);
  const dragRef    = useRef<{ node: Node; ox: number; oy: number } | null>(null);
  const offsetRef  = useRef({ x: 0, y: 0, scale: 1 });
  const panRef     = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  const [selected, setSelected] = useState<Node | null>(null);
  const [filter,   setFilter]   = useState<string>("all");
  const [search,   setSearch]   = useState("");
  const [dims,     setDims]     = useState({ w: 800, h: 600 });

  const categories = Array.from(new Set(allTools.filter(t => t.isImplemented).map(t => t.category)));

  // Init
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.parentElement!.clientWidth;
    const h = canvas.parentElement!.clientHeight;
    setDims({ w, h });
    nodesRef.current = initNodes(w, h);
    edgesRef.current = initEdges();
  }, []);

  // Force simulation
  useEffect(() => {
    const tick = () => {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const W = dims.w, H = dims.h;

      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const minDist = a.r + b.r + 30;
          if (dist < minDist) {
            const force = (minDist - dist) / dist * 0.3;
            a.vx -= dx * force; a.vy -= dy * force;
            b.vx += dx * force; b.vy += dy * force;
          }
        }
      }

      // Attraction along edges
      const nodeMap = new Map(nodes.map(n => [n.id, n]));
      for (const e of edges) {
        const a = nodeMap.get(e.source), b = nodeMap.get(e.target);
        if (!a || !b) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const target = 120;
        const force = (dist - target) / dist * 0.015;
        a.vx += dx * force; a.vy += dy * force;
        b.vx -= dx * force; b.vy -= dy * force;
      }

      // Center gravity
      for (const n of nodes) {
        n.vx += (W/2 - n.x) * 0.001;
        n.vy += (H/2 - n.y) * 0.001;
        // Damping
        n.vx *= 0.85; n.vy *= 0.85;
        if (!dragRef.current || dragRef.current.node !== n) {
          n.x += n.vx; n.y += n.vy;
        }
        // Bounds
        n.x = Math.max(n.r + 5, Math.min(W - n.r - 5, n.x));
        n.y = Math.max(n.r + 5, Math.min(H - n.r - 5, n.y));
      }

      draw();
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [dims, filter, search]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x: ox, y: oy, scale } = offsetRef.current;

    ctx.clearRect(0, 0, dims.w, dims.h);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    const nodes   = nodesRef.current;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const q       = search.toLowerCase();

    const isVisible = (n: Node) => {
      const matchCat    = filter === "all" || n.category === filter;
      const matchSearch = !q || n.name.toLowerCase().includes(q) || n.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    };

    // Draw edges
    for (const e of edgesRef.current) {
      const a = nodeMap.get(e.source), b = nodeMap.get(e.target);
      if (!a || !b) continue;
      const visible = isVisible(a) && isVisible(b);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = visible ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.015)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw nodes
    for (const n of nodes) {
      const visible = isVisible(n);
      const color   = CATEGORY_COLORS[n.category] ?? "#71717a";
      const isSelected = selected?.id === n.id;
      const alpha   = visible ? 1 : 0.15;

      ctx.globalAlpha = alpha;

      // Glow for popular or selected
      if ((n.isPopular || isSelected) && visible) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 6, 0, Math.PI * 2);
        ctx.fillStyle = color + "33";
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? color : color + "cc";
      ctx.fill();

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 2, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      if (visible && (scale > 0.6 || n.isPopular || isSelected)) {
        ctx.fillStyle = "#fafafa";
        ctx.font = `${n.isPopular ? "bold " : ""}${Math.max(9, 11 / scale)}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.name.length > 14 ? n.name.slice(0, 13) + "…" : n.name, n.x, n.y + n.r + 10);
      }

      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }, [dims, selected, filter, search]);

  // Mouse events
  function toWorld(ex: number, ey: number) {
    const { x, y, scale } = offsetRef.current;
    return { wx: (ex - x) / scale, wy: (ey - y) / scale };
  }

  function onMouseDown(e: React.MouseEvent) {
    const { wx, wy } = toWorld(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    const hit = nodesRef.current.find(n => Math.hypot(n.x - wx, n.y - wy) < n.r + 4);
    if (hit) {
      dragRef.current = { node: hit, ox: wx - hit.x, oy: wy - hit.y };
      setSelected(hit);
    } else {
      dragRef.current = null;
      panRef.current  = { startX: e.nativeEvent.offsetX, startY: e.nativeEvent.offsetY, ox: offsetRef.current.x, oy: offsetRef.current.y };
    }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (dragRef.current) {
      const { wx, wy } = toWorld(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      dragRef.current.node.x = wx - dragRef.current.ox;
      dragRef.current.node.y = wy - dragRef.current.oy;
    } else if (panRef.current) {
      offsetRef.current.x = panRef.current.ox + (e.nativeEvent.offsetX - panRef.current.startX);
      offsetRef.current.y = panRef.current.oy + (e.nativeEvent.offsetY - panRef.current.startY);
    }
  }

  function onMouseUp() { dragRef.current = null; panRef.current = null; }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    offsetRef.current.scale = Math.max(0.3, Math.min(3, offsetRef.current.scale * factor));
  }

  function resetView() {
    offsetRef.current = { x: 0, y: 0, scale: 1 };
  }

  const selectedTool = selected ? allTools.find(t => t.slug === selected.id) : null;

  return (
    <div className="relative w-full h-full bg-canvas">
      {/* Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={isRu ? "Поиск…" : "Search…"}
          className="w-44 rounded-lg border border-border bg-canvas/90 backdrop-blur px-3 py-1.5 text-xs text-text-primary outline-none placeholder:text-text-muted" />

        <div className="flex flex-wrap gap-1 max-w-[200px]">
          <button onClick={() => setFilter("all")}
            className={`rounded border px-2 py-0.5 text-[10px] transition-colors ${filter === "all" ? "border-white/30 bg-white/10 text-white" : "border-border bg-canvas/80 text-text-muted hover:bg-surface"}`}>
            {isRu ? "Все" : "All"}
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`rounded border px-2 py-0.5 text-[10px] transition-colors`}
              style={filter === cat ? { borderColor: CATEGORY_COLORS[cat] + "80", background: CATEGORY_COLORS[cat] + "20", color: CATEGORY_COLORS[cat] } : {}}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 z-10 rounded-lg border border-border bg-canvas/90 backdrop-blur p-3 text-[10px]">
        <p className="text-text-muted mb-2 font-medium">{isRu ? "Категории" : "Categories"}</p>
        <div className="space-y-1">
          {categories.map(cat => (
            <div key={cat} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[cat] ?? "#71717a" }} />
              <span className="text-text-muted capitalize">{cat}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t border-border pt-2">
          <p className="text-text-muted">{isRu ? "Управление:" : "Controls:"}</p>
          <p className="text-text-disabled">{isRu ? "Скролл — зум" : "Scroll — zoom"}</p>
          <p className="text-text-disabled">{isRu ? "Тяни — перемещение" : "Drag — pan"}</p>
          <p className="text-text-disabled">{isRu ? "Узел — детали" : "Node — details"}</p>
        </div>
        <button onClick={resetView} className="mt-2 w-full rounded border border-border bg-surface/50 py-1 text-[10px] text-text-muted hover:bg-surface transition-colors">
          {isRu ? "Сброс вида" : "Reset view"}
        </button>
      </div>

      {/* Tool detail panel */}
      {selected && selectedTool && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-80 rounded-xl border border-border bg-canvas/95 backdrop-blur-md p-4 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: (CATEGORY_COLORS[selectedTool.category] ?? "#71717a") + "20" }}>
                <span style={{ color: CATEGORY_COLORS[selectedTool.category] }}>
                  <CategoryIcon category={selectedTool.category} size={14} />
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{selectedTool.name}</p>
                <p className="text-[10px] text-text-muted capitalize">{selectedTool.category}</p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="text-text-disabled hover:text-text-muted text-xs">✕</button>
          </div>
          <p className="mt-2 text-xs text-text-muted leading-relaxed">{selectedTool.shortDescription}</p>
          <Link href={localePath(locale, `/tools/${selectedTool.slug}`)}
            className="mt-3 block w-full rounded-lg py-2 text-center text-xs font-semibold text-accent-fg transition-colors hover:opacity-90"
            style={{ background: CATEGORY_COLORS[selectedTool.category] ?? "#f59e0b" }}>
            {isRu ? "Открыть инструмент →" : "Open tool →"}
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="absolute bottom-4 right-4 z-10 text-right">
        <p className="text-xs text-text-disabled">
          {nodesRef.current.filter(n => filter === "all" || n.category === filter).length} {isRu ? "инструментов" : "tools"}
        </p>
      </div>

      <canvas
        ref={canvasRef}
        width={dims.w}
        height={dims.h}
        className="cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      />
    </div>
  );
}