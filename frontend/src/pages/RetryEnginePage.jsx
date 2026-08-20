import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Layout from "@/components/portfolio/Layout";
import SectionHeader from "@/components/portfolio/SectionHeader";
import { Play, RefreshCcw, KeyRound, AlertTriangle } from "lucide-react";

const DEFAULTS = {
  max_attempts: 4,
  initial_delay_ms: 5000,
  backoff_multiplier: 2,
  max_delay_ms: 60000,
  strategy: "Exponential",
  success_at_attempt: 4,
  request_id: "REQ-DEMO-1",
};

const STATUS_COLOR = {
  Success: "#22c55e",
  Failed: "#FF3B30",
  GaveUp: "#FFBF00",
  PermanentFailure: "#FF3B30",
};

export default function RetryEnginePage() {
  const [form, setForm] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    // Auto-populate from ?payment=… when linked from the Payment Simulator.
    const q = new URLSearchParams(window.location.search);
    const pid = q.get("payment");
    const reqId = q.get("request");
    if (pid || reqId) {
      setForm((f) => ({
        ...f,
        request_id: reqId || `REQ-${pid.slice(-6)}`,
        success_at_attempt: 3,
      }));
    }
  }, []);

  const set = (k, num = false) => (e) =>
    setForm((f) => ({ ...f, [k]: num ? Number(e.target.value) : e.target.value }));

  const run = async () => {
    setErr(null);
    setRunning(true);
    try {
      const r = await api.post("/retry-engine/simulate", {
        policy: {
          max_attempts: Number(form.max_attempts),
          initial_delay_ms: Number(form.initial_delay_ms),
          backoff_multiplier: Number(form.backoff_multiplier),
          max_delay_ms: Number(form.max_delay_ms),
          strategy: form.strategy,
        },
        success_at_attempt: Number(form.success_at_attempt),
        request_id: form.request_id,
      });
      setResult(r.data);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setRunning(false);
    }
  };

  const clear = () => {
    setResult(null);
    setErr(null);
  };

  return (
    <Layout>
      <div data-testid="retry-engine-page">
        <section className="relative overflow-hidden border-b border-zinc-800">
          <div className="eng-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div className="relative mx-auto max-w-[1440px] px-6 py-12 lg:py-16">
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#00E5FF]">
              /labs / retry-engine
            </div>
            <h1 className="mt-3 font-bold tracking-tight text-white text-4xl sm:text-5xl">
              Payment Retry Engine
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-300 md:text-lg">
              Configure a retry policy and inspect the attempt schedule.
              Simulated timestamps — no real delays.{" "}
              <span className="font-mono text-[13px] text-[#FFBF00]">Demo only.</span>
            </p>
          </div>
        </section>

        <section className="border-b border-zinc-800 bg-[#070707]">
          <div className="mx-auto max-w-[1440px] px-6 py-12 lg:py-16">
            <SectionHeader eyebrow="lab · policy" title="Policy configuration" />
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
              <form
                data-testid="retry-form"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  run();
                }}
                className="border border-zinc-800 bg-[#0a0a0a] lg:col-span-5 xl:col-span-4"
              >
                <div className="border-b border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
                  policy
                </div>
                <div className="grid grid-cols-1 gap-px bg-zinc-800 sm:grid-cols-2">
                  <Field testid="input-max-attempts" label="Max Attempts" type="number" min="1" max="10" value={form.max_attempts} onChange={set("max_attempts", true)} />
                  <Field testid="input-initial-delay" label="Initial Delay (ms)" type="number" min="0" value={form.initial_delay_ms} onChange={set("initial_delay_ms", true)} />
                  <Field testid="input-backoff" label="Backoff Multiplier" type="number" step="0.1" min="1" value={form.backoff_multiplier} onChange={set("backoff_multiplier", true)} />
                  <Field testid="input-max-delay" label="Max Delay (ms)" type="number" min="0" value={form.max_delay_ms} onChange={set("max_delay_ms", true)} />
                </div>
                <div className="grid grid-cols-1 gap-px bg-zinc-800 sm:grid-cols-2">
                  <SelectField testid="input-strategy" label="Strategy" value={form.strategy} onChange={set("strategy")} options={["Exponential", "Fixed"]} />
                  <Field testid="input-success-at" label="Succeed at attempt (0=all fail, -1=permanent)" type="number" min="-1" max="10" value={form.success_at_attempt} onChange={set("success_at_attempt", true)} />
                </div>
                <div>
                  <Field testid="input-request-id" label="Idempotency Key (Request ID)" value={form.request_id} onChange={set("request_id")} />
                </div>
                <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
                  <button type="button" onClick={clear} disabled={running} data-testid="btn-clear" className="inline-flex items-center gap-2 border border-zinc-700 bg-transparent px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-300 transition-colors duration-150 hover:border-[#007AFF] hover:text-white disabled:opacity-50">
                    <RefreshCcw size={12} /> Clear
                  </button>
                  <button type="submit" disabled={running} data-testid="btn-run" className="inline-flex items-center gap-2 border border-white bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-black transition-colors duration-150 hover:bg-zinc-200 disabled:opacity-50 active:scale-[0.98]">
                    <Play size={12} /> {running ? "simulating…" : "Run Retry Simulation"}
                  </button>
                </div>
                {err && (
                  <div data-testid="retry-error" role="alert" className="flex items-start gap-2 border-t border-zinc-800 bg-black px-4 py-3 font-mono text-[11.5px] text-[#FF3B30]">
                    <AlertTriangle size={13} className="mt-0.5" /> {err}
                  </div>
                )}
              </form>

              <div className="lg:col-span-7 xl:col-span-8">
                <RetryTimeline result={result} />
              </div>
            </div>

            <IdempotencyDemo />
            <ConceptsCard />
          </div>
        </section>
      </div>
    </Layout>
  );
}

