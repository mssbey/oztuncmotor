import type { Metadata } from "next";

/** Yapılandırılmış alan adı. Boşsa canonical / mutlak URL üretilmez. */
export function siteUrl(): string | null {
  const raw = process.env.SITE_URL?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

export function absoluteUrl(path: string): string | null {
  const base = siteUrl();
  return base ? `${base}${path.startsWith("/") ? path : `/${path}`}` : null;
}

export function buildMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: { url: string; width?: number; height?: number; alt?: string } | null;
  noindex?: boolean;
}): Metadata {
  const canonical = absoluteUrl(opts.path);
  const image = opts.image ?? { url: "/og", width: 1200, height: 630, alt: "Öztunç Motor" };
  const imageUrl = image.url.startsWith("http") ? image.url : absoluteUrl(image.url);
  return {
    title: opts.title,
    description: opts.description,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: "Öztunç Motor",
      title: opts.title,
      description: opts.description,
      ...(canonical ? { url: canonical } : {}),
      ...(imageUrl
        ? { images: [{ url: imageUrl, width: image.width, height: image.height, alt: image.alt }] }
        : {}),
    },
    twitter: { card: imageUrl ? "summary_large_image" : "summary", title: opts.title, description: opts.description },
    ...(opts.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
