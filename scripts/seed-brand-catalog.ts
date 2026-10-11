/**
 * Çalışılan markaların (Yuki, Motolux) resmi kataloglarındaki modelleri kataloğa ekler.
 * Tekrar çalıştırılabilir: slug'a göre günceller, görseli olan ürünün görsellerini yeniden indirmez.
 *
 *  - Veri: prisma/content/brand-catalog.json — yukimotor.com.tr ve motolux.com.tr ürün sayfalarından
 *    derlenmiş teknik değerler, renkler ve ürün görselleri (üreticinin bayilere sunduğu katalog görselleri).
 *  - Fiyat girilmez (priceTL = null) ve stok "Sipariş üzerine" eklenir; gerçek fiyat/stok panelden girilir.
 *  - Yetkili satıcı/servis işaretleri açılmaz; işletme panelden doğrular.
 *  - Diğer markaların ürünleri silinmez, yalnızca sıralamada bu markaların arkasına alınır.
 *
 * Çalıştırma: npx tsx scripts/seed-brand-catalog.ts
 */
import "dotenv/config";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./storage/uploads");
const UA = { "User-Agent": "Mozilla/5.0 (OztuncMotorCatalog/1.0; katalog içe aktarma)" };

const BRANDS = [
  { name: "Yuki", slug: "yuki", sortOrder: 0 },
  { name: "Motolux", slug: "motolux", sortOrder: 1 },
];

const CATEGORIES = [
  { slug: "scooter", name: "Scooter", description: "50 cc’den maxi scooter’a, şehir içi ulaşım için pratik ve ekonomik." },
  { slug: "elektrikli", name: "Elektrikli Scooter", description: "Prizden şarj, sessiz ve yakıtsız şehir ulaşımı." },
  { slug: "cub", name: "Cub", description: "Debriyajsız kullanım, düşük yakıt tüketimi, dayanıklı yapı." },
  { slug: "sehir", name: "Naked, Sport & Chopper", description: "Günlük kullanımda çevik, hafta sonu yollarında keyifli." },
  { slug: "touring", name: "Adventure & Touring", description: "Uzun yol konforu, yük taşıma ve her yol koşulu." },
  { slug: "enduro-cross", name: "Enduro & Cross", description: "Arazi ve patika için hafif, yüksek süspansiyonlu modeller." },
  { slug: "atv-utv", name: "ATV & UTV", description: "Arazi, tarla ve iş kullanımı için dört tekerlekli araçlar." },
  { slug: "uc-tekerlekli", name: "Üç Tekerlekli & Kargo", description: "Esnaf ve yük taşıma için kasalı, elektrikli ve benzinli araçlar." },
  { slug: "elektrikli-otomobil", name: "Elektrikli Araç & Golf", description: "Kapalı kabinli elektrikli araçlar ve golf/tesis araçları." },
  { slug: "e-bike", name: "E-Bike & Kick Scooter", description: "Elektrikli bisiklet ve elektrikli kick scooter modelleri." },
  { slug: "engelli-araclari", name: "Engelli Araçları", description: "Kolay binilen, güvenli ve konforlu akülü araçlar." },
  { slug: "cocuk", name: "Çocuk Grubu", description: "Çocuklar için akülü ATV, jeep ve motosikletler." },
  { slug: "jet-ski", name: "Jet Ski", description: "Deniz ve göl için jet ski." },
];

// Ana sayfadaki "öne çıkan" modeller (her biri farklı bir kategoriden)
const FEATURED = [
  "yuki-hammer-50",
  "motolux-rossi-rs-125",
  "yuki-yk-50-spark-new",
  "yuki-taro-gp1",
  "motolux-drift-200",
  "yuki-victor",
];

type Item = {
  slug: string;
  brand: string;
  category: string;
  model: string;
  powertrain: "ICE" | "ELECTRIC";
  summary: string;
  description: string;
  colors: { name: string; hex: string }[];
  images: string[];
  specs: Record<string, string | number>;
  extraSpecs: { label: string; value: string }[];
  source: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchRetry(url: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(encodeURI(decodeURI(url)), { headers: UA });
    if (res.ok) return res;
    if (attempt >= 3 || (res.status !== 429 && res.status < 500)) throw new Error(`${res.status} ${url}`);
    await sleep(2000 * (attempt + 1));
  }
}

async function importImage(url: string, alt: string) {
  const input = Buffer.from(await (await fetchRetry(url)).arrayBuffer());
  const meta = await sharp(input).metadata();
  if (Math.min(meta.width ?? 0, meta.height ?? 0) < 300) return null; // küçük önizlemeleri atla
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  const key = `catalog/${randomBytes(8).toString("hex")}.webp`;
  await mkdir(path.join(uploadDir, "catalog"), { recursive: true });
  await writeFile(path.join(uploadDir, key), data);
  return db.media.create({
    data: { key, url: `/media/${key}`, mime: "image/webp", size: data.byteLength, width: info.width, height: info.height, alt },
  });
}

