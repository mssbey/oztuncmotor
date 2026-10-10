// Rol → yetki eşlemesi. Her yönetim işlemi sunucuda bu tabloya göre denetlenir.
import type { UserRole } from "@/generated/prisma/enums";

export type Permission =
  | "content" // katalog, markalar, kategoriler, hizmetler, görseller, SEO, sayfa metinleri
  | "customers" // randevular, bilgi talepleri, müşteri iletişim bilgileri
  | "schedule" // çalışma saatleri, tatiller, slot kapasitesi
  | "settings" // iletişim bilgileri, logo/hero, bildirimler
  | "users"; // panel kullanıcıları

const MATRIX: Record<UserRole, Permission[]> = {
  ADMIN: ["content", "customers", "schedule", "settings", "users"],
  STAFF: ["content", "customers", "schedule"],
  EDITOR: ["content"],
};

export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return MATRIX[role]?.includes(permission) ?? false;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Yönetici",
  STAFF: "Servis / Satış Personeli",
  EDITOR: "İçerik Editörü",
};
