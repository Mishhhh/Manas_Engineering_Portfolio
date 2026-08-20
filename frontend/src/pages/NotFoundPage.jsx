import { Link } from "react-router-dom";
import Layout from "@/components/portfolio/Layout";

export default function NotFoundPage() {
  return (
    <Layout>
      <section
        data-testid="notfound-page"
        className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-[#050505] px-6"
      >
        <div className="eng-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#FF3B30]">
            HTTP 404 · not_found
          </div>
          <h1 className="mt-3 font-bold tracking-tight text-white text-5xl">
            Route not resolved
          </h1>
          <pre className="mx-auto mt-6 max-w-md whitespace-pre-wrap border border-zinc-800 bg-[#0a0a0a] p-4 text-left font-mono text-[12px] text-zinc-300">
{`{
  "ok": false,
  "code": "not_found",
  "hint": "Try Cmd+K to jump to a page"
}`}
          </pre>
          <Link
            to="/"
            data-testid="notfound-home-link"
            className="mt-8 inline-block border border-white bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-black transition-colors duration-150 hover:bg-zinc-200"
          >
            ← back to home
          </Link>
        </div>
      </section>
    </Layout>
  );
}
