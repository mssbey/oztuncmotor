/**
 * Gerçek motosiklet modellerini kataloğa ekler (tekrar çalıştırılabilir; slug'a göre günceller).
 *
 *  - Fotoğraflar Wikimedia Commons'tan, serbest lisanslı (CC BY / CC BY-SA / CC0) dosyalardır.
 *    Lisans gereği fotoğraf sahibi ve lisans her ürünün açıklamasında belirtilir.
 *  - Teknik değerler üretici beyanlarına dayanır; pazara/model yılına göre değişebilir.
 *  - Fiyat girilmez (priceTL = null) ve stok "Sipariş üzerine" olarak eklenir:
 *    gerçek fiyat ve stok durumunu panelden işletme girmelidir.
 *  - Kurgusal demo motosikletler yayından kaldırılır (silinmez).
 *
 * Çalıştırma: npx tsx scripts/seed-real-catalog.ts
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./storage/uploads");
const UA = { "User-Agent": "OztuncMotorCatalog/1.0 (katalog içe aktarma)" };

const CATEGORIES = [
  { slug: "scooter", name: "Scooter", description: "Şehir içi ulaşım için pratik ve ekonomik." },
  { slug: "sehir", name: "Şehir Motosikleti", description: "Günlük kullanımda çevik, hafta sonu keyifli." },
  { slug: "touring", name: "Adventure & Touring", description: "Uzun yol konforu, yük taşıma ve her yol koşulu." },
  { slug: "elektrikli", name: "Elektrikli", description: "Sessiz, yakıtsız ve bakımı kolay." },
];

const BRANDS = ["Honda", "Yamaha", "Kawasaki", "KTM", "BMW Motorrad", "Vespa", "Super Soco"];

type Bike = {
  slug: string;
  brand: string;
  category: string;
  model: string;
  modelYear: number;
  featured?: boolean;
  summary: string;
  description: string;
  colors: { name: string; hex: string }[];
  photos: string[]; // Commons dosya adları, ilki kapak
  specs: Record<string, unknown>;
};

const BIKES: Bike[] = [
  {
    slug: "honda-pcx-125",
    brand: "Honda",
    category: "scooter",
    model: "PCX 125",
    modelYear: 2025,
    featured: true,
    summary: "Türkiye'nin en sevilen scooter'larından; az yakan, akıllı anahtarlı ve B ehliyetle kullanılabilen şehir aracı.",
    description:
      "eSP+ motoru, start-stop sistemi ve Honda Seçilebilir Tork Kontrolü (HSTC) ile PCX 125, günlük şehir kullanımında hem ekonomik hem güvenli. Sele altında kask alabilecek bagaj, USB-C şarj soketi ve LED aydınlatma standart.",
    colors: [
      { name: "Mat gri", hex: "#6b6e70" },
      { name: "Mavi", hex: "#24365c" },
      { name: "Beyaz", hex: "#e8e8e6" },
    ],
    photos: ["2019 Honda PCX 125.jpg", "2021 Honda PCX 125.jpg"],
    specs: { engineCc: 125, powerHp: 12.5, torqueNm: 11.8, weightKg: 132, seatHeightMm: 764, fuelCapacityL: 8.1, transmission: "CVT otomatik", cooling: "Sıvı soğutmalı", brakes: "Ön disk, ABS", licenseClass: "A1 / B" },
  },
  {
    slug: "yamaha-nmax-155",
    brand: "Yamaha",
    category: "scooter",
    model: "NMAX 155",
    modelYear: 2025,
    summary: "Değişken supaplı (VVA) motoru ve sportif çizgileriyle şehirde çevik, çevre yolunda rahat scooter.",
    description:
      "Blue Core VVA motoru düşük devirde tasarruf, yüksek devirde güç sunar. Çift kanal ABS, çekiş kontrolü, akıllı anahtar ve Y-Connect bağlantısı ile donanım seviyesi sınıfının üzerinde.",
    colors: [
      { name: "Beyaz", hex: "#ecebe8" },
      { name: "Mat gri", hex: "#53575c" },
    ],
    photos: ["2025 Yamaha NMAX 155 Standard.jpg"],
    specs: { engineCc: 155, powerHp: 15.1, torqueNm: 14, weightKg: 131, seatHeightMm: 765, fuelCapacityL: 7.1, transmission: "CVT otomatik", cooling: "Sıvı soğutmalı", brakes: "Çift disk, çift kanal ABS", licenseClass: "A2" },
  },
  {
    slug: "yamaha-xmax-300",
    brand: "Yamaha",
    category: "scooter",
    model: "XMAX 300",
    modelYear: 2025,
    featured: true,
    summary: "Maxi scooter sınıfının referansı: geniş bagaj, ayarlanabilir ön cam ve şehirlerarası yolculuğa yetecek güç.",
    description:
      "292 cc Blue Core motor, çekiş kontrol sistemi ve ABS ile XMAX 300, şehir içi konforu uzun yol kabiliyetiyle birleştirir. Sele altında iki kask alabilecek bagaj hacmi ve akıllı anahtar standart.",
    colors: [
      { name: "Antrasit", hex: "#4a4d50" },
      { name: "Siyah", hex: "#1d1f21" },
    ],
    photos: ["Yamaha XMAX, 2020.jpg", "2024 Yamaha XMAX 300 Tech MAX.jpg"],
    specs: { engineCc: 292, powerHp: 28, torqueNm: 29, weightKg: 180, seatHeightMm: 795, fuelCapacityL: 13, transmission: "CVT otomatik", cooling: "Sıvı soğutmalı", brakes: "Çift disk, ABS + çekiş kontrolü", licenseClass: "A2" },
  },
  {
    slug: "vespa-gts-300",
    brand: "Vespa",
    category: "scooter",
    model: "GTS 300",
    modelYear: 2025,
    featured: true,
    summary: "Çelik gövdesi ve zamansız İtalyan tasarımıyla ikonik scooter; güçlü hpe motoruyla sadece şık değil, hızlı da.",
    description:
      "Vespa'nın tek parça çelik gövdesi, 278 cc hpe motorla buluşuyor. ABS ve ASR çekiş kontrolü, LED far ve geniş sele altı bagaj ile hem şehirde hem kısa tatil kaçamaklarında keyifli bir yol arkadaşı.",
    colors: [
      { name: "Beyaz", hex: "#f1f0ec" },
      { name: "Lacivert", hex: "#1f2a44" },
    ],
    photos: ["Vespa GTS 300 white.jpg", "Vespa GTS 300 HPE.jpg"],
    specs: { engineCc: 278, powerHp: 23.8, torqueNm: 26, weightKg: 160, seatHeightMm: 790, fuelCapacityL: 8.5, transmission: "CVT otomatik", cooling: "Sıvı soğutmalı", brakes: "Çift disk, ABS + ASR", licenseClass: "A2" },
  },
  {
    slug: "honda-cb650r",
    brand: "Honda",
    category: "sehir",
    model: "CB650R",
    modelYear: 2025,
    featured: true,
    summary: "Neo Sports Café tasarımı ve dört silindirli motorun eşsiz sesi; isteğe bağlı E-Clutch ile debriyajsız vites.",
    description:
      "649 cc sıralı dört silindirli motor yüksek devirlerde bile pürüzsüz güç verir. Showa SFF-BP ters ön süspansiyon, radyal frenler ve 5 inç TFT ekran standart. Honda E-Clutch seçeneği ile kalkış ve vites geçişlerinde debriyaj kolu kullanmak gerekmez.",
    colors: [
      { name: "Mat siyah", hex: "#232527" },
      { name: "Kırmızı", hex: "#b3232b" },
    ],
    photos: ["2023 Honda CB650R Standard.jpg", "2019 Honda CB650R (20190428).jpg"],
    specs: { engineCc: 649, powerHp: 95, torqueNm: 63, weightKg: 207, seatHeightMm: 810, fuelCapacityL: 15.4, transmission: "6 ileri (E-Clutch opsiyonel)", cooling: "Sıvı soğutmalı", brakes: "Çift 310 mm radyal disk, ABS", licenseClass: "A (A2 sürümü mevcut)" },
  },
  {
    slug: "yamaha-mt-07",
    brand: "Yamaha",
    category: "sehir",
    model: "MT-07",
    modelYear: 2024,
    featured: true,
    summary: "CP2 motorunun bol torku ve hafif şasisiyle Avrupa'nın en çok satan naked motosikletlerinden.",
    description:
      "689 cc CP2 iki silindirli motor düşük devirden itibaren güçlü çeker; hafif gövdesi şehir trafiğinde zahmetsiz manevra imkânı verir. A2 ehliyete uygun kısıtlanmış sürümüyle yeni sürücülerin de ilk büyük motoru olmaya aday.",
    colors: [
      { name: "Tech Black", hex: "#2a2c2f" },
      { name: "Icon Blue", hex: "#1f3e8c" },
    ],
    photos: ["2021 Black Yamaha MT-07.jpg"],
    specs: { engineCc: 689, powerHp: 73.4, torqueNm: 67, weightKg: 184, seatHeightMm: 805, fuelCapacityL: 14, transmission: "6 ileri", cooling: "Sıvı soğutmalı", brakes: "Çift 298 mm disk, ABS", licenseClass: "A (A2 sürümü mevcut)" },
  },
  {
    slug: "kawasaki-z650",
    brand: "Kawasaki",
    category: "sehir",
    model: "Z650",
    modelYear: 2025,
    summary: "Sugomi tasarımlı, A2 ehliyete uygun, hafif ve kolay kullanılan orta sınıf naked.",
    description:
      "649 cc paralel iki silindirli motor, KTRC çekiş kontrolü ve Bluetooth bağlantılı TFT ekranla Z650 hem yeni başlayanlar hem deneyimli sürücüler için dengeli bir seçim. Düşük sele yüksekliği güven verir.",
    colors: [
      { name: "Metalik siyah / yeşil", hex: "#1b1d1f" },
      { name: "Beyaz", hex: "#e6e6e4" },
    ],
    photos: ["Kawasaki Z650 schwarz 2020.jpg", "Kawasaki Z650 (1).jpg"],
    specs: { engineCc: 649, powerHp: 68, torqueNm: 64, weightKg: 188, seatHeightMm: 790, fuelCapacityL: 15, transmission: "6 ileri, kaydırmalı debriyaj", cooling: "Sıvı soğutmalı", brakes: "Çift 300 mm disk, ABS", licenseClass: "A2" },
  },
  {
    slug: "ktm-390-duke",
    brand: "KTM",
    category: "sehir",
    model: "390 Duke",
    modelYear: 2023,
    summary: "Hafif, agresif ve eğlenceli; A2 sınıfının en sportif naked modellerinden biri.",
    description:
      "Tek silindirli 373 cc motor, WP süspansiyon ve viraj destekli ABS ile 390 Duke, şehirde çevik, virajlı yollarda ise tam bir oyuncak. Renkli TFT ekran ve akıllı telefon bağlantısı standart.",
    colors: [{ name: "Turuncu / siyah", hex: "#f26b1d" }],
    photos: ["KTM 390 Duke.jpg", "KTM 390 Duke in Athens on 11-1-2023.jpg"],
    specs: { engineCc: 373, powerHp: 44, torqueNm: 37, weightKg: 163, seatHeightMm: 830, fuelCapacityL: 13.4, transmission: "6 ileri, quickshifter opsiyonel", cooling: "Sıvı soğutmalı", brakes: "320 mm ön disk, viraj ABS", licenseClass: "A2" },
  },
  {
    slug: "honda-rebel-500",
    brand: "Honda",
    category: "sehir",
    model: "Rebel 500",
    modelYear: 2025,
    summary: "Alçak selesi ve bobber tarzıyla her boydaki sürücüye uygun, A2 ehliyetle kullanılabilen cruiser.",
    description:
      "690 mm sele yüksekliği sayesinde ayaklar rahatça yere basar. 471 cc paralel iki silindirli motor düşük devirden güçlü çeker; kaydırmalı debriyaj ve ABS standart. Sade ve karakterli tasarımı kişiselleştirmeye çok uygun.",
    colors: [
      { name: "Mat yeşil", hex: "#5d6b52" },
      { name: "Mat siyah", hex: "#26282a" },
    ],
    photos: ["Honda CMX500 Rebel parked at Hogs for Hospice, Leamington, Ontario, 2025-08-02.jpg", "2020 Honda Rebel 500.jpg"],
    specs: { engineCc: 471, powerHp: 46.9, torqueNm: 43.3, weightKg: 191, seatHeightMm: 690, fuelCapacityL: 11.2, transmission: "6 ileri, kaydırmalı debriyaj", cooling: "Sıvı soğutmalı", brakes: "296 mm ön disk, ABS", licenseClass: "A2" },
  },
  {
    slug: "yamaha-tenere-700",
    brand: "Yamaha",
    category: "touring",
    model: "Ténéré 700",
    modelYear: 2025,
    featured: true,
    summary: "Gerçek arazi kabiliyeti olan, sade ve dayanıklı orta sınıf adventure; dünya turlarının favorisi.",
    description:
      "CP2 motor, uzun stroklu KYB süspansiyon ve 21/18 inç jant ölçüleriyle Ténéré 700 asfaltın bittiği yerde de rahat. 16 litrelik depo uzun menzil sağlar; seçilebilir ABS modları ve TFT ekran standart.",
    colors: [
      { name: "Icon Blue", hex: "#1f3e8c" },
      { name: "Siyah", hex: "#212325" },
    ],
    photos: ["Tenere 700.jpg", "Yamaha Tenere 700.jpg"],
    specs: { engineCc: 689, powerHp: 73.4, torqueNm: 68, weightKg: 205, seatHeightMm: 875, fuelCapacityL: 16, transmission: "6 ileri", cooling: "Sıvı soğutmalı", brakes: "Çift 282 mm disk, seçilebilir ABS", licenseClass: "A (A2 sürümü mevcut)" },
  },
  {
    slug: "honda-crf1100l-africa-twin",
    brand: "Honda",
    category: "touring",
    model: "CRF1100L Africa Twin",
    modelYear: 2025,
    featured: true,
    summary: "Efsane adventure: dakar ruhlu şasi, güçlü paralel iki silindirli motor ve isteğe bağlı DCT şanzıman.",
    description:
      "1084 cc motor, 6 eksenli IMU destekli viraj ABS ve çekiş kontrolü, 6,5 inç dokunmatik TFT ekran ve Apple CarPlay / Android Auto desteği. DCT (çift kavramalı otomatik) şanzıman seçeneğiyle uzun yolda yorgunluğu azaltır.",
    colors: [{ name: "Tricolor (beyaz / mavi / kırmızı)", hex: "#e9e9e6" }],
    photos: [
      "2022 Honda CRF1100L Africa Twin in Pearl Glare White Tricolor, front right.jpg",
      "2025 Honda CRF1100L Africa Twin DCT.jpg",
    ],
    specs: { engineCc: 1084, powerHp: 102, torqueNm: 112, weightKg: 231, seatHeightMm: 850, fuelCapacityL: 18.8, transmission: "6 ileri veya DCT", cooling: "Sıvı soğutmalı", brakes: "Çift 310 mm radyal disk, viraj ABS", licenseClass: "A" },
  },
  {
    slug: "bmw-r-1300-gs",
    brand: "BMW Motorrad",
    category: "touring",
    model: "R 1300 GS",
    modelYear: 2025,
    featured: true,
    summary: "Adventure segmentinin amiral gemisi: yeni boxer motor, daha hafif gövde ve üst düzey elektronik donanım.",
    description:
      "1300 cc boxer motor 145 beygir güç ve 149 Nm tork üretir. Önceki nesle göre daha kompakt ve hafif olan R 1300 GS; sürüş modları, dinamik çekiş kontrolü ve 6,5 inç TFT ekranla her koşulda güven verir.",
    colors: [{ name: "Option 719 Tramuntana", hex: "#d8cdb5" }],
    photos: ["BMW R 1300 GS, DRB GraphiX.jpg", "3 BMW R1300GS 2024-06-07.jpg"],
    specs: { engineCc: 1300, powerHp: 145, torqueNm: 149, weightKg: 237, seatHeightMm: 850, fuelCapacityL: 19, transmission: "6 ileri", cooling: "Hava / sıvı soğutmalı boxer", brakes: "Çift 310 mm disk, BMW Integral ABS Pro", licenseClass: "A" },
  },
  {
    slug: "honda-nc750x",
    brand: "Honda",
    category: "touring",
    model: "NC750X",
    modelYear: 2025,
    summary: "Yakıt cimrisi motoru, depo yerindeki kask bölmesi ve DCT seçeneğiyle her gün kullanılacak crossover.",
    description:
      "745 cc paralel iki silindirli motor düşük devirde güçlü çeker ve 100 km'de yaklaşık 3,5 litre yakar. Klasik yakıt deposunun yerindeki 23 litrelik bölmeye tam yüz kask sığar. A2 ehliyete uygundur.",
    colors: [
      { name: "Grand Prix kırmızısı", hex: "#c0242c" },
      { name: "Mat siyah", hex: "#26282a" },
    ],
    photos: ["2021 Honda NC750X (DCT).jpg"],
    specs: { engineCc: 745, powerHp: 58, torqueNm: 69, weightKg: 214, seatHeightMm: 800, fuelCapacityL: 14.1, transmission: "6 ileri veya DCT", cooling: "Sıvı soğutmalı", brakes: "Çift 296 mm disk, ABS", licenseClass: "A2" },
  },
  {
    slug: "super-soco-cpx",
    brand: "Super Soco",
    category: "elektrikli",
    model: "CPx",
    modelYear: 2025,
    featured: true,
    summary: "Çift sökülebilir bataryasıyla evde şarj edilebilen, 125 cc sınıfına denk elektrikli maxi scooter.",
    description:
      "Bosch hub motor, sökülebilir lityum bataryalar ve LED aydınlatmayla CPx, şehir içinde sessiz ve yakıtsız ulaşım sunar. Bataryalar eve taşınıp standart prizden şarj edilebilir. Menzil, sürüş tarzı ve hava koşullarına göre değişir.",
    colors: [
      { name: "Mat siyah", hex: "#232527" },
      { name: "Gri", hex: "#8b8f93" },
    ],
    photos: ["2024 SuperSoco CPX.jpg", "Super Soco CPX.jpg"],
    specs: { powertrain: "ELECTRIC", motorPowerKw: 4, batteryKwh: 5.4, rangeKm: 140, chargeTimeHours: 7, topSpeedKmh: 90, weightKg: 112, seatHeightMm: 770, transmission: "Doğrudan tahrik", brakes: "Çift disk, CBS", licenseClass: "A1 / B" },
  },
];

// ─── Commons ─────────────────────────────────────────────────────────

type Photo = { url: string; author: string; license: string; page: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const stripHtml = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function fetchRetry(url: string | URL): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: UA });
    if (res.ok) return res;
    if (attempt >= 4 || (res.status !== 429 && res.status < 500)) throw new Error(`${res.status} ${url}`);
    await sleep(3000 * (attempt + 1));
  }
}

async function commonsInfo(file: string): Promise<Photo> {
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  for (const [k, v] of Object.entries({
    action: "query", format: "json", titles: `File:${file}`, prop: "imageinfo",
    iiprop: "url|extmetadata", iiurlwidth: "1800",
  })) u.searchParams.set(k, v);
  const json = await (await fetchRetry(u)).json();
  const page = Object.values(json.query.pages)[0] as { imageinfo?: { thumburl: string; descriptionurl: string; extmetadata: Record<string, { value: string }> }[] };
  const ii = page.imageinfo?.[0];
  if (!ii) throw new Error(`Commons dosyası bulunamadı: ${file}`);
  return {
    url: ii.thumburl,
    author: stripHtml(ii.extmetadata.Artist?.value ?? "Bilinmiyor"),
    license: ii.extmetadata.LicenseShortName?.value ?? "",
    page: ii.descriptionurl,
  };
}

async function importPhoto(file: string, alt: string) {
  const info = await commonsInfo(file);
  await sleep(500);
  const input = Buffer.from(await (await fetchRetry(info.url)).arrayBuffer());
  const { data, info: out } = await sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer({ resolveWithObject: true });
  const key = `catalog/${randomBytes(8).toString("hex")}.webp`;
  await mkdir(path.join(uploadDir, "catalog"), { recursive: true });
  await writeFile(path.join(uploadDir, key), data);
  const media = await db.media.create({
    data: { key, url: `/media/${key}`, mime: "image/webp", size: data.byteLength, width: out.width, height: out.height, alt },
  });
  return { media, credit: `${info.author} (${info.license}, Wikimedia Commons)` };
}

// ─── İçe aktarma ────────────────────────────────────────────────────

const slugify = (s: string) =>
  s.toLowerCase().replace(/ö/g, "o").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ç/g, "c").replace(/ğ/g, "g")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  const brandIds = new Map<string, string>();
  for (const [i, name] of BRANDS.entries()) {
    const slug = slugify(name);
    // Yetkili bayi/servis bayrakları işletme doğrulayana kadar kapalı kalır.
    const b = await db.brand.upsert({ where: { slug }, update: {}, create: { name, slug, sortOrder: 10 + i } });
    brandIds.set(name, b.id);
  }

  const categoryIds = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) {
    const cat = await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, isDemo: false, published: true },
      create: { ...c, sortOrder: i },
    });
    categoryIds.set(c.slug, cat.id);
  }

  const categoryCover = new Map<string, string>(); // kategori slug → ilk ürünün kapak görseli
  for (const [i, b] of BIKES.entries()) {
    const existing = await db.motorcycle.findUnique({ where: { slug: b.slug }, include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } });
    if (existing && existing.images.length > 0) {
      console.log(`= ${b.brand} ${b.model} zaten var, atlanıyor`);
      if (!categoryCover.has(b.category)) categoryCover.set(b.category, existing.images[0].mediaId);
      continue;
    }

    const photos = [];
    for (const [j, file] of b.photos.entries()) {
      photos.push(await importPhoto(file, `${b.brand} ${b.model}${j === 0 ? "" : ` — görsel ${j + 1}`}`));
      await sleep(800);
    }
    const credits = [...new Set(photos.map((p) => p.credit))].join("; ");
    const { powertrain, ...specs } = b.specs as { powertrain?: "ELECTRIC" } & Record<string, unknown>;
    const data = {
      brandId: brandIds.get(b.brand)!,
      categoryId: categoryIds.get(b.category)!,
      model: b.model,
      modelYear: b.modelYear,
      powertrain: powertrain ?? ("ICE" as const),
      priceTL: null,
      stockStatus: "ON_ORDER" as const,
      featured: b.featured ?? false,
      published: true,
      isDemo: false,
      sortOrder: i,
      summary: b.summary,
      description: `${b.description}\n\nTeknik değerler üretici beyanıdır; model yılı ve pazara göre farklılık gösterebilir. Güncel fiyat ve stok bilgisi için bizimle iletişime geçin.\n\nFotoğraf: ${credits}.`,
      ...(specs as object),
    };
    const m = existing
      ? await db.motorcycle.update({ where: { id: existing.id }, data })
      : await db.motorcycle.create({ data: { slug: b.slug, ...data } });
    await db.motorcycleColor.deleteMany({ where: { motorcycleId: m.id } });
    await db.motorcycleColor.createMany({ data: b.colors.map((c, j) => ({ motorcycleId: m.id, name: c.name, hex: c.hex, sortOrder: j })) });
    for (const [j, p] of photos.entries()) {
      await db.motorcycleImage.create({ data: { motorcycleId: m.id, mediaId: p.media.id, alt: p.media.alt, sortOrder: j } });
    }
    if (!categoryCover.has(b.category)) categoryCover.set(b.category, photos[0].media.id);
    console.log(`+ ${b.brand} ${b.model} (${photos.length} görsel)`);
  }

  for (const [slug, mediaId] of categoryCover) {
    await db.category.update({ where: { slug }, data: { imageId: mediaId } });
  }

  // Ana sayfa görseli hâlâ demo çizimse (veya yoksa) Ténéré 700 fotoğrafını kullan.
  const settings = await db.siteSettings.findUnique({ where: { id: 1 } });
  const heroMedia = settings?.heroImageId ? await db.media.findUnique({ where: { id: settings.heroImageId } }) : null;
  if (settings && (!heroMedia || heroMedia.isDemo)) {
    const tenere = await db.motorcycle.findUnique({
      where: { slug: "yamaha-tenere-700" },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    });
    if (tenere?.images[0]) {
      await db.siteSettings.update({ where: { id: 1 }, data: { heroImageId: tenere.images[0].mediaId } });
      console.log("Ana sayfa görseli güncellendi.");
    }
  }

  const hidden = await db.motorcycle.updateMany({ where: { isDemo: true, published: true }, data: { published: false, featured: false } });
  console.log(`Tamamlandı: ${BIKES.length} gerçek model. Yayından kaldırılan demo ürün: ${hidden.count}.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
