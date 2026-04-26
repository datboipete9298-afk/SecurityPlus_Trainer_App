export default function VideoEmbed({ embedUrl, title }: { embedUrl: string; title: string }) {
  if (!embedUrl) {
    return (
      <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-6 text-center text-amber-100/90 text-sm">
        <p className="font-semibold">Video link needs verification</p>
        <p className="text-xs mt-2 text-amber-200/80">No official YouTube id is mapped for this section yet. Add it in `src/data/knownYoutubeIds.ts` from the public Messer playlist, or use Open YouTube / course index on the lesson page.</p>
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
