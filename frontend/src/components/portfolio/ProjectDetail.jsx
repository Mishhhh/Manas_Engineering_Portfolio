import { useEffect, useState } from "react";
import { api, endpoints } from "@/lib/api";
import { X, Layers } from "lucide-react";

/**
 * ProjectDetail — modal-style panel showing Problem/Context/Role/Architecture/Impl/Challenges/Decisions/Lessons.
 * Includes a clickable architecture node list ("Project architecture explorer" from the engineering layer).
 */
export default function ProjectDetail({ projectId, onClose }) {
  const [proj, setProj] = useState(null);
  const [err, setErr] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (!projectId) {
      setProj(null);
      setSelectedNode(null);
      return;
    }
    api
      .get(endpoints.project(projectId))
      .then((r) => {
        setProj(r.data);
        setErr(null);
        setSelectedNode(r.data.architecture_nodes?.[0]?.id ?? null);
      })
      .catch((e) => setErr(e.message || "load failed"));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [projectId, onClose]);

  if (!projectId) return null;

  return (
    <div
      data-testid="project-detail-overlay"
      role="dialog"
      aria-label="Project detail"
      className="fixed inset-0 z-[55] flex items-stretch justify-end bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        className="ml-auto flex h-full w-full max-w-3xl flex-col border-l border-zinc-800 bg-[#080808] shadow-[inset_1px_0_0_0_rgba(255,255,255,0.04)]"
        onClick={(e) => e.stopPropagation()}
        data-testid="project-detail"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
            // project detail
          </div>
          <button
            data-testid="project-detail-close"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center border border-zinc-800 text-zinc-400 transition-colors duration-150 hover:border-zinc-600 hover:text-white"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {err && (
            <div className="p-5 font-mono text-[13px] text-[#FF3B30]">{err}</div>
          )}
          {!proj && !err && (
            <div className="p-5 font-mono text-[12px] text-zinc-500">loading…</div>
          )}
          {proj && (
            <div className="p-5 md:p-7">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                <span className="border border-zinc-800 px-1.5 py-0.5">{proj.kind}</span>
                {proj.year && <span>· {proj.year}</span>}
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
                {proj.name}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-zinc-300">{proj.summary}</p>

              <Field label="Problem" value={proj.problem} />
              <Field label="Context" value={proj.context} />
              <Field label="My Role" value={proj.role} />

              {proj.architecture_nodes?.length > 0 && (
                <div className="mt-8">
                  <SubHeader icon={Layers} label="Architecture" />
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <ul className="border border-zinc-800">
                      {proj.architecture_nodes.map((n) => (
                        <li key={n.id}>
                          <button
                            data-testid={`arch-node-${n.id}`}
                            onClick={() => setSelectedNode(n.id)}
                            className={`flex w-full items-center gap-2 border-b border-b-zinc-800 px-3 py-2 text-left transition-colors duration-150 last:border-b-0 ${
                              selectedNode === n.id
                                ? "bg-zinc-900 text-white"
                                : "text-zinc-300 hover:bg-zinc-900/50"
                            }`}
                          >
                            <span className="font-mono text-[10px] tracking-[0.22em] text-[#00E5FF]">
                              {n.role.toUpperCase()}
                            </span>
                            <span className="text-[13px]">{n.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div data-testid="arch-node-info" className="border border-zinc-800 p-3">
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                        NODE INFO
                      </div>
                      {selectedNode ? (
                        <SelectedNodeInfo
                          node={proj.architecture_nodes.find((n) => n.id === selectedNode)}
                          edges={proj.architecture_edges || []}
                        />
                      ) : (
                        <p className="mt-2 font-mono text-[12px] text-zinc-500">
                          select a node to inspect it
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {proj.technology?.length > 0 && (
                <div className="mt-6">
                  <SubHeader label="Technology" />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {proj.technology.map((t) => (
                      <span
                        key={t}
                        className="border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[11px] text-zinc-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Field label="Implementation" value={proj.implementation} />
              <ListField label="Challenges" items={proj.challenges} />
              <ListField label="Engineering Decisions" items={proj.decisions} />
              <ListField label="Lessons Learned" items={proj.lessons} />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="mt-6">
      <SubHeader label={label} />
      <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-300">{value}</p>
    </div>
  );
}

function ListField({ label, items }) {
  if (!items?.length) return null;
  return (
    <div className="mt-6">
      <SubHeader label={label} />
      <ul className="mt-2 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-[14px] text-zinc-300">
            <span className="mt-2 h-[5px] w-[5px] shrink-0 bg-zinc-500" aria-hidden />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SubHeader({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 font-mono text-[10.5px] uppercase tracking-[0.24em] text-[#00E5FF]">
      {Icon && <Icon size={12} />}
      {label}
    </div>
  );
}

function SelectedNodeInfo({ node, edges }) {
  if (!node) return null;
  const incoming = edges.filter((e) => e.to === node.id).map((e) => e.from);
  const outgoing = edges.filter((e) => e.from === node.id).map((e) => e.to);
  return (
    <div className="mt-2 space-y-2">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          {node.role}
        </div>
        <div className="mt-0.5 text-[14px] font-medium text-white">{node.label}</div>
      </div>
      <p className="text-[13px] leading-relaxed text-zinc-300">{node.description}</p>
      <div className="grid grid-cols-2 gap-2 border-t border-zinc-800 pt-2 font-mono text-[11px]">
        <div>
          <div className="text-zinc-500">↓ incoming</div>
          <div className="text-zinc-300">{incoming.join(", ") || "—"}</div>
        </div>
        <div>
          <div className="text-zinc-500">↑ outgoing</div>
          <div className="text-zinc-300">{outgoing.join(", ") || "—"}</div>
        </div>
      </div>
    </div>
  );
}
