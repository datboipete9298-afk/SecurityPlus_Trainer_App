import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";

const SESS_KEY = "spt_backup_nudge_v2";

type BackupSess = {
  dismissedOnce: boolean;
  secondDone: boolean;
  signalsAtFirstDismiss: number;
};

function readSess(): BackupSess {
  try {
    const raw = sessionStorage.getItem(SESS_KEY);
    if (!raw) return { dismissedOnce: false, secondDone: false, signalsAtFirstDismiss: 0 };
    const o = JSON.parse(raw) as Partial<BackupSess>;
    return {
      dismissedOnce: !!o.dismissedOnce,
      secondDone: !!o.secondDone,
      signalsAtFirstDismiss: typeof o.signalsAtFirstDismiss === "number" ? o.signalsAtFirstDismiss : 0,
    };
  } catch {
    return { dismissedOnce: false, secondDone: false, signalsAtFirstDismiss: 0 };
  }
}

function writeSess(s: BackupSess) {
  sessionStorage.setItem(SESS_KEY, JSON.stringify(s));
}

/**
 * Soft backup reminder: first show after meaningful progress this session;
 * optional second after +8 more signals. Not tied to server — export is still manual on Progress.
 */
export default function BackupNudgeBanner() {
  const { sessionProgressSignals } = useProgress();
  const [renderKey, setRenderKey] = useState(0);
  const bump = useCallback(() => setRenderKey((t) => t + 1), []);

  const sess = readSess();
  const showFirst = sessionProgressSignals >= 1 && !sess.dismissedOnce;
  const showSecond =
    sess.dismissedOnce &&
    !sess.secondDone &&
    sess.signalsAtFirstDismiss > 0 &&
    sessionProgressSignals >= sess.signalsAtFirstDismiss + 8;
  const visible = showFirst || showSecond;

  if (!visible) return null;

  const dismiss = () => {
    if (showFirst) {
      writeSess({
        dismissedOnce: true,
        secondDone: false,
        signalsAtFirstDismiss: sessionProgressSignals,
      });
    } else {
      writeSess({ ...sess, secondDone: true });
    }
    bump();
  };

  return (
    <div
      key={renderKey}
      className="mt-6 rounded-2xl border border-cyan-800/50 bg-cyan-950/30 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      role="status"
    >
      <p className="text-sm text-slate-200 leading-relaxed">
        <strong className="text-cyan-100">Back up your progress</strong> (about 5 seconds) — exports streak, notes, and quiz history to a file you keep.
        Browsers can clear site data or you might switch devices; <strong className="text-cyan-50">without an export, that progress can be gone</strong>.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
        <Link to="/progress#backup" className="btn text-sm text-center min-h-[44px] touch-manipulation">
          Open backup →
        </Link>
        <button type="button" className="btn-ghost text-sm min-h-[44px] touch-manipulation border border-slate-700" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}
