import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  if (!base) return []; // SITE_URL yapılandırılmadan URL üretilmez
  const motorcycles = await db.motorcycle.findMany({
    where: { published: true, isDemo: false },
    select: { slug: true, updatedAt: true },
  });
  const pages = ["", "/motosikletler", "/servis", "/servis-randevusu", "/hakkimizda", "/iletisim", "/kvkk", "/gizlilik", "/cerez-politikasi"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...motorcycles.map((m) => ({
      url: `${base}/motosikletler/${m.slug}`,
      lastModified: m.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
