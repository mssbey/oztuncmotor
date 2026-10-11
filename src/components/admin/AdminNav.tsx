"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Close, Menu } from "@/components/icons";

export type NavItem = { href: string; label: string; badge?: number; group: string };

export function AdminNav({ items, footer }: { items: NavItem[]; footer: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  if (open && openedAt !== pathname) setOpen(false);

  const groups = [...new Set(items.map((i) => i.group))];
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <>
      <div className="on-dark flex h-14 items-center justify-between bg-ink px-4 text-white lg:hidden">
        <Link href="/admin" className="font-display text-xl font-bold uppercase tracking-wide">
          Öztunc <span className="text-muted-dark">Panel</span>
        </Link>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10"
          aria-expanded={open}
          aria-controls="admin-menu"
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          onClick={() => {
            setOpenedAt(pathname);
            setOpen((v) => !v);
          }}
        >
          {open ? <Close size={22} /> : <Menu size={22} />}
        </button>
      </div>
      <aside
        id="admin-menu"
        className={`on-dark bg-ink text-white lg:sticky lg:top-0 lg:block lg:h-dvh lg:w-64 lg:shrink-0 lg:overflow-y-auto ${open ? "block" : "hidden"}`}
      >
        <div className="hidden px-6 pb-4 pt-6 lg:block">
          <Link href="/admin" className="font-display text-2xl font-bold uppercase tracking-wide">
            Öztunc <span className="text-muted-dark">Panel</span>
          </Link>
        </div>
        <nav aria-label="Yönetim menüsü" className="px-3 pb-6">
          {groups.map((g) => (
            <div key={g} className="mt-4">
              <p className="px-3 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-muted-dark">{g}</p>
              <ul className="mt-1.5">
                {items
                  .filter((i) => i.group === g)
                  .map((item) => {
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={`flex min-h-10 items-center justify-between rounded-lg px-3 text-sm font-semibold ${
                            active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {active && <span aria-hidden className="h-4 w-0.5 bg-accent" />}
                            {item.label}
                          </span>
                          {item.badge ? (
                            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">
                              {item.badge}
                              <span className="sr-only"> yeni</span>
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
          <div className="mt-6 border-t border-line-dark px-3 pt-4">{footer}</div>
        </nav>
      </aside>
    </>
  );
}
