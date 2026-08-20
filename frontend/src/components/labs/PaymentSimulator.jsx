import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import SectionHeader from "@/components/portfolio/SectionHeader";
import PaymentWorkflow from "@/components/labs/PaymentWorkflow";
import PaymentEventTimeline from "@/components/labs/PaymentEventTimeline";
import PaymentResultCard from "@/components/labs/PaymentResultCard";
import PaymentArchitecture from "@/components/labs/PaymentArchitecture";
import { Play, RefreshCcw, AlertTriangle, ChevronDown, Layers, BookOpen } from "lucide-react";

const BASE = "/payment-simulator";

const DEFAULTS = {
  customerId: "DEMO-1001",
  amount: 120,
  currency: "GBP",
  paymentMethod: "DirectDebit",
  scenario: "Success",
};

const TERMINAL_STATUSES = new Set(["Settled", "Failed", "TimedOut"]);

export default function PaymentSimulator() {
  const [scenarios, setScenarios] = useState(null);
  const [form, setForm] = useState(DEFAULTS);
  const [payment, setPayment] = useState(null);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState(null);
  const [showArch, setShowArch] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    api.get(`${BASE}/scenarios`).then((r) => setScenarios(r.data)).catch(() => {});
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const setField = (k) => (e) => {
    const v = e.target.type === "number" ? e.target.value : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = (pid) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const r = await api.get(`${BASE}/payments/${pid}`);
        setPayment(r.data);
        if (TERMINAL_STATUSES.has(r.data.status)) {
          stopPolling();
          setRunning(false);
        }
      } catch (e) {
        stopPolling();
        setRunning(false);
        setErr(e?.response?.data?.message || e.message);
      }
    }, 350);
  };

  const process = async () => {
    setErr(null);
    // In-app validation so the backend 422 path can also be surfaced consistently.
    const amt = Number(form.amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setErr("amount must be greater than zero");
      return;
    }
    if (!form.customerId.trim()) {
      setErr("customerId is required");
      return;
    }
    if (!/^[A-Za-z]{3}$/.test(form.currency)) {
      setErr("currency must be a 3-letter ISO code");
      return;
    }
    setRunning(true);
    try {
      // 1. Create
      const create = await api.post(`${BASE}/payments`, {
        customerId: form.customerId,
        amount: Number(form.amount),
        currency: form.currency,
        paymentMethod: form.paymentMethod,
        scenario: form.scenario,
      });
      setPayment(create.data);
      const pid = create.data.id;

      // 2. Kick off backend state machine
      await api.post(`${BASE}/payments/${pid}/process`);

      // 3. Poll
      startPolling(pid);
    } catch (e) {
      setRunning(false);
      const detail = e?.response?.data;
      setErr(
        detail?.message ||
          detail?.detail?.[0]?.msg ||
          e.message ||
          "process failed",
      );
    }
  };

  const reset = async () => {
    if (!payment) {
      setPayment(null);
      setErr(null);
      return;
    }
    stopPolling();
    try {
      const r = await api.post(`${BASE}/payments/${payment.id}/reset`);
      setPayment(r.data);
      setRunning(false);
      setErr(null);
    } catch (e) {
      setErr(e.message);
    }
  };

  const clearAll = () => {
    stopPolling();
    setPayment(null);
    setRunning(false);
    setErr(null);
  };

  return (
    <div>
      <section
        data-testid="payment-simulator-hero"
        className="relative overflow-hidden border-b border-zinc-800"
      >
        <div className="eng-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-[1440px] px-6 py-12 lg:py-16">
          <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#00E5FF]">
            /labs / payment-simulator
          </div>
          <h1 className="mt-3 font-bold tracking-tight text-white text-4xl sm:text-5xl">
            Payment Processing Simulator
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-300 md:text-lg">
            Explore how a payment request moves through validation, mandate check,
            processing, failure handling and settlement. The state machine and event
            history are owned by the backend.{" "}
            <span className="font-mono text-[13px] text-[#FFBF00]">
              Demo only — no real financial systems are contacted.
            </span>
          </p>
          <button
            data-testid="toggle-arch"
            onClick={() => setShowArch((v) => !v)}
            className="mt-6 inline-flex items-center gap-2 border border-zinc-700 bg-transparent px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-200 transition-colors duration-150 hover:border-[#007AFF] hover:text-white"
          >
            <Layers size={13} />
            {showArch ? "Hide architecture" : "View architecture"}
            <ChevronDown
              size={13}
              className={`transition-transform duration-150 ${showArch ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </section>

      {showArch && <PaymentArchitecture />}

      <section
        id="simulator"
        data-testid="payment-simulator-section"
        className="border-b border-zinc-800 bg-[#070707]"
      >
        <div className="mx-auto max-w-[1440px] px-6 py-12 lg:py-16">
          <SectionHeader
            eyebrow="lab · state machine"
            title="Simulator"
            hint={payment ? `payment id · ${payment.id}` : "no active payment"}
          />

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Input panel */}
            <form
              data-testid="payment-input-panel"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                process();
              }}
              className="border border-zinc-800 bg-[#0a0a0a] lg:col-span-5 xl:col-span-4"
            >
              <div className="border-b border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
                request
              </div>
              <div className="grid grid-cols-1 gap-px bg-zinc-800 sm:grid-cols-2">
                <Field
                  testid="input-customer-id"
                  label="Customer ID"
                  value={form.customerId}
                  onChange={setField("customerId")}
                  required
                />
                <Field
                  testid="input-amount"
                  label="Amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={setField("amount")}
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-px bg-zinc-800 sm:grid-cols-2">
                <Field
                  testid="input-currency"
                  label="Currency"
                  value={form.currency}
                  onChange={setField("currency")}
                  maxLength={3}
                  required
                />
                <SelectField
                  testid="input-payment-method"
                  label="Payment Method"
                  value={form.paymentMethod}
                  onChange={setField("paymentMethod")}
                  options={scenarios?.paymentMethods || ["DirectDebit", "Card", "BankTransfer"]}
                />
              </div>
              <div>
                <SelectField
                  testid="input-scenario"
                  label="Scenario"
                  value={form.scenario}
                  onChange={setField("scenario")}
                  options={
                    scenarios?.scenarios || [
                      "Success",
                      "Failure",
                      "Timeout",
                      "MandateFailure",
                      "InsufficientFunds",
                    ]
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-zinc-800 bg-[#0a0a0a] px-4 py-3">
                <button
                  type="button"
                  data-testid="btn-reset"
                  onClick={payment ? reset : clearAll}
                  disabled={running}
                  className="inline-flex items-center gap-2 border border-zinc-700 bg-transparent px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-300 transition-colors duration-150 hover:border-[#007AFF] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
                >
                  <RefreshCcw size={12} /> Reset
                </button>
                <button
                  type="submit"
                  data-testid="btn-process"
                  disabled={running}
                  className="inline-flex items-center gap-2 border border-white bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-black transition-colors duration-150 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
                >
                  <Play size={12} />
                  {running ? "processing…" : "Process Payment"}
                </button>
              </div>

              {err && (
                <div
                  data-testid="payment-error"
                  className="flex items-start gap-2 border-t border-zinc-800 bg-black px-4 py-3 font-mono text-[11.5px] text-[#FF3B30]"
                  role="alert"
                >
                  <AlertTriangle size={13} className="mt-0.5" />
                  <span>{err}</span>
                </div>
              )}
            </form>

            {/* Workflow visualization */}
            <div className="lg:col-span-7 xl:col-span-8">
              <PaymentWorkflow payment={payment} running={running} />
            </div>
          </div>

          {/* Result + events */}
          {payment && (
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5 xl:col-span-4">
                <PaymentResultCard payment={payment} />
              </div>
              <div className="lg:col-span-7 xl:col-span-8">
                <PaymentEventTimeline events={payment.events} />
              </div>
            </div>
          )}
        </div>
      </section>

      <HowThisWorks />
    </div>
  );
}

/* ----------------- form field primitives ------------------- */
function Field({ testid, label, value, onChange, type = "text", ...rest }) {
  const id = `f-${testid}`;
  return (
    <label htmlFor={id} className="block bg-[#0a0a0a] px-4 py-3">
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </span>
      <input
        id={id}
        data-testid={testid}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[12.5px] text-white outline-none placeholder:text-zinc-600 focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
        {...rest}
      />
    </label>
  );
}

function SelectField({ testid, label, value, onChange, options }) {
  const id = `f-${testid}`;
  return (
    <label htmlFor={id} className="block bg-[#0a0a0a] px-4 py-3">
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </span>
      <select
        id={id}
        data-testid={testid}
        value={value}
        onChange={onChange}
        className="w-full border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[12.5px] text-white outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ----------------- 'How this works' ------------------- */
function HowThisWorks() {
  return (
    <section
      id="how-this-works"
      data-testid="how-this-works-section"
      className="border-b border-zinc-800 bg-[#050505]"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-12 lg:py-16">
        <SectionHeader
          eyebrow="lab · notes"
          title="How this works"
          hint={
            <span className="inline-flex items-center gap-1.5 text-zinc-500">
              <BookOpen size={12} /> concise · technical
            </span>
          }
        />

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card
            title="Payment lifecycle"
            body={[
              "Request validation — schema (Pydantic) and business rules (amount > 0, customer required).",
              "Payment method validation — the mandate check ensures the payer authorised collection.",
              "Business rules — scenario decides which branch of the machine is taken.",
              "Processing — simulated call to an external processor; produces success, failure or timeout.",
              "Failure handling — retryable failures (insufficient funds, timeout) flag retry_available.",
              "Settlement — created only after Succeeded → Settled. Terminal statuses have no outgoing edges.",
            ]}
          />
          <Card
            title="Engineering concepts"
            body={[
              "Explicit state machine with a transition matrix (ALLOWED) rejecting illegal moves.",
              "Idempotency — the create endpoint issues a fresh id; process is guarded by state check.",
              "Retry handling — retry_available surfaces on the response; backoff would live here.",
              "Failure states are terminal — a new run requires reset (business intent, not a bug).",
              "Transaction boundaries — one persist per transition keeps the audit trail linear.",
              "Event-driven — every transition writes a PaymentSimulationEvent to Mongo.",
              "Observability — structured logs + an event timeline power the frontend visualization.",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function Card({ title, body }) {
  return (
    <div className="border border-zinc-800 bg-[#0a0a0a]">
      <div className="border-b border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00E5FF]">
        {title}
      </div>
      <ul className="divide-y divide-zinc-800">
        {body.map((line, i) => (
          <li key={i} className="flex gap-3 px-4 py-3 text-[14px] leading-relaxed text-zinc-300">
            <span className="mt-2 h-[5px] w-[5px] shrink-0 bg-zinc-500" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
