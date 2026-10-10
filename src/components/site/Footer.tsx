import Link from "next/link";
import type { SiteSettingsView } from "@/server/site";
import { formatPhone } from "@/lib/validation";
import { Mail, Phone, Pin, Whatsapp } from "@/components/icons";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "./nav";

export function Footer({ settings }: { settings: SiteSettingsView }) {
  const year = new Date().getFullYear();
  return (
    <footer className="on-dark bg-ink text-white">
      <div className="container-x grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:py-20">
        <div className="max-w-sm">
          <Logo logo={settings.logo} />
          <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted-dark">
            Düzce’de motosiklet satışı ve servis hizmetleri. Showroom’umuzda modelleri inceleyebilir,
            servis randevunuzu online oluşturabilirsiniz.
          </p>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-dark">Sayfalar</h2>
          <ul className="mt-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-flex min-h-9 items-center text-white/85 hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/servis-randevusu" className="inline-flex min-h-9 items-center text-white/85 hover:text-white">
                Servis Randevusu
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-dark">Yasal</h2>
          <ul className="mt-4 space-y-1">
            <li>
              <Link href="/kvkk" className="inline-flex min-h-9 items-center text-white/85 hover:text-white">
                KVKK Aydınlatma Metni
              </Link>
            </li>
            <li>
              <Link href="/gizlilik" className="inline-flex min-h-9 items-center text-white/85 hover:text-white">
                Gizlilik Politikası
              </Link>
            </li>
            <li>
              <Link href="/cerez-politikasi" className="inline-flex min-h-9 items-center text-white/85 hover:text-white">
                Çerez Politikası
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-dark">İletişim</h2>
          <address className="mt-4 space-y-3 not-italic">
            <p className="flex gap-3 text-white/85">
              <Pin size={18} className="mt-0.5 shrink-0 text-accent" />
              <span>{settings.fullAddress}</span>
            </p>
            {settings.phoneHref && settings.phone && (
              <p>
                <a href={settings.phoneHref} className="flex items-center gap-3 text-white/85 hover:text-white">
                  <Phone size={18} className="shrink-0 text-accent" />
                  {formatPhone(settings.phone)}
                </a>
              </p>
            )}
            {settings.whatsappNumber && (
              <p>
                <a
                  href={`https://wa.me/${settings.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-white/85 hover:text-white"
                >
                  <Whatsapp size={18} className="shrink-0 text-accent" />
                  WhatsApp ile yazın
                </a>
              </p>
            )}
            {settings.emailHref && (
              <p>
                <a href={settings.emailHref} className="flex items-center gap-3 break-all text-white/85 hover:text-white">
                  <Mail size={18} className="shrink-0 text-accent" />
                  {settings.email}
                </a>
              </p>
            )}
          </address>
          <a
            href={settings.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-9 items-center text-sm font-bold text-white underline decoration-accent decoration-2 underline-offset-4"
          >
            Yol Tarifi Al
          </a>
        </div>
      </div>
      <div className="border-t border-line-dark">
        <div className="container-x flex flex-col gap-2 py-6 text-sm text-muted-dark sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {settings.businessName}. Tüm hakları saklıdır.</p>
          <p>Düzce motosiklet satış ve servis</p>
        </div>
      </div>
    </footer>
  );
}
