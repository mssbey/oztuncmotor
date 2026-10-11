import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { CC_RANGES, POWERTRAIN_OPTIONS, STOCK_OPTIONS, type CatalogFilters } from "@/lib/catalog";
import type { SpecValues } from "@/lib/specs";

// Demo içerik yalnızca geliştirme ortamında gösterilir; üretimde asla gerçek stok gibi yayımlanmaz.
export function demoVisibility(): Prisma.MotorcycleWhereInput {
  return process.env.NODE_ENV === "production" && process.env.SHOW_DEMO_CONTENT !== "true"
    ? { isDemo: false }
    : {};
}
export function showDemo(): boolean {
  return !(process.env.NODE_ENV === "production" && process.env.SHOW_DEMO_CONTENT !== "true");
}

const cardInclude = {
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  images: {
    orderBy: { sortOrder: "asc" },
    take: 1,
    include: { media: { select: { url: true, width: true, height: true, alt: true } } },
  },
} satisfies Prisma.MotorcycleInclude;

type CardRow = Prisma.MotorcycleGetPayload<{ include: typeof cardInclude }>;

const toNum = (v: Prisma.Decimal | number | null) => (v == null ? null : Number(v));

function specValues(m: CardRow): SpecValues {
  return {
    powertrain: m.powertrain,
    engineCc: m.engineCc,
    powerHp: toNum(m.powerHp),
    torqueNm: toNum(m.torqueNm),
    motorPowerKw: toNum(m.motorPowerKw),
    batteryKwh: toNum(m.batteryKwh),
    rangeKm: m.rangeKm,
    chargeTimeHours: toNum(m.chargeTimeHours),
    topSpeedKmh: m.topSpeedKmh,
    weightKg: m.weightKg,
    seatHeightMm: m.seatHeightMm,
    fuelCapacityL: toNum(m.fuelCapacityL),
    transmission: m.transmission,
    cooling: m.cooling,
    brakes: m.brakes,
    licenseClass: m.licenseClass,
    extraSpecs: Array.isArray(m.extraSpecs)
      ? (m.extraSpecs as { label?: unknown; value?: unknown }[])
          .filter((s) => typeof s?.label === "string" && typeof s?.value === "string")
          .map((s) => ({ label: s.label as string, value: s.value as string }))
      : [],
  };
}

export function toCard(m: CardRow) {
  const img = m.images[0];
  return {
    id: m.id,
    slug: m.slug,
    brand: m.brand.name,
    brandSlug: m.brand.slug,
    category: m.category?.name ?? null,
    model: m.model,
    modelYear: m.modelYear,
    priceTL: m.priceTL,
    stockStatus: m.stockStatus,
    summary: m.summary,
    isDemo: m.isDemo,
    image: img
      ? { url: img.media.url, width: img.media.width, height: img.media.height, alt: img.alt || img.media.alt }
      : null,
    specs: specValues(m),
  };
}

export type MotorcycleCard = ReturnType<typeof toCard>;

