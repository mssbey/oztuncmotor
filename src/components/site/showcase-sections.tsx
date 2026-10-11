import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ArrowRight, Phone, Whatsapp } from "@/components/icons";

type Icon = ComponentType<{ size?: number; className?: string }>;

/** Bölüm başlığı: kırmızı çizgili üst etiket, büyük başlık, isteğe bağlı açıklama. */
export function SectionIntro({
  eyebrow,
  title,
  text,
  id,
  dark = false,
  center = false,
}: {
  eyebrow: string;
  title: ReactNode;
  text?: ReactNode;
  id?: string;
  dark?: boolean;
  center?: boolean;
}) {
  return (
    <div className={`reveal max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="font-display mt-3 text-[2.5rem] font-bold uppercase leading-[0.95] sm:text-5xl lg:text-[3.5rem]">
        {title}
      </h2>
      {text && (
        <div className={`mt-4 text-[1.0625rem] leading-relaxed ${dark ? "text-white/70" : "text-muted"}`}>{text}</div>
      )}
    </div>
  );
}

/** İkonlu kart ızgarası: numara, ikon, başlık, açıklama ve/veya madde listesi. */
export function IconCards({
  items,
  columns = 3,
}: {
  items: { icon: Icon; title: string; text?: string; points?: string[]; href?: string; cta?: string }[];
  columns?: 2 | 3 | 4;
}) {
  const cols = columns === 4 ? "lg:grid-cols-4" : columns === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";
  return (
    <ul className={`mt-12 grid gap-4 sm:grid-cols-2 ${cols} lg:gap-5`}>
      {items.map((item, i) => {
        const body = (
          <>
            <div className="flex items-start justify-between gap-4">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-ink text-accent shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)] transition-colors group-hover:bg-accent group-hover:text-white">
                <item.icon size={28} />
              </span>
              <span className="font-display text-4xl font-bold leading-none tabular-nums text-line transition-colors group-hover:text-accent/25">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="font-display mt-6 text-[1.75rem] font-bold uppercase leading-none">{item.title}</h3>
            {item.text && <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{item.text}</p>}
            {item.points && (
              <ul className="mt-4 grid gap-2 border-t border-line pt-4 text-[0.9375rem] text-[#2b2e33]">
                {item.points.map((p) => (
                  <li key={p} className="flex gap-2.5">
                    <span aria-hidden className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rotate-45 bg-accent" />
                    {p}
                  </li>
                ))}
              </ul>
            )}
            {item.href && (
              <span className="link-arrow mt-auto pt-6 text-sm">
                {item.cta ?? "Detaylar"} <ArrowRight size={16} className="text-accent" />
              </span>
            )}
          </>
        );
        const cls = "lift-card group card flex h-full flex-col p-6 sm:p-7";
        return (
          <li key={item.title} className="reveal">
            {item.href ? (
              <Link href={item.href} className={cls}>
                {body}
              </Link>
            ) : (
              <div className={cls}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Adım adım süreç: masaüstünde yatay zaman çizelgesi, mobilde dikey. */
export function ProcessTimeline({ steps, dark = false }: { steps: { title: string; text: string }[]; dark?: boolean }) {
  return (
    <ol className="relative mt-14 grid gap-10 lg:grid-cols-4 lg:gap-6">
      <span
        aria-hidden
        className={`absolute bottom-6 left-[1.4rem] top-6 w-px lg:bottom-auto lg:left-6 lg:right-6 lg:top-[1.4rem] lg:h-px lg:w-auto ${
          dark ? "bg-gradient-to-b from-accent via-white/20 to-transparent lg:bg-gradient-to-r" : "bg-gradient-to-b from-accent via-line to-transparent lg:bg-gradient-to-r"
        }`}
      />
      {steps.map((s, i) => (
        <li key={s.title} className="reveal relative pl-16 lg:pl-0 lg:pt-16">
          <span
            className={`font-display absolute left-0 top-0 inline-flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold ring-[6px] ${
              i === 0 ? "bg-accent text-white" : dark ? "bg-surface-2 text-white" : "bg-ink text-white"
            } ${dark ? "ring-ink" : "ring-white"}`}
          >
            {i + 1}
          </span>
          <h3 className={`text-xl font-extrabold ${dark ? "text-white" : ""}`}>{s.title}</h3>
          <p className={`mt-2 text-[0.9375rem] leading-relaxed ${dark ? "text-white/65" : "text-muted"}`}>{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

/** Sayfa sonundaki kırmızı çağrı bandı. */
export function CtaBand({
  title,
  text,
  primary,
  phoneHref,
  whatsappHref,
}: {
  title: ReactNode;
  text: string;
  primary: { href: string; label: string };
  phoneHref?: string | null;
  whatsappHref?: string | null;
}) {
  return (
    <section className="on-dark stripe-band relative overflow-hidden text-white">
      <div className="container-x flex flex-col gap-8 py-14 lg:flex-row lg:items-center lg:justify-between lg:py-16">
        <div className="reveal max-w-2xl">
          <h2 className="font-display text-[2.5rem] font-bold uppercase leading-[0.92] sm:text-5xl lg:text-6xl">{title}</h2>
          <p className="mt-3 text-lg text-white/85">{text}</p>
        </div>
        <div className="flex flex-col gap-3 xs:flex-row lg:shrink-0">
          <Link href={primary.href} className="btn bg-white px-7 text-text hover:bg-paper">
            {primary.label} <ArrowRight size={18} />
          </Link>
          {whatsappHref && (
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light">
              <Whatsapp size={18} /> WhatsApp
            </a>
          )}
          {phoneHref && (
            <a href={phoneHref} className="btn btn-outline-light">
              <Phone size={18} /> Ara
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
