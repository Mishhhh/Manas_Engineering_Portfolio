import { useEffect, useState } from "react";
import { api, endpoints } from "@/lib/api";
import SectionHeader from "@/components/portfolio/SectionHeader";
import { Download, ExternalLink, FileText } from "lucide-react";

/** Resume — view (embed) + download. Resume URL comes from /api/resume. */
export default function Resume() {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.get(endpoints.resume)
      .then((r) => setUrl(r.data.url))
      .catch(() => setFailed(true));
  }, []);

  return (
    <section
      id="resume"
      data-testid="resume-section"
      className="border-b border-zinc-800 bg-[#050505]"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:py-20">
        <SectionHeader
          eyebrow="0x05 · résumé"
          title="Résumé"
          hint={url ? "PDF served via /api/resume" : "loading…"}
        />
        <h1 className="sr-only">Résumé</h1>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            data-testid="resume-download"
            href={url || "#"}
            download
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-white bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-black transition-colors duration-150 hover:bg-zinc-200 active:scale-[0.98]"
          >
            <Download size={13} />
            Download PDF
          </a>
          <a
            data-testid="resume-open-newtab"
            href={url || "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-zinc-700 bg-transparent px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-200 transition-colors duration-150 hover:border-[#007AFF] hover:text-white active:scale-[0.98]"
          >
            <ExternalLink size={13} />
            Open in new tab
          </a>
        </div>

        <div
          data-testid="resume-viewer"
          className="mt-6 border border-zinc-800 bg-[#0a0a0a]"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
            <div className="flex items-center gap-2">
              <FileText size={12} />
              Manas_Mishra_Resume.pdf
            </div>
            <div className="tracking-[0.2em]">READ-ONLY · PDF</div>
          </div>
          {url && !failed ? (
            <object
              data={`${url}#view=fitH`}
              type="application/pdf"
              className="h-[85vh] w-full bg-[#0a0a0a]"
            >
              <div className="p-6 font-mono text-[12.5px] text-zinc-400">
                Your browser can't display this PDF inline —{" "}
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#00E5FF] underline"
                >
                  open it in a new tab
                </a>
                .
              </div>
            </object>
          ) : (
            <div className="p-6 font-mono text-[12.5px] text-zinc-500">
              {failed ? "resume URL unavailable" : "loading resume…"}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
