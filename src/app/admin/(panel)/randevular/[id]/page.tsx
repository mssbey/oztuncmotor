import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { Field } from "@/components/admin/Field";
import { BackLink, Badge, PageTitle, Panel, STATUS_TONES } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDateLong, formatDateTime } from "@/lib/time";
import { formatPhone } from "@/lib/validation";
import { STATUS_LABELS } from "@/server/appointments";
import { requirePage } from "@/server/auth";
import { addAppointmentNote, changeAppointmentTime, setAppointmentStatus } from "../../../actions/customers";

export const metadata = { title: "Randevu" };

export default async function AppointmentDetail({ params }: PageProps<"/admin/randevular/[id]">) {
  await requirePage("customers");
  const { id } = await params;
  const a = await db.appointment.findUnique({
    where: { id },
    include: { notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } } },
  });
  if (!a) notFound();

  const rows: [string, React.ReactNode][] = [
    ["Talep edilen zaman", `${formatDateLong(a.slotDate)}, ${a.slotTime}`],
    ["Motosiklet", `${a.brandName} ${a.model}`],
    ["Model yılı", a.modelYear ?? "—"],
    ["Kilometre", a.mileageKm != null ? `${a.mileageKm.toLocaleString("tr-TR")} km` : "—"],
    ["Plaka", a.plate ?? "—"],
    ["İşlem", a.serviceName],
    ["Açıklama", a.description ? <span className="whitespace-pre-line">{a.description}</span> : "—"],
    ["Oluşturulma", formatDateTime(a.createdAt)],
    ["KVKK onayı", formatDateTime(a.kvkkAcceptedAt)],
    ["Pazarlama izni", a.marketingConsent ? "Verdi" : "Vermedi"],
  ];

  return (
    <>
      <BackLink href="/admin/randevular">Randevular</BackLink>
      <PageTitle
        title={a.fullName}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONES[a.status]}>{STATUS_LABELS[a.status]}</Badge>
            <span className="font-mono">{a.reference}</span>
          </span>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-6">
          <Panel title="İletişim">
            <div className="flex flex-wrap gap-3">
              <a href={`tel:+90${a.phone}`} className="btn btn-dark btn-sm">
                {formatPhone(a.phone)}
              </a>
              <a href={`https://wa.me/90${a.phone}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                WhatsApp sohbeti aç
              </a>
              {a.email && (
                <a href={`mailto:${a.email}`} className="btn btn-outline btn-sm">
                  {a.email}
                </a>
              )}
            </div>
            <p className="mt-2 text-xs text-muted">WhatsApp bağlantısı yalnızca sohbet açar; otomatik mesaj gönderilmez.</p>
          </Panel>
          <Panel title="Randevu bilgileri">
            <dl className="divide-y divide-line text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-[11rem_1fr]">
                  <dt className="font-semibold text-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel title="İç notlar" description="Yalnızca panel kullanıcıları görür.">
            <ActionForm action={addAppointmentNote} submitLabel="Not ekle" resetOnSuccess>
              <input type="hidden" name="id" value={a.id} />
              <Field as="textarea" rows={3} name="body" label="Yeni not" maxLength={2000} />
            </ActionForm>
            {a.notes.length > 0 && (
              <ul className="mt-5 divide-y divide-line">
                {a.notes.map((n) => (
                  <li key={n.id} className="py-3 text-sm">
                    <p className="whitespace-pre-line">{n.body}</p>
                    <p className="mt-1 text-xs text-muted">
                      {n.author?.name ?? "Silinmiş kullanıcı"} · {formatDateTime(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <div className="grid content-start gap-6">
          <Panel title="Durum">
            <ActionForm action={setAppointmentStatus} submitLabel="Durumu güncelle">
              <input type="hidden" name="id" value={a.id} />
              <Field as="select" name="status" label="Durum" defaultValue={a.status}>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Field>
            </ActionForm>
            <p className="mt-3 text-xs text-muted">
              İptal edilen randevular slot kapasitesini serbest bırakır. Yeniden açarken kapasite tekrar kontrol edilir.
            </p>
          </Panel>
          <Panel title="Zamanı değiştir" description="Müşteriyle kararlaştırılan kesin zamanı girin. Kapasite kontrol edilir.">
            <ActionForm action={changeAppointmentTime} submitLabel="Zamanı güncelle">
              <input type="hidden" name="id" value={a.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field type="date" name="date" label="Tarih" defaultValue={a.slotDate} />
                <Field type="time" name="time" label="Saat" defaultValue={a.slotTime} step={60} />
              </div>
            </ActionForm>
            <p className="mt-3 text-xs text-muted">
              Saat, <Link href="/admin/calisma-saatleri" className="underline">çalışma saatlerindeki</Link> slot başlangıçlarından biri olmalı.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
