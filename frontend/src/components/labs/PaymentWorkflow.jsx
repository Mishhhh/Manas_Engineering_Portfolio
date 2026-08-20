import { Circle, CheckCircle2, XCircle, Loader2, MinusCircle } from "lucide-react";

/**
 * PaymentWorkflow — 7-block state visualization driven off backend events.
 * PENDING (grey) → PROCESSING (cyan, spin) → SUCCESS (green) | FAILED (red) | SKIPPED (dim)
 */
const STEPS = [
  { key: "Request", label: "Payment Request" },
  { key: "Validation", label: "Validation" },
  { key: "MandateCheck", label: "Mandate / Method Check" },
  { key: "PaymentProcessing", label: "Payment Processing" },
  { key: "PaymentResult", label: "Payment Result" },
  { key: "RetryFailure", label: "Retry / Failure Handling" },
  { key: "Settlement", label: "Settlement" },
];

// Map events to a per-step outcome.
function stateOfStep(stepKey, payment, running) {
  if (!payment) return { state: "pending", meta: null };

  const events = payment.events || [];
  const stepEvents = events.filter((e) => e.step === stepKey);
  const current = payment.current_step;
  const status = payment.status;

  // If the machine already advanced past this step, decide from stepEvents.
  const anyFailed = stepEvents.some((e) => e.outcome === "failed");
  const anySuccess = stepEvents.some((e) => e.outcome === "success");
  const anyWarning = stepEvents.some((e) => e.outcome === "warning");

  if (stepKey === "Request") {
    return { state: "success", meta: null };
  }

  // PaymentResult step reflects the terminal status directly — it has no
  // per-step events by design, so we derive its visual from payment.status.
  if (stepKey === "PaymentResult") {
    if (["Succeeded", "Settled"].includes(status)) return { state: "success", meta: null };
    if (["Failed", "TimedOut"].includes(status))
      return { state: "failed", meta: payment.failure_reason };
    if (current === stepKey) return { state: "processing", meta: null };
    return { state: "pending", meta: null };
  }

  if (anyFailed) return { state: "failed", meta: payment.failure_reason };
  if (anySuccess) return { state: "success", meta: null };
  if (anyWarning) return { state: "warning", meta: null };

  // Currently on this step?
  if (current === stepKey) {
    return { state: running ? "processing" : "pending", meta: null };
  }

  // Retry & Settlement can be legitimately skipped depending on scenario.
  if (stepKey === "RetryFailure") {
    // Only reached if retry was scheduled — otherwise skipped after payment resolves.
    const resolved = ["Succeeded", "Settled", "Failed", "TimedOut"].includes(status);
    return { state: resolved ? "skipped" : "pending", meta: null };
  }
  if (stepKey === "Settlement") {
    if (status === "Settled") return { state: "success", meta: null };
    if (["Failed", "TimedOut"].includes(status)) return { state: "skipped", meta: null };
    return { state: "pending", meta: null };
  }

  return { state: "pending", meta: null };
}

export default function PaymentWorkflow({ payment, running }) {
  return (
    <div
      data-testid="payment-workflow"
      className="border border-zinc-800 bg-[#0a0a0a]"
    >
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
          state machine · flow
        </span>
        <span
          data-testid="payment-current-status"
          className="font-mono text-[10.5px] tracking-[0.22em] text-[#00E5FF]"
        >
          {payment ? `${payment.status.toUpperCase()} · ${payment.current_step}` : "IDLE"}
        </span>
      </div>

      <ol className="grid grid-cols-1 gap-px bg-zinc-800 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {STEPS.map((s, i) => {
          const { state, meta } = stateOfStep(s.key, payment, running);
          return (
            <li
              key={s.key}
              data-testid={`workflow-step-${s.key}`}
              data-state={state}
              aria-label={`${s.label}: ${state}`}
              className="flex items-start gap-3 bg-[#0a0a0a] p-4"
            >
              <StepIcon state={state} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    #{i + 1}
                  </span>
                  <span className="text-[13.5px] font-medium text-white">{s.label}</span>
                </div>
                <div className="mt-1">
                  <StateBadge state={state} />
                  {meta && (
                    <span className="ml-2 font-mono text-[11px] text-[#FF3B30]">{meta}</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepIcon({ state }) {
  const map = {
    pending: { Icon: Circle, cls: "text-zinc-600" },
    processing: { Icon: Loader2, cls: "text-[#00E5FF] animate-spin" },
    success: { Icon: CheckCircle2, cls: "text-[#22c55e]" },
    failed: { Icon: XCircle, cls: "text-[#FF3B30]" },
    warning: { Icon: CheckCircle2, cls: "text-[#FFBF00]" },
    skipped: { Icon: MinusCircle, cls: "text-zinc-700" },
  };
  const { Icon, cls } = map[state] || map.pending;
  return (
    <div
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center ${cls}`}
      aria-hidden
    >
      <Icon size={16} />
    </div>
  );
}

function StateBadge({ state }) {
  const map = {
    pending: { text: "PENDING", cls: "border-zinc-800 text-zinc-500" },
    processing: { text: "PROCESSING", cls: "border-[#00E5FF]/60 text-[#00E5FF]" },
    success: { text: "SUCCESS", cls: "border-[#22c55e]/60 text-[#22c55e]" },
    failed: { text: "FAILED", cls: "border-[#FF3B30]/60 text-[#FF3B30]" },
    warning: { text: "RETRY QUEUED", cls: "border-[#FFBF00]/60 text-[#FFBF00]" },
    skipped: { text: "SKIPPED", cls: "border-zinc-800 text-zinc-600" },
  };
  const { text, cls } = map[state] || map.pending;
  return (
    <span
      className={`inline-block border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] ${cls}`}
    >
      {text}
    </span>
  );
}
