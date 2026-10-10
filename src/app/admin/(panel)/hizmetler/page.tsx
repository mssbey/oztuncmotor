import { ActionButton, ActionForm } from "@/components/admin/ActionForm";
import { Field, Toggle } from "@/components/admin/Field";
import { Badge, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requirePage } from "@/server/auth";
import { deleteService, saveService } from "../../actions/catalog";

export const metadata = { title: "Servis hizmetleri" };

type S = { id: string; title: string; slug: string; description: string; sortOrder: number; published: boolean; bookable: boolean };

function ServiceFields({ s }: { s?: S }) {
  return (
    <div className="grid gap-4">
      {s && <input type="hidden" name="id" value={s.id} />}
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field name="title" label="Hizmet adı" defaultValue={s?.title ?? ""} required />
        <Field name="sortOrder" label="Sıra" inputMode="numeric" defaultValue={s?.sortOrder ?? 0} />
      </div>
      <Field as="textarea" rows={2} name="description" label="Kısa açıklama" maxLength={400} defaultValue={s?.description ?? ""} />
      <div className="flex flex-wrap gap-6">
        <Toggle name="published" label="Sitede yayımla" defaultChecked={s?.published ?? false} hint="Yalnızca gerçekte verilen hizmetleri yayımlayın." />
        <Toggle name="bookable" label="Randevu formunda seçilebilir" defaultChecked={s?.bookable ?? true} />
      </div>
    </div>
  );
}

export default async function ServicesPage() {
  await requirePage("content");
  const services = await db.serviceItem.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }] });
  const published = services.filter((s) => s.published).length;
  return (
    <>
      <PageTitle title="Servis hizmetleri" description="Servis bölümünde listelenen ve randevu formunda seçilebilen işlemler." />
      {published === 0 && (
        <div className="mb-6">
          <Notice>Yayımlanmış hizmet yok. Online randevu formu en az bir yayımlanmış ve seçilebilir hizmet gerektirir.</Notice>
        </div>
      )}
      <div className="grid gap-6">
        <Panel title="Yeni hizmet">
          <ActionForm action={saveService} submitLabel="Hizmet ekle" resetOnSuccess>
            <ServiceFields />
          </ActionForm>
        </Panel>
        <Panel title={`Hizmetler (${services.length})`}>
          <ul className="divide-y divide-line">
            {services.map((s) => (
              <li key={s.id} className="py-3">
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{s.title}</span>
                      {s.published ? <Badge tone="green">Yayında</Badge> : <Badge>Taslak</Badge>}
                      {!s.bookable && <Badge>Randevuda yok</Badge>}
                      {s.isDemo && <Badge tone="amber">DEMO</Badge>}
                    </span>
                    <span className="text-sm font-semibold text-accent">Düzenle</span>
                  </summary>
                  <div className="mt-4 rounded-lg bg-paper p-4">
                    <ActionForm action={saveService}>
                      <ServiceFields s={s} />
                    </ActionForm>
                    <div className="mt-4 border-t border-line pt-4">
                      <ActionButton
                        action={deleteService}
                        fields={{ id: s.id }}
                        label="Hizmeti sil"
                        confirm={`${s.title} silinsin mi? Geçmiş randevulardaki kayıt korunur.`}
                        className="btn btn-sm border-[#f3c4c0] text-[#b3261e] hover:bg-[#fdecea]"
                      />
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
