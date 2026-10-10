import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { hasPermission, type Permission } from "@/lib/permissions";
import { randomToken, sha256 } from "./security";

export const SESSION_COOKIE = "oz_admin_session";
const SESSION_DAYS = 7;
const BCRYPT_COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

// Kullanıcı yokken de karşılaştırma yaparak zamanlama farkıyla e-posta tespiti engellenir.
const DUMMY_HASH = "$2b$12$mXbqxNYyWLjKSKRMeCZECOIZm0YMRsGgAKYlNZ46iuAXmanE5nXSu";

export async function verifyCredentials(email: string, password: string) {
  const user = await db.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.active) return null;
  return user;
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.session.create({ data: { id: sha256(token), userId, expiresAt } });
  await db.adminUser.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  return { token, expiresAt };
}

export async function getUserBySessionToken(token: string | undefined | null) {
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: sha256(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date() || !session.user.active) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  const { passwordHash: _omit, ...user } = session.user;
  void _omit;
  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getUserBySessionToken>>>;

export const getCurrentUser = cache(async () => {
  const store = await cookies();
  return getUserBySessionToken(store.get(SESSION_COOKIE)?.value);
});

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha256(token) } });
  store.delete(SESSION_COOKIE);
}

export class AuthorizationError extends Error {
  constructor(public reason: "unauthenticated" | "forbidden") {
    super(reason === "unauthenticated" ? "Oturum açmanız gerekiyor." : "Bu işlem için yetkiniz yok.");
  }
}

/** Sayfalar için: oturum yoksa girişe, yetki yoksa panele yönlendirir. */
export async function requirePage(permission?: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/giris");
  if (permission && !hasPermission(user.role, permission)) redirect("/admin?yetki=yok");
  return user;
}

/** Sunucu işlemleri (server action) ve API uçları için: yetkisizse hata fırlatır. */
export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("unauthenticated");
  if (!hasPermission(user.role, permission)) throw new AuthorizationError("forbidden");
  return user;
}
