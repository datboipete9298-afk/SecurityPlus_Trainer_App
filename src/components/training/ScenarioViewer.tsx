export default function ScenarioViewer({ text, title }: { text: string; title?: string }) {
  return (
    <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-slate-200 leading-relaxed">
      {title && <p className="text-xs text-amber-300/90 font-semibold uppercase mb-2">{title}</p>}
      <p className="whitespace-pre-wrap">{text}</p>
    </div>
  );
}
