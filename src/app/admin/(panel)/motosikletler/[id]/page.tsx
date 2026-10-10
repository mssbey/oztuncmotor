import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/ActionForm";
import { MotorcycleForm } from "@/components/admin/MotorcycleForm";
import { MotorcycleImages } from "@/components/admin/MotorcycleImages";
import { BackLink, Notice, PageTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { SPEC_FIELDS } from "@/lib/specs";
import { requirePage } from "@/server/auth";
import { deleteMotorcycle } from "../../../actions/catalog";

export const metadata = { title: "Motosiklet düzenle" };

export default async function EditMotorcycle({ params, searchParams }: PageProps<"/admin/motosikletler/[id]">) {
  await requirePage("content");
  const { id } = await params;
  const sp = await searchParams;
  const [m, brands, categories] = await Promise.all([
    db.motorcycle.findUnique({
      where: { id },
      include: {
        brand: { select: { name: true } },
        colors: { orderBy: { sortOrder: "asc" } },
        images: { orderBy: { sortOrder: "asc" }, include: { media: true } },
      },
    }),
    db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!m) notFound();

  const specs: Record<string, string | number | null> = {};
  for (const f of SPEC_FIELDS) {
    const v = m[f.key as keyof typeof m];
    specs[f.key] = v == null ? null : typeof v === "object" ? Number(v) : (v as string | number);
  }

  return (
    <>
      <BackLink href="/admin/motosikletler">Motosikletler</BackLink>
      <PageTitle
        title={`${m.brand.name} ${m.model}`}
        description={m.published ? "Yayında" : "Taslak — sitede görünmez"}
        actions={
          <>
            {m.published && (
              <Link href={`/motosikletler/${m.slug}`} target="_blank" className="btn btn-outline btn-sm">
                Sitede gör
              </Link>
            )}
            <ActionButton
              action={deleteMotorcycle}
              fields={{ id: m.id, redirect: "1" }}
              label="Sil"
              confirm="Bu motosiklet ve fotoğrafları kalıcı olarak silinecek. Emin misiniz?"
              className="btn btn-sm border-[#f3c4c0] text-[#b3261e] hover:bg-[#fdecea]"
            />
          </>
        }
      />
      {sp.yeni && (
        <div className="mb-6">
          <Notice tone="green">Motosiklet oluşturuldu. Şimdi fotoğraf ekleyebilirsiniz.</Notice>
        </div>
      )}
      {m.isDemo && (
        <div className="mb-6">
          <Notice>Bu bir DEMO kayıttır; üretim ortamında gösterilmez.</Notice>
        </div>
      )}
      <div className="grid gap-6">
        <MotorcycleImages
          motorcycleId={m.id}
          images={m.images.map((i) => ({ id: i.id, url: i.media.url, alt: i.alt, width: i.media.width, height: i.media.height }))}
        />
        <MotorcycleForm
          brands={brands}
          categories={categories}
          values={{
            id: m.id,
            slug: m.slug,
            brandId: m.brandId,
            categoryId: m.categoryId,
            model: m.model,
            modelYear: m.modelYear,
            powertrain: m.powertrain,
            priceTL: m.priceTL,
            stockStatus: m.stockStatus,
            summary: m.summary,
            description: m.description,
            featured: m.featured,
            published: m.published,
            sortOrder: m.sortOrder,
            seoTitle: m.seoTitle,
            seoDescription: m.seoDescription,
            specs,
            extraSpecs: Array.isArray(m.extraSpecs) ? (m.extraSpecs as { label: string; value: string }[]) : [],
            colors: m.colors.map((c) => ({ name: c.name, hex: c.hex })),
          }}
        />
      </div>
    </>
  );
}
