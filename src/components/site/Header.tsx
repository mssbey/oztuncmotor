"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Close, Menu, Phone } from "@/components/icons";
import { Logo } from "./Logo";
import { NAV_ITEMS, isActive } from "./nav";

type Props = {
  logo: { url: string; width: number; height: number; alt: string } | null;
  phoneHref: string | null;
  phoneLabel: string | null;
};

export function Header({ logo, phoneHref, phoneLabel }: Props) {
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Sayfa değişince menüyü kapat
  if (open && openedAt !== pathname) {
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab" && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>("a, button"));
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={`on-dark sticky top-0 z-40 bg-ink text-white transition-shadow duration-200 ${
        compact ? "shadow-[0_1px_0_rgb(255_255_255/0.06),0_8px_24px_rgb(0_0_0/0.25)]" : ""
      }`}
    >
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-text"
      >
        İçeriğe geç
      </a>
      <div
        className={`container-x flex items-center justify-between gap-4 transition-[height] duration-200 ${
          compact ? "h-16" : "h-[4.5rem] lg:h-[5.5rem]"
        }`}
      >
        <Link href="/" className="shrink-0 rounded" aria-label="Öztunc Motor ana sayfa">
          <Logo logo={logo} compact={compact} />
        </Link>

        <nav aria-label="Ana menü" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                // Dar masaüstünde logo zaten ana sayfaya gider; menüye yer açmak için gizlenir
                <li key={item.href} className={item.href === "/" ? "hidden xl:block" : undefined}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative inline-flex h-11 items-center whitespace-nowrap px-2.5 text-[0.9375rem] font-semibold transition-colors xl:px-3.5 ${
                      active ? "text-white" : "text-white/70 hover:text-white"
                    }`}
                  >
                    {item.label}
                    {active && <span aria-hidden className="absolute inset-x-2.5 bottom-0 h-0.5 bg-accent xl:inset-x-3.5" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {phoneHref && (
            <a
              href={phoneHref}
              className="hidden items-center gap-2 px-3 text-sm font-semibold text-white/80 hover:text-white xl:inline-flex"
            >
              <Phone size={17} />
              {phoneLabel}
            </a>
          )}
          <Link
            href="/servis-randevusu"
            className={`btn btn-primary hidden whitespace-nowrap sm:inline-flex ${compact ? "btn-sm" : ""}`}
          >
            Servis Randevusu
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-white/10 lg:hidden"
            aria-expanded={open}
            aria-controls="mobil-menu"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            onClick={() => {
              setOpenedAt(pathname);
              setOpen((v) => !v);
            }}
          >
            {open ? <Close size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div
        id="mobil-menu"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-line-dark bg-ink lg:hidden"
      >
        <nav aria-label="Mobil menü" className="container-x py-6">
          <ul className="divide-y divide-line-dark">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className="font-display flex min-h-14 items-center justify-between py-3 text-[1.75rem] font-semibold uppercase tracking-wide"
                  >
                    {item.label}
                    {active && <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-8 grid gap-3">
            <Link href="/servis-randevusu" className="btn btn-primary w-full" onClick={() => setOpen(false)}>
              Servis Randevusu
            </Link>
            {phoneHref && (
              <a href={phoneHref} className="btn btn-outline-light w-full">
                <Phone size={18} /> {phoneLabel}
              </a>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