function RetryTimeline({ result }) {
  return (
    <div data-testid="retry-timeline" className="border border-zinc-800 bg-[#0a0a0a]">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
          attempt schedule
        </span>
        {result && (
          <span
            data-testid="retry-outcome"
            className="border px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.22em]"
            style={{ color: STATUS_COLOR[result.outcome], borderColor: STATUS_COLOR[result.outcome] + "66" }}
          >
            {result.outcome} · {result.total_duration_ms}ms
          </span>
        )}
      </div>
      {!result && (
        <div className="p-6 font-mono text-[12.5px] text-zinc-500">
          configure a policy and press Run to see the attempt schedule
        </div>
      )}
      {result && (
        <ol className="divide-y divide-zinc-800">
          {result.attempts.map((a) => (
            <li key={a.n} data-testid={`retry-attempt-${a.n}`} className="grid grid-cols-[60px_100px_100px_1fr] items-baseline gap-3 px-4 py-3 font-mono text-[12.5px]">
              <span className="text-zinc-500">#{a.n}</span>
              <span
                className="border px-1.5 py-0.5 text-center text-[10px] uppercase tracking-widest"
                style={{ color: STATUS_COLOR[a.status], borderColor: STATUS_COLOR[a.status] + "66" }}
              >
                {a.status}
              </span>
              <span className="tabular-nums text-zinc-400">{a.delay_before_ms}ms</span>
              <span className="min-w-0 truncate text-zinc-300">{a.reason}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function IdempotencyDemo() {
  return (
    <div data-testid="idempotency-demo" className="mt-8 border border-zinc-800 bg-[#0a0a0a]">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2">
        <KeyRound size={12} className="text-[#00E5FF]" />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00E5FF]">
          idempotency · educational
        </span>
      </div>
      <pre className="whitespace-pre-wrap p-4 font-mono text-[12.5px] leading-relaxed text-zinc-200">
{`Request ID: REQ-123
────────────────────────────
Attempt 1  →  FAILED (timeout)
             the client doesn't know if the payment succeeded server-side.

Attempt 2  →  RECEIVED SAME REQUEST ID
             the server recognises REQ-123 and reuses the original outcome
             instead of creating a duplicate payment transaction.

Result: exactly one payment recorded per request id.

Why: retries + timeouts + at-least-once delivery = potential duplicates.
     Idempotency keys let the server dedupe safely.`}
      </pre>
    </div>
  );
}

function ConceptsCard() {
  const rows = [
    ["Exponential backoff", "Delay grows geometrically — reduces load on a struggling processor."],
    ["Fixed delay", "Constant wait — simpler but doesn't relieve backend pressure."],
    ["Max attempts", "Hard upper bound so runaway retries can't storm the network."],
    ["Max delay", "Cap on the growth of exponential backoff — avoids hour-long waits."],
    ["Transient failure", "Temporary — worth retrying (timeout, insufficient credit temporarily)."],
    ["Permanent failure", "Definitive — DO NOT retry (mandate revoked, currency unsupported)."],
    ["Retry storm", "Many clients retry simultaneously after an outage — needs jitter to fix."],
    ["Idempotency", "Same request id must never create duplicate state on the server."],
  ];
  return (
    <div data-testid="retry-concepts" className="mt-8 border border-zinc-800 bg-[#0a0a0a]">
      <div className="border-b border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00E5FF]">
        concepts
      </div>
      <ul className="divide-y divide-zinc-800">
        {rows.map(([k, v]) => (
          <li key={k} className="grid grid-cols-[200px_1fr] gap-4 px-4 py-3">
            <span className="font-mono text-[12px] uppercase tracking-wide text-zinc-400">{k}</span>
            <span className="text-[13.5px] text-zinc-300">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ testid, label, ...rest }) {
  const id = `f-${testid}`;
  return (
    <label htmlFor={id} className="block bg-[#0a0a0a] px-4 py-3">
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">{label}</span>
      <input id={id} data-testid={testid} {...rest} className="w-full border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[12.5px] text-white outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" />
    </label>
  );
}

function SelectField({ testid, label, value, onChange, options }) {
  const id = `f-${testid}`;
  return (
    <label htmlFor={id} className="block bg-[#0a0a0a] px-4 py-3">
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">{label}</span>
      <select id={id} data-testid={testid} value={value} onChange={onChange} className="w-full border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[12.5px] text-white outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
