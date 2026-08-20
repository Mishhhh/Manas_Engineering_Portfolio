import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Search, ArrowRight, Terminal, FileText, User, Briefcase, FolderKanban, Code2, Mail, FlaskConical } from "lucide-react";

/**
 * Global command palette (Cmd/Ctrl-K).
 * Fuzzy-ish substring filter across navigation + resume actions + terminal shortcuts.
 */
export default function CommandPalette({ open, onClose }) {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);

  const commands = useMemo(
    () => [
      { id: "go-home", label: "Go to Home", hint: "/", icon: Terminal, run: () => nav("/") },
      { id: "go-about", label: "Go to About", hint: "/about", icon: User, run: () => nav("/about") },
      { id: "go-experience", label: "Go to Experience", hint: "/experience", icon: Briefcase, run: () => nav("/experience") },
      { id: "go-projects", label: "Go to Projects", hint: "/projects", icon: FolderKanban, run: () => nav("/projects") },
      { id: "go-skills", label: "Go to Skills", hint: "/skills", icon: Code2, run: () => nav("/skills") },
      { id: "go-resume", label: "Open Résumé page", hint: "/resume", icon: FileText, run: () => nav("/resume") },
      { id: "go-contact", label: "Go to Contact", hint: "/contact", icon: Mail, run: () => nav("/contact") },
      { id: "go-labs", label: "Engineering Labs", hint: "/labs", icon: FlaskConical, run: () => nav("/labs") },
      { id: "download-resume", label: "Download Résumé (PDF)", hint: "external", icon: FileText, run: () => window.open(document.getElementById("__resume-url__")?.dataset.url || "#", "_blank") },
      { id: "terminal-help", label: "Terminal → help", hint: "shell", icon: Terminal, run: () => { nav("/labs"); setTimeout(() => window.dispatchEvent(new CustomEvent("terminal:run", { detail: "help" })), 60); } },
      { id: "terminal-projects", label: "Terminal → projects", hint: "shell", icon: Terminal, run: () => { nav("/labs"); setTimeout(() => window.dispatchEvent(new CustomEvent("terminal:run", { detail: "projects" })), 60); } },
      { id: "terminal-hire", label: "Terminal → sudo hire-manas", hint: "shell", icon: Terminal, run: () => { nav("/labs"); setTimeout(() => window.dispatchEvent(new CustomEvent("terminal:run", { detail: "sudo hire-manas" })), 60); } },
    ],
    [nav],
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return commands;
    return commands.filter(
      (c) => c.label.toLowerCase().includes(t) || c.hint.toLowerCase().includes(t) || c.id.includes(t),
    );
  }, [q, commands]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setCursor(0);
  }, [open]);

  useEffect(() => {
    if (cursor >= filtered.length) setCursor(Math.max(0, filtered.length - 1));
  }, [filtered.length, cursor]);

  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[cursor];
        if (cmd) {
          cmd.run();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, filtered, cursor, onClose]);

  if (!open) return null;

  return (
    <div
      data-testid="command-palette"
      role="dialog"
      aria-label="Command palette"
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 pt-24 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl border border-zinc-800 bg-[#0a0a0a] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
          <Search size={16} className="text-zinc-500" />
          <input
            data-testid="palette-input"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type a command or search — e.g. projects, resume, terminal…"
            className="flex-1 border-0 bg-transparent p-0 font-mono text-[13px] text-white outline-none focus:ring-0"
          />
          <span className="border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.22em] text-zinc-500">
            ESC
          </span>
        </div>

        <ul className="max-h-[360px] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <li className="px-5 py-4 font-mono text-[12px] text-zinc-500">
              no matches — try “projects”, “resume”, “terminal”…
            </li>
          )}
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon || ArrowRight;
            const active = i === cursor;
            return (
              <li key={cmd.id}>
                <button
                  data-testid={`palette-item-${cmd.id}`}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => {
                    cmd.run();
                    onClose();
                  }}
                  className={`group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 ${
                    active ? "bg-zinc-900" : "bg-transparent"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center border ${
                      active ? "border-[#00E5FF] text-[#00E5FF]" : "border-zinc-800 text-zinc-500"
                    }`}
                  >
                    <Icon size={12} />
                  </div>
                  <span className="flex-1 text-[13.5px] text-zinc-100">{cmd.label}</span>
                  <span className="font-mono text-[10.5px] tracking-wide text-zinc-500">{cmd.hint}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2 font-mono text-[10.5px] tracking-wide text-zinc-500">
          <span>↑↓ navigate · ⏎ run · esc close</span>
          <Link to="/labs" onClick={onClose} className="hover:text-white">
            open labs →
          </Link>
        </div>
      </div>
    </div>
  );
}
