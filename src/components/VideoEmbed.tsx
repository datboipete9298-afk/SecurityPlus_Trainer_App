export default function VideoEmbed({ embedUrl, title }: { embedUrl: string; title: string }) {
  if (!embedUrl) {
    return (
      <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-6 text-center text-amber-100/90 text-sm">
        <p className="font-semibold">No exact YouTube match for this slot yet</p>
        <p className="text-xs mt-2 text-amber-200/80">
          Use <strong className="text-amber-50">Open playlist</strong> on the lesson page, or the Messer course index. When an official 11-character id is
          confirmed for this section, it is added in <code className="text-amber-100/90">src/data/knownYoutubeIds.ts</code> — the lesson stays usable with PDFs,
          notes, and quick checks.
        </p>
      </div>
    );
  }
  return (
    <div className="relative w-full max-w-full aspect-video rounded-xl overflow-hidden border border-slate-700 bg-black shadow-lg mx-auto">
      <iframe
        title={title}
        className="absolute inset-0 w-full h-full"
        src={embedUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
