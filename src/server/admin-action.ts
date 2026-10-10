import "server-only";
import { z } from "zod";
import type { Permission } from "@/lib/permissions";
import { fieldErrors } from "@/lib/validation";
import { AuthorizationError, requirePermission, type CurrentUser } from "./auth";

export type ActionState = { ok?: boolean; message?: string; errors?: Record<string, string>; nonce?: number };

export class ActionError extends Error {
  constructor(message: string, public errors?: Record<string, string>) {
    super(message);
  }
}

/**
 * Tüm yönetim işlemleri bu sarmalayıcıdan geçer: önce sunucuda yetki denetimi,
 * sonra işlem. Hatalar kullanıcıya anlaşılır mesaj olarak döner.
 */
export async function run(
  permission: Permission,
  fn: (user: CurrentUser) => Promise<string | void>,
): Promise<ActionState> {
  try {
    const user = await requirePermission(permission);
    const message = await fn(user);
    return { ok: true, message: message || "Kaydedildi.", nonce: Date.now() };
  } catch (err) {
    if (err instanceof AuthorizationError) return { ok: false, message: err.message, nonce: Date.now() };
    if (err instanceof ActionError) return { ok: false, message: err.message, errors: err.errors, nonce: Date.now() };
    if (err instanceof z.ZodError) {
      return { ok: false, message: "Lütfen işaretli alanları kontrol edin.", errors: fieldErrors(err), nonce: Date.now() };
    }
    // redirect()/notFound() gibi Next.js kontrol akışı hatalarını yeniden fırlat
    if (err && typeof err === "object" && "digest" in err) throw err;
    console.error("[yönetim] işlem hatası", err);
    return { ok: false, message: "İşlem tamamlanamadı. Lütfen tekrar deneyin.", nonce: Date.now() };
  }
}

// ─── FormData yardımcıları ──────────────────────────────────────────

export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function optStr(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v ? v : null;
}

export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

export function optInt(fd: FormData, key: string, label: string, min = 0, max = 100_000_000): number | null {
  const raw = str(fd, key).replace(/[.\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) throw new ActionError(`${label} geçersiz.`, { [key]: `${label} ${min}–${max} arasında tam sayı olmalı.` });
  return n;
}

export function optDecimal(fd: FormData, key: string, label: string, max = 100_000): number | null {
  const raw = str(fd, key).replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > max) throw new ActionError(`${label} geçersiz.`, { [key]: `${label} için geçerli bir sayı girin.` });
  return n;
}

export function slugify(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
