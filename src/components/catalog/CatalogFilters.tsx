"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import {
  CC_RANGES,
  POWERTRAIN_OPTIONS,
  SORT_OPTIONS,
  STOCK_OPTIONS,
  catalogQueryString,
  type CatalogFilters as Filters,
} from "@/lib/catalog";
import { Close, Filter, Search } from "@/components/icons";

type Option = { value: string; label: string };

type Props = {
  filters: Filters;
  brands: Option[];
  categories: Option[];
  resultCount: number;
  children: ReactNode;
};

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function CatalogFilters({ filters, brands, categories, resultCount, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [panelOpen, setPanelOpen] = useState(false);
  const [q, setQ] = useState(filters.q);
  const [min, setMin] = useState(filters.min?.toString() ?? "");
  const [max, setMax] = useState(filters.max?.toString() ?? "");
  const [syncedFrom, setSyncedFrom] = useState(filters);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);

  // URL dışarıdan değişirse (ör. "Filtreleri Temizle") alanları eşitle
  if (syncedFrom !== filters) {
    setSyncedFrom(filters);
    setQ(filters.q);
    setMin(filters.min?.toString() ?? "");
    setMax(filters.max?.toString() ?? "");
  }

  function apply(next: Partial<Filters>) {
    const merged = { ...filters, ...next };
    startTransition(() => {
      router.replace(`${pathname}${catalogQueryString(merged)}`, { scroll: false });
    });
  }

  // Arama: yazmayı bitirince uygula
  useEffect(() => {
    if (q === filters.q) return;
    const t = setTimeout(() => apply({ q: q.trim() }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    if (!panelOpen) return;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPanelOpen(false);
        openRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [panelOpen]);

  function applyPrice() {
    const parse = (v: string) => (v.replace(/\D/g, "") ? Number(v.replace(/\D/g, "")) : null);
    let lo = parse(min);
    let hi = parse(max);
    if (lo != null && hi != null && lo > hi) [lo, hi] = [hi, lo];
    if (lo !== filters.min || hi !== filters.max) apply({ min: lo, max: hi });
  }

  const activeCount =
    filters.brands.length +
    filters.categories.length +
    filters.stock.length +
    filters.cc.length +
    filters.powertrain.length +
    (filters.min != null || filters.max != null ? 1 : 0);

  const ccDisabled = filters.powertrain.length === 1 && filters.powertrain[0] === "elektrikli";

  const groups = (
    <div className="divide-y divide-line">
      {categories.length > 0 && (
        <FilterGroup title="Kategori">
          {categories.map((c) => (
            <Chip
              key={c.value}
              active={filters.categories.includes(c.value)}
              onClick={() => apply({ categories: toggle(filters.categories, c.value) })}
            >
              {c.label}
            </Chip>
          ))}
        </FilterGroup>
      )}
      {brands.length > 0 && (
        <FilterGroup title="Marka">
          {brands.map((b) => (
            <Chip
              key={b.value}
              active={filters.brands.includes(b.value)}
              onClick={() => apply({ brands: toggle(filters.brands, b.value) })}
            >
              {b.label}
            </Chip>
          ))}
        </FilterGroup>
      )}
      <FilterGroup title="Güç aktarımı">
        {POWERTRAIN_OPTIONS.map((o) => (
          <Chip
            key={o.value}
            active={filters.powertrain.includes(o.value)}
            onClick={() => apply({ powertrain: toggle(filters.powertrain, o.value) })}
          >
            {o.label}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup
        title="Motor hacmi"
        hint={ccDisabled ? "Elektrikli modellerde motor hacmi yerine güç ve menzil kullanılır." : "Yalnızca benzinli modellere uygulanır."}
      >
        {CC_RANGES.map((o) => (
          <Chip
            key={o.value}
            active={filters.cc.includes(o.value)}
            disabled={ccDisabled}
            onClick={() => apply({ cc: toggle(filters.cc, o.value) })}
          >
            {o.label}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title="Fiyat aralığı (TL)" hint="Fiyatı girilmemiş modeller fiyat filtresinde gösterilmez.">
        <form
          className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            applyPrice();
          }}
        >
          <label className="sr-only" htmlFor="fiyat-min">
            En düşük fiyat
          </label>
          <input
            id="fiyat-min"
            inputMode="numeric"
            placeholder="En az"
            className="input min-h-11 py-2"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            onBlur={applyPrice}
          />
          <span aria-hidden className="text-muted">
            –
          </span>
          <label className="sr-only" htmlFor="fiyat-max">
            En yüksek fiyat
          </label>
          <input
            id="fiyat-max"
            inputMode="numeric"
            placeholder="En çok"
            className="input min-h-11 py-2"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            onBlur={applyPrice}
          />
          <button type="submit" className="sr-only">
            Fiyat aralığını uygula
          </button>
        </form>
      </FilterGroup>
      <FilterGroup title="Stok durumu">
        {STOCK_OPTIONS.map((o) => (
          <Chip
            key={o.value}
            active={filters.stock.includes(o.value)}
            onClick={() => apply({ stock: toggle(filters.stock, o.value) })}
          >
            {o.label}
          </Chip>
        ))}
      </FilterGroup>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:gap-10">
      <aside aria-label="Filtreler" className="hidden lg:block">
        <div className="sticky top-24 -mt-5">{groups}</div>
      </aside>
      <div className="min-w-0">
      {/* Üst çubuk: arama, mobil filtre düğmesi, sıralama */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="model-ara" className="sr-only">
            Model ara
          </label>
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="model-ara"
            type="search"
            placeholder="Marka veya model ara"
            className="input pl-10"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply({ q: q.trim() });
            }}
          />
        </div>
        <div className="flex gap-3">
          <button
            ref={openRef}
            type="button"
            className="btn btn-outline flex-1 lg:hidden"
            aria-expanded={panelOpen}
            aria-controls="filtre-paneli"
            onClick={() => setPanelOpen(true)}
          >
            <Filter size={18} />
            Filtrele
            {activeCount > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs text-white">
                {activeCount}
              </span>
            )}
          </button>
          <div className="flex-1 sm:w-60 sm:flex-none">
            <label htmlFor="siralama" className="sr-only">
              Sıralama
            </label>
            <select
              id="siralama"
              className="input"
              value={filters.sort}
              onChange={(e) => apply({ sort: e.target.value as Filters["sort"] })}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {pending ? "Sonuçlar güncelleniyor" : `${resultCount} model bulundu`}
      </p>

      <div className={`transition-opacity duration-150 ${pending ? "opacity-60" : ""}`}>{children}</div>
      </div>

      {/* Mobil filtre paneli */}
      <div
        id="filtre-paneli"
        role="dialog"
        aria-modal="true"
        aria-label="Filtreler"
        hidden={!panelOpen}
        className="fixed inset-0 z-50 lg:hidden"
      >
        <div className="absolute inset-0 bg-ink/50" onClick={() => setPanelOpen(false)} aria-hidden />
        <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-display text-2xl font-bold uppercase">Filtreler</h2>
            <button
              ref={closeRef}
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-black/5"
              aria-label="Filtreleri kapat"
              onClick={() => setPanelOpen(false)}
            >
              <Close size={22} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4">{groups}</div>
          <div className="grid grid-cols-2 gap-3 border-t border-line bg-white p-4">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => apply({ brands: [], categories: [], stock: [], cc: [], powertrain: [], min: null, max: null })}
            >
              Temizle
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setPanelOpen(false)}>
              {pending ? "Güncelleniyor…" : `${resultCount} sonucu göster`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  const id = useId();
  return (
    <fieldset className="py-5" aria-describedby={hint ? id : undefined}>
      <legend className="float-left mb-3 w-full text-sm font-extrabold uppercase tracking-[0.12em]">{title}</legend>
      <div className="clear-both flex flex-wrap gap-2">{children}</div>
      {hint && (
        <p id={id} className="field-hint">
          {hint}
        </p>
      )}
    </fieldset>
  );
}

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="chip disabled:cursor-not-allowed disabled:opacity-45"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
