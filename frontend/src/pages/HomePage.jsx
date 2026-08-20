import TopBar from "@/components/portfolio/TopBar";
import Hero from "@/components/portfolio/Hero";
import SystemStatus from "@/components/portfolio/SystemStatus";
import Terminal from "@/components/portfolio/Terminal";

export default function HomePage() {
  return (
    <div data-testid="home-page" className="min-h-screen bg-[#050505] text-white">
      <TopBar />
      <main>
        <Hero />
        <SystemStatus />
        <Terminal />
        <RoadmapSection />
        <Footer />
      </main>
    </div>
  );
}

function RoadmapSection() {
  const phases = [
    { n: "01", label: "Foundation", status: "DONE", detail: "hero · status · terminal shell · API skeleton" },
    { n: "02", label: "Project Explorer", status: "NEXT", detail: "professional · personal · experiments" },
    { n: "03", label: "Payment Simulator", status: "PLANNED", detail: "mandate → validation → retries → settlement" },
    { n: "04", label: "Retry Engine Lab", status: "PLANNED", detail: "exponential backoff · idempotency" },
    { n: "05", label: "SQL Arena", status: "PLANNED", detail: "sandboxed challenges on subscriptions schema" },
    { n: "06", label: "Incident Simulator", status: "PLANNED", detail: "logs · traces · RCA prompts" },
    { n: "07", label: "Observability Dashboard", status: "PLANNED", detail: "latency · errors · SLOs" },
    { n: "08", label: "Ask Manas (RAG)", status: "PLANNED", detail: "GPT-5.6 · resume-grounded assistant" },
    { n: "09", label: "Admin CMS", status: "PLANNED", detail: "JWT-protected content editor" },
  ];
  const statusColor = {
    DONE: "#22c55e",
    NEXT: "#00E5FF",
    PLANNED: "#52525B",
  };
  return (
    <section
      id="roadmap"
      data-testid="roadmap-section"
      className="border-b border-zinc-800 bg-[#070707]"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:py-20">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#00E5FF]">
            0x03 · roadmap
          </div>
          <h2 className="mt-2 font-bold tracking-tight text-white text-3xl sm:text-4xl">
            Build phases
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
            This portfolio is itself a project — shipped in phases. Phase 1 is live.
            Each subsequent phase lands as an interactive engineering surface.
          </p>
        </div>

        <ol className="mt-8 grid grid-cols-1 border border-zinc-800 md:grid-cols-3">
          {phases.map((p, i) => (
            <li
              key={p.n}
              data-testid={`roadmap-item-${p.n}`}
              className={`relative p-5 transition-colors duration-150 hover:bg-zinc-900/40 ${
                (i + 1) % 3 !== 0 ? "md:border-r md:border-r-zinc-800" : ""
              } ${i < phases.length - (phases.length % 3 || 3) ? "border-b border-b-zinc-800" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-[0.22em] text-zinc-500">
                  PHASE {p.n}
                </span>
                <span
                  className="border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em]"
                  style={{ color: statusColor[p.status], borderColor: statusColor[p.status] + "55" }}
                >
                  {p.status}
                </span>
              </div>
              <div className="mt-3 text-lg font-medium tracking-tight text-white">
                {p.label}
              </div>
              <div className="mt-1 font-mono text-[11.5px] leading-relaxed text-zinc-500">
                {p.detail}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      data-testid="footer"
      id="resume"
      className="bg-[#050505]"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center">
        <div className="font-mono text-[11px] tracking-wide text-zinc-500">
          © {new Date().getFullYear()} Manas Mishra ·{" "}
          <span className="text-zinc-600">shipped from Pune with a working coffee machine</span>
        </div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-600">
          this site is the project · not a template
        </div>
      </div>
    </footer>
  );
}
