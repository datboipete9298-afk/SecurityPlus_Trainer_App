import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import { ORDERED_LESSON_IDS } from "../data/lessons";

export default function ProgressPage() {
  const { state, readiness, levelInfo, nextStep, importProgress, exportProgress, resetAllProgress } = useProgress();
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const done = state.completedLessons.filter((id) => ORDERED_LESSON_IDS.includes(id)).length;
  const total = ORDERED_LESSON_IDS.length;
  const pct = Math.min(100, Math.round((done / Math.max(total, 1)) * 100));
  const r = readiness;

  const onDownload = () => {
    const j = exportProgress();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([j], { type: "application/json" }));
    a.download = `securityplus-trainer-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onImport = () => {
    const r0 = importProgress(importText);
    if (r0.ok) {
      setImportMsg("Imported successfully. Refresh if anything looks off.");
      setImportText("");
    } else {
      setImportMsg(`Failed: ${r0.error}`);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="h1">Progress</h1>
      <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
        Stats, domains, and backup — your Continue target is still the system queue. On each phone or computer, progress stays in{" "}
        <strong className="text-slate-300">that browser only</strong> unless you export/import JSON.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold text-white">Course</h2>
          <p className="text-3xl font-bold mt-2 text-emerald-400">{pct}%</p>
          <p className="text-slate-400 text-sm">
            {done} / {total} lessons (Messer order)
          </p>
          <p className="text-slate-500 text-sm mt-2">
            🔥 {state.streak} day streak · {state.xp} XP · {levelInfo.name} (next tier {levelInfo.next} XP)
          </p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-white">Exam readiness</h2>
          <p className="text-3xl font-bold mt-2 text-white">{r.score}</p>
          <p className="text-slate-400 capitalize">{r.label.replace("_", " ")}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-white mb-3">Domains</h2>
        <ul className="space-y-2 text-sm">
          {Object.entries(state.domainScore).map(([d, v]) => (
            <li key={d} className="flex justify-between gap-4 text-slate-300">
              <span>Domain {d}</span>
              <span className={v < 50 ? "text-rose-300" : "text-slate-200"}>{v} / 100</span>
            </li>
          ))}
        </ul>
        <Link to="/weak" className="btn mt-4 w-full sm:w-auto text-center">
          Open weak areas
        </Link>
      </div>

      <div className="card border-slate-700">
        <h2 className="font-semibold text-white">Backup &amp; restore</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-lg">
          Export a JSON file of this device’s progress. No data is sent to a server. Import merges through the same migration path as localStorage — duplicate exports are
          safe; missing fields are filled with defaults.
        </p>
        <div className="mt-3 flex flex-col sm:flex-row sm:flex-wrap gap-2">
          <button type="button" className="btn" onClick={onDownload}>
            Export progress (download JSON)
          </button>
          <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
            Import from file…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Select backup JSON file"
            title="Select backup JSON file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const rdr = new FileReader();
              rdr.onload = () => {
                setImportText(String(rdr.result ?? ""));
                setImportMsg("File loaded — review below, then Import.");
              };
              rdr.readAsText(f);
              e.target.value = "";
            }}
          />
        </div>
        <label className="block text-xs text-slate-500 mt-4 mb-1">Or paste JSON</label>
        <textarea
          className="w-full min-h-[120px] bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="{ ... }"
        />
        <div className="mt-2 flex flex-col sm:flex-row gap-2">
          <button type="button" className="btn text-sm" onClick={onImport} disabled={!importText.trim()}>
            Import backup (replace progress on this device)
          </button>
        </div>
        {importMsg && <p className="text-sm mt-2 text-amber-200/90">{importMsg}</p>}
        <p className="text-xs text-rose-300/80 mt-4 border-t border-slate-800 pt-3">
          <button type="button" className="underline hover:text-rose-200" onClick={resetAllProgress}>
            Reset all progress on this device
          </button>{" "}
          (asks for confirmation)
        </p>
      </div>

      <div className="card border-emerald-800/40">
        <p className="text-xs text-emerald-200/80 uppercase">Next system action</p>
        <Link to={nextStep.href} className="btn mt-2 inline-block w-full sm:w-auto text-center">
          {nextStep.buttonLabel} →
        </Link>
      </div>
    </div>
  );
}
