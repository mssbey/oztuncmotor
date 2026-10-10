"use client";

import { useState } from "react";
import { SPEC_FIELDS } from "@/lib/specs";
import { saveMotorcycle } from "@/app/admin/actions/catalog";
import { ActionForm } from "./ActionForm";
import { Field, Toggle } from "./Field";

type Option = { id: string; name: string };

export type MotorcycleFormValues = {
  id?: string;
  slug?: string;
  brandId?: string;
  categoryId?: string | null;
  model?: string;
  modelYear?: number | null;
  powertrain?: "ICE" | "ELECTRIC";
  priceTL?: number | null;
  stockStatus?: "IN_STOCK" | "ON_ORDER" | "SOLD_OUT";
  summary?: string;
  description?: string;
  featured?: boolean;
  published?: boolean;
  sortOrder?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  specs?: Record<string, string | number | null>;
  extraSpecs?: { label: string; value: string }[];
  colors?: { name: string; hex: string }[];
};

export function MotorcycleForm({ values, brands, categories }: { values: MotorcycleFormValues; brands: Option[]; categories: Option[] }) {
  const [powertrain, setPowertrain] = useState<"ICE" | "ELECTRIC">(values.powertrain ?? "ICE");
  const [extras, setExtras] = useState(values.extraSpecs?.length ? values.extraSpecs : []);
  const [colors, setColors] = useState(values.colors ?? []);

  return (
    <ActionForm action={saveMotorcycle} submitLabel={values.id ? "Değişiklikleri kaydet" : "Motosikleti oluştur"} className="grid gap-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <section className="card grid gap-5 p-5 sm:p-6">
        <h2 className="text-base font-extrabold">Temel bilgiler</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Field as="select" name="brandId" label="Marka" defaultValue={values.brandId ?? ""} required>
            <option value="">Seçin</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Field>
          <Field name="model" label="Model" defaultValue={values.model ?? ""} required maxLength={80} />
          <Field as="select" name="categoryId" label="Kategori" defaultValue={values.categoryId ?? ""}>
            <option value="">Kategorisiz</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Field>
          <Field name="modelYear" label="Model yılı" inputMode="numeric" defaultValue={values.modelYear ?? ""} />
          <Field
            name="priceTL"
            label="Fiyat (TL, KDV dahil)"
            inputMode="numeric"
            defaultValue={values.priceTL ?? ""}
            hint="Boş bırakılırsa sitede “Fiyat bilgisi alın” yazar."
          />
          <Field as="select" name="stockStatus" label="Stok durumu" defaultValue={values.stockStatus ?? "ON_ORDER"}>
            <option value="IN_STOCK">Stokta</option>
            <option value="ON_ORDER">Sipariş üzerine</option>
            <option value="SOLD_OUT">Tükendi</option>
          </Field>
          <Field
            name="slug"
            label="Bağlantı adı (URL)"
            defaultValue={values.slug ?? ""}
            hint="Boş bırakılırsa marka ve modelden üretilir. Yayındaki bir ürünün adresini değiştirmek eski bağlantıları bozar."
          />
          <Field name="sortOrder" label="Sıralama" inputMode="numeric" defaultValue={values.sortOrder ?? 0} hint="Küçük sayı önce gösterilir." />
        </div>
        <Field name="summary" label="Kısa özet" defaultValue={values.summary ?? ""} maxLength={220} hint="Kartlarda ve arama sonuçlarında görünür (en fazla 220 karakter)." />
        <Field as="textarea" name="description" label="Açıklama" rows={6} defaultValue={values.description ?? ""} hint="Paragrafları boş satırla ayırın." />
        <div className="flex flex-wrap gap-6">
          <Toggle name="published" label="Yayında" defaultChecked={values.published ?? false} />
          <Toggle name="featured" label="Ana sayfada öne çıkar" defaultChecked={values.featured ?? false} />
        </div>
      </section>

      <section className="card grid gap-5 p-5 sm:p-6">
        <div>
          <h2 className="text-base font-extrabold">Teknik özellikler</h2>
          <p className="mt-1 text-sm text-muted">Yalnızca doğrulanmış değerleri girin. Boş alanlar sitede gösterilmez.</p>
        </div>
        <fieldset>
          <legend className="field-label">Güç aktarımı</legend>
          <div className="flex gap-3">
            {(["ICE", "ELECTRIC"] as const).map((p) => (
              <label key={p} className={`chip ${powertrain === p ? "" : ""}`} data-active={powertrain === p}>
                <input
                  type="radio"
                  name="powertrain"
                  value={p}
                  checked={powertrain === p}
                  onChange={() => setPowertrain(p)}
                  className="sr-only"
                />
                {p === "ICE" ? "Benzinli" : "Elektrikli"}
              </label>
            ))}
          </div>
          <p className="field-hint">Elektrikli modellerde motor hacmi yerine motor gücü, batarya ve menzil alanları kullanılır.</p>
        </fieldset>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SPEC_FIELDS.filter((f) => !f.only || f.only === powertrain).map((f) => (
            <Field
              key={f.key}
              name={f.key}
              label={`${f.label}${f.unit ? ` (${f.unit})` : ""}`}
              inputMode={f.kind === "text" ? undefined : "decimal"}
              defaultValue={values.specs?.[f.key] ?? ""}
            />
          ))}
        </div>

        <div>
          <p className="field-label">Ek özellikler</p>
          <div className="grid gap-2">
            {extras.map((e, i) => (
              <div key={i} className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
                <input aria-label={`Ek özellik ${i + 1} adı`} name="extraLabel" defaultValue={e.label} placeholder="Ör. Lastik ölçüsü (ön)" className="input min-h-10 py-2" />
                <input aria-label={`Ek özellik ${i + 1} değeri`} name="extraValue" defaultValue={e.value} placeholder="Ör. 120/70-17" className="input min-h-10 py-2" />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setExtras((x) => x.filter((_, j) => j !== i))} aria-label="Ek özelliği kaldır">
                  Kaldır
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-outline btn-sm mt-3" onClick={() => setExtras((x) => [...x, { label: "", value: "" }])}>
            + Özellik ekle
          </button>
        </div>
      </section>

      <section className="card grid gap-4 p-5 sm:p-6">
        <div>
          <h2 className="text-base font-extrabold">Renk seçenekleri</h2>
          <p className="mt-1 text-sm text-muted">Satışta olan renkleri ekleyin. Hiç renk girilmezse bu bölüm sitede görünmez.</p>
        </div>
        {colors.map((c, i) => (
          <div key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:grid-cols-[auto_1fr_10rem_auto]">
            <input
              type="color"
              aria-label={`Renk ${i + 1} seçici`}
              value={/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : "#000000"}
              onChange={(e) => setColors((cs) => cs.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
              className="h-10 w-12 cursor-pointer rounded border border-line"
            />
            <input
              name="colorName"
              aria-label={`Renk ${i + 1} adı`}
              value={c.name}
              onChange={(e) => setColors((cs) => cs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              placeholder="Renk adı"
              className="input min-h-10 py-2"
            />
            <input
              name="colorHex"
              aria-label={`Renk ${i + 1} kodu`}
              value={c.hex}
              onChange={(e) => setColors((cs) => cs.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
              className="input hidden min-h-10 py-2 font-mono sm:block"
            />
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setColors((cs) => cs.filter((_, j) => j !== i))}>
              Kaldır
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-outline btn-sm justify-self-start" onClick={() => setColors((cs) => [...cs, { name: "", hex: "#111315" }])}>
          + Renk ekle
        </button>
      </section>

      <section className="card grid gap-5 p-5 sm:p-6">
        <h2 className="text-base font-extrabold">Arama motoru (SEO)</h2>
        <Field name="seoTitle" label="SEO başlığı" maxLength={70} defaultValue={values.seoTitle ?? ""} hint="Boşsa “Marka Model | Düzce” kullanılır. En fazla 70 karakter." />
        <Field as="textarea" rows={2} name="seoDescription" label="SEO açıklaması" maxLength={170} defaultValue={values.seoDescription ?? ""} hint="Boşsa özet ve fiyattan üretilir. En fazla 170 karakter." />
      </section>
    </ActionForm>
  );
}
