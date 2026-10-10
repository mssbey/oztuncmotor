"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { COMPARE_LIMIT, useCompare } from "./compare-store";

type Option = { slug: string; label: string };

/** Karşılaştırma yuvaları: URL esas alınır, seçim yerel tercihle eşitlenir. */
export function ComparePicker({ selected, options }: { selected: string[]; options: Option[] }) {
  const router = useRouter();
  const compare = useCompare();

  // URL'de seçim yoksa ama tarayıcıda kayıtlı seçim varsa ona yönlendir
  useEffect(() => {
    if (selected.length === 0 && compare.items.length > 0) {
      router.replace(`/karsilastir?modeller=${compare.items.join(",")}`);
    } else if (selected.length > 0 && selected.join(",") !== compare.items.join(",")) {
      compare.set(selected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.join(",")]);

  function update(index: number, slug: string) {
    const next = [...selected];
    if (slug) next[index] = slug;
    else next.splice(index, 1);
    const unique = [...new Set(next.filter(Boolean))].slice(0, COMPARE_LIMIT);
    compare.set(unique);
    router.replace(unique.length ? `/karsilastir?modeller=${unique.join(",")}` : "/karsilastir", { scroll: false });
  }

  const slots = Array.from({ length: COMPARE_LIMIT }, (_, i) => selected[i] ?? "");

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {slots.map((value, i) => (
        <div key={i}>
          <label htmlFor={`karsilastir-${i}`} className="field-label">
            {i + 1}. model
          </label>
          <select
            id={`karsilastir-${i}`}
            className="input"
            value={value}
            disabled={i > selected.length}
            onChange={(e) => update(i, e.target.value)}
          >
            <option value="">{value ? "— Kaldır —" : "Model seçin"}</option>
            {options
              .filter((o) => o.slug === value || !selected.includes(o.slug))
              .map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.label}
                </option>
              ))}
          </select>
        </div>
      ))}
    </div>
  );
}
