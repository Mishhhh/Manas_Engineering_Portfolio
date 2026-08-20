import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/portfolio/Layout";
import SectionHeader from "@/components/portfolio/SectionHeader";
import { api } from "@/lib/api";
import { Play, Lightbulb, Eye, RefreshCcw, BookOpen, Clock, CheckCircle2, XCircle, ChevronRight, ChevronDown, Database, GraduationCap, Timer, AlertTriangle } from "lucide-react";

const DIFF_COLOR = { Easy: "#22c55e", Medium: "#00E5FF", Hard: "#FFBF00", Expert: "#FF3B30" };

export default function SqlArenaPage() {
  const [schema, setSchema] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [sql, setSql] = useState("SELECT * FROM Payments LIMIT 10");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [difficulty, setDifficulty] = useState("All");
  const [mode, setMode] = useState("Learning"); // Learning | Interview
  const [hints, setHints] = useState([]);
  const [solution, setSolution] = useState(null);
  const [submitState, setSubmitState] = useState(null);
  const [expanded, setExpanded] = useState(new Set());
  const [timerStart, setTimerStart] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [progress, setProgress] = useState(() => JSON.parse(localStorage.getItem("sqlArenaProgress") || "{}"));

  useEffect(() => {
    api.get("/sql-arena/schema").then((r) => setSchema(r.data));
    api.get("/sql-arena/challenges").then((r) => setChallenges(r.data));
  }, []);

  useEffect(() => {
    if (mode !== "Interview" || !timerStart) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [mode, timerStart]);

  const filtered = useMemo(() => {
    if (difficulty === "All") return challenges;
    return challenges.filter((c) => c.difficulty === difficulty);
  }, [challenges, difficulty]);

  const stats = useMemo(() => {
    const done = Object.values(progress).filter((p) => p?.correct).length;
    const total = challenges.length || 12;
    const attempted = Object.keys(progress).length;
    return { done, total, attempted, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [progress, challenges]);

  const openChallenge = async (cid) => {
    setActiveId(cid);
    setSubmitState(null);
    setHints([]);
    setSolution(null);
    setResult(null);
    const r = await api.get(`/sql-arena/challenges/${cid}`);
    setDetail(r.data);
    // Reset the editor to a runnable starter — the challenge title/description
    // live in the right-hand panel, not injected into the editor. The arena
    // guard rejects SQL comments, so prose-in-editor would be un-runnable.
    setSql("SELECT * FROM Payments LIMIT 10");
    if (mode === "Interview") setTimerStart(Date.now());
  };

  const runSql = async () => {
    setRunning(true);
    setSubmitState(null);
    try {
      const r = await api.post("/sql-arena/execute", { sql });
      setResult(r.data);
    } catch (e) {
      setResult({ ok: false, error: e.message, columns: [], rows: [], rowCount: 0, executionMs: 0 });
    } finally {
      setRunning(false);
    }
  };

  const submitChallenge = async () => {
    if (!activeId) return;
    setRunning(true);
    try {
      const r = await api.post(`/sql-arena/challenges/${activeId}/submit`, { sql });
      setSubmitState(r.data);
      setResult(r.data.execution);
      // Track progress locally
      const next = { ...progress, [activeId]: { correct: r.data.correct, at: Date.now() } };
      setProgress(next);
      localStorage.setItem("sqlArenaProgress", JSON.stringify(next));
    } finally {
      setRunning(false);
    }
  };

  const revealHint = async () => {
    if (!activeId) return;
    const idx = hints.length;
    if (idx >= (detail?.hintCount ?? 0)) return;
    const r = await api.get(`/sql-arena/challenges/${activeId}/hint`, { params: { index: idx } });
    setHints((h) => [...h, r.data.hint]);
  };

  const revealSolution = async () => {
    if (!activeId) return;
    const r = await api.get(`/sql-arena/challenges/${activeId}/solution`);
    setSolution(r.data);
  };

  const toggleTable = (name) => {
    setExpanded((s) => {
      const n = new Set(s);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });
  };

  const elapsed = timerStart ? Math.floor((nowTick - timerStart) / 1000) : 0;

  return (
    <Layout>
      <div data-testid="sql-arena-page">
        <section className="relative overflow-hidden border-b border-zinc-800">
          <div className="eng-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div className="relative mx-auto max-w-[1440px] px-6 py-12">
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#00E5FF]">/labs / sql-arena</div>
            <h1 className="mt-3 font-bold tracking-tight text-white text-4xl sm:text-5xl">SQL Arena</h1>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-zinc-300 md:text-lg">
              Sandboxed SQLite payments schema. Read-only. 12 curated challenges from filtering to window functions.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <div className="inline-flex border border-zinc-800">
                {["All", "Easy", "Medium", "Hard", "Expert"].map((d) => (
                  <button
                    key={d}
                    data-testid={`filter-${d}`}
                    onClick={() => setDifficulty(d)}
                    className={`border-r border-zinc-800 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors duration-150 last:border-r-0 ${difficulty === d ? "bg-white text-black" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}
                  >{d}</button>
                ))}
              </div>
              <div className="inline-flex border border-zinc-800">
                {["Learning", "Interview"].map((m) => (
                  <button
                    key={m}
                    data-testid={`mode-${m}`}
                    onClick={() => { setMode(m); setHints([]); setSolution(null); if (m === "Interview" && activeId) setTimerStart(Date.now()); }}
                    className={`border-r border-zinc-800 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] last:border-r-0 ${mode === m ? "bg-white text-black" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}
                  >
                    {m === "Learning" ? <GraduationCap size={11} className="mr-1 inline" /> : <Timer size={11} className="mr-1 inline" />}
                    {m}
                  </button>
                ))}
              </div>
              <div data-testid="progress-widget" className="border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-[11px] tracking-wide text-zinc-300">
                {stats.done}/{stats.total} · {stats.pct}%
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-zinc-800 bg-[#070707]">
          <div className="mx-auto max-w-[1440px] px-6 py-8 lg:py-12">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

              {/* LEFT — schema + challenges */}
              <aside className="lg:col-span-3">
                <div className="border border-zinc-800 bg-[#0a0a0a]">
                  <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
                    <Database size={12} /> schema
                  </div>
                  <ul data-testid="schema-explorer" className="divide-y divide-zinc-800">
                    {schema.map((t) => (
                      <li key={t.name}>
                        <button onClick={() => toggleTable(t.name)} data-testid={`schema-table-${t.name}`} className="flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-[12px] text-zinc-200 hover:bg-zinc-900/60">
                          {expanded.has(t.name) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          <span className="text-[#00E5FF]">{t.name}</span>
                          <span className="ml-auto text-[10px] tracking-widest text-zinc-500">{t.columns.length}c</span>
                        </button>
                        {expanded.has(t.name) && (
                          <ul className="border-t border-zinc-800 bg-black/40">
                            {t.columns.map((c) => (
                              <li key={c.name} className="grid grid-cols-[1fr_auto] gap-2 px-4 py-1.5 font-mono text-[11px]">
                                <span className="text-zinc-200">{c.name}</span>
                                <span className="text-zinc-500">{c.type}{c.nullable ? "?" : ""}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 border border-zinc-800 bg-[#0a0a0a]">
                  <div className="border-b border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">challenges</div>
                  <ol data-testid="challenge-list" className="max-h-[520px] divide-y divide-zinc-800 overflow-y-auto">
                    {filtered.map((c) => {
                      const done = progress[c.id]?.correct;
                      return (
                        <li key={c.id}>
                          <button data-testid={`challenge-${c.id}`} onClick={() => openChallenge(c.id)} className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors duration-150 ${activeId === c.id ? "bg-zinc-900" : "hover:bg-zinc-900/50"}`}>
                            <span className="mt-1 h-[10px] w-[10px]" style={{ background: DIFF_COLOR[c.difficulty] }} aria-hidden />
                            <span className="flex-1">
                              <span className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500">{c.id} · {c.difficulty}</span>
                              <span className="block text-[12.5px] text-zinc-200">{c.title}</span>
                            </span>
                            {done && <CheckCircle2 size={13} className="mt-1 text-[#22c55e]" />}
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </aside>

              {/* CENTER — editor */}
              <div className="lg:col-span-6">
                <div className="border border-zinc-800 bg-[#0a0a0a]">
                  <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-500">
                    <span>sql editor · read-only sandbox</span>
                    {mode === "Interview" && activeId && (
                      <span data-testid="interview-timer" className="text-[#FFBF00]"><Clock size={11} className="mr-1 inline" /> {Math.floor(elapsed / 60).toString().padStart(2, "0")}:{(elapsed % 60).toString().padStart(2, "0")}</span>
                    )}
                  </div>
                  <textarea
                    data-testid="sql-editor"
                    value={sql}
                    onChange={(e) => setSql(e.target.value)}
                    rows={9}
                    spellCheck={false}
                    className="w-full resize-y border-0 bg-[#050505] p-4 font-mono text-[13px] leading-relaxed text-zinc-100 outline-none focus:ring-1 focus:ring-[#007AFF]"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 px-4 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button data-testid="btn-run-sql" onClick={runSql} disabled={running} className="inline-flex items-center gap-1.5 border border-white bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-black hover:bg-zinc-200 disabled:opacity-50"><Play size={11} /> Run</button>
                      {activeId && <button data-testid="btn-submit" onClick={submitChallenge} disabled={running} className="inline-flex items-center gap-1.5 border border-[#00E5FF] bg-transparent px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-[#00E5FF] hover:bg-[#00E5FF]/10 disabled:opacity-50"><CheckCircle2 size={11} /> Submit</button>}
                      <button data-testid="btn-reset-sql" onClick={() => setSql("SELECT * FROM Payments LIMIT 10")} className="inline-flex items-center gap-1.5 border border-zinc-700 bg-transparent px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-300 hover:border-[#007AFF] hover:text-white"><RefreshCcw size={11} /> Reset</button>
                    </div>
                    {activeId && mode === "Learning" && (
                      <div className="flex flex-wrap gap-2">
                        <button data-testid="btn-hint" onClick={revealHint} className="inline-flex items-center gap-1.5 border border-zinc-700 bg-transparent px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-300 hover:border-[#FFBF00] hover:text-[#FFBF00]"><Lightbulb size={11} /> Hint</button>
                        <button data-testid="btn-solution" onClick={revealSolution} className="inline-flex items-center gap-1.5 border border-zinc-700 bg-transparent px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-300 hover:border-[#00E5FF] hover:text-[#00E5FF]"><Eye size={11} /> Show Solution</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Result panel */}
                {result && (
                  <div className="mt-4 border border-zinc-800 bg-[#0a0a0a]" data-testid="sql-result">
                    <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.22em]">
                      <span className={result.ok ? "text-[#22c55e]" : "text-[#FF3B30]"}>{result.ok ? "SUCCESS" : "SQL ERROR"}</span>
                      <span className="text-zinc-500">{result.executionMs}ms · {result.rowCount} rows</span>
                    </div>
                    {!result.ok && (
                      <div className="p-4 font-mono text-[12.5px] text-[#FF3B30]" data-testid="sql-error">
                        <AlertTriangle size={12} className="mr-1 inline" /> {result.error}
                        {result.hint && <div className="mt-2 text-zinc-500">hint: {result.hint}</div>}
                      </div>
                    )}
                    {result.ok && (
                      <div className="max-h-[420px] overflow-auto">
                        <table className="w-full border-collapse font-mono text-[12px]">
                          <thead className="sticky top-0 bg-[#0a0a0a]">
                            <tr>
                              {result.columns.map((c) => (<th key={c} className="border-b border-zinc-800 px-3 py-2 text-left text-[#00E5FF]">{c}</th>))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.rows.map((row, i) => (
                              <tr key={i} data-testid={`sql-row-${i}`} className="hover:bg-zinc-900/40">
                                {row.map((v, j) => (<td key={j} className="border-b border-zinc-900 px-3 py-1.5 text-zinc-200">{v === null ? <span className="text-zinc-600">NULL</span> : String(v)}</td>))}
                              </tr>
                            ))}
                            {result.rows.length === 0 && <tr><td className="p-3 text-zinc-500" colSpan={result.columns.length}>no rows</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT — challenge + hints + solution */}
              <aside className="lg:col-span-3">
                {!detail && (
                  <div className="border border-dashed border-zinc-800 bg-[#0a0a0a] p-5 font-mono text-[12px] text-zinc-500">
                    pick a challenge from the list to see the objective
                  </div>
                )}
                {detail && (
                  <div className="border border-zinc-800 bg-[#0a0a0a]" data-testid="challenge-detail">
                    <div className="border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00E5FF]">{detail.id}</span>
                      <span className="border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: DIFF_COLOR[detail.difficulty], borderColor: DIFF_COLOR[detail.difficulty] + "66" }}>{detail.difficulty}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold tracking-tight text-white">{detail.title}</h3>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-zinc-300">{detail.description}</p>
                    </div>

                    {submitState && (
                      <div className="border-t border-zinc-800 p-4" data-testid="submit-result">
                        <div className={`flex items-center gap-2 font-mono text-[12.5px] ${submitState.correct ? "text-[#22c55e]" : "text-[#FF3B30]"}`}>
                          {submitState.correct ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {submitState.correct ? "CORRECT — well done" : `NEEDS IMPROVEMENT — ${submitState.reason || ""}`}
                        </div>
                        {!submitState.correct && submitState.expected_row_count != null && (
                          <div className="mt-1 font-mono text-[11px] text-zinc-500">expected rows: {submitState.expected_row_count} · your rows: {submitState.user_row_count}</div>
                        )}
                      </div>
                    )}

                    {mode === "Learning" && hints.length > 0 && (
                      <div className="border-t border-zinc-800 p-4" data-testid="hints-panel">
                        <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#FFBF00]"><Lightbulb size={12} /> hints ({hints.length}/{detail.hintCount})</div>
                        <ul className="mt-2 space-y-2">
                          {hints.map((h, i) => (
                            <li key={i} className="text-[13px] text-zinc-300"><span className="text-zinc-500">#{i + 1}</span> — {h}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {solution && (
                      <div className="border-t border-zinc-800 p-4" data-testid="solution-panel">
                        <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#00E5FF]"><BookOpen size={12} /> recommended solution</div>
                        <pre className="mt-2 overflow-auto whitespace-pre-wrap border border-zinc-800 bg-black p-3 font-mono text-[12px] text-zinc-100">{solution.solution}</pre>
                        <p className="mt-2 text-[12.5px] leading-relaxed text-zinc-400">{solution.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </aside>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
