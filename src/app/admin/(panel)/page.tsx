import Link from "next/link";
import { Badge, Notice, PageTitle, Panel, STATUS_TONES } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { siteUrl } from "@/lib/seo";
import { formatDateShort, todayInTz } from "@/lib/time";
import { STATUS_LABELS } from "@/server/appointments";
import { requirePage } from "@/server/auth";
import { smtpConfigured } from "@/server/notifications";

export const metadata = { title: "Genel bakış" };

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const user = await requirePage();
  const sp = await searchParams;
  const canCustomers = hasPermission(user.role, "customers");
  const today = todayInTz();

  const [settings, schedule, publishedServices, realMotorcycles, demoCount, failedNotifications] = await Promise.all([
    db.siteSettings.findUnique({ where: { id: 1 } }),
    db.appointmentSettings.findUnique({ where: { id: 1 } }),
    db.serviceItem.count({ where: { published: true, isDemo: false } }),
    db.motorcycle.count({ where: { published: true, isDemo: false } }),
    db.motorcycle.count({ where: { isDemo: true } }),
    db.notification.count({ where: { status: "FAILED" } }),
  ]);

  const upcoming = canCustomers
    ? await db.appointment.findMany({
        where: { slotDate: { gte: today }, status: { in: ["PENDING", "CONFIRMED"] } },
        orderBy: { slotStart: "asc" },
        take: 8,
      })
    : [];
  const counts = canCustomers
    ? await Promise.all([
        db.appointment.count({ where: { status: "PENDING" } }),
        db.appointment.count({ where: { slotDate: today, status: { not: "CANCELLED" } } }),
        db.inquiry.count({ where: { status: "NEW" } }),
      ])
    : null;

  const checklist = [
    { done: Boolean(settings?.phone), label: "Telefon numarası", href: "/admin/ayarlar" },
    { done: Boolean(settings?.whatsapp), label: "WhatsApp numarası", href: "/admin/ayarlar" },
    { done: Boolean(settings?.email), label: "E-posta adresi", href: "/admin/ayarlar" },
    { done: Boolean(settings?.notifyEmail) && smtpConfigured(), label: "Bildirim e-postası ve SMTP ayarı", href: "/admin/bildirimler" },
    { done: Boolean(schedule?.showHoursPublic), label: "Çalışma saatleri doğrulandı ve sitede gösteriliyor", href: "/admin/calisma-saatleri" },
    { done: Boolean(schedule?.enabled), label: "Online randevu açık", href: "/admin/calisma-saatleri" },
    { done: publishedServices > 0, label: "Gerçekte verilen servis hizmetleri yayımlandı", href: "/admin/hizmetler" },
    { done: realMotorcycles > 0, label: "Gerçek ürünler eklendi ve yayımlandı", href: "/admin/motosikletler" },
    { done: Boolean(settings?.logoId), label: "Logo (yoksa yazı logosu kullanılır)", href: "/admin/ayarlar" },
    { done: Boolean(settings?.heroImageId), label: "Giriş (hero) fotoğrafı", href: "/admin/ayarlar" },
    { done: Boolean(settings?.serviceImageId), label: "Gerçek servis fotoğrafı", href: "/admin/ayarlar" },
    { done: Boolean(settings?.aboutImage1Id), label: "Showroom / işletme fotoğrafları", href: "/admin/ayarlar" },
    { done: Boolean(siteUrl()), label: "Alan adı (SITE_URL ortam değişkeni)", href: null },
  ];
  const policyDrafts = await db.page.count({ where: { body: { contains: "[[" } } });
  checklist.push({ done: policyDrafts === 0, label: "Politika metinlerindeki [[...]] alanları dolduruldu", href: "/admin/sayfalar" });
  const missing = checklist.filter((c) => !c.done).length;

  return (
    <>
      <PageTitle title="Genel bakış" description={`Hoş geldiniz, ${user.name}.`} />
      {sp.yetki === "yok" && (
        <div className="mb-6">
          <Notice tone="red">Bu sayfayı görüntüleme yetkiniz yok.</Notice>
        </div>
      )}
      {demoCount > 0 && (
        <div className="mb-6">
          <Notice>
            Veritabanında {demoCount} demo ürün var. Demo içerik üretimde gösterilmez; gerçek ürünleri ekledikten sonra demo kayıtları
            silebilirsiniz.
          </Notice>
        </div>
      )}
      {failedNotifications > 0 && hasPermission(user.role, "settings") && (
        <div className="mb-6">
          <Notice tone="red">
            {failedNotifications} bildirim e-postası gönderilemedi.{" "}
            <Link href="/admin/bildirimler" className="font-bold underline">
              Bildirimleri incele
            </Link>
          </Notice>
        </div>
      )}

      {counts && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Onay bekleyen randevu", value: counts[0], href: "/admin/randevular?durum=PENDING" },
            { label: "Bugünkü randevu", value: counts[1], href: `/admin/randevular?baslangic=${today}&bitis=${today}` },
            { label: "Yeni bilgi talebi", value: counts[2], href: "/admin/talepler?durum=NEW" },
          ].map((s) => (
            <Link key={s.label} href={s.href} className="card p-5 transition-shadow hover:shadow-[var(--shadow-card-hover)]">
              <p className="text-sm font-semibold text-muted">{s.label}</p>
              <p className="font-display mt-1 text-5xl font-bold leading-none tabular-nums">{s.value}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        {canCustomers && (
          <Panel title="Yaklaşan randevular">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted">Yaklaşan randevu yok.</p>
            ) : (
              <ul className="divide-y divide-line">
                {upcoming.map((a) => (
                  <li key={a.id}>
                    <Link href={`/admin/randevular/${a.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-accent">
                      <span>
                        <span className="font-bold tabular-nums">
                          {formatDateShort(a.slotDate)} {a.slotTime}
                        </span>
                        <span className="ml-2 text-muted">
                          {a.fullName} · {a.brandName} {a.model}
                        </span>
                      </span>
                      <Badge tone={STATUS_TONES[a.status]}>{STATUS_LABELS[a.status]}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
        <Panel
          title={`Yayın öncesi kontrol listesi (${missing} eksik)`}
          description="Doğrulanmamış bilgiler sitede gösterilmez; eksikler tamamlandıkça site otomatik güncellenir."
        >
          <ul className="grid gap-2 text-sm">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    c.done ? "bg-success text-white" : "border-2 border-[#c9cac4]"
                  }`}
                >
                  {c.done ? "✓" : ""}
                </span>
                <span className={c.done ? "text-muted line-through" : "font-semibold"}>
                  <span className="sr-only">{c.done ? "Tamam: " : "Eksik: "}</span>
                  {c.href && !c.done ? (
                    <Link href={c.href} className="underline-offset-2 hover:underline">
                      {c.label}
                    </Link>
                  ) : (
                    c.label
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
