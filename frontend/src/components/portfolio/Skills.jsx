import { useProfile, useExperience, useSkills, useProjects, useResume } from "@/lib/hooks";
import SectionHeader from "@/components/portfolio/SectionHeader";

/** Skills — grouped matrix. Data-driven from /api/skills. */
export default function Skills() {
  const { data: groups } = useSkills();

  return (
    <section
      id="skills"
      data-testid="skills-section"
      className="border-b border-zinc-800 bg-[#070707]"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:py-20">
        <SectionHeader eyebrow="0x04 · skills" title="Skills Matrix" hint="grouped by category" />

        <div className="mt-8 grid grid-cols-1 gap-px border border-zinc-800 bg-zinc-800 md:grid-cols-2 lg:grid-cols-3">
          {(groups || []).map((g) => (
            <div
              key={g.category}
              data-testid={`skill-group-${g.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="bg-[#0a0a0a] p-5"
            >
              <div className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-[#00E5FF]">
                {g.category}
              </div>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {g.items.map((it) => (
                  <li
                    key={it}
                    className="border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[11.5px] tracking-wide text-zinc-200"
                  >
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!groups && (
            <div className="col-span-full bg-[#0a0a0a] p-6 font-mono text-[12px] text-zinc-500">
              loading skills…
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
