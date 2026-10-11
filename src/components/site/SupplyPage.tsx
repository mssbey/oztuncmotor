import type { ComponentType, ReactNode } from "react";
import { ArrowRight, Phone, Whatsapp } from "@/components/icons";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { ContactDetails } from "@/components/site/ContactDetails";
import { ModelMarquee } from "@/components/site/ModelMarquee";
import { ShowcaseHero } from "@/components/site/ShowcaseHero";
import { CtaBand, IconCards, ProcessTimeline, SectionIntro } from "@/components/site/showcase-sections";
import { issueFormToken } from "@/server/security";
import type { getBrandLineup, ShowcaseItem } from "@/server/catalog";
import type { getPublicHours, SiteSettingsView } from "@/server/site";

type Group = { title: string; icon: ComponentType<{ size?: number; className?: string }>; items: string[] };

/** Yedek parça ve aksesuar sayfalarının ortak düzeni: vitrin, gruplar, süreç, talep formu. */
export function SupplyPage({
  crumb,
  word,
  title,
  lead,
  showcase,
  stage,
  highlights,
  lineup,
  groupsTitle,
  groupsText,
  groups,
  note,
  steps,
  formTitle,
  formText,
  formMessage,
  whatsappText,
  cta,
  settings,
  hours,
}: {
  crumb: string;
  word: string;
  title: ReactNode;
  lead: string;
  showcase: ShowcaseItem[];
  stage?: ReactNode;
  highlights: { value: ReactNode; label: string }[];
  lineup: Awaited<ReturnType<typeof getBrandLineup>>;
  groupsTitle: ReactNode;
  groupsText: string;
  groups: Group[];
  note?: string;
  steps: { title: string; text: string }[];
  formTitle: ReactNode;
  formText: string;
  formMessage: string;
  whatsappText: string;
  cta: { title: ReactNode; text: string };
  settings: SiteSettingsView;
  hours: Awaited<ReturnType<typeof getPublicHours>>;
}) {
  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(whatsappText)}`
    : null;
  return (
    <>
      <ShowcaseHero crumb={crumb} eyebrow={`${crumb} · Yuki & Motolux`} title={title} lead={lead} word={word} showcase={showcase} stage={stage} highlights={highlights}>
        <div className="mt-9 flex flex-col gap-3 xs:flex-row xs:flex-wrap">
          <a href="#talep" className="btn btn-primary px-7">
            Talep Oluştur <ArrowRight size={18} />
          </a>
          {whatsappHref && (
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light backdrop-blur-sm">
              <Whatsapp size={18} /> WhatsApp ile sorun
            </a>
          )}
          {settings.phoneHref && (
            <a href={settings.phoneHref} className="btn btn-outline-light backdrop-blur-sm">
              <Phone size={18} /> Bizi arayın
            </a>
          )}
        </div>
      </ShowcaseHero>

      <ModelMarquee brands={lineup.brands} models={lineup.models} />

      <section aria-labelledby="gruplar" className="bg-paper">
        <div className="container-x py-20 lg:py-28">
          <SectionIntro eyebrow={crumb} id="gruplar" title={groupsTitle} text={groupsText} />
          <IconCards items={groups.map((g) => ({ icon: g.icon, title: g.title, points: g.items }))} />
          {note && (
            <p className="reveal mt-8 flex max-w-3xl gap-3 border-l-2 border-accent pl-4 text-[0.9375rem] leading-relaxed text-muted">{note}</p>
          )}
        </div>
      </section>

      <section aria-labelledby="surec" className="on-dark relative isolate overflow-hidden bg-ink text-white">
        <div aria-hidden className="grid-bg absolute inset-0 -z-10 opacity-60" />
        <div className="container-x py-20 lg:py-28">
          <SectionIntro eyebrow="Süreç" id="surec" title="Talepten teslime" dark />
          <ProcessTimeline steps={steps} dark />
        </div>
      </section>

      <section id="talep" aria-labelledby="talep-baslik" className="scroll-mt-24 bg-paper">
        <div className="container-x grid gap-12 py-20 lg:grid-cols-[1fr_1.15fr] lg:gap-16 lg:py-28">
          <div className="reveal grid content-start gap-10">
            <div>
              <p className="eyebrow">Talep formu</p>
              <h2 id="talep-baslik" className="font-display mt-3 text-[2.5rem] font-bold uppercase leading-[0.95] sm:text-5xl lg:text-[3.5rem]">
                {formTitle}
              </h2>
              <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-muted">{formText}</p>
            </div>
            <ContactDetails settings={settings} hours={hours} />
          </div>
          <div className="reveal relative">
            <div aria-hidden className="absolute -inset-3 -z-0 rounded-[18px] bg-gradient-to-br from-accent/25 via-transparent to-ink/10 blur-xl" />
            <div className="card relative h-fit border-t-4 border-t-accent p-6 sm:p-9">
              <InquiryForm formToken={issueFormToken()} defaultMessage={formMessage} submitLabel="Talebi Gönder" />
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        title={cta.title}
        text={cta.text}
        primary={{ href: "/servis-randevusu", label: "Servis Randevusu Al" }}
        phoneHref={settings.phoneHref}
        whatsappHref={whatsappHref}
      />
    </>
  );
}
