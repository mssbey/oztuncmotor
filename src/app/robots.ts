import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/karsilastir"] }],
    // Alan adı tanımlanmadan mutlak sitemap adresi yayımlanmaz
    ...(base ? { sitemap: `${base}/sitemap.xml`, host: base } : {}),
  };
}
