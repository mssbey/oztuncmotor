import Image from "next/image";
import Link from "next/link";
import { ActionButton } from "@/components/admin/ActionForm";
import { Badge, EmptyRow, PageTitle, Table } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { STOCK_LABELS, formatPrice } from "@/lib/catalog";
import { requirePage } from "@/server/auth";
import { deleteAllDemoContent, deleteMotorcycle, toggleMotorcycleFlag } from "../../actions/catalog";

export const metadata = { title: "Motosikletler" };

export default async function AdminMotorcycles({ searchParams }: PageProps<"/admin/motosikletler">) {
  await requirePage("content");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const items = await db.motorcycle.findMany({
    where: q
      ? { OR: [{ model: { contains: q, mode: "insensitive" } }, { brand: { name: { contains: q, mode: "insensitive" } } }] }
      : {},
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1, include: { media: { select: { url: true } } } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  const demoCount = items.filter((i) => i.isDemo).length;

  return (
    <>
      <PageTitle
        title="Motosikletler"
        description="Yayımlanan modeller katalogda görünür. Öne çıkanlar ana sayfada listelenir."
        actions={
          <>
            {demoCount > 0 && (
              <ActionButton
                action={deleteAllDemoContent}
                label="Demo içeriği sil"
                confirm="Tüm demo ürünler, demo markalar/kategoriler ve demo görseller silinecek. Emin misiniz?"
              />
            )}
            <Link href="/admin/motosikletler/yeni" className="btn btn-primary btn-sm">
              Yeni motosiklet
            </Link>
          </>
        }
      />
      <form className="mb-4 flex max-w-md gap-2" role="search">
        <label htmlFor="ara" className="sr-only">
          Model ara
        </label>
        <input id="ara" name="q" defaultValue={q} placeholder="Marka veya model ara" className="input min-h-10 py-2" />
        <button className="btn btn-dark btn-sm">Ara</button>
      </form>
      <Table>
        <thead>
          <tr>
            <th className="w-20">Görsel</th>
            <th>Model</th>
            <th>Fiyat</th>
            <th>Stok</th>
            <th>Durum</th>
            <th className="text-right">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && <EmptyRow colSpan={6}>Kayıt bulunamadı.</EmptyRow>}
          {items.map((m) => (
            <tr key={m.id}>
              <td>
                <div className="studio-floor relative h-12 w-16 overflow-hidden rounded">
                  {m.images[0] && <Image src={m.images[0].media.url} alt="" fill sizes="64px" className="object-contain p-0.5" />}
                </div>
              </td>
              <td>
                <Link href={`/admin/motosikletler/${m.id}`} className="font-bold hover:text-accent">
                  {m.brand.name} {m.model}
                </Link>
                <p className="text-xs text-muted">
                  {m.category?.name ?? "Kategorisiz"} {m.modelYear ? `· ${m.modelYear}` : ""} {m.isDemo && <Badge tone="amber">DEMO</Badge>}
                </p>
              </td>
              <td className="tabular-nums">{formatPrice(m.priceTL) ?? <span className="text-muted">—</span>}</td>
              <td>{STOCK_LABELS[m.stockStatus]}</td>
              <td>
                <div className="flex flex-wrap gap-1.5">
                  <ActionButton
                    action={toggleMotorcycleFlag}
                    fields={{ id: m.id, flag: "published" }}
                    className={`rounded px-2 py-1 text-xs font-bold ${m.published ? "bg-[#e3f2e9] text-success" : "bg-[#ecece7] text-[#3d4148]"}`}
                    label={m.published ? "Yayında" : "Taslak"}
                  />
                  <ActionButton
                    action={toggleMotorcycleFlag}
                    fields={{ id: m.id, flag: "featured" }}
                    className={`rounded px-2 py-1 text-xs font-bold ${m.featured ? "bg-[#fdecea] text-[#8c1d18]" : "bg-[#ecece7] text-[#3d4148]"}`}
                    label={m.featured ? "Öne çıkan" : "Öne çıkar"}
                  />
                </div>
              </td>
              <td className="text-right">
                <div className="inline-flex gap-2">
                  <Link href={`/admin/motosikletler/${m.id}`} className="btn btn-outline btn-sm">
                    Düzenle
                  </Link>
                  <ActionButton
                    action={deleteMotorcycle}
                    fields={{ id: m.id }}
                    label="Sil"
                    confirm={`${m.brand.name} ${m.model} ve görselleri kalıcı olarak silinecek. Emin misiniz?`}
                    className="btn btn-sm border-[#f3c4c0] text-[#b3261e] hover:bg-[#fdecea]"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
