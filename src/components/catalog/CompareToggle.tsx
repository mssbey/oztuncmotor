"use client";

import { useState } from "react";
import { Check, Compare } from "@/components/icons";
import { COMPARE_LIMIT, useCompare } from "./compare-store";

export function CompareToggle({ slug, label }: { slug: string; label: string }) {
  const compare = useCompare();
  const [message, setMessage] = useState("");
  const selected = compare.has(slug);

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => {
          const result = compare.toggle(slug);
          setMessage(
            result === "full"
              ? `En fazla ${COMPARE_LIMIT} model karşılaştırılabilir.`
              : result === "added"
                ? `${label} karşılaştırmaya eklendi.`
                : `${label} karşılaştırmadan çıkarıldı.`,
          );
        }}
        className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-1 text-sm font-semibold transition-colors ${
          selected ? "text-accent" : "text-muted hover:text-text"
        }`}
      >
        <span
          aria-hidden
          className={`flex h-5 w-5 items-center justify-center rounded border-[1.5px] ${
            selected ? "border-accent bg-accent text-white" : "border-[#a9aba4]"
          }`}
        >
          {selected ? <Check size={14} strokeWidth={3} /> : null}
        </span>
        Karşılaştır
        <Compare size={16} className="sr-only" />
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {message}
      </span>
      {message.startsWith("En fazla") && <span className="text-xs font-semibold text-accent">{message}</span>}
    </div>
  );
}
