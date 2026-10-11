import { ArrowRight, Pin } from "@/components/icons";

/** Native lazy loading fetches the map when the location section approaches view. */
export function MapEmbed({ query, directionsUrl }: { query: string; directionsUrl: string }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed&hl=tr`;

  return (
    <div className="w-full overflow-hidden rounded-[10px] border border-line bg-white">
      <div className="relative aspect-[4/3] bg-[#e9e9e4] sm:aspect-[16/10]">
        <iframe
          title="Öztunc Motor konum haritası"
          src={src}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Pin size={18} className="shrink-0 text-accent" />
          Öztunc Motor · Düzce
        </span>
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold hover:text-accent">
          Yol Tarifi Al <ArrowRight size={16} />
        </a>
      </div>
    </div>
  );
}
