import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { RichText } from "@/components/ui/RichText";
import { getPage } from "@/server/site";

export async function PolicyPage({ pageKey }: { pageKey: string }) {
  const page = await getPage(pageKey);
  if (!page) notFound();
  const hasPlaceholders = page.body.includes("[[");
  return (
    <>
      <PageHero crumb={page.title} title={page.title} />
      <section className="bg-white">
        <div className="container-x py-12 lg:py-16">
          <div className="max-w-3xl">
            {hasPlaceholders && (
              <p className="mb-8 rounded-lg border border-[#e8d38a] bg-[#fff8dc] px-4 py-3 text-sm text-[#4a3800]">
                Bu metin taslaktır: vurgulu alanlar işletme bilgileriyle tamamlanmalıdır.
              </p>
            )}
            <RichText source={page.body} />
            <p className="mt-10 text-sm text-muted">
              Son güncelleme: {new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeZone: "Europe/Istanbul" }).format(page.updatedAt)}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
