/**
 * Müşteri önizlemesi için sitenin statik kopyasını üretir (veritabanı/sunucu gerektirmez).
 *
 *   STATIC_PREVIEW=1 npm run build
 *   npx next start -p 3210            (ayrı terminalde, yerel veritabanı açıkken)
 *   npx tsx scripts/static-preview.ts
 *
 * Çıktı: preview/ klasörü ve kökteki vercel.json (Vercel bu klasörü statik olarak yayınlar).
 * - Sorgu parametreli sayfalar (tekli katalog filtreleri, ikili karşılaştırmalar, randevu işlemi)
 *   önceden üretilir ve vercel.json rewrite kurallarıyla eşlenir.
 * - Form gönderimleri tarayıcıda taklit edilir; hiçbir veri kaydedilmez.
 * Gerçek (veritabanlı) yayına geçerken kökteki vercel.json silinmelidir.
 */
import "dotenv/config";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const BASE = process.env.PREVIEW_SOURCE_URL ?? "http://localhost:3210";
const ROOT = process.cwd();
const OUT = path.join(ROOT, "preview");

const CATALOG_KEYS = ["q", "marka", "kategori", "tip", "hacim", "stok", "min", "max", "sira"];
const SKIP_PREFIXES = ["/admin", "/api", "/_next", "/media", "/og", "/_v"];

// Formları ve API çağrılarını tarayıcıda taklit eder (önizlemede veri kaydedilmez).
const SHIM = `<script>(function(){var f=window.fetch;window.fetch=function(i,o){var u=typeof i==="string"?i:(i&&i.url)||"";try{u=new URL(u,location.href).pathname}catch(e){}if(u==="/api/inquiries"||u==="/api/appointments"){var b={};try{b=JSON.parse((o&&o.body)||"{}")}catch(e){}var r="ONIZLEME-"+Math.random().toString(36).slice(2,7).toUpperCase();var d=u==="/api/appointments"?{ok:true,reference:r,date:b.date,time:b.time}:{ok:true,reference:r};return new Promise(function(res){setTimeout(function(){res(new Response(JSON.stringify(d),{status:201,headers:{"Content-Type":"application/json"}}))},500)})}if(u.indexOf("/api/")===0){return Promise.resolve(new Response("{}",{status:404}))}return f.apply(this,arguments)}})();</script>`;

type Variant = { source: string; has: Record<string, string>; missing: string[]; url: string; file: string };

const pages = new Map<string, string>(); // yol -> html
const media = new Set<string>();

async function fetchPage(url: string): Promise<{ status: number; html: string } | null> {
  const res = await fetch(BASE + url, { redirect: "manual" });
  if (res.status >= 300 && res.status < 400) return null;
  return { status: res.status, html: await res.text() };
}

function collect(html: string) {
  for (const m of html.matchAll(/\/media\/[A-Za-z0-9/_.-]+\.[a-z0-9]+/g)) media.add(m[0]);
  const links: string[] = [];
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const p = m[1].replace(/\/$/, "") || "/";
    if (!SKIP_PREFIXES.some((s) => p === s || p.startsWith(s + "/")) && !/\.[a-z0-9]+$/i.test(p)) links.push(p);
  }
  return links;
}

function finalize(html: string) {
  return html.replace(/<head([^>]*)>/, `<head$1>${SHIM}<meta name="robots" content="noindex, nofollow">`);
}

async function save(rel: string, html: string) {
  const file = path.join(OUT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, finalize(html));
}

