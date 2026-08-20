import { useProfile, useExperience, useSkills, useProjects, useResume } from "@/lib/hooks";
import SectionHeader from "@/components/portfolio/SectionHeader";
import { MapPin, Mail, Phone, Linkedin, Github } from "lucide-react";
import { Link } from "react-router-dom";

/** About — full summary + contact card + highlights. Data-driven from /api/profile. */
export default function About() {
  const { data: profile } = useProfile();

  const highlights = [
    { label: "Experience", value: "~4 years" },
    { label: "Focus", value: "Payments & Backend" },
    { label: "Primary Stack", value: ".NET · C# · SQL Server" },
    { label: "Patterns", value: "SOLID · CQRS · SAGA" },
  ];

  return (
    <section
      id="about"
      data-testid="about-section"
      className="border-b border-zinc-800 bg-[#050505]"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:py-20">
        <SectionHeader eyebrow="0x00 · about" title="About" hint="grounded in résumé · not fabricated" />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p
              data-testid="about-summary"
              className="max-w-3xl text-base leading-relaxed text-zinc-300 md:text-lg"
            >
              {profile?.summary || "Loading…"}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-px border border-zinc-800 bg-zinc-800 sm:grid-cols-4">
              {highlights.map((h) => (
                <div
                  key={h.label}
                  data-testid={`about-highlight-${h.label.toLowerCase()}`}
                  className="bg-[#0a0a0a] p-4"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    {h.label}
                  </div>
                  <div className="mt-2 text-sm font-medium text-white md:text-base">{h.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/experience"
                data-testid="about-cta-experience"
                className="border border-zinc-700 bg-transparent px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-200 transition-colors duration-150 hover:border-[#007AFF] hover:text-white"
              >
                See experience →
              </Link>
              <Link
                to="/projects"
                data-testid="about-cta-projects"
                className="border border-zinc-700 bg-transparent px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-200 transition-colors duration-150 hover:border-[#007AFF] hover:text-white"
              >
                Browse projects →
              </Link>
            </div>
          </div>

          <aside
            data-testid="about-contact-card"
            className="border border-zinc-800 bg-black/40 lg:col-span-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                // contact.card
              </span>
              <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-600">DIRECT</span>
            </div>
            <ul className="divide-y divide-zinc-800 text-sm">
              <ContactRow icon={MapPin} label={profile?.location || "—"} testid="row-location" />
              {profile?.contact?.email && (
                <ContactRow
                  icon={Mail}
                  label={profile.contact.email}
                  href={`mailto:${profile.contact.email}`}
                  testid="row-email"
                />
              )}
              {profile?.contact?.phone && (
                <ContactRow icon={Phone} label={profile.contact.phone} testid="row-phone" />
              )}
              {profile?.contact?.linkedin && (
                <ContactRow
                  icon={Linkedin}
                  label="linkedin.com/in/mishra-manas270801"
                  href={profile.contact.linkedin}
                  testid="row-linkedin"
                />
              )}
              {profile?.contact?.github && (
                <ContactRow
                  icon={Github}
                  label="github.com"
                  href={profile.contact.github}
                  testid="row-github"
                />
              )}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}

function ContactRow({ icon: Icon, label, href, testid }) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon size={14} className="text-zinc-500" />
      <span className="font-mono text-[12.5px] text-zinc-200">{label}</span>
    </div>
  );
  return (
    <li data-testid={testid} className="transition-colors duration-150 hover:bg-zinc-900/50">
      {href ? (
        <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="block">
          {inner}
        </a>
      ) : (
        inner
      )}
    </li>
  );
}
