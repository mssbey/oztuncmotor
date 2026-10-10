import "server-only";
import type { z } from "zod";
import { fieldErrors } from "@/lib/validation";
import { clientIp, hashIp, rateLimit, verifyFormToken } from "./security";

export type FormFailure = { ok: false; status: number; errors: Record<string, string>; message?: string };

/**
 * Herkese açık form isteklerinin ortak ön kontrolü:
 * hız sınırı → JSON çözümleme → bal küpü → form belirteci (süre) → şema doğrulaması.
 * Hiçbir koşulda kayıt yapılmadan başarı döndürülmez.
 */
export async function parsePublicForm<S extends z.ZodType>(
  req: Request,
  schema: S,
  opts: { kind: string; limit: number; windowSeconds: number },
): Promise<{ ok: true; data: z.infer<S>; ipHash: string } | FormFailure> {
  const ipHash = hashIp(clientIp(req.headers));
  if (!(await rateLimit(`${opts.kind}:${ipHash}`, opts.limit, opts.windowSeconds))) {
    return {
      ok: false,
      status: 429,
      errors: {},
      message: "Kısa sürede çok fazla talep gönderildi. Lütfen biraz sonra tekrar deneyin veya bizi arayın.",
    };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, status: 400, errors: {}, message: "Geçersiz istek." };
  }
  if (typeof body !== "object" || body === null) {
    return { ok: false, status: 400, errors: {}, message: "Geçersiz istek." };
  }

  const raw = body as Record<string, unknown>;
  if (typeof raw.website === "string" && raw.website.length > 0) {
    return { ok: false, status: 400, errors: {}, message: "Talebiniz gönderilemedi. Lütfen sayfayı yenileyip tekrar deneyin." };
  }
  const token = verifyFormToken(typeof raw.formToken === "string" ? raw.formToken : "");
  if (token !== "ok") {
    return {
      ok: false,
      status: 400,
      errors: {},
      message:
        token === "too-fast"
          ? "Form çok hızlı gönderildi. Lütfen birkaç saniye sonra tekrar deneyin."
          : "Form süresi doldu. Lütfen sayfayı yenileyip tekrar deneyin.",
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, status: 422, errors: fieldErrors(parsed.error), message: "Lütfen işaretli alanları kontrol edin." };
  }
  return { ok: true, data: parsed.data, ipHash };
}

export function failure(f: FormFailure) {
  return Response.json({ ok: false, errors: f.errors, message: f.message }, { status: f.status });
}
