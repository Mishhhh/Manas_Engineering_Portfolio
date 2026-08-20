export default function Footer() {
  return (
    <footer data-testid="footer" className="border-t border-zinc-800 bg-[#050505]">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center">
        <div className="font-mono text-[11px] tracking-wide text-zinc-400">
          © {new Date().getFullYear()} Manas Mishra ·{" "}
          <span className="text-zinc-500">shipped from Pune with a working coffee machine</span>
        </div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-400">
          this site is the project · not a template
        </div>
      </div>
    </footer>
  );
}
