// Ortak form şemaları — istemcide adım doğrulaması, sunucuda kesin doğrulama için.
import { z } from "zod";
import { isValidDateString, isValidTimeString } from "./time";

export const OTHER_BRAND = "other";

/** Türkiye telefon numarasını 10 haneye indirger (5XXXXXXXXX / 2XXXXXXXXX). Geçersizse null. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (!/^[2-5]\d{9}$/.test(digits)) return null;
  return digits;
}

export function formatPhone(digits: string): string {
  const d = normalizePhone(digits) ?? digits;
  if (d.length !== 10) return digits;
  return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
}

export function normalizePlate(input: string): string {
  return input
    .toLocaleUpperCase("tr-TR")
    .replace(/[^0-9A-ZÇĞİÖŞÜ]/g, "")
    .replace(/^(\d{2})([A-ZÇĞİÖŞÜ]{1,3})(\d{2,4})$/, "$1 $2 $3");
}

const trimmed = (max: number) => z.string().trim().max(max, `En fazla ${max} karakter girin.`);

const optionalInt = (min: number, max: number, label: string) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((v, ctx) => {
      if (v === undefined || v === "") return undefined;
      const n = typeof v === "number" ? v : Number(String(v).replace(/[.\s]/g, ""));
      if (!Number.isInteger(n) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: `${label} ${min}–${max} arasında olmalı.` });
        return z.NEVER;
      }
      return n;
    });

const phoneField = z
  .string()
  .trim()
  .min(1, "Telefon numaranızı girin.")
  .transform((v, ctx) => {
    const n = normalizePhone(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "Geçerli bir telefon numarası girin (ör. 0555 123 45 67)." });
      return z.NEVER;
    }
    return n;
  });

const emailField = z
  .string()
  .trim()
  .max(160)
  .optional()
  .transform((v, ctx) => {
    if (!v) return undefined;
    if (!z.email().safeParse(v).success) {
      ctx.addIssue({ code: "custom", message: "Geçerli bir e-posta adresi girin." });
      return z.NEVER;
    }
    return v.toLowerCase();
  });

const kvkkField = z.literal(true, "Devam etmek için KVKK aydınlatma metnini okuduğunuzu onaylayın.");

// ─── Randevu ────────────────────────────────────────────────────────

export const appointmentStep1 = z
  .object({
    brandId: z.string().min(1, "Marka seçin."),
    brandOther: trimmed(60).optional().default(""),
    model: trimmed(80).min(1, "Model girin."),
    modelYear: optionalInt(1950, new Date().getFullYear() + 1, "Model yılı"),
    mileageKm: optionalInt(0, 1_000_000, "Kilometre"),
    plate: z
      .string()
      .trim()
      .max(12)
      .optional()
      .transform((v, ctx) => {
        if (!v) return undefined;
        const p = normalizePlate(v);
        if (!/^(0[1-9]|[1-7]\d|8[01]) [A-ZÇĞİÖŞÜ]{1,3} \d{2,4}$/.test(p)) {
          ctx.addIssue({ code: "custom", message: "Plakayı 81 ABC 123 biçiminde girin." });
          return z.NEVER;
        }
        return p;
      }),
    serviceItemId: z.string().min(1, "Servis işlemini seçin."),
    description: trimmed(1500).optional().default(""),
  })
  .superRefine((v, ctx) => {
    if (v.brandId === OTHER_BRAND && v.brandOther.length < 2) {
      ctx.addIssue({ code: "custom", path: ["brandOther"], message: "Marka adını yazın." });
    }
  });

export const appointmentStep2 = z.object({
  date: z.string().refine(isValidDateString, "Tarih seçin."),
  time: z.string().refine(isValidTimeString, "Saat seçin."),
});

export const appointmentStep3 = z.object({
  fullName: trimmed(80).min(3, "Adınızı ve soyadınızı girin."),
  phone: phoneField,
  email: emailField,
  kvkk: kvkkField,
  marketing: z.boolean().optional().default(false),
});

export const antiSpamFields = z.object({
  website: z.string().max(0).optional().default(""), // bal küpü alanı — boş olmalı
  formToken: z.string().min(10).max(200),
});

export const appointmentSchema = z.intersection(
  z.intersection(appointmentStep1, appointmentStep2),
  z.intersection(appointmentStep3, antiSpamFields),
);

export type AppointmentInput = z.infer<typeof appointmentSchema>;

// ─── Ürün bilgi talebi / iletişim ───────────────────────────────────

export const inquirySchema = z.object({
  motorcycleId: z.string().max(40).optional(),
  fullName: trimmed(80).min(3, "Adınızı ve soyadınızı girin."),
  phone: phoneField,
  email: emailField,
  message: trimmed(1500).optional().default(""),
  kvkk: kvkkField,
  marketing: z.boolean().optional().default(false),
  website: z.string().max(0).optional().default(""),
  formToken: z.string().min(10).max(200),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

/** Zod hatasını { alan: mesaj } nesnesine çevirir (alan başına ilk hata). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
