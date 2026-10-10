// Katalog filtrelerinin URL parametreleriyle eşlenmesi (istemci ve sunucu ortak).

export const STOCK_OPTIONS = [
  { value: "stokta", status: "IN_STOCK", label: "Stokta" },
  { value: "siparis", status: "ON_ORDER", label: "Sipariş üzerine" },
  { value: "tukendi", status: "SOLD_OUT", label: "Tükendi" },
] as const;

export const STOCK_LABELS = {
  IN_STOCK: "Stokta",
  ON_ORDER: "Sipariş üzerine",
  SOLD_OUT: "Tükendi",
} as const;

export const CC_RANGES = [
  { value: "0-125", label: "125 cc ve altı", min: 0, max: 125 },
  { value: "126-250", label: "126–250 cc", min: 126, max: 250 },
  { value: "251-500", label: "251–500 cc", min: 251, max: 500 },
  { value: "501-900", label: "501–900 cc", min: 501, max: 900 },
  { value: "901-", label: "900 cc üzeri", min: 901, max: null },
] as const;

export const POWERTRAIN_OPTIONS = [
  { value: "benzinli", powertrain: "ICE", label: "Benzinli" },
  { value: "elektrikli", powertrain: "ELECTRIC", label: "Elektrikli" },
] as const;

export const SORT_OPTIONS = [
  { value: "onerilen", label: "Önerilen" },
  { value: "fiyat-artan", label: "Fiyat: Düşükten yükseğe" },
  { value: "fiyat-azalan", label: "Fiyat: Yüksekten düşüğe" },
  { value: "yeni", label: "En yeni eklenen" },
] as const;

export type CatalogFilters = {
  q: string;
  brands: string[];
  categories: string[];
  stock: string[];
  cc: string[];
  powertrain: string[];
  min: number | null;
  max: number | null;
  sort: (typeof SORT_OPTIONS)[number]["value"];
};

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

function get(params: Params, key: string): string {
  if (params instanceof URLSearchParams) return params.get(key) ?? "";
  const v = params[key];
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

function list(params: Params, key: string, allowed?: readonly string[]): string[] {
  const values = get(params, key)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  return allowed ? values.filter((v) => allowed.includes(v)) : values.filter((v) => /^[a-z0-9-]+$/.test(v));
}

function num(params: Params, key: string): number | null {
  const raw = get(params, key).replace(/\D/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 100_000_000) : null;
}

export function parseCatalogParams(params: Params): CatalogFilters {
  const sort = get(params, "sira");
  return {
    q: get(params, "q").trim().slice(0, 80),
    brands: list(params, "marka"),
    categories: list(params, "kategori"),
    stock: list(params, "stok", STOCK_OPTIONS.map((o) => o.value)),
    cc: list(params, "hacim", CC_RANGES.map((o) => o.value)),
    powertrain: list(params, "tip", POWERTRAIN_OPTIONS.map((o) => o.value)),
    min: num(params, "min"),
    max: num(params, "max"),
    sort: (SORT_OPTIONS.find((o) => o.value === sort)?.value ?? "onerilen") as CatalogFilters["sort"],
  };
}

export function catalogQueryString(f: Partial<CatalogFilters>): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.brands?.length) sp.set("marka", f.brands.join(","));
  if (f.categories?.length) sp.set("kategori", f.categories.join(","));
  if (f.powertrain?.length) sp.set("tip", f.powertrain.join(","));
  if (f.cc?.length) sp.set("hacim", f.cc.join(","));
  if (f.stock?.length) sp.set("stok", f.stock.join(","));
  if (f.min != null) sp.set("min", String(f.min));
  if (f.max != null) sp.set("max", String(f.max));
  if (f.sort && f.sort !== "onerilen") sp.set("sira", f.sort);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function hasActiveFilters(f: CatalogFilters): boolean {
  return Boolean(
    f.q ||
      f.brands.length ||
      f.categories.length ||
      f.stock.length ||
      f.cc.length ||
      f.powertrain.length ||
      f.min != null ||
      f.max != null,
  );
}

const tl = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

export function formatPrice(price: number | null | undefined): string | null {
  if (price == null) return null;
  return `${tl.format(price)} TL`;
}

export function formatNumber(n: number | string | null | undefined, digits = 1): string {
  if (n == null || n === "") return "";
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: digits }).format(Number(n));
}
