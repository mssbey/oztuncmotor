import { ActionButton } from "@/components/admin/ActionForm";
import { Badge, EmptyRow, Notice, PageTitle, Table } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/time";
import { requirePage } from "@/server/auth";
import { MAX_ATTEMPTS, smtpConfigured } from "@/server/notifications";
import { retryNotification, runNotificationQueue } from "../../actions/settings";

export const metadata = { title: "Bildirimler" };

const TONE = { PENDING: "amber", SENT: "green", FAILED: "red" } as const;
const LABEL = { PENDING: "Bekliyor", SENT: "Gönderildi", FAILED: "Başarısız" } as const;

export default async function NotificationsPage() {
  await requirePage("settings");
  const [items, settings] = await Promise.all([
    db.notification.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.siteSettings.findUnique({ where: { id: 1 } }),
  ]);
  return (
    <>
      <PageTitle
        title="Bildirimler"
        description={`E-posta bildirimleri kayıttan sonra ayrı adımda gönderilir. Gönderim başarısız olsa da randevu ve talepler kaybolmaz; en fazla ${MAX_ATTEMPTS} kez artan aralıklarla yeniden denenir.`}
        actions={<ActionButton action={runNotificationQueue} label="Kuyruğu şimdi işle" className="btn btn-dark btn-sm" />}
      />
      <div className="mb-6 grid gap-3">
        {!smtpConfigured() && <Notice>SMTP yapılandırılmadı (SMTP_HOST vb. ortam değişkenleri). Bildirimler kuyrukta bekler.</Notice>}
        {!settings?.notifyEmail && <Notice>Bildirim e-postası girilmedi (İletişim ve görseller sayfası). İşletmeye bildirim oluşturulmaz.</Notice>}
        <Notice tone="green">
          WhatsApp bağlantıları yalnızca sohbet açar. Otomatik WhatsApp bildirimi bu sistemde yoktur; eklenmesi ayrı bir WhatsApp Business
          API entegrasyonu gerektirir.
        </Notice>
      </div>
      <Table>
        <thead>
          <tr>
            <th>Oluşturulma</th>
            <th>Konu</th>
            <th>Alıcı</th>
            <th>Durum</th>
            <th>Deneme</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && <EmptyRow colSpan={6}>Bildirim kaydı yok.</EmptyRow>}
          {items.map((n) => (
            <tr key={n.id}>
              <td className="whitespace-nowrap text-xs">{formatDateTime(n.createdAt)}</td>
              <td>
                {n.subject}
                {n.lastError && n.status !== "SENT" && <p className="mt-1 text-xs text-[#b3261e]">{n.lastError}</p>}
              </td>
              <td className="text-xs">{n.recipient}</td>
              <td>
                <Badge tone={TONE[n.status]}>{LABEL[n.status]}</Badge>
              </td>
              <td className="tabular-nums">{n.attempts}</td>
              <td className="text-right">
                {n.status !== "SENT" && <ActionButton action={retryNotification} fields={{ id: n.id }} label="Yeniden dene" />}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
