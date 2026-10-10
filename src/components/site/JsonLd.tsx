import { absoluteUrl, siteUrl } from "@/lib/seo";
import type { SiteSettingsView } from "@/server/site";
import type { MotorcycleDetail } from "@/server/catalog";

function Script({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON içinde "<" kaçışlanır; betik enjeksiyonuna izin verilmez.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const DAY_CODES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type Hours = { weekday: number; isOpen: boolean; openTime: string; closeTime: string }[] | null;

/** İşletme yapılandırılmış verisi — yalnızca panelde girilmiş/doğrulanmış alanlar. */
export function BusinessJsonLd({ settings, hours }: { settings: SiteSettingsView; hours: Hours }) {
  const base = siteUrl();
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["MotorcycleDealer", "MotorcycleRepair"],
    name: settings.businessName,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.addressLine,
      postalCode: settings.postalCode,
      addressLocality: settings.city,
      addressRegion: settings.city,
      addressCountry: "TR",
    },
  };
  if (base) data.url = base;
  if (settings.phoneHref) data.telephone = settings.phoneHref.replace("tel:", "");
  if (settings.email) data.email = settings.email;
  if (settings.latitude != null && settings.longitude != null) {
    data.geo = { "@type": "GeoCoordinates", latitude: settings.latitude, longitude: settings.longitude };
  }
  if (hours) {
    data.openingHoursSpecification = hours
      .filter((h) => h.isOpen)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DAY_CODES[h.weekday - 1],
        opens: h.openTime,
        closes: h.closeTime,
      }));
  }
  const sameAs = [settings.instagramUrl, settings.facebookUrl].filter(Boolean);
  if (sameAs.length) data.sameAs = sameAs;
  if (base && settings.hero) {
    const img = settings.hero.url.startsWith("http") ? settings.hero.url : absoluteUrl(settings.hero.url);
    if (img) data.image = img;
  }
  return <Script data={data} />;
}

const AVAILABILITY = {
  IN_STOCK: "https://schema.org/InStock",
  ON_ORDER: "https://schema.org/PreOrder",
  SOLD_OUT: "https://schema.org/OutOfStock",
} as const;

export function ProductJsonLd({ item }: { item: MotorcycleDetail }) {
  if (item.isDemo) return null; // demo ürünler için yapılandırılmış veri üretilmez
  const base = siteUrl();
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${item.brand} ${item.model}`,
    brand: { "@type": "Brand", name: item.brand },
    model: item.model,
  };
  if (item.summary) data.description = item.summary;
  if (item.category) data.category = item.category;
  if (base) {
    data.url = absoluteUrl(`/motosikletler/${item.slug}`);
    const images = item.images
      .map((i) => (i.url.startsWith("http") ? i.url : absoluteUrl(i.url)))
      .filter(Boolean);
    if (images.length) data.image = images;
  }
  if (item.priceTL != null) {
    data.offers = {
      "@type": "Offer",
      priceCurrency: "TRY",
      price: item.priceTL,
      availability: AVAILABILITY[item.stockStatus],
      ...(base ? { url: absoluteUrl(`/motosikletler/${item.slug}`) } : {}),
    };
  }
  return <Script data={data} />;
}
