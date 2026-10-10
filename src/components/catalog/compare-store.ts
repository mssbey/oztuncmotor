"use client";

import { useSyncExternalStore } from "react";

// Karşılaştırma için seçilen model kısa adları (slug). Yalnızca arayüz tercihidir;
// ürün verisi her zaman sunucudan okunur.
const KEY = "oz-compare";
export const COMPARE_LIMIT = 3;

const listeners = new Set<() => void>();
let cache: string[] | null = null;
const EMPTY: string[] = [];

function read(): string[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string" && /^[a-z0-9-]+$/.test(s)).slice(0, COMPARE_LIMIT)
      : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: string[]) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* depolama kapalıysa yalnızca bellekte tut */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCompare() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    items,
    has: (slug: string) => items.includes(slug),
    toggle: (slug: string): "added" | "removed" | "full" => {
      const current = read();
      if (current.includes(slug)) {
        write(current.filter((s) => s !== slug));
        return "removed";
      }
      if (current.length >= COMPARE_LIMIT) return "full";
      write([...current, slug]);
      return "added";
    },
    set: (slugs: string[]) => write(slugs.slice(0, COMPARE_LIMIT)),
    clear: () => write([]),
  };
}
