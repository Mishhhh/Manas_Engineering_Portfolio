import { useEffect, useState } from "react";
import { Terminal as TerminalIcon, Github, Linkedin, Mail, FileText } from "lucide-react";
import { api, endpoints } from "@/lib/api";

/**
 * TopBar — sticky command-center header.
 * Left: brand + service tag. Right: contact icons + mode hint.
 */
export default function TopBar() {
  const [profile, setProfile] = useState(null);
  const [clock, setClock] = useState(currentClock());

  useEffect(() => {
    api.get(endpoints.profile).then((r) => setProfile(r.data)).catch(() => {});
    const id = setInterval(() => setClock(currentClock()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      data-testid="top-bar"
      className="sticky top-0 z-40 border-b border-zinc-800 bg-black/80 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center border border-zinc-700 bg-zinc-900 text-[#00FF41]"
            aria-hidden
          >
            <TerminalIcon size={14} strokeWidth={2.25} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              manas.mishra / portfolio.os
            </span>
            <span className="font-mono text-[10px] tracking-[0.18em] text-zinc-600">
              v0.1.0 • phase-1
            </span>
          </div>
        </div>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          <a
            data-testid="nav-hero"
            href="#hero"
            className="border border-transparent px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400 transition-colors duration-150 hover:border-zinc-800 hover:bg-zinc-900 hover:text-white"
          >
            Home
          </a>
          <a
            data-testid="nav-status"
            href="#status"
            className="border border-transparent px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400 transition-colors duration-150 hover:border-zinc-800 hover:bg-zinc-900 hover:text-white"
          >
            Status
          </a>
          <a
            data-testid="nav-terminal"
            href="#terminal"
            className="border border-transparent px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400 transition-colors duration-150 hover:border-zinc-800 hover:bg-zinc-900 hover:text-white"
          >
            Terminal
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <span
            className="hidden font-mono text-[11px] tracking-[0.15em] text-zinc-500 md:inline"
            data-testid="top-bar-clock"
          >
            {clock}
          </span>
          <div className="hidden h-4 w-px bg-zinc-800 md:block" />
          <div className="flex items-center gap-1">
            {profile?.contact?.github && (
              <a
                data-testid="link-github"
                href={profile.contact.github}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="flex h-8 w-8 items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-400 transition-colors duration-150 hover:border-zinc-600 hover:text-white"
              >
                <Github size={14} />
              </a>
            )}
            {profile?.contact?.linkedin && (
              <a
                data-testid="link-linkedin"
                href={profile.contact.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="flex h-8 w-8 items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-400 transition-colors duration-150 hover:border-zinc-600 hover:text-white"
              >
                <Linkedin size={14} />
              </a>
            )}
            {profile?.contact?.email && (
              <a
                data-testid="link-email"
                href={`mailto:${profile.contact.email}`}
                aria-label="Email"
                className="flex h-8 w-8 items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-400 transition-colors duration-150 hover:border-zinc-600 hover:text-white"
              >
                <Mail size={14} />
              </a>
            )}
            <a
              data-testid="link-resume"
              href="#resume"
              className="flex items-center gap-1.5 border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-300 transition-colors duration-150 hover:border-[#007AFF] hover:text-white"
            >
              <FileText size={12} />
              Résumé
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

function currentClock() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
