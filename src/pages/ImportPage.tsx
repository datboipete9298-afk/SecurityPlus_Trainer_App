import { useMemo, useState } from "react";
import type { Lesson } from "../types";

const REQUIRED: (keyof Lesson)[] = [
  "id",
  "title",
  "domain",
  "order",
  "hasFullContent",
  "videoFocus",
  "simpleExplanation",
  "highlightRules",
  "writeDown",
  "examTraps",
  "instantRecognition",
  "threeSecondRecall",
  "quickAction",
  "miniQuizIntro",
  "teachBackPrompt",
];

function validate(obj: unknown): { ok: boolean; missing: string[]; lesson?: Lesson } {
  if (!obj || typeof obj !== "object") return { ok: false, missing: ["(root must be a JSON object)"] };
  const o = obj as Record<string, unknown>;
  const missing: string[] = [];
  for (const k of REQUIRED) {
    if (o[k] === undefined || o[k] === null) missing.push(String(k));
  }
  if (o.highlightRules && !Array.isArray(o.highlightRules)) missing.push("highlightRules (array)");
  if (o.examTraps && !Array.isArray(o.examTraps)) missing.push("examTraps (array)");
  if (o.videoFocus && !Array.isArray(o.videoFocus)) missing.push("videoFocus (array)");
  return { ok: missing.length === 0, missing, lesson: missing.length ? undefined : (o as unknown as Lesson) };
}

function toTsLiteral(lesson: Lesson): string {
  return `  "${lesson.id}": ${JSON.stringify(lesson, null, 2).replace(/"([^"]+)":/g, '"$1":')},`;
}

export default function ImportPage() {
  const [raw, setRaw] = useState("");

  const parsed = useMemo(() => {
    if (!raw.trim()) return { err: null as string | null, result: null as ReturnType<typeof validate> | null };
    try {
      const j = JSON.parse(raw) as unknown;
      return { err: null, result: validate(j) };
    } catch (e) {
      return { err: e instanceof Error ? e.message : "Invalid JSON", result: null };
    }
  }, [raw]);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="h1">Content import (validator)</h1>
      <p className="text-slate-400 text-sm">
        Paste a <strong className="text-slate-200">single lesson object</strong> as JSON. The app checks required fields, shows a quick preview, and gives copy-ready text you can drop into <code className="text-amber-300">src/data/lessons</code> merge code.
      </p>

      <div className="card">
        <label className="text-sm text-slate-400">Lesson JSON</label>
        <textarea
          className="mt-2 w-full min-h-[200px] bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-mono text-slate-200"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder='{ "id": "1-1", "title": "...", ... }'
        />
        {parsed.err && <p className="text-rose-400 text-sm mt-2">JSON parse: {parsed.err}</p>}
        {raw.trim() && !parsed.err && parsed.result && (
          <div className="mt-3 space-y-2">
            <p className={parsed.result.ok ? "text-emerald-400 font-semibold" : "text-amber-300 font-semibold"}>
              {parsed.result.ok ? "Valid — all required fields present" : "Invalid — missing or wrong shape"}
            </p>
            {!parsed.result.ok && parsed.result.missing.length > 0 && (
              <ul className="text-sm text-rose-200/90 list-disc pl-4">
                {parsed.result.missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
            {parsed.result.lesson && (
              <div className="text-sm text-slate-300 border border-slate-700 rounded-lg p-3 bg-slate-950/80">
                <p>
                  <strong className="text-white">{parsed.result.lesson.title}</strong> · domain {parsed.result.lesson.domain} · order{" "}
                  {parsed.result.lesson.order}
                </p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-3">{parsed.result.lesson.simpleExplanation}</p>
              </div>
            )}
            {parsed.result.lesson && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Copy for lessons merge (one entry)</p>
                <pre className="text-xs text-slate-300 overflow-x-auto p-3 bg-slate-950 rounded-xl border border-slate-800 max-h-64 overflow-y-auto">
                  {toTsLiteral(parsed.result.lesson)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
