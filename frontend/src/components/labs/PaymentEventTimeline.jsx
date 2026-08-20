const OUTCOME = {
  info: { color: "#a1a1aa", label: "INFO" },
  success: { color: "#22c55e", label: "OK" },
  failed: { color: "#FF3B30", label: "FAIL" },
  warning: { color: "#FFBF00", label: "WARN" },
};

/** Per-event timeline. Ordered by insertion (timestamp ascending). */
export default function PaymentEventTimeline({ events }) {
  const list = events || [];
  return (
    <div
      data-testid="payment-event-timeline"
      className="border border-zinc-800 bg-[#0a0a0a]"
    >
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
          event history
        </span>
        <span
          data-testid="event-count"
          className="font-mono text-[10.5px] tracking-[0.22em] text-zinc-500"
        >
          {list.length} events
        </span>
      </div>
      <ol className="divide-y divide-zinc-800">
        {list.length === 0 && (
          <li className="p-4 font-mono text-[12px] text-zinc-500">
            no events yet — click Process Payment
          </li>
        )}
        {list.map((e, i) => {
          const o = OUTCOME[e.outcome] || OUTCOME.info;
          const t = e.timestamp?.slice(11, 19) || "";
          return (
            <li
              key={e.id || i}
              data-testid={`event-row-${i}`}
              className="grid grid-cols-[88px_60px_1fr] items-baseline gap-3 px-4 py-2.5 font-mono text-[12.5px]"
            >
              <span className="tabular-nums text-zinc-500">{t}</span>
              <span
                className="border px-1.5 py-0.5 text-center text-[10px] uppercase tracking-widest"
                style={{ color: o.color, borderColor: o.color + "66" }}
              >
                {o.label}
              </span>
              <span className="min-w-0 truncate text-zinc-200">
                <span className="text-[#00E5FF]">{e.event_type}</span>{" "}
                <span className="text-zinc-400">— {e.message}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
