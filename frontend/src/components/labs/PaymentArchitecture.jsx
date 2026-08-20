import { useState } from "react";

const LAYERS = [
  {
    id: "frontend",
    label: "Frontend (React)",
    role: "client",
    description:
      "Payment simulator page. Sends REST requests, polls the backend for state, renders the workflow + event timeline. Does NOT own state — every visual is derived from server data.",
  },
  {
    id: "api",
    label: "Payment Simulator API",
    role: "controller",
    description:
      "FastAPI router at /api/payment-simulator. Thin controllers, Pydantic DTOs, uses the shared exception envelope. Returns 201 on create, 200 on read, 422 on validation, 404 on missing.",
  },
  {
    id: "service",
    label: "Payment Service",
    role: "application",
    description:
      "PaymentSimulatorService — orchestrates the state machine, kicks off the background task and calls the persistence layer. All business logic lives here (not in the controller).",
  },
  {
    id: "machine",
    label: "Payment State Machine",
    role: "domain",
    description:
      "Explicit ALLOWED transition matrix over PaymentStatus. Illegal transitions raise a domain error. Terminal states (Settled/Failed/TimedOut) have no outgoing edges.",
  },
  {
    id: "repo",
    label: "Repository",
    role: "infrastructure",
    description:
      "Motor + Mongo collection payment_simulations. One upsert per transition keeps the audit trail linear and idempotent.",
  },
  {
    id: "db",
    label: "MongoDB (analog to SQL Server)",
    role: "database",
    description:
      "Stores each PaymentSimulation with an embedded events array. Indexed on created_at for listing. Production analog would be SQL Server with PaymentSimulation + PaymentSimulationEvent tables.",
  },
];

/**
 * PaymentArchitecture — clickable stack diagram (matches the existing
 * Architecture Explorer look & feel).
 */
export default function PaymentArchitecture() {
  const [sel, setSel] = useState(LAYERS[0].id);
  const node = LAYERS.find((l) => l.id === sel) || LAYERS[0];

  return (
    <section
      data-testid="payment-architecture-section"
      className="border-b border-zinc-800 bg-[#050505]"
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-6 py-10 lg:grid-cols-12 lg:py-14">
        <div
          data-testid="payment-arch-diagram"
          className="border border-zinc-800 bg-[#0a0a0a] lg:col-span-7"
        >
          <div className="border-b border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
            payment-simulator · stack
          </div>
          <div className="flex flex-col items-center gap-2 p-6">
            {LAYERS.map((l, i) => (
              <div key={l.id} className="flex flex-col items-center">
                <button
                  data-testid={`payment-arch-${l.id}`}
                  onClick={() => setSel(l.id)}
                  className={`w-full max-w-md border px-4 py-3 text-left transition-colors duration-150 ${
                    sel === l.id
                      ? "border-[#00E5FF] bg-zinc-900"
                      : "border-zinc-800 bg-[#0a0a0a] hover:border-zinc-600"
                  }`}
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00E5FF]">
                    {l.role}
                  </div>
                  <div className="mt-1 text-[13.5px] font-medium text-white">{l.label}</div>
                </button>
                {i < LAYERS.length - 1 && (
                  <div className="my-1 h-6 w-px bg-zinc-700" aria-hidden />
                )}
              </div>
            ))}
          </div>
        </div>

        <aside
          data-testid="payment-arch-info"
          className="border border-zinc-800 bg-black/40 lg:col-span-5"
        >
          <div className="border-b border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
            layer info
          </div>
          <div className="p-5">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00E5FF]">
              {node.role}
            </div>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-white">
              {node.label}
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-zinc-300">{node.description}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
