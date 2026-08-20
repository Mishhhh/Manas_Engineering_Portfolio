import { useMemo, useState } from "react";
import { useProfile, useExperience, useSkills, useProjects, useResume } from "@/lib/hooks";
import SectionHeader from "@/components/portfolio/SectionHeader";

/**
 * Project Architecture Explorer — pick a project, inspect its architecture
 * nodes + edges. Clickable node reveals purpose.
 */
export default function ArchitectureExplorer() {
  const { data: projects } = useProjects();
  const [pid, setPid] = useState(null);
  const [nodeId, setNodeId] = useState(null);

  const activeId = pid ?? projects?.[0]?.id ?? null;
  const proj = useMemo(
    () => projects?.find((p) => p.id === activeId) || null,
    [projects, activeId],
  );

  const node = useMemo(
    () => proj?.architecture_nodes.find((n) => n.id === nodeId) || proj?.architecture_nodes?.[0],
    [proj, nodeId],
  );

  return (
    <section
      id="arch-explorer"
      data-testid="arch-explorer-section"
      className="border-b border-zinc-800 bg-[#070707]"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:py-20">
        <SectionHeader
          eyebrow="lab · architecture"
          title="Project Architecture Explorer"
          hint="click a node to inspect its purpose"
        />

        <div
          data-testid="arch-project-picker"
          className="mt-6 flex flex-wrap gap-1.5 sm:inline-flex sm:flex-nowrap sm:gap-0 sm:border sm:border-zinc-800"
        >
          {(projects || []).map((p) => (
            <button
              key={p.id}
              data-testid={`arch-pick-${p.id}`}
              onClick={() => {
                setPid(p.id);
                setNodeId(null);
              }}
              className={`border border-zinc-800 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors duration-150 sm:border-0 sm:border-r sm:border-r-zinc-800 sm:last:border-r-0 ${
                activeId === p.id ? "bg-white text-black" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {proj && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Diagram column */}
            <div
              data-testid="arch-diagram"
              className="border border-zinc-800 bg-[#0a0a0a] lg:col-span-7"
            >
              <div className="border-b border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
                {proj.name} · flow
              </div>
              <div className="flex flex-col items-center gap-2 p-6">
                {proj.architecture_nodes.map((n, i) => (
                  <div key={n.id} className="flex flex-col items-center">
                    <button
                      data-testid={`arch-node-${n.id}`}
                      onClick={() => setNodeId(n.id)}
                      className={`w-full max-w-md border px-4 py-3 text-left transition-colors duration-150 ${
                        (nodeId ?? proj.architecture_nodes[0].id) === n.id
                          ? "border-[#00E5FF] bg-zinc-900"
                          : "border-zinc-800 bg-[#0a0a0a] hover:border-zinc-600"
                      }`}
                    >
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00E5FF]">
                        {n.role}
                      </div>
                      <div className="mt-1 text-[13.5px] font-medium text-white">{n.label}</div>
                    </button>
                    {i < proj.architecture_nodes.length - 1 && (
                      <div
                        className="my-1 h-6 w-px bg-zinc-700"
                        aria-hidden
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Node info column */}
            <aside
              data-testid="arch-node-info"
              className="border border-zinc-800 bg-black/40 lg:col-span-5"
            >
              <div className="border-b border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
                node info
              </div>
              {node ? (
                <div className="p-5">
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00E5FF]">
                    {node.role}
                  </div>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight text-white">
                    {node.label}
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-zinc-300">
                    {node.description}
                  </p>

                  <div className="mt-5 border-t border-zinc-800 pt-3 font-mono text-[11.5px]">
                    <div className="text-zinc-500">edges</div>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-zinc-500">↓ incoming</div>
                        <div className="text-zinc-300">
                          {proj.architecture_edges
                            .filter((e) => e.to === node.id)
                            .map((e) => e.from)
                            .join(", ") || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500">↑ outgoing</div>
                        <div className="text-zinc-300">
                          {proj.architecture_edges
                            .filter((e) => e.from === node.id)
                            .map((e) => e.to)
                            .join(", ") || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 font-mono text-[12px] text-zinc-500">select a node</div>
              )}
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
