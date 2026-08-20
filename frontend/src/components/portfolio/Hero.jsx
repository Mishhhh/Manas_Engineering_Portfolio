import { useEffect, useState } from "react";
import { ArrowRight, FileText } from "lucide-react";
import { api, endpoints } from "@/lib/api";
import { Link } from "react-router-dom";

/**
 * Hero — dark-first, dense, left-aligned. No purple gradients.
 * Uses a strict grid: LEFT (name + tagline + CTAs) | RIGHT (marker card w/ metadata).
 */
export default function Hero() {
  const [profile, setProfile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState("");

  useEffect(() => {
    api.get(endpoints.profile).then((r) => setProfile(r.data)).catch(() => {});
    api.get(endpoints.resume).then((r) => setResumeUrl(r.data.url)).catch(() => {});
  }, []);

  return (
    <section
      id="hero"
      data-testid="hero-section"
      className="relative overflow-hidden border-b border-zinc-800"
    >
      <div className="eng-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div className="eng-noise absolute inset-0" aria-hidden />

      <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-20 lg:grid-cols-12 lg:gap-14 lg:py-28">
        {/* Left — identity */}
        <div className="lg:col-span-8">
          <div className="mb-6 inline-flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-2.5 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="status-dot-halo bg-[#00E5FF]" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#00E5FF]" />
            </span>
            <span
              data-testid="hero-availability"
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400"
            >
              open to backend / payments roles
            </span>
          </div>

          <h1
            data-testid="hero-name"
            className="font-bold tracking-tight text-white text-4xl sm:text-5xl lg:text-6xl"
          >
            {profile?.name || "Manas Mishra"}
          </h1>

          <p
            data-testid="hero-title"
            className="mt-3 font-mono text-base tracking-tight text-[#00E5FF] md:text-lg"
          >
            {profile?.title || "Backend Software Engineer"}
          </p>

          <p
            data-testid="hero-tagline"
            className="mt-8 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg"
          >
            {profile?.tagline ||
              "I build reliable backend systems, payment workflows and APIs."}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {(profile?.stack_tags || [".NET", "C#", "SQL", "APIs", "Payments", "Cloud"]).map(
              (t) => (
                <span
                  key={t}
                  data-testid={`stack-tag-${t.toLowerCase().replace(/\s+/g, "-")}`}
                  className="border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[11px] tracking-wide text-zinc-300"
                >
                  {t}
                </span>
              ),
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              data-testid="cta-explore"
              to="/labs"
              className="group inline-flex items-center gap-2 border border-white bg-white px-4 py-2.5 font-mono text-[12px] uppercase tracking-[0.22em] text-black transition-colors duration-150 hover:bg-zinc-200 active:scale-[0.98]"
            >
              Explore Engineering
              <ArrowRight
                size={14}
                className="transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              data-testid="cta-resume"
              to="/resume"
              className="inline-flex items-center gap-2 border border-zinc-700 bg-transparent px-4 py-2.5 font-mono text-[12px] uppercase tracking-[0.22em] text-zinc-200 transition-colors duration-150 hover:border-[#007AFF] hover:text-white active:scale-[0.98]"
            >
              <FileText size={14} />
              View Résumé
            </Link>
          </div>
        </div>

        {/* Right — engineer marker card */}
        <aside
          className="border border-zinc-800 bg-black/40 lg:col-span-4"
          data-testid="hero-marker-card"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              // identity.json
            </span>
            <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-600">READ ONLY</span>
          </div>
          <div className="p-4 font-mono text-[12.5px] leading-relaxed">
            <MarkerRow k="role" v={profile?.title || "Backend Software Engineer"} accent />
            <MarkerRow k="focus" v="payments · direct-debit · retries" />
            <MarkerRow k="experience" v="~4 years" />
            <MarkerRow k="location" v={profile?.location || "Pune, India"} />
            <MarkerRow k="stack" v=".NET · C# · SQL Server" />
            <MarkerRow k="patterns" v="SOLID · CQRS · SAGA" />
            <MarkerRow k="mode" v="production-ready" accent />
          </div>
          <div className="border-t border-zinc-800 px-4 py-2.5">
            <p className="font-mono text-[10.5px] leading-relaxed text-zinc-500">
              This site is itself the portfolio. Every panel below is a live interactive
              engineering surface — terminal, simulators, sql, incidents.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function MarkerRow({ k, v, accent = false }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-baseline gap-3 py-1">
      <span className="text-zinc-500">{k}</span>
      <span className={accent ? "text-[#00E5FF]" : "text-zinc-200"}>{v}</span>
    </div>
  );
}
