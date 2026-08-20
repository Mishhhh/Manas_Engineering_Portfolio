import { useState } from "react";
import { api, endpoints } from "@/lib/api";
import SectionHeader from "@/components/portfolio/SectionHeader";
import { useProfile, useExperience, useSkills, useProjects, useResume } from "@/lib/hooks";
import { Mail, Phone, Linkedin, Send, CheckCircle2, AlertTriangle } from "lucide-react";

/** Contact — data-driven info + POST /api/contact form. */
export default function Contact() {
  const { data: profile } = useProfile();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [state, setState] = useState({ status: "idle", error: null, id: null });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setState({ status: "sending", error: null, id: null });
    try {
      const r = await api.post(endpoints.contact, form);
      setState({ status: "sent", error: null, id: r.data.id });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail?.[0]?.msg ||
        err.message ||
        "send failed";
      setState({ status: "error", error: msg, id: null });
    }
  };

  return (
    <section
      id="contact"
      data-testid="contact-section"
      className="border-b border-zinc-800 bg-[#070707]"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:py-20">
        <SectionHeader
          eyebrow="0x06 · contact"
          title="Get in touch"
          hint="messages POST to /api/contact"
        />
        <h1 className="sr-only">Contact</h1>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside
            data-testid="contact-info"
            className="border border-zinc-800 bg-black/40 lg:col-span-4"
          >
            <div className="border-b border-zinc-800 px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
              // direct channels
            </div>
            <ul className="divide-y divide-zinc-800">
              {profile?.contact?.email && (
                <a
                  data-testid="contact-info-email"
                  href={`mailto:${profile.contact.email}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-zinc-900/50"
                >
                  <Mail size={14} className="text-zinc-500" />
                  <span className="font-mono text-[12.5px] text-zinc-200">
                    {profile.contact.email}
                  </span>
                </a>
              )}
              {profile?.contact?.phone && (
                <div
                  data-testid="contact-info-phone"
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Phone size={14} className="text-zinc-500" />
                  <span className="font-mono text-[12.5px] text-zinc-200">
                    {profile.contact.phone}
                  </span>
                </div>
              )}
              {profile?.contact?.linkedin && (
                <a
                  data-testid="contact-info-linkedin"
                  href={profile.contact.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-zinc-900/50"
                >
                  <Linkedin size={14} className="text-zinc-500" />
                  <span className="font-mono text-[12.5px] text-zinc-200">LinkedIn profile</span>
                </a>
              )}
            </ul>
            <div className="border-t border-zinc-800 px-4 py-3 font-mono text-[11px] leading-relaxed text-zinc-500">
              Response time typically &lt; 24h on weekdays. For urgent hiring
              questions, ping via LinkedIn or the address above.
            </div>
          </aside>

          <form
            onSubmit={onSubmit}
            data-testid="contact-form"
            className="border border-zinc-800 bg-[#0a0a0a] lg:col-span-8"
          >
            <div className="grid grid-cols-1 gap-px bg-zinc-800 sm:grid-cols-2">
              <Field
                testid="contact-name"
                label="Name"
                value={form.name}
                onChange={set("name")}
                placeholder="e.g. Alex Doe"
                required
              />
              <Field
                testid="contact-email"
                type="email"
                label="Email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="border-t border-zinc-800">
              <Field
                testid="contact-subject"
                label="Subject"
                value={form.subject}
                onChange={set("subject")}
                placeholder="Backend role · payments team"
                required
              />
            </div>
            <div className="border-t border-zinc-800 bg-[#0a0a0a] px-4 py-3">
              <label
                htmlFor="contact-message"
                className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                data-testid="contact-message"
                value={form.message}
                onChange={set("message")}
                required
                minLength={5}
                rows={6}
                placeholder="Tell me a bit about the role, team and stack…"
                className="w-full resize-y border border-zinc-800 bg-zinc-950 p-3 font-mono text-[12.5px] text-white outline-none placeholder:text-zinc-600 focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
              />
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-zinc-800 px-4 py-3">
              <div className="min-h-[24px] font-mono text-[11px]" aria-live="polite">
                {state.status === "sent" && (
                  <span
                    data-testid="contact-success"
                    className="inline-flex items-center gap-1.5 text-[#22c55e]"
                  >
                    <CheckCircle2 size={12} /> sent · id {state.id?.slice(0, 8)}
                  </span>
                )}
                {state.status === "error" && (
                  <span
                    data-testid="contact-error"
                    className="inline-flex items-center gap-1.5 text-[#FF3B30]"
                  >
                    <AlertTriangle size={12} /> {state.error}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={state.status === "sending"}
                data-testid="contact-submit"
                className="inline-flex items-center gap-2 border border-white bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-black transition-colors duration-150 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
              >
                <Send size={12} />
                {state.status === "sending" ? "sending…" : "send"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function Field({ testid, label, value, onChange, placeholder, required, type = "text" }) {
  return (
    <label className="block bg-[#0a0a0a] px-4 py-3">
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </span>
      <input
        data-testid={testid}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[12.5px] text-white outline-none placeholder:text-zinc-600 focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
      />
    </label>
  );
}
