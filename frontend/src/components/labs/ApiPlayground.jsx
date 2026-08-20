import { useState } from "react";
import { api } from "@/lib/api";
import SectionHeader from "@/components/portfolio/SectionHeader";
import { Play, Loader2 } from "lucide-react";

const ENDPOINTS = [
  { method: "GET", path: "/health", tag: "meta" },
  { method: "GET", path: "/profile", tag: "portfolio" },
  { method: "GET", path: "/experience", tag: "portfolio" },
  { method: "GET", path: "/skills", tag: "portfolio" },
  { method: "GET", path: "/projects", tag: "portfolio" },
  { method: "GET", path: "/projects/safesend-sdk", tag: "portfolio" },
  { method: "GET", path: "/resume", tag: "meta" },
  {
    method: "POST",
    path: "/contact",
    tag: "portfolio",
    body: {
      name: "Alex Doe",
      email: "alex@example.com",
      subject: "Backend role · payments",
      message: "Loved the interactive portfolio — can we chat?",
    },
  },
];

const METHOD_COLOR = {
  GET: "#00E5FF",
  POST: "#FFBF00",
  PUT: "#22c55e",
  DELETE: "#FF3B30",
};

/** ApiPlayground — click an endpoint to hit it and inspect the response. */
export default function ApiPlayground() {
  const [selected, setSelected] = useState(ENDPOINTS[0]);
  const [body, setBody] = useState(JSON.stringify(ENDPOINTS[0].body || {}, null, 2));
  const [state, setState] = useState({
    status: "idle",
    response: null,
    statusCode: null,
    ms: null,
    error: null,
  });

  const pickEndpoint = (ep) => {
    setSelected(ep);
    setBody(JSON.stringify(ep.body || {}, null, 2));
    setState({ status: "idle", response: null, statusCode: null, ms: null, error: null });
  };

  const execute = async () => {
    setState({ status: "running", response: null, statusCode: null, ms: null, error: null });
    const t0 = performance.now();
    try {
      const opts = { method: selected.method, url: selected.path };
      if (selected.method === "POST" && selected.body) {
        opts.data = JSON.parse(body || "{}");
      }
      const r = await api.request(opts);
      const ms = Math.round(performance.now() - t0);
      setState({
        status: "done",
        response: r.data,
        statusCode: r.status,
        ms,
        error: null,
      });
    } catch (err) {
      const ms = Math.round(performance.now() - t0);
      setState({
        status: "done",
        response: err?.response?.data ?? null,
        statusCode: err?.response?.status ?? 0,
        ms,
        error: err.message,
      });
    }
  };

  return (
    <section
      id="api-playground"
      data-testid="api-playground-section"
      className="border-b border-zinc-800 bg-[#050505]"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:py-20">
        <SectionHeader
          eyebrow="lab · api"
          title="API Playground"
          hint="calls hit the same FastAPI backend"
        />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside
            data-testid="api-endpoint-list"
            className="border border-zinc-800 lg:col-span-4"
          >
            <div className="border-b border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
              endpoints
            </div>
            <ul>
              {ENDPOINTS.map((ep) => {
                const isSel = ep.path === selected.path && ep.method === selected.method;
                return (
                  <li key={ep.method + ep.path}>
                    <button
                      data-testid={`api-endpoint-${ep.method}-${ep.path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`}
                      onClick={() => pickEndpoint(ep)}
                      className={`flex w-full items-center gap-3 border-b border-b-zinc-800 px-4 py-2.5 text-left transition-colors duration-150 last:border-b-0 ${
                        isSel ? "bg-zinc-900" : "hover:bg-zinc-900/50"
                      }`}
                    >
                      <span
                        className="w-14 shrink-0 border px-1 py-0.5 text-center font-mono text-[10px] font-semibold tracking-widest"
                        style={{
                          color: METHOD_COLOR[ep.method] || "#a1a1aa",
                          borderColor: (METHOD_COLOR[ep.method] || "#a1a1aa") + "66",
                        }}
                      >
                        {ep.method}
                      </span>
                      <span className="flex-1 truncate font-mono text-[12.5px] text-zinc-200">
                        {ep.path}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="lg:col-span-8">
            <div className="border border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
                <div className="flex items-center gap-3">
                  <span
                    className="border px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-widest"
                    style={{
                      color: METHOD_COLOR[selected.method],
                      borderColor: METHOD_COLOR[selected.method] + "66",
                    }}
                  >
                    {selected.method}
                  </span>
                  <span
                    data-testid="api-selected-path"
                    className="font-mono text-[13px] text-white"
                  >
                    {selected.path}
                  </span>
                </div>
                <button
                  data-testid="api-execute"
                  onClick={execute}
                  disabled={state.status === "running"}
                  className="inline-flex items-center gap-2 border border-white bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-black transition-colors duration-150 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
                >
                  {state.status === "running" ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> running…
                    </>
                  ) : (
                    <>
                      <Play size={12} /> Execute
                    </>
                  )}
                </button>
              </div>

              {selected.method === "POST" && (
                <div className="border-b border-zinc-800 bg-[#0a0a0a] p-3">
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    request body (json)
                  </div>
                  <textarea
                    data-testid="api-body-input"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                    spellCheck={false}
                    className="w-full resize-y border border-zinc-800 bg-zinc-950 p-3 font-mono text-[12px] text-white outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-px bg-zinc-800">
                <Stat
                  testid="api-status-code"
                  label="STATUS"
                  value={state.statusCode ?? "—"}
                  color={
                    state.statusCode
                      ? state.statusCode >= 400
                        ? "#FF3B30"
                        : "#22c55e"
                      : "#a1a1aa"
                  }
                />
                <Stat
                  testid="api-response-time"
                  label="TIME"
                  value={state.ms != null ? `${state.ms} ms` : "—"}
                />
                <Stat
                  testid="api-response-kind"
                  label="RESULT"
                  value={state.error ? "ERROR" : state.status === "done" ? "OK" : state.status.toUpperCase()}
                  color={state.error ? "#FF3B30" : state.status === "done" ? "#22c55e" : "#a1a1aa"}
                />
              </div>

              <div className="border-t border-zinc-800 bg-[#0a0a0a] p-3">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  response
                </div>
                <pre
                  data-testid="api-response-body"
                  className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words border border-zinc-800 bg-[#050505] p-3 font-mono text-[12px] leading-relaxed text-zinc-200"
                >
{state.response
                    ? JSON.stringify(state.response, null, 2)
                    : state.status === "running"
                      ? "…"
                      : "// click Execute to run this request"}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, color = "#e4e4e7", testid }) {
  return (
    <div className="bg-[#0a0a0a] p-3" data-testid={testid}>
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 font-mono text-[14px] font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
