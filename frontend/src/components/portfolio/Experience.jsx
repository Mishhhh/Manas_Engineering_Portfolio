import { useProfile, useExperience, useSkills, useProjects, useResume } from "@/lib/hooks";
import SectionHeader from "@/components/portfolio/SectionHeader";
import { Briefcase, MapPin } from "lucide-react";

/** Experience — timeline based on /api/experience (resume-grounded). */
export default function Experience() {
  const { data: entries } = useExperience();

  return (
    <section
      id="experience"
      data-testid="experience-section"
      className="border-b border-zinc-800 bg-[#070707]"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:py-20">
        <SectionHeader
          eyebrow="0x02 · experience"
          title="Experience"
          hint="most-recent first"
        />

        <ol className="mt-8 border border-zinc-800">
          {(entries || []).map((e, i) => (
            <li
              key={e.id}
              data-testid={`experience-item-${e.id}`}
              className={`grid grid-cols-1 gap-6 p-5 md:grid-cols-[220px_1fr] md:p-6 ${
                i > 0 ? "border-t border-t-zinc-800" : ""
              }`}
            >
              <div>
                <div className="font-mono text-[11px] tracking-[0.22em] text-zinc-500">
                  {e.dates}
                </div>
                <div className="mt-2 flex items-center gap-2 text-zinc-300">
                  <Briefcase size={13} className="text-zinc-500" />
                  <span className="font-mono text-[12px]">{e.location}</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-white md:text-xl">
                  {e.title}
                </h3>
                <div className="mt-1 font-mono text-[12px] text-[#00E5FF]">@ {e.company}</div>

                {e.tech?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {e.tech.map((t) => (
                      <span
                        key={t}
                        className="border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[10.5px] tracking-wide text-zinc-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <ul className="mt-4 space-y-2">
                  {e.bullets.map((b, idx) => (
                    <li
                      key={idx}
                      className="flex gap-3 text-sm leading-relaxed text-zinc-300 md:text-[15px]"
                    >
                      <span
                        className="mt-2 h-[6px] w-[6px] shrink-0 bg-zinc-600"
                        aria-hidden
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
          {!entries && (
            <li className="p-6 font-mono text-[12px] text-zinc-500">loading experience…</li>
          )}
        </ol>
      </div>
    </section>
  );
}
