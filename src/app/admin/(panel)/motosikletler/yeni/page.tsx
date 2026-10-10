import { MotorcycleForm } from "@/components/admin/MotorcycleForm";
import { BackLink, Notice, PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requirePage } from "@/server/auth";

export const metadata = { title: "Yeni motosiklet" };

export default async function NewMotorcycle() {
  await requirePage("content");
  const [brands, categories] = await Promise.all([
    db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <>
      <BackLink href="/admin/motosikletler">Motosikletler</BackLink>
      <PageTitle title="Yeni motosiklet" description="Kaydettikten sonra fotoğraf ekleyebilirsiniz. Taslak olarak kaydedip hazır olunca yayımlayın." />
      {brands.length === 0 ? (
        <Notice>
          Önce <a href="/admin/markalar" className="font-bold underline">marka ekleyin</a>.
        </Notice>
      ) : (
        <MotorcycleForm values={{}} brands={brands} categories={categories} />
      )}
    </>
  );
}
