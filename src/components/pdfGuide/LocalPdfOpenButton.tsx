import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPdfObjectUrl, hasRequiredPdf, isIndexedDbAvailable } from "../../utils/localPdfStore";
import { subscribePdfStorageChanged } from "../../utils/pdfStorageBroadcast";

type Props = {
  pdfId: string;
  /** Optional deep link hint (many browsers ignore #page= for blob URLs — still harmless). */
  page?: number;
  className?: string;
  children?: React.ReactNode;
  variant?: "btn" | "btn-ghost";
};

export default function LocalPdfOpenButton({ pdfId, page, className = "", children, variant = "btn" }: Props) {
  const navigate = useNavigate();
  const [ready, setReady] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (!isIndexedDbAvailable()) {
        setReady(false);
        return;
      }
      void hasRequiredPdf(pdfId).then((y) => {
        if (!cancelled) setReady(y);
      });
    };
    refresh();
    const onFocus = () => refresh();
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    const unsubBc = subscribePdfStorageChanged(refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      unsubBc();
    };
  }, [pdfId]);

  const open = useCallback(async () => {
    setErr(null);
    if (!isIndexedDbAvailable()) {
      setErr("This browser blocked IndexedDB. Try another browser or turn off private mode.");
      return;
    }
    setBusy(true);
    try {
      const has = await hasRequiredPdf(pdfId);
      if (!has) {
        navigate(`/pdf-setup?need=${encodeURIComponent(pdfId)}`);
        return;
      }
      const url = await getPdfObjectUrl(pdfId);
      if (!url) {
        setErr("Could not read the saved PDF — try removing it and adding again.");
        return;
      }
      const withHash = page && page > 0 ? `${url}#page=${page}` : url;
      window.open(withHash, "_blank", "noopener,noreferrer");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "open_failed";
      if (msg === "quota_exceeded") {
        setErr("Browser storage is full. Free space or remove an old PDF, then try again.");
      } else {
        setErr("Something went wrong opening the PDF. Try again or re-add the file.");
      }
    } finally {
      setBusy(false);
    }
  }, [navigate, pdfId, page]);

  const cls = variant === "btn-ghost" ? `btn-ghost border border-slate-600 ${className}` : `btn ${className}`;

  if (ready === null) {
    return (
      <button type="button" className={`${cls} min-h-[44px] touch-manipulation opacity-70`} disabled>
        Checking PDF…
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <button type="button" className={`${cls} min-h-[44px] touch-manipulation`} disabled={busy} onClick={() => void open()}>
        {busy ? "Opening…" : children ?? "Open local PDF"}
      </button>
      {err && <p className="text-xs text-amber-200/90">{err}</p>}
    </div>
  );
}
