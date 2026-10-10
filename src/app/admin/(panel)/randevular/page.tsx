import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import type { AppointmentStatus } from "@/generated/prisma/enums";
import { Badge, EmptyRow, PageTitle, STATUS_TONES, Table } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDateShort, isValidDateString } from "@/lib/time";
import { formatPhone, normalizePhone } from "@/lib/validation";
import { STATUS_LABELS } from "@/server/appointments";
import { requirePage } from "@/server/auth";

export const metadata = { title: "Randevular" };

const PAGE_SIZE = 50;

export default async function AppointmentsPage({ searchParams }: PageProps<"/admin/randevular">) {
  await requirePage("customers");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const status = typeof sp.durum === "string" && sp.durum in STATUS_LABELS ? (sp.durum as AppointmentStatus) : "";
  const from = typeof sp.baslangic === "string" && isValidDateString(sp.baslangic) ? sp.baslangic : "";
  const to = typeof sp.bitis === "string" && isValidDateString(sp.bitis) ? sp.bitis : "";
  const page = Math.max(1, Number(sp.sayfa) || 1);

  const and: Prisma.AppointmentWhereInput[] = [];
  if (status) and.push({ status });
  if (from) and.push({ slotDate: { gte: from } });
  if (to) and.push({ slotDate: { lte: to } });
  if (q) {
    const phone = normalizePhone(q);
    and.push({
      OR: [
        { reference: { contains: q, mode: "insensitive" } },
        { fullName: { contains: q, mode: "insensitive" } },
        { plate: { contains: q.replace(/\s/g, ""), mode: "insensitive" } },
        { plate: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { brandName: { contains: q, mode: "insensitive" } },
        { phone: { contains: (phone ?? q.replace(/\D/g, "")) || q } },
      ],
    });
  }
  const where = { AND: and };
  const [items, total] = await Promise.all([
    db.appointment.findMany({
      where,
      orderBy: [{ slotStart: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.appointment.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const s = new URLSearchParams();
    if (q) s.set("q", q);
    if (status) s.set("durum", status);
    if (from) s.set("baslangic", from);
    if (to) s.set("bitis", to);
    s.set("sayfa", String(p));
    return `?${s}`;
  };

  return (
    <>
      <PageTitle
        title="Randevular"
        description="Yeni talepler “Onay Bekliyor” durumuyla gelir. Müşteriyle görüştükten sonra onaylayın veya zamanı güncelleyin."
        actions={
          <Link href="/admin/takvim" className="btn btn-outline btn-sm">
            Takvim görünümü
          </Link>
        }
      />
      <form className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end" role="search">
        <div>
          <label htmlFor="q" className="field-label">
            Ara
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Ad, telefon, plaka, referans…" className="input min-h-10 py-2" />
        </div>
        <div>
          <label htmlFor="durum" className="field-label">
            Durum
          </label>
          <select id="durum" name="durum" defaultValue={status} className="input min-h-10 py-2">
            <option value="">Tümü</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="baslangic" className="field-label">
            Başlangıç
          </label>
          <input id="baslangic" type="date" name="baslangic" defaultValue={from} className="input min-h-10 py-2" />
        </div>
        <div>
          <label htmlFor="bitis" className="field-label">
            Bitiş
          </label>
          <input id="bitis" type="date" name="bitis" defaultValue={to} className="input min-h-10 py-2" />
        </div>
        <div className="flex gap-2">
          <button className="btn btn-dark btn-sm">Filtrele</button>
          <Link href="/admin/randevular" className="btn btn-outline btn-sm">
            Temizle
          </Link>
        </div>
      </form>
      <p className="mb-3 text-sm text-muted">{total} kayıt</p>
      <Table>
        <thead>
          <tr>
            <th>Zaman</th>
            <th>Müşteri</th>
            <th>Motosiklet</th>
            <th>İşlem</th>
            <th>Durum</th>
            <th>Referans</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && <EmptyRow colSpan={6}>Kriterlere uyan randevu yok.</EmptyRow>}
          {items.map((a) => (
            <tr key={a.id} className="hover:bg-paper">
              <td className="whitespace-nowrap font-bold tabular-nums">
                <Link href={`/admin/randevular/${a.id}`} className="hover:text-accent">
                  {formatDateShort(a.slotDate)} {a.slotTime}
                </Link>
              </td>
              <td>
                <Link href={`/admin/randevular/${a.id}`} className="font-semibold hover:text-accent">
                  {a.fullName}
                </Link>
                <p className="text-xs text-muted tabular-nums">{formatPhone(a.phone)}</p>
              </td>
              <td>
                {a.brandName} {a.model}
                {a.plate && <p className="text-xs text-muted">{a.plate}</p>}
              </td>
              <td>{a.serviceName}</td>
              <td>
                <Badge tone={STATUS_TONES[a.status]}>{STATUS_LABELS[a.status]}</Badge>
              </td>
              <td className="font-mono text-xs">{a.reference}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {pages > 1 && (
        <nav aria-label="Sayfalar" className="mt-4 flex items-center gap-2 text-sm">
          {page > 1 && (
            <Link href={qs(page - 1)} className="btn btn-outline btn-sm">
              Önceki
            </Link>
          )}
          <span className="text-muted">
            Sayfa {page} / {pages}
          </span>
          {page < pages && (
            <Link href={qs(page + 1)} className="btn btn-outline btn-sm">
              Sonraki
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
