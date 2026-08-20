import Layout from "@/components/portfolio/Layout";
import Terminal from "@/components/portfolio/Terminal";
import ArchitectureExplorer from "@/components/labs/ArchitectureExplorer";
import ApiPlayground from "@/components/labs/ApiPlayground";
import SystemStatus from "@/components/portfolio/SystemStatus";

export default function LabsPage() {
  return (
    <Layout>
      <div data-testid="labs-page">
        <LabsHero />
        <SystemStatus />
        <Terminal />
        <ArchitectureExplorer />
        <ApiPlayground />
      </div>
    </Layout>
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
