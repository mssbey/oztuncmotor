import { ActionForm } from "@/components/admin/ActionForm";
import { Field } from "@/components/admin/Field";
import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/seo";
import { requirePage } from "@/server/auth";
import { saveSeo } from "../../actions/settings";

export const metadata = { title: "SEO" };

const PAGES = [
  { key: "home", label: "Ana sayfa", path: "/" },
  { key: "motorcycles", label: "Motosikletler", path: "/motosikletler" },
  { key: "service", label: "Servis", path: "/servis" },
  { key: "appointment", label: "Servis randevusu", path: "/servis-randevusu" },
  { key: "parts", label: "Yedek parça", path: "/yedek-parca" },
  { key: "accessories", label: "Aksesuar", path: "/aksesuar" },
  { key: "about", label: "Hakkımızda", path: "/hakkimizda" },
  { key: "contact", label: "İletişim", path: "/iletisim" },
];

export default async function SeoPage() {
  await requirePage("content");
  const entries = await db.seoEntry.findMany();
  const base = siteUrl();
  return (
    <>
      <PageTitle title="SEO" description="Sayfa başlıkları ve açıklamaları. Boş bırakılan alanlarda özenle hazırlanmış varsayılan metin kullanılır. Ürün SEO’su ürün düzenleme ekranındadır." />
      {!base && (
        <div className="mb-6">
          <Notice>
            SITE_URL ortam değişkeni tanımlı değil: canonical adresler, sitemap URL’leri ve mutlak Open Graph adresleri alan adı
            tanımlanana kadar yayımlanmaz.
          </Notice>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        {PAGES.map((p) => {
          const e = entries.find((x) => x.key === p.key);
          return (
            <Panel key={p.key} title={p.label} description={<span className="font-mono">{base ? `${base}${p.path}` : p.path}</span>}>
              <ActionForm action={saveSeo} className="grid gap-4">
                <input type="hidden" name="key" value={p.key} />
                <Field name="title" label="Başlık (en fazla 70)" maxLength={70} defaultValue={e?.title ?? ""} />
                <Field as="textarea" rows={3} name="description" label="Açıklama (en fazla 170)" maxLength={170} defaultValue={e?.description ?? ""} />
              </ActionForm>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
