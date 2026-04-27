import { useCallback, useEffect, useState } from "react";
import type { PdfGuideSection } from "../../types/pdfLibrary";

type SpeechRec = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  onresult: ((ev: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type Props = {
  guide: PdfGuideSection;
};

export default function VoiceExplainPanel({ guide }: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<string[]>([]);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window));
  }, []);

  const analyze = useCallback(
    (text: string) => {
      const t = text.toLowerCase();
      const out: string[] = [];
      const keywords = [...guide.keyConcepts, ...guide.mustHighlight.map((m) => m.split(":")[0] ?? m)].map((k) => k.toLowerCase());
      let hits = 0;
      for (const k of keywords) {
        const frag = k.slice(0, 12);
        if (frag.length > 3 && t.includes(frag)) hits++;
      }
      if (text.trim().length < 25) out.push("Too short — try 2–3 sentences: definition, example, why the exam cares.");
      else if (hits >= 2) out.push("Nice — you referenced multiple hooks from this section.");
      else out.push("Add one keyword from “Must mirror” or “Key concepts” in your own words.");
      if (/i don't know|not sure|uh/i.test(t)) out.push("Replace hedging with one concrete fact from the guide summary.");
      setFeedback(out);
    },
    [guide],
  );

  const start = () => {
    const W = window as unknown as { webkitSpeechRecognition?: new () => SpeechRec; SpeechRecognition?: new () => SpeechRec };
    const WSR = W.webkitSpeechRecognition || W.SpeechRecognition;
    if (!WSR) return;
    const rec = new WSR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (ev: { results: { 0: { 0: { transcript: string } } } }) => {
      const said = ev.results[0][0].transcript;
      setTranscript(said);
      analyze(said);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    setFeedback([]);
    rec.start();
  };

  if (!supported) {
    return (
      <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-xs text-slate-400">
        Voice explain uses the browser speech API (Chrome / Edge). On this device it isn’t available — use the AI tutor or type a short
        explanation instead.
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-indigo-800/40 bg-indigo-950/20 p-4 space-y-2">
      <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-wide">Voice explain (talk-back)</h3>
      <p className="text-xs text-slate-400">Explain this section out loud in ~20–40 seconds. You get fast on-device pattern feedback (not a grade).</p>
      <button type="button" className="btn text-sm min-h-[44px] touch-manipulation" disabled={listening} onClick={start}>
        {listening ? "Listening…" : "Start speaking"}
      </button>
      {transcript && (
        <div className="text-xs text-slate-200 rounded-lg border border-slate-700 p-2 mt-2">
          <span className="text-slate-500">You said: </span>
          {transcript}
        </div>
      )}
      {feedback.length > 0 && (
        <ul className="list-disc pl-4 text-xs text-indigo-100/90 space-y-1">
          {feedback.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
