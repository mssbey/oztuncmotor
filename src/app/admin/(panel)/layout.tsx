import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav, type NavItem } from "@/components/admin/AdminNav";
import { db } from "@/lib/db";
import { ROLE_LABELS, hasPermission } from "@/lib/permissions";
import { requirePage } from "@/server/auth";
import { logoutAction } from "../actions/auth";

export const metadata: Metadata = {
  title: { default: "Yönetim", template: "%s | Öztunc Panel" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const user = await requirePage();
  const canCustomers = hasPermission(user.role, "customers");
  const [pending, newInquiries] = canCustomers
    ? await Promise.all([
        db.appointment.count({ where: { status: "PENDING" } }),
        db.inquiry.count({ where: { status: "NEW" } }),
      ])
    : [0, 0];

  const items: (NavItem & { show: boolean })[] = [
    { href: "/admin", label: "Genel bakış", group: "Panel", show: true },
    { href: "/admin/randevular", label: "Randevular", group: "Müşteri", badge: pending, show: canCustomers },
    { href: "/admin/takvim", label: "Takvim", group: "Müşteri", show: canCustomers },
    { href: "/admin/talepler", label: "Bilgi talepleri", group: "Müşteri", badge: newInquiries, show: canCustomers },
    { href: "/admin/motosikletler", label: "Motosikletler", group: "Katalog", show: true },
    { href: "/admin/markalar", label: "Markalar", group: "Katalog", show: true },
    { href: "/admin/kategoriler", label: "Kategoriler", group: "Katalog", show: true },
    { href: "/admin/hizmetler", label: "Servis hizmetleri", group: "Servis", show: true },
    { href: "/admin/calisma-saatleri", label: "Çalışma saatleri", group: "Servis", show: hasPermission(user.role, "schedule") },
    { href: "/admin/ayarlar", label: "İletişim ve görseller", group: "Site", show: hasPermission(user.role, "settings") },
    { href: "/admin/seo", label: "SEO", group: "Site", show: true },
    { href: "/admin/sayfalar", label: "Politika metinleri", group: "Site", show: true },
    { href: "/admin/bildirimler", label: "Bildirimler", group: "Sistem", show: hasPermission(user.role, "settings") },
    { href: "/admin/kullanicilar", label: "Kullanıcılar", group: "Sistem", show: hasPermission(user.role, "users") },
  ];

  return (
    <div className="min-h-dvh bg-[#f0f0ec] lg:flex">
      <AdminNav
        items={items.filter((i) => i.show).map(({ show: _s, ...i }) => i)}
        footer={
          <div className="text-sm">
            <p className="font-semibold text-white">{user.name}</p>
            <p className="text-xs text-muted-dark">{ROLE_LABELS[user.role]}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/admin/hesap" className="text-white/75 underline-offset-2 hover:text-white hover:underline">
                Hesabım
              </Link>
              <Link href="/" target="_blank" className="text-white/75 underline-offset-2 hover:text-white hover:underline">
                Siteyi aç
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="text-white/75 underline-offset-2 hover:text-white hover:underline">
                  Çıkış
                </button>
              </form>
            </div>
          </div>
        }
      />
      <main id="icerik" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
