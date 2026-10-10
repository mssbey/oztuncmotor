import { ActionButton, ActionForm } from "@/components/admin/ActionForm";
import { Field, Toggle } from "@/components/admin/Field";
import { Badge, PageTitle, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requirePage } from "@/server/auth";
import { deleteBrand, saveBrand } from "../../actions/catalog";

export const metadata = { title: "Markalar" };

function BrandFields({ b }: { b?: { id: string; name: string; slug: string; sortOrder: number; authorizedDealer: boolean; authorizedService: boolean } }) {
  return (
    <div className="grid gap-4">
      {b && <input type="hidden" name="id" value={b.id} />}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="name" label="Marka adı" defaultValue={b?.name ?? ""} required />
        <Field name="slug" label="Kısa ad (URL)" defaultValue={b?.slug ?? ""} hint="Boşsa addan üretilir." />
        <Field name="sortOrder" label="Sıra" inputMode="numeric" defaultValue={b?.sortOrder ?? 0} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle
          name="authorizedDealer"
          label="Yetkili satıcıyız (doğrulandı)"
          defaultChecked={b?.authorizedDealer}
          hint="Yalnızca resmi yetki belgesi varsa işaretleyin."
        />
        <Toggle
          name="authorizedService"
          label="Yetkili servisiz (doğrulandı)"
          defaultChecked={b?.authorizedService}
          hint="Yalnızca resmi yetki belgesi varsa işaretleyin."
        />
      </div>
    </div>
  );
}

export default async function BrandsPage() {
  await requirePage("content");
  const brands = await db.brand.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { motorcycles: true } } },
  });
  return (
    <>
      <PageTitle
        title="Markalar"
        description="Katalog filtresinde ve servis randevu formunda kullanılan markalar. Yetki işaretleri yalnızca doğrulanmış bilgiler içindir."
      />
      <div className="grid gap-6">
        <Panel title="Yeni marka">
          <ActionForm action={saveBrand} submitLabel="Marka ekle" resetOnSuccess>
            <BrandFields />
          </ActionForm>
        </Panel>
        <Panel title={`Kayıtlı markalar (${brands.length})`}>
          {brands.length === 0 ? (
            <p className="text-sm text-muted">Henüz marka yok.</p>
          ) : (
            <ul className="divide-y divide-line">
              {brands.map((b) => (
                <li key={b.id} className="py-3">
                  <details>
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">{b.name}</span>
                        <span className="text-xs text-muted">{b._count.motorcycles} model</span>
                        {b.isDemo && <Badge tone="amber">DEMO</Badge>}
                        {b.authorizedDealer && <Badge tone="green">Yetkili satıcı</Badge>}
                        {b.authorizedService && <Badge tone="green">Yetkili servis</Badge>}
                      </span>
                      <span className="text-sm font-semibold text-accent">Düzenle</span>
                    </summary>
                    <div className="mt-4 rounded-lg bg-paper p-4">
                      <ActionForm action={saveBrand} submitLabel="Kaydet">
                        <BrandFields b={b} />
                      </ActionForm>
                      <div className="mt-4 border-t border-line pt-4">
                        <ActionButton
                          action={deleteBrand}
                          fields={{ id: b.id }}
                          label="Markayı sil"
                          confirm={`${b.name} silinsin mi?`}
                          className="btn btn-sm border-[#f3c4c0] text-[#b3261e] hover:bg-[#fdecea]"
                        />
                      </div>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
