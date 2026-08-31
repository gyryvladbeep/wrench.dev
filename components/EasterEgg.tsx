"use client";
import { useEffect, useState } from "react";

const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];

function Confetti() {
  const pieces = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: ["#f59e0b","#3b82f6","#8b5cf6","#22c55e","#ef4444","#06b6d4","#ec4899"][Math.floor(Math.random() * 7)],
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {pieces.map((p) => (
        <div key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: "-20px",
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            transform: `rotate(${p.rotate}deg)`,
            animation: `confettiFall ${p.duration}s ${p.delay}s linear forwards`,
          }} />
      ))}
      <style>{`
        @keyframes confettiFall {
          to { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export function EasterEgg() {
  const [keys,   setKeys]   = useState<string[]>([]);
  const [active, setActive] = useState(false);
  const [emoji,  setEmoji]  = useState("");

  useEffect(() => {
    const EMOJIS = ["🎉","🔧","🚀","⭐","🏆","💎","🎯","⚡"];

    function onKey(e: KeyboardEvent) {
      setKeys(prev => {
        const next = [...prev, e.key].slice(-KONAMI.length);
        if (next.join(",") === KONAMI.join(",")) {
          setActive(true);
          setEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
          setTimeout(() => setActive(false), 4000);
          return [];
        }
        return next;
      });
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!active) return null;

  return (
    <>
      <Confetti />
      <div className="pointer-events-none fixed inset-0 z-[9998] flex items-center justify-center">
        <div className="animate-scale-in rounded-2xl border border-border bg-canvas/95 backdrop-blur-md px-8 py-6 text-center shadow-2xl">
          <p className="text-5xl mb-3">{emoji}</p>
          <p className="text-lg font-bold text-text-primary">Konami Code!</p>
          <p className="text-sm text-text-muted mt-1">You found the easter egg 🔧</p>
        </div>
      </div>
    </>
  );
}