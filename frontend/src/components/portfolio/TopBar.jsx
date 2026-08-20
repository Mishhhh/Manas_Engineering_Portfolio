import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Terminal as TerminalIcon, Github, Linkedin, Mail, FileText, Command, Menu, X } from "lucide-react";
import { useProfile } from "@/lib/hooks";

const NAV = [
  { to: "/", label: "Home", key: "home" },
  { to: "/about", label: "About", key: "about" },
  { to: "/experience", label: "Experience", key: "experience" },
  { to: "/projects", label: "Projects", key: "projects" },
  { to: "/skills", label: "Skills", key: "skills" },
  { to: "/resume", label: "Résumé", key: "resume" },
  { to: "/contact", label: "Contact", key: "contact" },
  { to: "/labs", label: "Labs", key: "labs" },
];

export default function TopBar({ onOpenPalette }) {
  const { data: profile } = useProfile();
  const [clock, setClock] = useState(currentClock());
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const id = setInterval(() => setClock(currentClock()), 1000);
    return () => clearInterval(id);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      data-testid="top-bar"
      className="sticky top-0 z-40 border-b border-zinc-800 bg-black/85 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          data-testid="brand-link"
          className="flex items-center gap-3 outline-none focus-visible:ring-1 focus-visible:ring-[#007AFF]"
        >
          <div className="flex h-7 w-7 items-center justify-center border border-zinc-700 bg-zinc-900 text-[#00FF41]">
            <TerminalIcon size={14} strokeWidth={2.25} />
          </div>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">
              manas.mishra / portfolio.os
            </span>
            <span className="font-mono text-[10px] tracking-[0.18em] text-zinc-600">
              v0.3.0 • phase-5
            </span>
          </div>
        </Link>

        <nav className="hidden items-center md:flex" aria-label="Primary">
          {NAV.map((n) => {
            const active =
              n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.key}
                to={n.to}
                data-testid={`nav-${n.key}`}
                className={`border-b-2 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-150 ${
                  active
                    ? "border-[#00E5FF] text-white"
                    : "border-transparent text-zinc-400 hover:border-zinc-700 hover:text-white"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            data-testid="open-palette"
            onClick={onOpenPalette}
            className="hidden items-center gap-2 border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 font-mono text-[11px] tracking-wide text-zinc-400 transition-colors duration-150 hover:border-[#007AFF] hover:text-white md:inline-flex"
            title="Open command palette"
          >
            <Command size={12} />
            <span className="tracking-[0.22em]">CMD · K</span>
          </button>
          <span
            className="hidden font-mono text-[11px] tracking-[0.15em] text-zinc-500 xl:inline"
            data-testid="top-bar-clock"
          >
            {clock}
          </span>
          <div className="hidden h-4 w-px bg-zinc-800 xl:block" />
          {profile?.contact?.github && (
            <a
              data-testid="link-github"
              href={profile.contact.github}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="hidden h-8 w-8 items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-400 transition-colors duration-150 hover:border-zinc-600 hover:text-white sm:flex"
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
              className="hidden h-8 w-8 items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-400 transition-colors duration-150 hover:border-zinc-600 hover:text-white sm:flex"
            >
              <Linkedin size={14} />
            </a>
          )}
          {profile?.contact?.email && (
            <a
              data-testid="link-email"
              href={`mailto:${profile.contact.email}`}
              aria-label="Email"
              className="hidden h-8 w-8 items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-400 transition-colors duration-150 hover:border-zinc-600 hover:text-white sm:flex"
            >
              <Mail size={14} />
            </a>
          )}
          <Link
            to="/resume"
            data-testid="link-resume"
            className="hidden items-center gap-1.5 border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-300 transition-colors duration-150 hover:border-[#007AFF] hover:text-white lg:inline-flex"
          >
            <FileText size={12} />
            Résumé
          </Link>

          {/* Mobile menu trigger */}
          <button
            data-testid="mobile-menu-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-drawer"
            className="flex h-8 w-8 items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-300 transition-colors duration-150 hover:border-[#007AFF] hover:text-white md:hidden"
          >
            {mobileOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          id="mobile-drawer"
          data-testid="mobile-drawer"
          className="border-t border-zinc-800 bg-black md:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {NAV.map((n) => {
              const active =
                n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.key}
                  to={n.to}
                  data-testid={`mobile-nav-${n.key}`}
                  className={`border-b border-zinc-900 px-5 py-3 font-mono text-[12px] uppercase tracking-[0.22em] transition-colors duration-150 ${
                    active
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-400 hover:bg-zinc-950 hover:text-white"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 px-5 py-3">
            <button
              data-testid="mobile-open-palette"
              onClick={() => {
                setMobileOpen(false);
                onOpenPalette();
              }}
              className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 font-mono text-[11px] tracking-wide text-zinc-300 transition-colors duration-150 hover:border-[#007AFF] hover:text-white"
            >
              <Command size={12} /> palette
            </button>
            {profile?.contact?.github && (
              <a
                href={profile.contact.github}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="flex h-8 w-8 items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-300"
              >
                <Github size={14} />
              </a>
            )}
            {profile?.contact?.linkedin && (
              <a
                href={profile.contact.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="flex h-8 w-8 items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-300"
              >
                <Linkedin size={14} />
              </a>
            )}
            {profile?.contact?.email && (
              <a
                href={`mailto:${profile.contact.email}`}
                aria-label="Email"
                className="flex h-8 w-8 items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-300"
              >
                <Mail size={14} />
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function currentClock() {
  const d = new Date();
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
const p = (n) => String(n).padStart(2, "0");
