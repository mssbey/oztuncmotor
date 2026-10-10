/**
 * Seed
 *  - Temel kayıtlar (her ortamda): site ayarları, randevu ayarları (KAPALI), haftalık saatler (kapalı),
 *    düzenlenmesi gereken politika metinleri, yayımlanmamış taslak servis hizmetleri.
 *  - SEED_MODE=demo (yalnızca NODE_ENV !== "production"): kurgusal "(Demo)" markalar, örnek modeller,
 *    üretilmiş "DEMO GÖRSEL" çizimleri, örnek çalışma saatleri ve örnek randevular. Hepsi isDemo=true.
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { bikeSvg, type BikeKind } from "./demo/bike-art";
import { POLICY_PAGES } from "./content/policies";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const isProduction = process.env.NODE_ENV === "production";
const demo = process.env.SEED_MODE === "demo" && !isProduction;

const SERVICES = [
  { slug: "periyodik-bakim", title: "Periyodik bakım", description: "Kilometre ve zaman aralığına göre yağ, filtre ve genel kontroller." },
  { slug: "ariza-tespiti", title: "Arıza tespiti", description: "Belirtinin dinlenmesi, kontrol ve teşhis; işlem öncesi bilgilendirme." },
  { slug: "lastik", title: "Lastik işlemleri", description: "Lastik değişimi, basınç ve aşınma kontrolü." },
  { slug: "fren", title: "Fren bakımı", description: "Balata, disk ve hidrolik kontrolü." },
  { slug: "elektrik", title: "Elektrik ve aydınlatma", description: "Akü, şarj sistemi, aydınlatma ve kablo kontrolleri." },
];

async function base() {
  await db.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await db.appointmentSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1, enabled: false } });
  for (let weekday = 1; weekday <= 7; weekday++) {
    await db.workingDay.upsert({ where: { weekday }, update: {}, create: { weekday, isOpen: false } });
  }
  for (const page of POLICY_PAGES) {
    await db.page.upsert({ where: { key: page.key }, update: {}, create: page });
  }
  // Hizmetler taslak olarak eklenir: işletme gerçekte verdiğini doğrulayıp panelden yayımlar.
  for (const [i, s] of SERVICES.entries()) {
    await db.serviceItem.upsert({
      where: { slug: s.slug },
      update: {},
      create: { ...s, sortOrder: i, published: false },
    });
  }
}

// ─── Demo ────────────────────────────────────────────────────────────

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./storage/uploads");

async function demoImage(svg: string, alt: string) {
  const buffer = await sharp(Buffer.from(svg)).webp({ quality: 88 }).toBuffer({ resolveWithObject: true });
  const key = `demo/${randomBytes(8).toString("hex")}.webp`;
  await mkdir(path.join(uploadDir, "demo"), { recursive: true });
  await writeFile(path.join(uploadDir, key), buffer.data);
  return db.media.create({
    data: {
      key,
      url: `/media/${key}`,
      mime: "image/webp",
      size: buffer.data.byteLength,
      width: buffer.info.width,
      height: buffer.info.height,
      alt,
      isDemo: true,
    },
  });
}

type DemoBike = {
  slug: string;
  brand: string;
  category: string;
  model: string;
  modelYear: number;
  kind: BikeKind;
  paints: { name: string; hex: string }[];
  priceTL: number | null;
  stockStatus: "IN_STOCK" | "ON_ORDER" | "SOLD_OUT";
  featured?: boolean;
  summary: string;
  specs: Record<string, unknown>;
};

const DEMO_BIKES: DemoBike[] = [
  {
    slug: "demo-nordline-street-650",
    brand: "Nordline (Demo)",
    category: "sehir",
    model: "Street 650",
    modelYear: 2026,
    kind: "naked",
    paints: [
      { name: "Kırmızı", hex: "#c62828" },
      { name: "Grafit", hex: "#3b3f45" },
    ],
    priceTL: 489000,
    stockStatus: "IN_STOCK",
    featured: true,
    summary: "Şehir içinde çevik, hafta sonu yollarında keyifli orta sınıf naked.",
    specs: { engineCc: 649, powerHp: 68, torqueNm: 64, weightKg: 206, seatHeightMm: 805, fuelCapacityL: 15, transmission: "6 ileri", cooling: "Sıvı soğutmalı", brakes: "Çift disk ön, ABS", licenseClass: "A2 (kısıtlamalı)" },
  },
  {
    slug: "demo-vela-urban-125",
    brand: "Vela (Demo)",
    category: "scooter",
    model: "Urban 125",
    modelYear: 2026,
    kind: "scooter",
    paints: [
      { name: "Petrol mavisi", hex: "#2f6f8f" },
      { name: "Kum beji", hex: "#cdbb98" },
    ],
    priceTL: 129900,
    stockStatus: "IN_STOCK",
    featured: true,
    summary: "Günlük işe gidiş geliş için ekonomik ve pratik scooter.",
    specs: { engineCc: 125, powerHp: 11.2, weightKg: 124, seatHeightMm: 770, fuelCapacityL: 7.5, transmission: "CVT otomatik", licenseClass: "A1 / B" },
  },
  {
    slug: "demo-kestrel-grand-tour-1250",
    brand: "Kestrel (Demo)",
    category: "touring",
    model: "Grand Tour 1250",
    modelYear: 2025,
    kind: "touring",
    paints: [{ name: "Antrasit", hex: "#3b3f45" }],
    priceTL: null,
    stockStatus: "ON_ORDER",
    featured: true,
    summary: "Uzun yol için yan çantalı, rüzgar korumalı touring.",
    specs: { engineCc: 1254, powerHp: 136, torqueNm: 143, weightKg: 279, seatHeightMm: 820, fuelCapacityL: 24, transmission: "6 ileri", brakes: "Çift disk ön, viraj ABS" },
  },
  {
    slug: "demo-volt-e-city",
    brand: "Volt (Demo)",
    category: "elektrikli",
    model: "E-City",
    modelYear: 2026,
    kind: "electric",
    paints: [
      { name: "Buz beyazı", hex: "#e0e0dc" },
      { name: "Gece siyahı", hex: "#25282c" },
    ],
    priceTL: 214500,
    stockStatus: "IN_STOCK",
    featured: true,
    summary: "Şarjlı şehir kullanımı için sessiz ve bakımı kolay elektrikli model.",
    specs: { powertrain: "ELECTRIC", motorPowerKw: 11, batteryKwh: 4.2, rangeKm: 110, chargeTimeHours: 5.5, topSpeedKmh: 105, weightKg: 142, seatHeightMm: 790, licenseClass: "A1" },
  },
  {
    slug: "demo-nordline-trail-800",
    brand: "Nordline (Demo)",
    category: "touring",
    model: "Trail 800",
    modelYear: 2026,
    kind: "adventure",
    paints: [{ name: "Hardal", hex: "#c9a227" }],
    priceTL: 612000,
    stockStatus: "ON_ORDER",
    featured: true,
    summary: "Asfalt ve stabilize yollarda rahat, uzun süspansiyonlu adventure.",
    specs: { engineCc: 799, powerHp: 95, torqueNm: 80, weightKg: 229, seatHeightMm: 860, fuelCapacityL: 20, transmission: "6 ileri", cooling: "Sıvı soğutmalı" },
  },
  {
    slug: "demo-vela-metro-250",
    brand: "Vela (Demo)",
    category: "scooter",
    model: "Metro 250",
    modelYear: 2025,
    kind: "scooter",
    paints: [{ name: "Grafit", hex: "#4a4f56" }],
    priceTL: 189000,
    stockStatus: "SOLD_OUT",
    featured: true,
    summary: "Şehirler arası kısa yollara da uygun maxi scooter.",
    specs: { engineCc: 249, powerHp: 22, weightKg: 172, seatHeightMm: 780, fuelCapacityL: 11, transmission: "CVT otomatik", licenseClass: "A2" },
  },
  {
    slug: "demo-kestrel-roadster-300",
    brand: "Kestrel (Demo)",
    category: "sehir",
    model: "Roadster 300",
    modelYear: 2026,
    kind: "naked",
    paints: [{ name: "Mavi", hex: "#2f5d8f" }],
    priceTL: 239000,
    stockStatus: "IN_STOCK",
    summary: "A2 ehliyete uygun, hafif ve kolay kullanılan başlangıç modeli.",
    specs: { engineCc: 292, powerHp: 34, weightKg: 159, seatHeightMm: 790, transmission: "6 ileri" },
  },
  {
    slug: "demo-volt-e-sport",
    brand: "Volt (Demo)",
    category: "elektrikli",
    model: "E-Sport",
    modelYear: 2026,
    kind: "electric",
    paints: [{ name: "Kırmızı", hex: "#b3261e" }],
    priceTL: null,
    stockStatus: "ON_ORDER",
    summary: "Yüksek torklu elektrikli naked.",
    specs: { powertrain: "ELECTRIC", motorPowerKw: 35, rangeKm: 160, topSpeedKmh: 160 },
  },
];

const CATEGORIES = [
  { slug: "scooter", name: "Scooter", description: "Şehir içi ulaşım için pratik ve ekonomik.", kind: "scooter" as const, paint: "#2f6f8f" },
  { slug: "sehir", name: "Şehir Motosikleti", description: "Günlük kullanımda çevik, hafta sonu keyifli.", kind: "naked" as const, paint: "#c62828" },
  { slug: "touring", name: "Touring", description: "Uzun yol konforu, yük ve rüzgar koruması.", kind: "touring" as const, paint: "#3b3f45" },
  { slug: "elektrikli", name: "Elektrikli", description: "Sessiz, yakıtsız ve bakımı kolay.", kind: "electric" as const, paint: "#e0e0dc" },
];

async function seedDemo() {
  const existing = await db.motorcycle.count({ where: { isDemo: true } });
  if (existing > 0) {
    console.log("Demo veri zaten var; atlanıyor. Sıfırlamak için: npx prisma migrate reset");
    return;
  }

  const brands = new Map<string, string>();
  for (const [i, name] of [...new Set(DEMO_BIKES.map((b) => b.brand))].entries()) {
    const slug = name.toLowerCase().replace(/\s*\(demo\)/, "-demo").replace(/[^a-z0-9-]/g, "");
    const brand = await db.brand.create({ data: { name, slug, sortOrder: i, isDemo: true } });
    brands.set(name, brand.id);
  }

  const categories = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) {
    const image = await demoImage(bikeSvg({ kind: c.kind, paint: c.paint }), `${c.name} kategorisi (demo görsel)`);
    const cat = await db.category.create({
      data: { slug: c.slug, name: c.name, description: c.description, sortOrder: i, imageId: image.id, isDemo: true },
    });
    categories.set(c.slug, cat.id);
  }

  for (const [i, b] of DEMO_BIKES.entries()) {
    const { powertrain, ...specs } = b.specs as { powertrain?: "ELECTRIC" } & Record<string, unknown>;
    const m = await db.motorcycle.create({
      data: {
        slug: b.slug,
        brandId: brands.get(b.brand)!,
        categoryId: categories.get(b.category)!,
        model: b.model,
        modelYear: b.modelYear,
        powertrain: powertrain ?? "ICE",
        priceTL: b.priceTL,
        stockStatus: b.stockStatus,
        featured: b.featured ?? false,
        published: true,
        isDemo: true,
        sortOrder: i,
        summary: b.summary,
        description: `${b.summary}\n\nBu kayıt geliştirme ortamı için hazırlanmış bir DEMO üründür. Marka, model, fiyat ve teknik değerler kurgusaldır; gerçek bir ürünü temsil etmez.`,
        ...(specs as object),
        colors: { create: b.paints.map((p, j) => ({ name: p.name, hex: p.hex, sortOrder: j })) },
      },
    });
    // Her renk için bir görsel + ilk renk için ters açıdan bir görsel
    const shots = [
      ...b.paints.map((p) => ({ paint: p.hex, mirror: false, label: p.name })),
      { paint: b.paints[0].hex, mirror: true, label: `${b.paints[0].name}, sol taraf` },
    ];
    for (const [j, shot] of shots.entries()) {
      const media = await demoImage(
        bikeSvg({ kind: b.kind, paint: shot.paint, mirror: shot.mirror }),
        `${b.brand} ${b.model} — ${shot.label} (demo görsel)`,
      );
      await db.motorcycleImage.create({ data: { motorcycleId: m.id, mediaId: media.id, sortOrder: j, alt: media.alt } });
    }
  }

  const hero = await demoImage(
    bikeSvg({ kind: "naked", paint: "#c62828", background: "transparent" }),
    "Kırmızı naked motosiklet (demo görsel)",
  );
  await db.siteSettings.update({ where: { id: 1 }, data: { heroImageId: hero.id, notifyEmail: "servis@ornek.local" } });

  // Örnek servis takvimi (gerçek çalışma saatleri panelden girilmelidir)
  const hours: Record<number, [boolean, string, string, string | null, string | null]> = {
    1: [true, "09:00", "18:00", "12:30", "13:30"],
    2: [true, "09:00", "18:00", "12:30", "13:30"],
    3: [true, "09:00", "18:00", "12:30", "13:30"],
    4: [true, "09:00", "18:00", "12:30", "13:30"],
    5: [true, "09:00", "18:00", "12:30", "13:30"],
    6: [true, "09:00", "14:00", null, null],
    7: [false, "09:00", "18:00", null, null],
  };
  for (const [weekday, [isOpen, openTime, closeTime, breakStart, breakEnd]] of Object.entries(hours)) {
    await db.workingDay.update({
      where: { weekday: Number(weekday) },
      data: { isOpen, openTime, closeTime, breakStart, breakEnd },
    });
  }
  await db.appointmentSettings.update({
    where: { id: 1 },
    data: { enabled: true, slotMinutes: 60, slotCapacity: 2, showHoursPublic: true },
  });
  await db.serviceItem.updateMany({ data: { published: true, isDemo: true } });

  console.log(`Demo veri eklendi: ${DEMO_BIKES.length} model, ${CATEGORIES.length} kategori.`);
}

async function main() {
  await base();
  console.log("Temel kayıtlar hazır.");
  if (process.env.SEED_MODE === "demo" && isProduction) {
    console.warn("Üretim ortamında demo veri eklenmez.");
  }
  if (demo) await seedDemo();
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
