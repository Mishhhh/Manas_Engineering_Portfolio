import { useEffect, useRef, useState } from "react";
import { api, endpoints } from "@/lib/api";
import SectionHeader from "@/components/portfolio/SectionHeader";

const BANNER = [
  "manas-os shell v0.1.0 · type `help` to list commands",
  "tip: try `sudo hire-manas`, `coffee`, or `resume`",
];

/**
 * Terminal — Phase-1 shell. Deep-links & interactive commands land later.
 * Supports: command history (up/down), Ctrl+L clear, and live output.
 */
export default function Terminal() {
  const [lines, setLines] = useState(() => [
    { kind: "banner", text: "boot:" },
    ...BANNER.map((b) => ({ kind: "sys", text: b })),
    { kind: "hint", text: "" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  // Allow external components (e.g. CommandPalette) to inject a command.
  useEffect(() => {
    const h = (e) => {
      const cmd = e.detail;
      if (typeof cmd === "string" && cmd.length) {
        runCommand(cmd);
      }
    };
    window.addEventListener("terminal:run", h);
    return () => window.removeEventListener("terminal:run", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusInput = () => inputRef.current?.focus();

  const push = (entries) =>
    setLines((prev) => [...prev, ...(Array.isArray(entries) ? entries : [entries])]);

  const runCommand = async (raw) => {
    const cmd = raw.trim();
    push({ kind: "cmd", text: cmd });
    if (!cmd) return;

    setHistory((h) => [cmd, ...h].slice(0, 50));
    setHistoryIdx(-1);

    const [head, ...args] = cmd.split(/\s+/);
    const key = head.toLowerCase();

    try {
      switch (key) {
        case "help":
          push({ kind: "out", text: HELP_TEXT });
          break;
        case "clear":
        case "cls":
          setLines([]);
          break;
        case "whoami":
          push({ kind: "out", text: "manas-mishra · backend engineer · payments" });
          break;
        case "about": {
          const p = (await api.get(endpoints.profile)).data;
          push({ kind: "out", text: p.summary });
          break;
        }
        case "skills": {
          const groups = (await api.get(endpoints.skills)).data;
          const rendered = groups
            .map((g) => `${padCat(g.category)}  ${g.items.join(" · ")}`)
            .join("\n");
          push({ kind: "out", text: rendered });
          break;
        }
        case "experience": {
          const exp = (await api.get(endpoints.experience)).data;
          const rendered = exp
            .map(
              (e) =>
                `${e.dates}\n  ${e.title}\n  @ ${e.company} — ${e.location}\n  ${e.bullets[0]}`,
            )
            .join("\n\n");
          push({ kind: "out", text: rendered });
          break;
        }
        case "projects": {
          const list = (await api.get(endpoints.projects)).data;
          const rendered = list
            .map((p) => `[${p.kind.padEnd(12)}] ${p.name}\n  ${p.summary}`)
            .join("\n\n");
          push({ kind: "out", text: rendered });
          break;
        }
        case "architecture":
          push({ kind: "out", text: ARCHITECTURE_ASCII });
          break;
        case "contact": {
          const p = (await api.get(endpoints.profile)).data;
          push({
            kind: "out",
            text: [
              `email    ${p.contact.email}`,
              `phone    ${p.contact.phone}`,
              `linkedin ${p.contact.linkedin}`,
              `github   ${p.contact.github}`,
            ].join("\n"),
          });
          break;
        }
        case "resume": {
          const r = (await api.get(endpoints.resume)).data;
          push({ kind: "out", text: `opening resume → ${r.url}` });
          if (r.url) window.open(r.url, "_blank", "noreferrer");
          break;
        }
        case "coffee":
          push({ kind: "out", text: COFFEE_ART });
          break;
        case "date":
          push({ kind: "out", text: new Date().toString() });
          break;
        case "echo":
          push({ kind: "out", text: args.join(" ") });
          break;
        case "sudo": {
          if (args[0] === "hire-manas") {
            push({ kind: "out", text: HIRE_ME });
          } else {
            push({
              kind: "err",
              text: `sudo: ${args.join(" ") || "<cmd>"}: permission denied. try \`sudo hire-manas\``,
            });
          }
          break;
        }
        case "status":
          push({ kind: "out", text: "see the STATUS section — polled every 5s from /api/health" });
          break;
        case "sql":
        case "sql-arena":
          push({ kind: "out", text: "opening /lab/sql-arena…" });
          window.location.href = "/lab/sql-arena";
          break;
        case "retry":
          push({ kind: "out", text: "opening /lab/retry-engine…" });
          window.location.href = "/lab/retry-engine";
          break;
        case "arrears":
          push({ kind: "out", text: "opening /lab/arrears…" });
          window.location.href = "/lab/arrears";
          break;
        default:
          push({ kind: "err", text: `command not found: ${head} — type \`help\`` });
      }
    } catch (e) {
      push({ kind: "err", text: `runtime error: ${e.message || e}` });
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runCommand(input);
      setInput("");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(historyIdx + 1, history.length - 1);
      if (next >= 0 && history[next] !== undefined) {
        setHistoryIdx(next);
        setInput(history[next]);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = historyIdx - 1;
      if (next < 0) {
        setHistoryIdx(-1);
        setInput("");
      } else {
        setHistoryIdx(next);
        setInput(history[next] || "");
      }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <section
      id="terminal"
      data-testid="terminal-section"
      className="border-b border-zinc-800 bg-[#050505]"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:py-20">
        <SectionHeader
          eyebrow="0x02 · shell"
          title="Interactive Terminal"
          hint="try: about · skills · projects · sudo hire-manas"
        />

        <div
          data-testid="terminal-window"
          onClick={focusInput}
          className="mt-8 border border-zinc-800 bg-[#0a0a0a] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
        >
          {/* window chrome */}
          <div className="flex items-center justify-between border-b border-zinc-800 bg-[#0d0d0d] px-4 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF3B30]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FFBF00]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#00E676]" />
            </div>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
              manas@portfolio:~ · zsh
            </span>
            <span className="font-mono text-[10.5px] tracking-[0.18em] text-zinc-600">80×24</span>
          </div>

          {/* scrollback */}
          <div
            ref={scrollRef}
            className="h-[420px] overflow-y-auto px-5 py-4 font-mono text-[12.5px] leading-6"
          >
            {lines.map((l, i) => (
              <TerminalLine key={i} line={l} />
            ))}

            {/* live input */}
            <div className="mt-1 flex items-center gap-2">
              <Prompt />
              <input
                ref={inputRef}
                data-testid="terminal-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                autoFocus
                spellCheck={false}
                autoComplete="off"
                className="flex-1 border-0 bg-transparent p-0 font-mono text-[12.5px] text-white outline-none focus:ring-0"
              />
              <span className="terminal-cursor" aria-hidden />
            </div>
          </div>

          {/* status bar */}
          <div className="flex items-center justify-between border-t border-zinc-800 bg-[#0d0d0d] px-4 py-1.5 font-mono text-[10.5px] tracking-wide text-zinc-500">
            <div className="flex items-center gap-3">
              <span>↑/↓ history</span>
              <span>·</span>
              <span>ctrl+L clear</span>
              <span>·</span>
              <span>enter execute</span>
            </div>
            <div className="hidden gap-3 sm:flex">
              <span>lines {lines.length}</span>
              <span>·</span>
              <span>utf-8</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_CMDS.map((q) => (
            <button
              key={q}
              data-testid={`quick-cmd-${q.replace(/\s+/g, "-")}`}
              onClick={() => {
                setInput("");
                focusInput();
                runCommand(q);
              }}
              className="border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 font-mono text-[11px] tracking-wide text-zinc-300 transition-colors duration-150 hover:border-[#007AFF] hover:text-white active:scale-[0.98]"
            >
              $ {q}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Prompt() {
  return (
    <span className="select-none font-mono text-[12.5px]">
      <span className="text-[#00E5FF]">manas</span>
      <span className="text-zinc-500">@</span>
      <span className="text-[#22c55e]">portfolio</span>
      <span className="text-zinc-500">:</span>
      <span className="text-zinc-300">~</span>
      <span className="ml-1 text-[#FFBF00]">$</span>
    </span>
  );
}

function TerminalLine({ line }) {
  if (line.kind === "cmd") {
    return (
      <div className="flex items-center gap-2">
        <Prompt />
        <span className="text-white">{line.text}</span>
      </div>
    );
  }
  if (line.kind === "err") {
    return <pre className="whitespace-pre-wrap text-[#FF3B30]">{line.text}</pre>;
  }
  if (line.kind === "sys") {
    return <div className="text-zinc-400">{line.text}</div>;
  }
  if (line.kind === "banner") {
    return <div className="text-[#00E5FF]">{line.text}</div>;
  }
  if (line.kind === "hint") {
    return <div className="h-2" />;
  }
  return <pre className="whitespace-pre-wrap text-zinc-200">{line.text}</pre>;
}

const QUICK_CMDS = ["help", "about", "skills", "projects", "experience", "resume", "sudo hire-manas"];

const HELP_TEXT = [
  "AVAILABLE COMMANDS",
  "",
  "  help              show this help",
  "  about             short professional summary",
  "  skills            grouped technical skills",
  "  experience        work history summary",
  "  projects          project explorer",
  "  architecture      backend architecture (ascii)",
  "  contact           email · linkedin · github",
  "  resume            open resume PDF in a new tab",
  "  status            system status panel info",
  "  whoami            identity",
  "  echo <text>       echo back",
  "  date              current time",
  "  coffee            ☕",
  "  sudo hire-manas   💼",
  "  clear (ctrl+L)    clear the screen",
].join("\n");

function padCat(s) {
  return (s + " ".repeat(28)).slice(0, 28);
}

const ARCHITECTURE_ASCII = [
  "backend architecture (typical .NET stack in production experience)",
  "",
  "  Client",
  "    │",
  "    ▼",
  "  API Gateway  ──►  ASP.NET Core Controller",
  "                        │",
  "                        ▼",
  "                  Application Layer (CQRS handlers)",
  "                        │",
  "                        ▼",
  "                  Domain Services  ──►  Payment Handler",
  "                        │                      │",
  "                        ▼                      ▼",
  "                  Repositories        External Processor",
  "                        │                      │",
  "                        ▼                      ▼",
  "                  SQL Server           Mandate / Retry",
].join("\n");

const COFFEE_ART = [
  "      ( (",
  "       ) )",
  "    ........",
  "    |      |]   coffee.status = REQUIRED",
  "    \\      /    caffeine.level = LOW",
  "     `----'",
].join("\n");

const HIRE_ME = [
  "[sudo] password for manas: ********",
  "resolving hiring.manifest…",
  "opening a channel to your inbox 📬",
  "",
  "  You: We should chat.",
  "  Manas: Absolutely — reach me at manasmishra0801@gmail.com",
  "         or via LinkedIn (see the header).",
  "",
  "hire-manas exited with code 0.",
].join("\n");
