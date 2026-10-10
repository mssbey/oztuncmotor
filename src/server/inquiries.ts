import "server-only";
import { db } from "@/lib/db";
import { formatPhone, type InquiryInput } from "@/lib/validation";
import { generateReference } from "./appointments";
import { demoVisibility } from "./catalog";
import { enqueueEmail } from "./notifications";
import { Prisma } from "@/generated/prisma/client";

export const INQUIRY_STATUS_LABELS = { NEW: "Yeni", CONTACTED: "İletişime geçildi", CLOSED: "Kapandı" } as const;

/** Bilgi talebini (varsa ürün kimliğiyle) ve bildirim kaydını tek işlemde yazar. */
export async function createInquiry(input: InquiryInput, now = new Date()) {
  let motorcycle: { id: string; model: string; brand: { name: string } } | null = null;
  if (input.motorcycleId) {
    motorcycle = await db.motorcycle.findFirst({
      where: { id: input.motorcycleId, published: true, ...demoVisibility() },
      select: { id: true, model: true, brand: { select: { name: true } } },
    });
    if (!motorcycle) throw new Error("Ürün bulunamadı.");
  }
  const label = motorcycle ? `${motorcycle.brand.name} ${motorcycle.model}` : null;
  const settings = await db.siteSettings.findUnique({ where: { id: 1 } });

  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = generateReference("BT");
    try {
      return await db.$transaction(async (tx) => {
        const inquiry = await tx.inquiry.create({
          data: {
            reference,
            motorcycleId: motorcycle?.id ?? null,
            motorcycleLabel: label,
            fullName: input.fullName,
            phone: input.phone,
            email: input.email ?? null,
            message: input.message,
            kvkkAcceptedAt: now,
            marketingConsent: input.marketing === true,
          },
        });
        await enqueueEmail(tx, {
          kind: "inquiry.created",
          to: settings?.notifyEmail,
          subject: `Yeni bilgi talebi ${reference}${label ? ` — ${label}` : ""}`,
          body: [
            `Referans: ${reference}`,
            label ? `Model: ${label}` : "Genel iletişim talebi",
            `Müşteri: ${input.fullName} — ${formatPhone(input.phone)}`,
            input.email ? `E-posta: ${input.email}` : null,
            input.message ? `\nMesaj:\n${input.message}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        });
        return inquiry;
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue;
      throw err;
    }
  }
  throw new Error("Referans üretilemedi.");
}
