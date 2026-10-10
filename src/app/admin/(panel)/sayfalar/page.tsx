import Link from "next/link";
import { ActionForm } from "@/components/admin/ActionForm";
import { Field } from "@/components/admin/Field";
import { Badge, PageTitle, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requirePage } from "@/server/auth";
import { savePage } from "../../actions/settings";

export const metadata = { title: "Politika metinleri" };

const PATHS: Record<string, string> = { kvkk: "/kvkk", gizlilik: "/gizlilik", cerez: "/cerez-politikasi" };

export default async function PagesAdmin() {
  await requirePage("content");
  const pages = await db.page.findMany({ orderBy: { key: "asc" } });
  return (
    <>
      <PageTitle
        title="Politika metinleri"
        description={
          <>
            Biçim: <code>## Başlık</code>, <code>- liste</code>, paragraflar arasında boş satır. <code>[[…]]</code> ile işaretli alanlar
            sitede sarı vurgulanır; yayından önce işletme bilgileriyle doldurun. Hukuki kontrol önerilir.
          </>
        }
      />
      <div className="grid gap-6">
        {pages.map((p) => (
          <Panel
            key={p.key}
            title={p.title}
            description={
              <span className="flex flex-wrap items-center gap-2">
                <Link href={PATHS[p.key] ?? "/"} target="_blank" className="underline">
                  Sitede gör
                </Link>
                {p.body.includes("[[") ? <Badge tone="amber">Doldurulacak alanlar var</Badge> : <Badge tone="green">Tamamlandı</Badge>}
              </span>
            }
          >
            <ActionForm action={savePage} className="grid gap-4">
              <input type="hidden" name="key" value={p.key} />
              <Field name="title" label="Başlık" defaultValue={p.title} />
              <Field as="textarea" rows={16} name="body" label="Metin" defaultValue={p.body} className="font-mono" />
            </ActionForm>
          </Panel>
        ))}
      </div>
    </>
  );
}
