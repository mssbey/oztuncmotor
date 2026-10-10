/** Panelde satır sonu ile girilen başlıkları satır satır gösterir; nokta kırmızı vurgulanır. */
export function MultilineTitle({ text, accentDots = true }: { text: string; accentDots?: boolean }) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return (
    <>
      {lines.map((line, i) => {
        const endsWithDot = accentDots && line.endsWith(".");
        return (
          <span key={i} className="block">
            {endsWithDot ? line.slice(0, -1) : line}
            {endsWithDot && <span className="text-accent">.</span>}
          </span>
        );
      })}
    </>
  );
}
