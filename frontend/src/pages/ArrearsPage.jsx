import { useState } from "react";
import { api } from "@/lib/api";
import Layout from "@/components/portfolio/Layout";
import SectionHeader from "@/components/portfolio/SectionHeader";
import { Play, RefreshCcw, AlertTriangle, Plus, Minus } from "lucide-react";

const STATE_COLOR = {
  Active: "#22c55e",
  PaymentDue: "#00E5FF",
  PaymentFailed: "#FF3B30",
  Retrying: "#FFBF00",
  InArrears: "#FF3B30",
  Recovered: "#22c55e",
  Cancelled: "#a1a1aa",
};

const DEFAULTS = {
  subscription_amount: 12.99,
  currency: "GBP",
  payment_due_date: "",
  attempts: ["Fail", "Fail", "Success"],
  retry_policy: { max_attempts: 3, initial_delay_ms: 5000, backoff_multiplier: 2, max_delay_ms: 60000, strategy: "Exponential" },
};

export default function ArrearsPage() {
  const [form, setForm] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [running, setRunning] = useState(false);

  const setField = (k, num = false) => (e) => setForm((f) => ({ ...f, [k]: num ? Number(e.target.value) : e.target.value }));
  const setPolicy = (k, num = true) => (e) => setForm((f) => ({ ...f, retry_policy: { ...f.retry_policy, [k]: num ? Number(e.target.value) : e.target.value } }));
  const setAttempt = (i, val) => setForm((f) => { const a = [...f.attempts]; a[i] = val; return { ...f, attempts: a }; });
  const addAttempt = () => setForm((f) => f.attempts.length < 24 ? { ...f, attempts: [...f.attempts, "Fail"] } : f);
  const removeAttempt = (i) => setForm((f) => f.attempts.length > 1 ? { ...f, attempts: f.attempts.filter((_, j) => j !== i) } : f);

  const run = async () => {
    setErr(null);
    setRunning(true);
    try {
      const r = await api.post("/arrears/simulate", form);
      setResult(r.data);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Layout>
      <div data-testid="arrears-page">
        <section className="relative overflow-hidden border-b border-zinc-800">
          <div className="eng-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div className="relative mx-auto max-w-[1440px] px-6 py-12 lg:py-16">
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#00E5FF]">/labs / arrears</div>
            <h1 className="mt-3 font-bold tracking-tight text-white text-4xl sm:text-5xl">Subscription Arrears Simulator</h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-300 md:text-lg">
              Model missed payments, retries and arrears creation across billing cycles.{" "}
              <span className="font-mono text-[13px] text-[#FFBF00]">Demo only — no real payments.</span>
            </p>
          </div>
        </section>

        <section className="border-b border-zinc-800 bg-[#070707]">
          <div className="mx-auto max-w-[1440px] px-6 py-12 lg:py-16">
            <SectionHeader eyebrow="lab · subscription" title="Configuration" />
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
              <form
                data-testid="arrears-form"
                noValidate
                onSubmit={(e) => { e.preventDefault(); run(); }}
                className="border border-zinc-800 bg-[#0a0a0a] lg:col-span-5 xl:col-span-4"
              >
                <div className="border-b border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">subscription</div>
                <div className="grid grid-cols-1 gap-px bg-zinc-800 sm:grid-cols-2">
                  <Field testid="input-sub-amount" label="Subscription Amount" type="number" step="0.01" value={form.subscription_amount} onChange={setField("subscription_amount", true)} />
                  <Field testid="input-sub-currency" label="Currency" maxLength={3} value={form.currency} onChange={setField("currency")} />
                </div>
                <div>
                  <Field testid="input-due-date" label="Payment Due Date (ISO)" placeholder="2025-05-01" value={form.payment_due_date} onChange={setField("payment_due_date")} />
                </div>

                <div className="border-t border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">retry policy</div>
                <div className="grid grid-cols-1 gap-px bg-zinc-800 sm:grid-cols-2">
                  <Field testid="input-policy-max" label="Max Attempts" type="number" min="1" max="10" value={form.retry_policy.max_attempts} onChange={setPolicy("max_attempts")} />
                  <Field testid="input-policy-initial" label="Initial Delay (ms)" type="number" value={form.retry_policy.initial_delay_ms} onChange={setPolicy("initial_delay_ms")} />
                  <Field testid="input-policy-backoff" label="Backoff x" type="number" step="0.1" value={form.retry_policy.backoff_multiplier} onChange={setPolicy("backoff_multiplier")} />
                  <Field testid="input-policy-maxdelay" label="Max Delay (ms)" type="number" value={form.retry_policy.max_delay_ms} onChange={setPolicy("max_delay_ms")} />
                </div>

                <div className="border-t border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500 flex items-center justify-between">
                  <span>scripted attempts ({form.attempts.length})</span>
                  <button type="button" data-testid="btn-add-attempt" onClick={addAttempt} className="flex h-6 w-6 items-center justify-center border border-zinc-700 text-zinc-300 hover:border-[#00E5FF] hover:text-white"><Plus size={12} /></button>
                </div>
                <ul className="divide-y divide-zinc-800">
                  {form.attempts.map((a, i) => (
                    <li key={i} data-testid={`attempt-row-${i}`} className="flex items-center gap-2 px-4 py-2 font-mono text-[12.5px]">
                      <span className="w-8 text-zinc-500">#{i + 1}</span>
                      <select value={a} onChange={(e) => setAttempt(i, e.target.value)} data-testid={`attempt-select-${i}`} className="flex-1 border border-zinc-800 bg-zinc-950 px-2 py-1 text-white outline-none focus:border-[#007AFF]">
                        <option value="Fail">Fail</option>
                        <option value="Success">Success</option>
                      </select>
                      <button type="button" onClick={() => removeAttempt(i)} data-testid={`attempt-remove-${i}`} className="flex h-6 w-6 items-center justify-center border border-zinc-800 text-zinc-500 hover:border-[#FF3B30] hover:text-[#FF3B30]"><Minus size={12} /></button>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
                  <button type="button" onClick={() => setResult(null)} data-testid="btn-clear" className="inline-flex items-center gap-2 border border-zinc-700 bg-transparent px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-300 hover:border-[#007AFF] hover:text-white"><RefreshCcw size={12} /> Clear</button>
                  <button type="submit" disabled={running} data-testid="btn-run-arrears" className="inline-flex items-center gap-2 border border-white bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-black hover:bg-zinc-200 disabled:opacity-50 active:scale-[0.98]"><Play size={12} /> {running ? "simulating…" : "Simulate"}</button>
                </div>
                {err && <div data-testid="arrears-error" role="alert" className="flex items-start gap-2 border-t border-zinc-800 bg-black px-4 py-3 font-mono text-[11.5px] text-[#FF3B30]"><AlertTriangle size={13} className="mt-0.5" /> {err}</div>}
              </form>

              <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                {result && <ResultBanner result={result} />}
                <ArrearsTimeline events={result?.events || []} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function ResultBanner({ result }) {
  const color = STATE_COLOR[result.final_state] || "#a1a1aa";
  return (
    <div data-testid="arrears-result" className="border border-zinc-800 bg-[#0a0a0a]">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">result</span>
        <span data-testid="arrears-state" className="border px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.22em]" style={{ color, borderColor: color + "66" }}>{result.final_state}</span>
      </div>
      <dl className="grid grid-cols-2 gap-y-3 p-4 font-mono text-[13px] sm:grid-cols-4">
        <Cell label="Outstanding" value={`${sym(result.request.currency)}${result.outstanding_balance.toFixed(2)}`} testid="arrears-outstanding" />
        <Cell label="Arrears" value={`${sym(result.request.currency)}${result.arrears_amount.toFixed(2)}`} testid="arrears-amount" />
        <Cell label="Retry Count" value={result.retry_count} testid="arrears-retry-count" />
        <Cell label="Recovered" value={result.payments_recovered} testid="arrears-recovered" />
      </dl>
    </div>
  );
}

function Cell({ label, value, testid }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">{label}</div>
      <div className="mt-1 text-white" data-testid={testid}>{value}</div>
    </div>
  );
}

function ArrearsTimeline({ events }) {
  const OUT = { info: "#a1a1aa", success: "#22c55e", failed: "#FF3B30", warning: "#FFBF00" };
  return (
    <div data-testid="arrears-timeline" className="border border-zinc-800 bg-[#0a0a0a]">
      <div className="border-b border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
        timeline · {events.length} events
      </div>
      <ol className="divide-y divide-zinc-800">
        {events.length === 0 && <li className="p-4 font-mono text-[12px] text-zinc-500">no events yet — run a simulation</li>}
        {events.map((e, i) => (
          <li key={i} data-testid={`arrears-event-${i}`} className="grid grid-cols-[92px_80px_1fr_120px] items-baseline gap-3 px-4 py-2.5 font-mono text-[12.5px]">
            <span className="tabular-nums text-zinc-500">{e.ts.slice(11, 19)}</span>
            <span className="border px-1.5 py-0.5 text-center text-[10px] uppercase tracking-widest" style={{ color: OUT[e.outcome], borderColor: OUT[e.outcome] + "66" }}>{e.step}</span>
            <span className="min-w-0 truncate text-zinc-200">{e.message}</span>
            <span className="text-right tabular-nums text-zinc-500">bal {e.balance_after.toFixed(2)} · arr {e.arrears_after.toFixed(2)}</span>
          </li>
        ))}
      </ol>
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

function sym(cur) { return { GBP: "£", USD: "$", EUR: "€", INR: "₹", JPY: "¥" }[cur] || `${cur} `; }
