import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompareToggle } from "@/components/catalog/CompareToggle";
import { Gallery } from "@/components/catalog/Gallery";
import { MotorcycleCard } from "@/components/catalog/MotorcycleCard";
import { DemoBadge, StockBadge } from "@/components/catalog/StockBadge";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { ArrowRight, Phone, Whatsapp } from "@/components/icons";
import { ProductJsonLd } from "@/components/site/JsonLd";
import { formatPrice } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";
import { specRows } from "@/lib/specs";
import { formatPhone } from "@/lib/validation";
import { getMotorcycleBySlug, getRelatedMotorcycles } from "@/server/catalog";
import { issueFormToken } from "@/server/security";
import { getSiteSettings, whatsappLink } from "@/server/site";

export async function generateMetadata({ params }: PageProps<"/motosikletler/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const m = await getMotorcycleBySlug(slug);
  if (!m) return { title: "Model bulunamadı" };
  const title = m.seoTitle || `${m.brand} ${m.model}${m.modelYear ? ` (${m.modelYear})` : ""} | Düzce`;
  const price = formatPrice(m.priceTL);
  const description =
    m.seoDescription ||
    [
      `${m.brand} ${m.model}`,
      m.summary,
      price ? `Fiyat: ${price}.` : "Fiyat bilgisi için iletişime geçin.",
      "Öztunç Motor, Düzce.",
    ]
      .filter(Boolean)
      .join(" ")
      .slice(0, 300);
  return {
    ...buildMetadata({ title, description, path: `/motosikletler/${m.slug}`, image: m.images[0] }),
    ...(m.isDemo ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function MotorcyclePage({ params }: PageProps<"/motosikletler/[slug]">) {
  const { slug } = await params;
  const m = await getMotorcycleBySlug(slug);
  if (!m) notFound();
  const [related, settings] = await Promise.all([getRelatedMotorcycles(m), getSiteSettings()]);

  const title = `${m.brand} ${m.model}`;
  const price = formatPrice(m.priceTL);
  const rows = specRows(m.specs);
  const waText = `Merhaba, ${title}${m.modelYear ? ` (${m.modelYear})` : ""} modeli hakkında bilgi almak istiyorum.`;
  const wa = whatsappLink(settings.whatsappNumber, waText);

  return (
    <>
      <ProductJsonLd item={m} />
      <div className="bg-paper">
        <div className="container-x pt-6 lg:pt-8">
          <nav aria-label="Sayfa yolu" className="text-sm text-muted">
            <ol className="flex flex-wrap gap-x-2 gap-y-1">
              <li>
                <Link href="/" className="hover:text-text">
                  Ana Sayfa
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href="/motosikletler" className="hover:text-text">
                  Motosikletler
                </Link>
              </li>
              {m.category && m.categorySlug && (
                <>
                  <li aria-hidden>/</li>
                  <li>
                    <Link href={`/motosikletler?kategori=${m.categorySlug}`} className="hover:text-text">
                      {m.category}
                    </Link>
                  </li>
                </>
              )}
              <li aria-hidden>/</li>
              <li aria-current="page" className="font-semibold text-text">
                {m.model}
              </li>
            </ol>
          </nav>
        </div>

        <section className="container-x grid gap-8 pb-14 pt-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-12 lg:pb-20">
          <Gallery images={m.images} title={title} />

          <div className="lg:pt-2">
            <div className="flex flex-wrap items-center gap-2">
              {m.isDemo && <DemoBadge />}
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">{m.brand}</p>
            </div>
            <h1 className="font-display mt-2 text-5xl font-bold uppercase leading-[0.92] sm:text-6xl">
              {m.model}
              {m.modelYear && <span className="ml-3 align-middle text-2xl font-semibold text-muted sm:text-3xl">{m.modelYear}</span>}
            </h1>
            {m.summary && <p className="mt-4 text-[1.0625rem] leading-relaxed text-[#2b2e33]">{m.summary}</p>}

            <div className="mt-6 border-y border-line py-5">
              {price ? (
                <>
                  <p className="text-sm font-semibold text-muted">Liste fiyatı</p>
                  <p className="mt-0.5 text-3xl font-extrabold tracking-tight">{price}</p>
                </>
              ) : (
                <p className="text-xl font-extrabold">Fiyat bilgisi alın</p>
              )}
              <StockBadge status={m.stockStatus} className="mt-2 text-[0.9375rem]" />
            </div>

            {m.colors.length > 0 && (
              <div className="mt-5">
                <h2 className="text-sm font-extrabold uppercase tracking-[0.12em]">Renk seçenekleri</h2>
                <ul className="mt-3 flex flex-wrap gap-3">
                  {m.colors.map((c) => (
                    <li key={c.name} className="flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-3.5 text-sm font-semibold">
                      <span aria-hidden className="h-6 w-6 rounded-full border border-black/10" style={{ background: c.hex }} />
                      {c.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-7 grid gap-3">
              <a href="#bilgi-al" className="btn btn-primary">
                Bu Model İçin Bilgi Al <ArrowRight size={18} />
              </a>
              <div className="grid gap-3 xs:grid-cols-2">
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                    <Whatsapp size={18} /> WhatsApp’tan sor
                  </a>
                )}
                {settings.phoneHref && settings.phone && (
                  <a href={settings.phoneHref} className="btn btn-outline">
                    <Phone size={18} /> {formatPhone(settings.phone)}
                  </a>
                )}
              </div>
              {wa && (
                <p className="text-xs text-muted">
                  WhatsApp bağlantısı, model adı yazılı bir sohbet başlatır; mesajı siz gönderirsiniz.
                </p>
              )}
            </div>
            <div className="mt-4">
              <CompareToggle slug={m.slug} label={title} />
            </div>
          </div>
        </section>
      </div>

      <section className="border-t border-line bg-white">
        <div className="container-x grid gap-12 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <div>
            <h2 className="font-display text-4xl font-bold uppercase leading-none">Teknik özellikler</h2>
            <table className="mt-6 w-full text-left text-[0.9375rem]">
              <caption className="sr-only">{title} teknik özellikleri</caption>
              <tbody className="divide-y divide-line border-y border-line">
                {rows.map((r) => (
                  <tr key={r.label}>
                    <th scope="row" className="w-1/2 py-3 pr-4 font-semibold text-muted">
                      {r.label}
                    </th>
                    <td className="py-3 font-semibold">{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length <= 1 && (
              <p className="mt-4 text-sm text-muted">Bu model için teknik özellikler henüz girilmedi. Bilgi almak için bize ulaşın.</p>
            )}
            {m.description && (
              <div className="mt-12">
                <h2 className="font-display text-4xl font-bold uppercase leading-none">Açıklama</h2>
                <div className="mt-5 space-y-4 text-[1.0625rem] leading-relaxed text-[#2b2e33]">
                  {m.description.split(/\n{2,}/).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div id="bilgi-al" className="scroll-mt-28">
            <div className="card p-6 sm:p-8">
              <h2 className="font-display text-4xl font-bold uppercase leading-none">Bu model için bilgi al</h2>
              <p className="mt-3 text-[0.9375rem] text-muted">
                Fiyat, stok, renk ve teslim süresi hakkında sizi arayalım. Talebiniz {title} modeliyle birlikte kaydedilir.
              </p>
              <div className="mt-6">
                <InquiryForm
                  formToken={issueFormToken()}
                  motorcycleId={m.id}
                  defaultMessage={`${title} modeli hakkında bilgi almak istiyorum.`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-line bg-paper">
          <div className="container-x py-14 lg:py-20">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-4xl font-bold uppercase leading-none">İlgili modeller</h2>
              <Link href="/motosikletler" className="link-arrow shrink-0 text-sm">
                Tüm modeller <ArrowRight size={16} className="text-accent" />
              </Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3 lg:gap-6">
              {related.map((r) => (
                <MotorcycleCard key={r.id} item={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