export const getFeaturedMotorcycles = cache(async (limit = 6) => {
  const rows = await db.motorcycle.findMany({
    where: { published: true, featured: true, ...demoVisibility() },
    include: cardInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
  return rows.map(toCard);
});

export type ShowcaseItem = {
  slug: string;
  label: string;
  brand: { name: string; slug: string };
  model: string;
  image: { url: string; width: number; height: number };
};

/**
 * Tanıtım sayfalarındaki vitrin görselleri: verilen sırayla, yalnızca yayımlanmış ve görseli olan ürünler.
 * Listede olmayan/yayından kalkan ürün sessizce atlanır.
 */
export const getShowcase = cache(async (slugs: string[]): Promise<ShowcaseItem[]> => {
  const rows = await db.motorcycle.findMany({
    where: { slug: { in: slugs }, published: true, ...demoVisibility() },
    include: cardInclude,
  });
  return slugs.flatMap((slug) => {
    const m = rows.find((r) => r.slug === slug);
    const media = m?.images[0]?.media;
    return m && media ? [{ slug, label: `${m.brand.name} ${m.model}`, brand: m.brand, model: m.model, image: media }] : [];
  });
});

/** Verilen sıradaki ürün kartları (ana sayfa sahnesi gibi elle seçilmiş listeler için). */
export const getCardsBySlugs = cache(async (slugs: string[]) => {
  const rows = await db.motorcycle.findMany({
    where: { slug: { in: slugs }, published: true, ...demoVisibility() },
    include: cardInclude,
  });
  return slugs.flatMap((slug) => {
    const m = rows.find((r) => r.slug === slug);
    return m && m.images.length ? [toCard(m)] : [];
  });
});

/** Katalogdaki gerçek sayılar (tanıtım sayfalarında uydurma istatistik yerine kullanılır). */
export const getCatalogStats = cache(async () => {
  const where = { published: true, ...demoVisibility() };
  const [models, categories, brands] = await Promise.all([
    db.motorcycle.count({ where }),
    db.category.count({ where: { published: true, motorcycles: { some: where } } }),
    db.brand.findMany({ where: { motorcycles: { some: where } }, select: { slug: true } }),
  ]);
  return { models, categories, brands: brands.length };
});

/** Verilen markaların yayımlanmış model sayıları ve model adları (kayan şerit için). */
export const getBrandLineup = cache(async (brandSlugs: string[]) => {
  const where = { published: true, ...demoVisibility(), brand: { slug: { in: brandSlugs } } };
  const [rows, models] = await Promise.all([
    db.brand.findMany({
      where: { slug: { in: brandSlugs } },
      select: { name: true, slug: true, _count: { select: { motorcycles: { where: { published: true, ...demoVisibility() } } } } },
      orderBy: { sortOrder: "asc" },
    }),
    db.motorcycle.findMany({ where, select: { model: true, slug: true }, orderBy: { sortOrder: "asc" }, take: 40 }),
  ]);
  return {
    brands: rows.filter((b) => b._count.motorcycles > 0).map((b) => ({ name: b.name, slug: b.slug, count: b._count.motorcycles })),
    models,
  };
});

/** Yayımlanmış ürünü olan kategoriler (boş kategoriler ziyaretçiye gösterilmez). */
export const getVisibleCategories = cache(async () => {
  const categories = await db.category.findMany({
    where: { published: true, motorcycles: { some: { published: true, ...demoVisibility() } } },
    include: {
      image: { select: { url: true, width: true, height: true, alt: true } },
      _count: { select: { motorcycles: { where: { published: true, ...demoVisibility() } } } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return categories;
});

export const getVisibleBrands = cache(async () =>
  db.brand.findMany({
    where: { motorcycles: { some: { published: true, ...demoVisibility() } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true },
  }),
);

export function buildCatalogWhere(f: CatalogFilters): Prisma.MotorcycleWhereInput {
  const and: Prisma.MotorcycleWhereInput[] = [{ published: true }, demoVisibility()];
  if (f.q) {
    const words = f.q.split(/\s+/).filter(Boolean).slice(0, 5);
    for (const w of words) {
      and.push({
        OR: [
          { model: { contains: w, mode: "insensitive" } },
          { brand: { name: { contains: w, mode: "insensitive" } } },
          { category: { name: { contains: w, mode: "insensitive" } } },
        ],
      });
    }
  }
  if (f.brands.length) and.push({ brand: { slug: { in: f.brands } } });
  if (f.categories.length) and.push({ category: { slug: { in: f.categories } } });
  if (f.stock.length) {
    const statuses = STOCK_OPTIONS.filter((o) => f.stock.includes(o.value)).map((o) => o.status);
    and.push({ stockStatus: { in: statuses } });
  }
  if (f.powertrain.length) {
    const p = POWERTRAIN_OPTIONS.filter((o) => f.powertrain.includes(o.value)).map((o) => o.powertrain);
    and.push({ powertrain: { in: p } });
  }
  if (f.cc.length) {
    // Motor hacmi yalnızca benzinli modellere uygulanır
    and.push({
      powertrain: "ICE",
      OR: CC_RANGES.filter((r) => f.cc.includes(r.value)).map((r) => ({
        engineCc: { gte: r.min, ...(r.max != null ? { lte: r.max } : {}) },
      })),
    });
  }
  if (f.min != null || f.max != null) {
    and.push({
      priceTL: { not: null, ...(f.min != null ? { gte: f.min } : {}), ...(f.max != null ? { lte: f.max } : {}) },
    });
  }
  return { AND: and };
}

export const CATALOG_PAGE_SIZE = 24;

export async function searchCatalog(f: CatalogFilters, page = 1) {
  const orderBy: Prisma.MotorcycleOrderByWithRelationInput[] =
    f.sort === "fiyat-artan"
      ? [{ priceTL: { sort: "asc", nulls: "last" } }]
      : f.sort === "fiyat-azalan"
        ? [{ priceTL: { sort: "desc", nulls: "last" } }]
        : f.sort === "yeni"
          ? [{ createdAt: "desc" }]
          : [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }];
  const where = buildCatalogWhere(f);
  const total = await db.motorcycle.count({ where });
  const pages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  const rows = await db.motorcycle.findMany({
    where,
    include: cardInclude,
    orderBy: [...orderBy, { id: "asc" }], // sayfalar arasında kararlı sıra
    skip: (current - 1) * CATALOG_PAGE_SIZE,
    take: CATALOG_PAGE_SIZE,
  });
  return { items: rows.map(toCard), total, page: current, pages };
}

export async function getPriceBounds() {
  const agg = await db.motorcycle.aggregate({
    where: { published: true, priceTL: { not: null }, ...demoVisibility() },
    _min: { priceTL: true },
    _max: { priceTL: true },
  });
  return { min: agg._min.priceTL, max: agg._max.priceTL };
}

const detailInclude = {
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  images: {
    orderBy: { sortOrder: "asc" },
    include: { media: { select: { url: true, width: true, height: true, alt: true } } },
  },
  colors: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.MotorcycleInclude;

export const getMotorcycleBySlug = cache(async (slug: string) => {
  const m = await db.motorcycle.findFirst({
    where: { slug, published: true, ...demoVisibility() },
    include: detailInclude,
  });
  if (!m) return null;
  return {
    ...toCard({ ...m, images: m.images.slice(0, 1) }),
    description: m.description,
    seoTitle: m.seoTitle,
    seoDescription: m.seoDescription,
    brandId: m.brand.id,
    categoryId: m.category?.id ?? null,
    categorySlug: m.category?.slug ?? null,
    updatedAt: m.updatedAt,
    images: m.images.map((i) => ({
      id: i.id,
      url: i.media.url,
      width: i.media.width,
      height: i.media.height,
      alt: i.alt || i.media.alt,
    })),
    colors: m.colors.map((c) => ({ name: c.name, hex: c.hex })),
  };
});

export type MotorcycleDetail = NonNullable<Awaited<ReturnType<typeof getMotorcycleBySlug>>>;

export async function getRelatedMotorcycles(m: MotorcycleDetail, limit = 3) {
  const rows = await db.motorcycle.findMany({
    where: {
      published: true,
      id: { not: m.id },
      ...demoVisibility(),
      OR: [
        ...(m.categoryId ? [{ categoryId: m.categoryId }] : []),
        { brandId: m.brandId },
      ],
    },
    include: cardInclude,
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    take: limit,
  });
  return rows.map(toCard);
}

export async function getMotorcyclesBySlugs(slugs: string[]) {
  if (!slugs.length) return [];
  const rows = await db.motorcycle.findMany({
    where: { slug: { in: slugs.slice(0, 3) }, published: true, ...demoVisibility() },
    include: cardInclude,
  });
  const cards = rows.map(toCard);
  return slugs.map((s) => cards.find((c) => c.slug === s)).filter((c): c is MotorcycleCard => Boolean(c));
}

export async function getCompareOptions() {
  return db.motorcycle.findMany({
    where: { published: true, ...demoVisibility() },
    select: { slug: true, model: true, brand: { select: { name: true } } },
    orderBy: [{ brand: { name: "asc" } }, { model: "asc" }],
  });
}