/** Sırayla değil, küçük gruplar halinde çalıştırır. */
async function pool<T>(items: T[], size: number, fn: (item: T, i: number) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        await fn(items[i], i);
      }
    }),
  );
}

async function main() {
  const items: Item[] = JSON.parse(await readFile(path.join(process.cwd(), "prisma/content/brand-catalog.json"), "utf8"));

  // Diğer markaları sıralamada geriye al (bir kez)
  const others = await db.motorcycle.updateMany({
    where: { brand: { slug: { notIn: BRANDS.map((b) => b.slug) } }, sortOrder: { lt: 1000 } },
    data: { sortOrder: { increment: 1000 } },
  });
  await db.brand.updateMany({
    where: { slug: { notIn: BRANDS.map((b) => b.slug) }, sortOrder: { lt: 10 } },
    data: { sortOrder: { increment: 10 } },
  });

  const brandIds = new Map<string, string>();
  for (const b of BRANDS) {
    // Yetkili bayi/servis bayrakları işletme doğrulayana kadar kapalı kalır.
    const row = await db.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, sortOrder: b.sortOrder, isDemo: false },
      create: b,
    });
    brandIds.set(b.name, row.id);
  }

  const categoryIds = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) {
    const row = await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, sortOrder: i, isDemo: false, published: true },
      create: { ...c, sortOrder: i },
    });
    categoryIds.set(c.slug, row.id);
  }

  // Liste sırası: kategori sırası → öne çıkanlar → marka → model
  const catOrder = new Map(CATEGORIES.map((c, i) => [c.slug, i]));
  const sorted = [...items].sort(
    (a, b) =>
      catOrder.get(a.category)! - catOrder.get(b.category)! ||
      Number(FEATURED.includes(b.slug)) - Number(FEATURED.includes(a.slug)) ||
      a.brand.localeCompare(b.brand) ||
      a.model.localeCompare(b.model, "tr", { numeric: true }),
  );

  let created = 0;
  let failed = 0;
  await pool(sorted, 4, async (it) => {
    const i = sorted.indexOf(it);
    const existing = await db.motorcycle.findUnique({ where: { slug: it.slug }, include: { _count: { select: { images: true } } } });
    const data = {
      brandId: brandIds.get(it.brand)!,
      categoryId: categoryIds.get(it.category)!,
      model: it.model,
      modelYear: null,
      powertrain: it.powertrain,
      stockStatus: "ON_ORDER" as const,
      featured: FEATURED.includes(it.slug),
      published: true,
      isDemo: false,
      sortOrder: i,
      summary: it.summary,
      description: it.description,
      extraSpecs: it.extraSpecs,
      ...it.specs,
    };
    // Fiyat ve stok işletmeye aittir: mevcut kayıtta panelden girilen değerlere dokunulmaz.
    const m = existing
      ? await db.motorcycle.update({ where: { id: existing.id }, data: { ...data, stockStatus: undefined } })
      : await db.motorcycle.create({ data: { slug: it.slug, priceTL: null, ...data } });

    await db.motorcycleColor.deleteMany({ where: { motorcycleId: m.id } });
    if (it.colors.length) {
      await db.motorcycleColor.createMany({ data: it.colors.map((c, j) => ({ motorcycleId: m.id, name: c.name, hex: c.hex, sortOrder: j })) });
    }

    if (existing && existing._count.images > 0) return;
    let n = 0;
    for (const url of it.images) {
      try {
        const media = await importImage(url, `${it.brand} ${it.model}${n === 0 ? "" : ` — görsel ${n + 1}`}`);
        if (!media) continue;
        await db.motorcycleImage.create({ data: { motorcycleId: m.id, mediaId: media.id, alt: media.alt, sortOrder: n++ } });
      } catch (e) {
        failed++;
        console.warn(`! ${it.brand} ${it.model}: ${(e as Error).message}`);
      }
    }
    created++;
    console.log(`+ ${it.brand} ${it.model} (${n} görsel)`);
  });

  // Kategori kapakları: kategorideki ilk (öne çıkan) modelin ilk görseli
  for (const c of CATEGORIES) {
    const first = await db.motorcycleImage.findFirst({
      where: { motorcycle: { categoryId: categoryIds.get(c.slug), brandId: { in: [...brandIds.values()] }, published: true } },
      orderBy: [{ motorcycle: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    });
    if (first) await db.category.update({ where: { slug: c.slug }, data: { imageId: first.mediaId } });
  }

  console.log(
    `Tamamlandı: ${items.length} model (${created} yeni görsel seti, ${failed} indirilemeyen görsel). ` +
      `Sıralamada geriye alınan diğer marka ürünü: ${others.count}.`,
  );
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
