import Layout from "@/components/portfolio/Layout";
import Terminal from "@/components/portfolio/Terminal";
import ArchitectureExplorer from "@/components/labs/ArchitectureExplorer";
import ApiPlayground from "@/components/labs/ApiPlayground";
import SystemStatus from "@/components/portfolio/SystemStatus";
import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";

export default function LabsPage() {
  return (
    <Layout>
      <div data-testid="labs-page">
        <LabsHero />
        <LabHighlight />
        <SystemStatus />
        <Terminal />
        <ArchitectureExplorer />
        <ApiPlayground />
      </div>
    </Layout>
  );
}

function LabHighlight() {
  const cards = [
    { to: "/lab/payment-simulator", tag: "phase-5", title: "Payment Processing Simulator", body: "Backend state machine · 5 scenarios · event history." },
    { to: "/lab/retry-engine", tag: "phase-6", title: "Payment Retry Engine", body: "Exponential/fixed backoff · idempotency demo · timeline." },
    { to: "/lab/arrears", tag: "phase-7", title: "Subscription Arrears Simulator", body: "Scripted attempts · arrears escalation · recovery." },
    { to: "/lab/sql-arena", tag: "phase-8", title: "SQL Arena", body: "Sandboxed SQLite · 12 challenges · learning + interview modes." },
  ];
  return (
    <section data-testid="lab-highlight" className="border-b border-zinc-800 bg-[#070707]">
      <div className="mx-auto max-w-[1440px] px-6 py-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              data-testid={`lab-card-${c.to.split("/").pop()}`}
              className="group flex items-start justify-between gap-4 border border-zinc-800 bg-[#0a0a0a] p-5 transition-colors duration-150 hover:border-[#00E5FF]"
            >
              <div>
                <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00E5FF]">
                  <Zap size={11} /> new · {c.tag}
                </div>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">{c.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{c.body}</p>
              </div>
              <ArrowRight size={16} className="mt-1 shrink-0 text-zinc-500 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-white" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function LabsHero() {
  return (
    <section className="relative overflow-hidden border-b border-zinc-800">
      <div className="eng-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-[1440px] px-6 py-14 lg:py-20">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#00E5FF]">
          /labs
        </div>
        <h1 className="mt-3 font-bold tracking-tight text-white text-4xl sm:text-5xl">
          Engineering Labs
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
          Interactive engineering surfaces. Available now: developer terminal,
          project architecture explorer, API playground. SQL Arena, Payment
          Simulator, Ask Manas (RAG) and Incident Simulator land in later phases.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em]">
          <span className="border border-[#22c55e]/50 px-2 py-1 text-[#22c55e]">available · terminal</span>
          <span className="border border-[#22c55e]/50 px-2 py-1 text-[#22c55e]">available · arch explorer</span>
          <span className="border border-[#22c55e]/50 px-2 py-1 text-[#22c55e]">available · api playground</span>
          <span className="border border-zinc-800 px-2 py-1 text-zinc-500">planned · sql arena</span>
          <span className="border border-zinc-800 px-2 py-1 text-zinc-500">planned · payment simulator</span>
          <span className="border border-zinc-800 px-2 py-1 text-zinc-500">planned · ask manas (RAG)</span>
          <span className="border border-zinc-800 px-2 py-1 text-zinc-500">planned · incident simulator</span>
        </div>
      </div>
    </section>
  );
}
