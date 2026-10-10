import Link from "next/link";
import type { InquiryStatus } from "@/generated/prisma/enums";
import { ActionForm } from "@/components/admin/ActionForm";
import { Field } from "@/components/admin/Field";
import { Badge, PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/time";
import { formatPhone } from "@/lib/validation";
import { requirePage } from "@/server/auth";
import { INQUIRY_STATUS_LABELS } from "@/server/inquiries";
import { updateInquiry } from "../../actions/customers";

export const metadata = { title: "Bilgi talepleri" };

const TONE = { NEW: "red", CONTACTED: "blue", CLOSED: "gray" } as const;

export default async function InquiriesPage({ searchParams }: PageProps<"/admin/talepler">) {
  await requirePage("customers");
  const sp = await searchParams;
  const status = typeof sp.durum === "string" && sp.durum in INQUIRY_STATUS_LABELS ? (sp.durum as InquiryStatus) : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const items = await db.inquiry.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { reference: { contains: q, mode: "insensitive" } },
              { motorcycleLabel: { contains: q, mode: "insensitive" } },
              { phone: { contains: q.replace(/\D/g, "").replace(/^0/, "") || q } },
            ],
          }
        : {}),
    },
    include: { motorcycle: { select: { id: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <PageTitle title="Bilgi talepleri" description="Ürün sayfalarından ve iletişim formundan gelen talepler." />
      <form className="card mb-4 flex flex-wrap items-end gap-3 p-4" role="search">
        <div className="min-w-48 flex-1">
          <label htmlFor="q" className="field-label">
            Ara
          </label>
          <input id="q" name="q" defaultValue={q} className="input min-h-10 py-2" placeholder="Ad, telefon, model, referans" />
        </div>
        <div>
          <label htmlFor="durum" className="field-label">
            Durum
          </label>
          <select id="durum" name="durum" defaultValue={status ?? ""} className="input min-h-10 py-2">
            <option value="">Tümü</option>
            {Object.entries(INQUIRY_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-dark btn-sm">Filtrele</button>
      </form>

      {items.length === 0 ? (
        <p className="card p-8 text-center text-sm text-muted">Talep yok.</p>
      ) : (
        <ul className="grid gap-3">
          {items.map((i) => (
            <li key={i.id} className="card p-4 sm:p-5">
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                  <span>
                    <span className="font-bold">{i.fullName}</span>
                    <span className="ml-2 text-sm text-muted">{i.motorcycleLabel ?? "Genel iletişim"}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted">
                    {formatDateTime(i.createdAt)}
                    <Badge tone={TONE[i.status]}>{INQUIRY_STATUS_LABELS[i.status]}</Badge>
                  </span>
                </summary>
                <div className="mt-4 grid gap-5 border-t border-line pt-4 lg:grid-cols-2">
                  <div className="text-sm">
                    <p className="font-mono text-xs text-muted">{i.reference}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a href={`tel:+90${i.phone}`} className="btn btn-dark btn-sm">
                        {formatPhone(i.phone)}
                      </a>
                      <a href={`https://wa.me/90${i.phone}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                        WhatsApp sohbeti aç
                      </a>
                      {i.email && (
                        <a href={`mailto:${i.email}`} className="btn btn-outline btn-sm">
                          {i.email}
                        </a>
                      )}
                    </div>
                    {i.message && <p className="mt-3 whitespace-pre-line rounded-lg bg-paper p-3">{i.message}</p>}
                    {i.motorcycle && (
                      <Link href={`/admin/motosikletler/${i.motorcycle.id}`} className="mt-3 inline-block font-semibold underline">
                        Ürünü panelde aç
                      </Link>
                    )}
                    <p className="mt-2 text-xs text-muted">Pazarlama izni: {i.marketingConsent ? "Verdi" : "Vermedi"}</p>
                  </div>
                  <ActionForm action={updateInquiry} className="grid gap-3">
                    <input type="hidden" name="id" value={i.id} />
                    <Field as="select" name="status" label="Durum" defaultValue={i.status}>
                      {Object.entries(INQUIRY_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </Field>
                    <Field as="textarea" rows={3} name="internalNote" label="İç not" defaultValue={i.internalNote} />
                  </ActionForm>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
