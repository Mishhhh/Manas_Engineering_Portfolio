import { CheckCircle2, XCircle, Clock } from "lucide-react";

const CFG = {
  Settled: { color: "#22c55e", Icon: CheckCircle2, title: "PAYMENT SUCCESSFUL", banner: "SETTLED" },
  Succeeded: { color: "#22c55e", Icon: CheckCircle2, title: "PAYMENT SUCCESSFUL", banner: "SUCCEEDED" },
  Failed: { color: "#FF3B30", Icon: XCircle, title: "PAYMENT FAILED", banner: "FAILED" },
  TimedOut: { color: "#FFBF00", Icon: Clock, title: "PAYMENT TIMED OUT", banner: "TIMED_OUT" },
  Processing: { color: "#00E5FF", Icon: Clock, title: "PAYMENT IN FLIGHT", banner: "PROCESSING" },
  Created: { color: "#a1a1aa", Icon: Clock, title: "PAYMENT READY", banner: "CREATED" },
  Validated: { color: "#00E5FF", Icon: Clock, title: "PAYMENT IN FLIGHT", banner: "VALIDATED" },
  MandateChecked: { color: "#00E5FF", Icon: Clock, title: "PAYMENT IN FLIGHT", banner: "MANDATE_OK" },
};

export default function PaymentResultCard({ payment }) {
  const cfg = CFG[payment.status] || CFG.Created;
  const { Icon } = cfg;
  return (
    <aside
      data-testid="payment-result-card"
      className="border border-zinc-800 bg-[#0a0a0a]"
    >
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
          result
        </span>
        <span
          className="border px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.22em]"
          style={{ color: cfg.color, borderColor: cfg.color + "66" }}
          data-testid="result-banner"
        >
          {cfg.banner}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-3">
          <Icon size={22} style={{ color: cfg.color }} />
          <h3
            className="text-lg font-semibold tracking-tight text-white md:text-xl"
            data-testid="result-title"
          >
            {cfg.title}
          </h3>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-y-3 font-mono text-[12.5px]">
          <Row label="Payment ID" value={payment.id} testid="result-payment-id" />
          <Row
            label="Amount"
            value={`${symbol(payment.currency)}${payment.amount.toFixed(2)}`}
            testid="result-amount"
          />
          <Row label="Status" value={payment.status} testid="result-status" />
          <Row
            label="Method"
            value={payment.payment_method}
            testid="result-method"
          />
          <Row
            label="Processing time"
            value={
              payment.processing_ms > 0 ? `${(payment.processing_ms / 1000).toFixed(2)}s` : "—"
            }
            testid="result-processing-ms"
          />
          <Row
            label="Events"
            value={(payment.events || []).length.toString()}
            testid="result-event-count"
          />
        </dl>

        {payment.failure_reason && (
          <div className="mt-5 border border-zinc-800 bg-black p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#FF3B30]">
              failure reason
            </div>
            <div
              data-testid="result-failure-reason"
              className="mt-1 text-[13.5px] text-zinc-200"
            >
              {payment.failure_reason}
            </div>
            <div className="mt-2 font-mono text-[11px] tracking-wide text-zinc-500">
              retry available:{" "}
              <span
                data-testid="result-retry-available"
                className={payment.retry_available ? "text-[#22c55e]" : "text-zinc-400"}
              >
                {payment.retry_available ? "Yes" : "No"}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function Row({ label, value, testid }) {
  return (
    <>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="truncate text-right text-zinc-200" data-testid={testid}>
        {value}
      </dd>
    </>
  );
}

function symbol(cur) {
  return { GBP: "£", USD: "$", EUR: "€", INR: "₹" }[cur] || `${cur} `;
}
