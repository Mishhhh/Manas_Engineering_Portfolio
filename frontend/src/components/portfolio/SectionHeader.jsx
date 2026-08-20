import { Command as CommandIcon } from "lucide-react";

/** Small reusable section header used across every section. */
export default function SectionHeader({ eyebrow, title, hint, children }) {
  return (
    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#00E5FF]">
          {eyebrow}
        </div>
        <h2 className="mt-2 font-bold tracking-tight text-white text-3xl sm:text-4xl">
          {title}
        </h2>
      </div>
      {hint !== undefined && (
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-wide text-zinc-500">
          {hint}
        </div>
      )}
      {children}
    </div>
  );
}

export function CmdKHint() {
  return (
    <span
      data-testid="cmdk-hint"
      className="inline-flex items-center gap-1 border border-zinc-800 bg-zinc-950 px-1.5 py-1 font-mono text-[10px] tracking-widest text-zinc-500"
    >
      <CommandIcon size={10} /> K
    </span>
  );
}
