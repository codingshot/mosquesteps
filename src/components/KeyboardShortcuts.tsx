import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Keyboard, X } from "lucide-react";

const shortcuts = [
  { key: "d", label: "Dashboard", path: "/dashboard" },
  { key: "m", label: "Mosque Finder", path: "/mosques" },
  { key: "w", label: "Start Walk", path: "/walk" },
  { key: "r", label: "Rewards", path: "/rewards" },
  { key: "s", label: "Stats", path: "/stats" },
  { key: "h", label: "History", path: "/history" },
  { key: "g", label: "Guides", path: "/guides" },
  { key: "b", label: "Blog", path: "/blogs" },
  { key: ",", label: "Settings", path: "/settings" },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "?" || e.key === "/") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      if (open) {
        const s = shortcuts.find((s) => s.key === e.key.toLowerCase());
        if (s) { navigate(s.path); setOpen(false); }
        if (e.key === "Escape") setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, navigate]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" /> Keyboard Shortcuts
          </h2>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-1.5">
          {shortcuts.map((s) => (
            <button
              key={s.key}
              onClick={() => { navigate(s.path); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
            >
              <span className="text-foreground">{s.label}</span>
              <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-xs font-mono text-muted-foreground">{s.key}</kbd>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-4">
          Press <kbd className="px-1 rounded bg-muted border border-border text-[10px] font-mono">?</kbd> to toggle
        </p>
      </div>
    </div>
  );
}
