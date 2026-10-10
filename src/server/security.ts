import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

function secret(): string {
  const s = process.env.APP_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("APP_SECRET en az 32 karakter olmalı.");
    return "dev-only-insecure-secret-change-me-please-0000";
  }
  return s;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** IP adresini saklamadan, yalnızca hız sınırı anahtarı için tuzlu özet. */
export function hashIp(ip: string): string {
  return createHmac("sha256", secret()).update(`ip:${ip}`).digest("hex").slice(0, 32);
}

// ─── Form belirteci: formun ne zaman açıldığını imzalı olarak taşır ───
const MIN_FILL_MS = 3000;
const MAX_TOKEN_AGE_MS = 1000 * 60 * 60 * 6;

export function issueFormToken(now = Date.now()): string {
  const ts = String(now);
  const sig = createHmac("sha256", secret()).update(`form:${ts}`).digest("base64url").slice(0, 32);
  return `${ts}.${sig}`;
}

export type TokenCheck = "ok" | "invalid" | "too-fast" | "expired";

export function verifyFormToken(token: string, now = Date.now()): TokenCheck {
  const [ts, sig] = token.split(".");
  if (!ts || !sig || !/^\d+$/.test(ts)) return "invalid";
  const expected = createHmac("sha256", secret()).update(`form:${ts}`).digest("base64url").slice(0, 32);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "invalid";
  const age = now - Number(ts);
  if (age < MIN_FILL_MS) return "too-fast";
  if (age > MAX_TOKEN_AGE_MS) return "expired";
  return "ok";
}

// ─── Hız sınırı (veritabanında, çoklu sunucu örneğinde de tutarlı) ───
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);
  // Tek ifadede atomik artış: süresi dolmuşsa sayaç sıfırlanır.
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count"`;
  return (rows[0]?.count ?? 0) <= limit;
}

/** İstek başlıklarından istemci IP'si (ters vekil arkasında x-forwarded-for). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
