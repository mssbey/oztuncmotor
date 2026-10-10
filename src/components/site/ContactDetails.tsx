import type { SiteSettingsView } from "@/server/site";
import { formatPhone } from "@/lib/validation";
import { WEEKDAY_NAMES } from "@/lib/time";
import { ArrowRight, Clock, Mail, Phone, Pin, Whatsapp } from "@/components/icons";

type Hours = { weekday: number; isOpen: boolean; openTime: string; closeTime: string; breakStart: string | null; breakEnd: string | null }[] | null;

/** Adres, girilmiş iletişim bilgileri ve (yayımlanmışsa) çalışma saatleri. */
export function ContactDetails({ settings, hours }: { settings: SiteSettingsView; hours: Hours }) {
  const hasDirectContact = Boolean(settings.phoneHref || settings.whatsappNumber || settings.emailHref);
  return (
    <div className="grid gap-8">
      <div className="flex gap-4">
        <Pin size={22} className="mt-1 shrink-0 text-accent" />
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-muted">Adres</h3>
          <address className="mt-1.5 text-lg font-semibold not-italic leading-snug">{settings.fullAddress}</address>
          <a
            href={settings.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-arrow mt-3 text-[0.9375rem]"
          >
            Yol Tarifi Al <ArrowRight size={16} className="text-accent" />
            <span className="sr-only">(Google Haritalar yeni sekmede açılır)</span>
          </a>
        </div>
      </div>

      {hours && (
        <div className="flex gap-4">
          <Clock size={22} className="mt-1 shrink-0 text-accent" />
          <div className="w-full max-w-sm">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-muted">Çalışma saatleri</h3>
            <dl className="mt-2 divide-y divide-line">
              {hours.map((d) => (
                <div key={d.weekday} className="flex justify-between gap-4 py-1.5 text-[0.9375rem]">
                  <dt className="font-semibold">{WEEKDAY_NAMES[d.weekday - 1]}</dt>
                  <dd className={d.isOpen ? "tabular-nums" : "text-muted"}>
                    {d.isOpen
                      ? `${d.openTime}–${d.closeTime}${d.breakStart && d.breakEnd ? ` (mola ${d.breakStart}–${d.breakEnd})` : ""}`
                      : "Kapalı"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {hasDirectContact && (
        <div className="flex flex-wrap gap-3">
          {settings.phoneHref && settings.phone && (
            <a href={settings.phoneHref} className="btn btn-dark">
              <Phone size={18} /> {formatPhone(settings.phone)}
            </a>
          )}
          {settings.whatsappNumber && (
            <a
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              <Whatsapp size={18} /> WhatsApp
            </a>
          )}
          {settings.emailHref && (
            <a href={settings.emailHref} className="btn btn-outline">
              <Mail size={18} /> E-posta gönder
            </a>
          )}
        </div>
      )}
    </div>
  );
}
