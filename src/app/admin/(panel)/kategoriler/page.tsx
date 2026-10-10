import { ActionButton, ActionForm } from "@/components/admin/ActionForm";
import { Field, Toggle } from "@/components/admin/Field";
import { ImageField } from "@/components/admin/ImageField";
import { Badge, PageTitle, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requirePage } from "@/server/auth";
import { deleteCategory, saveCategory } from "../../actions/catalog";

export const metadata = { title: "Kategoriler" };

type Cat = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  published: boolean;
  image: { id: string; url: string; width: number; height: number } | null;
};

function CategoryFields({ c }: { c?: Cat }) {
  return (
    <div className="grid gap-4">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="name" label="Kategori adı" defaultValue={c?.name ?? ""} required />
        <Field name="slug" label="Kısa ad (URL)" defaultValue={c?.slug ?? ""} hint="Boşsa addan üretilir." />
        <Field name="sortOrder" label="Sıra" inputMode="numeric" defaultValue={c?.sortOrder ?? 0} />
      </div>
      <Field name="description" label="Kısa açıklama" maxLength={300} defaultValue={c?.description ?? ""} />
      <ImageField name="imageId" label="Kategori görseli" current={c?.image ?? null} folder="kategori" contain hint="Kategoriyi temsil eden, düz zeminli bir ürün fotoğrafı." />
      <Toggle name="published" label="Yayında" defaultChecked={c?.published ?? true} hint="Yayımlanmış ürünü olmayan kategoriler ziyaretçiye zaten gösterilmez." />
    </div>
  );
}

export default async function CategoriesPage() {
  await requirePage("content");
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      image: { select: { id: true, url: true, width: true, height: true } },
      _count: { select: { motorcycles: { where: { published: true } } } },
    },
  });
  return (
    <>
      <PageTitle title="Kategoriler" description="Ana sayfadaki hızlı kategori seçimi ve katalog filtresi. Boş kategoriler sitede gizlenir." />
      <div className="grid gap-6">
        <Panel title="Yeni kategori">
          <ActionForm action={saveCategory} submitLabel="Kategori ekle" resetOnSuccess>
            <CategoryFields />
          </ActionForm>
        </Panel>
        <Panel title={`Kategoriler (${categories.length})`}>
          <ul className="divide-y divide-line">
            {categories.map((c) => (
              <li key={c.id} className="py-3">
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{c.name}</span>
                      <span className="text-xs text-muted">{c._count.motorcycles} yayında model</span>
                      {!c.published && <Badge>Taslak</Badge>}
                      {c.published && c._count.motorcycles === 0 && <Badge tone="amber">Boş — sitede gizli</Badge>}
                      {c.isDemo && <Badge tone="amber">DEMO</Badge>}
                    </span>
                    <span className="text-sm font-semibold text-accent">Düzenle</span>
                  </summary>
                  <div className="mt-4 rounded-lg bg-paper p-4">
                    <ActionForm action={saveCategory}>
                      <CategoryFields c={c} />
                    </ActionForm>
                    <div className="mt-4 border-t border-line pt-4">
                      <ActionButton
                        action={deleteCategory}
                        fields={{ id: c.id }}
                        label="Kategoriyi sil"
                        confirm={`${c.name} silinsin mi? Bağlı ürünler kategorisiz kalır.`}
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
