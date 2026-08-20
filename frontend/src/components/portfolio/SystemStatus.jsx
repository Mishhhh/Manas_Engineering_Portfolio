import { useEffect, useState } from "react";
import { api, endpoints } from "@/lib/api";

const STATUS_COLOR = {
  OPERATIONAL: "#22c55e",
  DEGRADED: "#FFBF00",
  DOWN: "#FF3B30",
  REQUIRED: "#FFBF00",
};

/**
 * SystemStatus — live from /api/health. Shows the "engineer OS" pulse.
 */
export default function SystemStatus() {
  const [health, setHealth] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await api.get(endpoints.health);
        if (!cancelled) {
          setHealth(r.data);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "unreachable");
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const indicators = health?.indicators || fallbackIndicators;

  return (
    <section
      id="status"
      data-testid="system-status-section"
      className="border-b border-zinc-800 bg-[#070707]"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:py-20">
        <SectionHeader
          eyebrow="0x01 · runtime"
          title="System Status"
          hint={
            err
              ? `unreachable · ${err}`
              : health
                ? `uptime ${formatUptime(health.uptime_seconds)}`
                : "polling…"
          }
        />

        <div
          data-testid="system-status-grid"
          className="mt-8 grid grid-cols-1 border border-zinc-800 sm:grid-cols-2 lg:grid-cols-5"
        >
          {indicators.map((ind, i) => (
            <StatusCell key={ind.key} indicator={ind} last={i === indicators.length - 1} />
          ))}
        </div>

        <p className="mt-4 font-mono text-[11px] tracking-wide text-zinc-500">
          <span className="text-zinc-600"># </span>
          polled every 5s from{" "}
          <span className="text-zinc-300">GET /api/health</span> — real backend, no mock.
        </p>
      </div>
    </section>
  );
}

function StatusCell({ indicator, last }) {
  const color = STATUS_COLOR[indicator.status] || "#a1a1aa";
  return (
    <div
      data-testid={`status-cell-${indicator.key}`}
      className={`relative flex flex-col justify-between p-5 transition-colors duration-150 hover:bg-zinc-900/50 ${
        last ? "" : "border-b border-zinc-800 lg:border-b-0 lg:border-r"
      } lg:border-r-zinc-800`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          {indicator.label}
        </span>
        <span className="relative flex h-2 w-2">
          {indicator.status !== "DOWN" && (
            <span className="status-dot-halo" style={{ backgroundColor: color }} />
          )}
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
          />
        </span>
      </div>
      <div className="mt-6">
        <div
          className="font-mono text-[13px] font-medium tracking-tight"
          style={{ color }}
        >
          {indicator.status}
        </div>
        <div className="mt-1 font-mono text-[11px] text-zinc-500">{indicator.detail}</div>
      </div>
    </div>
  );
}

export function SectionHeader({ eyebrow, title, hint }) {
  return (
    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#00E5FF]">
          {eyebrow}
        </div>
        <h2 className="mt-2 font-bold tracking-tight text-white text-3xl sm:text-4xl">
          {title}
        </h2>
      </div>
      {hint && (
        <div className="font-mono text-[11px] tracking-wide text-zinc-500">{hint}</div>
      )}
    </div>
  );
}

function formatUptime(sec) {
  if (typeof sec !== "number") return "";
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
}

const fallbackIndicators = [
  { key: "api", label: "API", status: "OPERATIONAL", detail: "connecting…" },
  { key: "db", label: "DATABASE", status: "OPERATIONAL", detail: "connecting…" },
  { key: "payments", label: "PAYMENT ENGINE", status: "OPERATIONAL", detail: "idle" },
  { key: "cicd", label: "CI/CD", status: "OPERATIONAL", detail: "green" },
  { key: "coffee", label: "COFFEE", status: "REQUIRED", detail: "brew in progress" },
];
