import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/validation";
import { showDemo } from "./catalog";

export type MediaRef = { url: string; width: number; height: number; alt: string } | null;

async function mediaById(id: string | null | undefined): Promise<MediaRef> {
  if (!id) return null;
  const m = await db.media.findUnique({ where: { id } });
  if (!m || (m.isDemo && !showDemo())) return null;
  return { url: m.url, width: m.width, height: m.height, alt: m.alt };
}

export const getSiteSettings = cache(async () => {
  const s =
    (await db.siteSettings.findUnique({ where: { id: 1 } })) ??
    (await db.siteSettings.create({ data: { id: 1 } }));
  const [logo, hero, serviceImage, about1, about2] = await Promise.all([
    mediaById(s.logoId),
    mediaById(s.heroImageId),
    mediaById(s.serviceImageId),
    mediaById(s.aboutImage1Id),
    mediaById(s.aboutImage2Id),
  ]);
  const phone = s.phone ? normalizePhone(s.phone) : null;
  const whatsapp = s.whatsapp ? normalizePhone(s.whatsapp) : null;
  const fullAddress = `${s.addressLine}, ${s.postalCode} ${s.district ? `${s.district}/` : ""}${s.city}`;
  return {
    ...s,
    latitude: s.latitude == null ? null : Number(s.latitude),
    longitude: s.longitude == null ? null : Number(s.longitude),
    logo,
    hero,
    serviceImage,
    about1,
    about2,
    fullAddress,
    // Yalnızca geçerli girilmiş bilgilerden bağlantı üretilir
    phoneHref: phone ? `tel:+90${phone}` : null,
    whatsappNumber: whatsapp ? `90${whatsapp}` : null,
    emailHref: s.email ? `mailto:${s.email}` : null,
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${s.businessName}, ${fullAddress}`,
    )}`,
    mapSearchQuery: `${s.businessName}, ${fullAddress}`,
  };
});

export type SiteSettingsView = Awaited<ReturnType<typeof getSiteSettings>>;

export function whatsappLink(number: string | null, text: string): string | null {
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export const getPublishedServices = cache(async () =>
  db.serviceItem.findMany({
    where: { published: true, ...(showDemo() ? {} : { isDemo: false }) },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  }),
);

export const getSeo = cache(async (key: string) => db.seoEntry.findUnique({ where: { key } }));

export const getPage = cache(async (key: string) => db.page.findUnique({ where: { key } }));

/** Sitede gösterilecek çalışma saatleri — yalnızca panelde "sitede göster" açıksa. */
export const getPublicHours = cache(async () => {
  const settings = await db.appointmentSettings.findUnique({ where: { id: 1 } });
  if (!settings?.showHoursPublic) return null;
  const days = await db.workingDay.findMany({ orderBy: { weekday: "asc" } });
  if (days.length === 0) return null;
  return days;
});

/** Yalnızca panelde "doğrulandı" olarak işaretlenmiş yetki bilgileri. */
export const getAuthorizedBrands = cache(async () => {
  const brands = await db.brand.findMany({
    where: { OR: [{ authorizedDealer: true }, { authorizedService: true }], ...(showDemo() ? {} : { isDemo: false }) },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true, authorizedDealer: true, authorizedService: true },
  });
  return {
    dealer: brands.filter((b) => b.authorizedDealer).map((b) => b.name),
    service: brands.filter((b) => b.authorizedService).map((b) => b.name),
  };
});
