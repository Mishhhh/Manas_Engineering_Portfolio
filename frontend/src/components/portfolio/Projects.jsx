import { useMemo, useState } from "react";
import { useProfile, useExperience, useSkills, useProjects, useResume } from "@/lib/hooks";
import SectionHeader from "@/components/portfolio/SectionHeader";
import { ArrowRight } from "lucide-react";

const KIND_LABEL = {
  professional: "Professional",
  personal: "Personal",
  experiment: "Experiment",
};

const KIND_COLOR = {
  professional: "#00E5FF",
  personal: "#FFBF00",
  experiment: "#22c55e",
};

/** Projects — filterable list. Full detail lives at /projects/:id. */
export default function Projects({ compact = false, onOpen }) {
  const { data: projects } = useProjects();
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (!projects) return [];
    if (filter === "all") return projects;
    return projects.filter((p) => p.kind === filter);
  }, [projects, filter]);

  return (
    <section
      id="projects"
      data-testid="projects-section"
      className="border-b border-zinc-800 bg-[#050505]"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:py-20">
        <SectionHeader
          eyebrow="0x03 · projects"
          title="Project Explorer"
          hint={`${filtered.length} shown · problem → decisions → lessons`}
        />
        <h1 className="sr-only">Projects</h1>

        <div
          data-testid="projects-filters"
          className="mt-6 flex flex-wrap gap-1.5 sm:inline-flex sm:flex-nowrap sm:gap-0 sm:border sm:border-zinc-800"
        >
          {["all", "professional", "personal", "experiment"].map((k) => (
            <button
              key={k}
              data-testid={`projects-filter-${k}`}
              onClick={() => setFilter(k)}
              className={`border border-zinc-800 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors duration-150 sm:border-0 sm:border-r sm:border-r-zinc-800 sm:last:border-r-0 ${
                filter === k
                  ? "bg-white text-black"
                  : "bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        <ul
          data-testid="projects-list"
          className={`mt-6 grid grid-cols-1 border border-zinc-800 ${
            compact ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {filtered.map((p, i) => (
            <li
              key={p.id}
              data-testid={`project-card-${p.id}`}
              className={`group relative flex flex-col justify-between p-5 transition-colors duration-150 hover:bg-zinc-900/40 ${
                (i + 1) % (compact ? 2 : 3) !== 0
                  ? "md:border-r md:border-r-zinc-800"
                  : ""
              } ${i < filtered.length - (filtered.length % (compact ? 2 : 3) || (compact ? 2 : 3)) ? "border-b border-b-zinc-800" : ""}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className="border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: KIND_COLOR[p.kind], borderColor: KIND_COLOR[p.kind] + "55" }}
                  >
                    {KIND_LABEL[p.kind] || p.kind}
                  </span>
                  <span className="font-mono text-[10.5px] tracking-wide text-zinc-500">
                    {p.year || ""}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">
                  {p.name}
                </h3>
                <p className="mt-2 line-clamp-4 text-[13.5px] leading-relaxed text-zinc-400">
                  {p.summary}
                </p>
                {p.tags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.slice(0, 5).map((t) => (
                      <span
                        key={t}
                        className="border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-zinc-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                data-testid={`project-open-${p.id}`}
                onClick={() => onOpen?.(p.id)}
                className="mt-4 inline-flex w-fit items-center gap-1.5 border border-zinc-700 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-200 transition-colors duration-150 hover:border-[#00E5FF] hover:text-white group-hover:border-[#00E5FF]"
              >
                Open
                <ArrowRight size={12} />
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="col-span-full p-6 font-mono text-[12px] text-zinc-500">
              no projects for filter “{filter}”
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