async function main() {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const [brands, categories, bikes, services] = await Promise.all([
    db.brand.findMany({ where: { isDemo: false }, select: { slug: true } }),
    db.category.findMany({ where: { isDemo: false, published: true }, select: { slug: true } }),
    db.motorcycle.findMany({ where: { isDemo: false, published: true }, select: { slug: true } }),
    db.serviceItem.findMany({ where: { isDemo: false, published: true, bookable: true }, select: { id: true } }),
  ]);
  await db.$disconnect();

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await cp(path.join(ROOT, ".next/static"), path.join(OUT, "_next/static"), { recursive: true });
  if (existsSync(path.join(ROOT, "public"))) await cp(path.join(ROOT, "public"), OUT, { recursive: true });
  await cp(path.join(ROOT, "src/app/favicon.ico"), path.join(OUT, "favicon.ico"));

  // 1) Bağlantıları izleyerek tüm sayfaları gez
  const queue = ["/", "/motosikletler", "/karsilastir", "/servis-randevusu", ...bikes.map((b) => `/motosikletler/${b.slug}`)];
  const seen = new Set<string>();
  while (queue.length) {
    const p = queue.shift()!;
    if (seen.has(p)) continue;
    seen.add(p);
    const r = await fetchPage(p);
    if (!r || r.status !== 200) {
      console.warn(`atlandı ${p} (${r?.status ?? "yönlendirme"})`);
      continue;
    }
    pages.set(p, r.html);
    queue.push(...collect(r.html));
  }

  // 2) Sorgu parametreli varyantlar
  const variants: Variant[] = [];
  const catalogVariant = (key: string, value: string) =>
    variants.push({
      source: "/motosikletler",
      has: { [key]: `^${value}$` },
      missing: CATALOG_KEYS.filter((k) => k !== key),
      url: `/motosikletler?${key}=${value}`,
      file: `/_v/motosikletler-${key}-${value}.html`,
    });
  for (const b of brands) catalogVariant("marka", b.slug);
  for (const c of categories) catalogVariant("kategori", c.slug);
  for (const v of ["benzinli", "elektrikli"]) catalogVariant("tip", v);
  for (const v of ["0-125", "126-250", "251-500", "501-900", "901-"]) catalogVariant("hacim", v);
  for (const v of ["stokta", "siparis", "tukendi"]) catalogVariant("stok", v);
  for (const v of ["fiyat-artan", "fiyat-azalan", "yeni"]) catalogVariant("sira", v);

  const slugs = bikes.map((b) => b.slug);
  for (const a of slugs)
    variants.push({ source: "/karsilastir", has: { modeller: `^${a}$` }, missing: [], url: `/karsilastir?modeller=${a}`, file: `/_v/karsilastir-${a}.html` });
  for (let i = 0; i < slugs.length; i++)
    for (let j = i + 1; j < slugs.length; j++) {
      const [a, b] = [slugs[i], slugs[j]];
      variants.push({
        source: "/karsilastir",
        has: { modeller: `^(${a}(,|%2C)${b}|${b}(,|%2C)${a})$` },
        missing: [],
        url: `/karsilastir?modeller=${a},${b}`,
        file: `/_v/karsilastir-${a}--${b}.html`,
      });
    }
  for (const s of services)
    variants.push({ source: "/servis-randevusu", has: { islem: `^${s.id}$` }, missing: [], url: `/servis-randevusu?islem=${s.id}`, file: `/_v/servis-randevusu-${s.id}.html` });

  for (const v of variants) {
    const r = await fetchPage(v.url);
    if (!r || r.status !== 200) throw new Error(`varyant alınamadı: ${v.url}`);
    collect(r.html);
    await save(v.file, r.html);
  }

  // 3) Sayfaları yaz. Varyantı olan yollar dosya sisteminde olmamalı ki rewrite kuralları çalışsın.
  const rewritten = new Set(variants.map((v) => v.source));
  for (const [p, html] of pages) {
    const rel = rewritten.has(p) ? `/_v/${p.slice(1)}.html` : p === "/" ? "/index.html" : `${p}.html`;
    await save(rel, html);
  }
  const notFound = await fetch(BASE + "/bu-sayfa-bulunamadi-onizleme");
  const notFoundHtml = await notFound.text();
  collect(notFoundHtml);
  await save("/404.html", notFoundHtml);

  // 4) Görseller
  for (const m of media) {
    const res = await fetch(BASE + m);
    if (!res.ok) {
      console.warn(`görsel yok ${m}`);
      continue;
    }
    const file = path.join(OUT, m);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
  }

  await writeFile(path.join(OUT, "robots.txt"), "User-agent: *\nDisallow: /\n");

  // 5) vercel.json
  const rewrites = [
    ...variants.map((v) => ({
      source: v.source,
      has: Object.entries(v.has).map(([key, value]) => ({ type: "query", key, value })),
      ...(v.missing.length ? { missing: v.missing.map((key) => ({ type: "query", key })) } : {}),
      destination: v.file.replace(/.html$/, ""), // cleanUrls: hedef uzantısız olmalı
    })),
    ...[...rewritten].map((p) => ({ source: p, destination: `/_v/${p.slice(1)}` })),
  ];
  const vercel = {
    $schema: "https://openapi.vercel.sh/vercel.json",
    framework: null,
    installCommand: "echo statik-onizleme",
    buildCommand: "echo statik-onizleme",
    outputDirectory: "preview",
    cleanUrls: true,
    trailingSlash: false,
    headers: [
      { source: "/(.*)", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/_next/static/(.*)", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ],
    rewrites,
  };
  await writeFile(path.join(ROOT, "vercel.json"), JSON.stringify(vercel, null, 2) + "\n");

  console.log(`${pages.size} sayfa, ${variants.length} varyant, ${media.size} görsel, ${rewrites.length} rewrite`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
