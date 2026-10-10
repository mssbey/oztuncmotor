import "server-only";
import { db } from "@/lib/db";
import { Prisma, type AppointmentStatus } from "@/generated/prisma/client";
import { checkSlot, SLOT_ERROR_MESSAGES } from "@/lib/slots";
import { formatDateLong } from "@/lib/time";
import { OTHER_BRAND, formatPhone, type AppointmentInput } from "@/lib/validation";
import { loadScheduleConfig } from "./schedule";
import { enqueueEmail } from "./notifications";
import { randomBytes } from "node:crypto";

export class AppointmentError extends Error {
  constructor(
    public code: "slot" | "full" | "service" | "brand" | "not-found",
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Onay Bekliyor",
  CONFIRMED: "Onaylandı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal Edildi",
};

const REF_ALPHABET = "ABCDEFGHJKLMNPRSTUVYZ23456789";

export function generateReference(prefix = "OZ"): string {
  const bytes = randomBytes(6);
  let code = "";
  for (const b of bytes) code += REF_ALPHABET[b % REF_ALPHABET.length];
  return `${prefix}-${code.slice(0, 3)}${code.slice(3)}`;
}

type Tx = Prisma.TransactionClient;

/**
 * Aynı slot için yapılan işlemleri sıraya sokar (transaction sonuna kadar tutulur),
 * ardından iptal edilmemiş randevu sayısını kapasiteyle karşılaştırır.
 */
async function lockSlotAndCount(tx: Tx, slotStart: Date, excludeId?: string): Promise<number> {
  const key = `slot:${slotStart.toISOString()}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
  return tx.appointment.count({
    where: {
      slotStart,
      status: { not: "CANCELLED" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

export async function createAppointment(input: AppointmentInput, now = new Date()) {
  const config = await loadScheduleConfig();
  const slot = checkSlot(config, input.date, input.time, now);
  if (!slot.ok) throw new AppointmentError("slot", SLOT_ERROR_MESSAGES[slot.code], "time");

  const service = await db.serviceItem.findFirst({
    where: { id: input.serviceItemId, published: true, bookable: true },
  });
  if (!service) throw new AppointmentError("service", "Geçerli bir servis işlemi seçin.", "serviceItemId");

  let brandId: string | null = null;
  let brandName = input.brandOther;
  if (input.brandId !== OTHER_BRAND) {
    const brand = await db.brand.findUnique({ where: { id: input.brandId } });
    if (!brand) throw new AppointmentError("brand", "Geçerli bir marka seçin.", "brandId");
    brandId = brand.id;
    brandName = brand.name;
  }

  const settings = await db.siteSettings.findUnique({ where: { id: 1 } });

  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = generateReference("OZ");
    try {
      return await db.$transaction(async (tx) => {
        const used = await lockSlotAndCount(tx, slot.slotStart);
        if (used >= config.slotCapacity) {
          throw new AppointmentError("full", SLOT_ERROR_MESSAGES.full, "time");
        }
        const appointment = await tx.appointment.create({
          data: {
            reference,
            status: "PENDING",
            brandId,
            brandName,
            model: input.model,
            modelYear: input.modelYear ?? null,
            mileageKm: input.mileageKm ?? null,
            plate: input.plate ?? null,
            serviceItemId: service.id,
            serviceName: service.title,
            description: input.description,
            slotStart: slot.slotStart,
            slotDate: input.date,
            slotTime: input.time,
            fullName: input.fullName,
            phone: input.phone,
            email: input.email ?? null,
            kvkkAcceptedAt: now,
            marketingConsent: input.marketing === true,
          },
        });

        const when = `${formatDateLong(input.date)} ${input.time}`;
        await enqueueEmail(tx, {
          kind: "appointment.created",
          to: settings?.notifyEmail,
          subject: `Yeni servis randevu talebi ${reference}`,
          body: [
            `Referans: ${reference}`,
            `Talep edilen zaman: ${when}`,
            `Motosiklet: ${brandName} ${input.model}${input.modelYear ? ` (${input.modelYear})` : ""}`,
            `İşlem: ${service.title}`,
            `Müşteri: ${input.fullName} — ${formatPhone(input.phone)}`,
            input.email ? `E-posta: ${input.email}` : null,
            input.description ? `\nAçıklama:\n${input.description}` : null,
            `\nDurum: Onay Bekliyor. Yönetim panelinden onaylayın.`,
          ]
            .filter(Boolean)
            .join("\n"),
        });
        if (input.email) {
          await enqueueEmail(tx, {
            kind: "appointment.received",
            to: input.email,
            subject: `Randevu talebiniz alındı — ${reference}`,
            body: [
              `Merhaba ${input.fullName},`,
              ``,
              `${when} için servis randevu talebiniz alındı. Referans numaranız: ${reference}`,
              `Bu bir onay değildir; kesin tarih ve saat için ekibimiz sizinle iletişime geçecektir.`,
              ``,
              settings?.businessName ?? "Öztunç Motor",
            ].join("\n"),
          });
        }
        return appointment;
      });
    } catch (err) {
      // Referans çakışması (çok düşük olasılık): yeni referansla tekrar dene
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue;
      throw err;
    }
  }
  throw new Error("Randevu referansı üretilemedi.");
}

/** Durum değişikliği; iptalden geri alınırken kapasite yeniden doğrulanır. */
export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const config = await loadScheduleConfig();
  return db.$transaction(async (tx) => {
    const current = await tx.appointment.findUnique({ where: { id } });
    if (!current) throw new AppointmentError("not-found", "Randevu bulunamadı.");
    if (current.status === "CANCELLED" && status !== "CANCELLED") {
      const used = await lockSlotAndCount(tx, current.slotStart, id);
      if (used >= config.slotCapacity) {
        throw new AppointmentError("full", "Bu slotun kapasitesi dolu; randevu yeniden açılamaz.");
      }
    }
    return tx.appointment.update({ where: { id }, data: { status } });
  });
}

/** Panelden tarih/saat değişikliği (geçmiş zaman ve kapasite kontrolüyle). */
export async function rescheduleAppointment(id: string, date: string, time: string, now = new Date()) {
  const config = await loadScheduleConfig();
  const slot = checkSlot({ ...config, enabled: true, minLeadMinutes: 0 }, date, time, now);
  if (!slot.ok) throw new AppointmentError("slot", SLOT_ERROR_MESSAGES[slot.code], "time");
  return db.$transaction(async (tx) => {
    const current = await tx.appointment.findUnique({ where: { id } });
    if (!current) throw new AppointmentError("not-found", "Randevu bulunamadı.");
    if (current.status !== "CANCELLED") {
      const used = await lockSlotAndCount(tx, slot.slotStart, id);
      if (used >= config.slotCapacity) throw new AppointmentError("full", SLOT_ERROR_MESSAGES.full, "time");
    }
    return tx.appointment.update({
      where: { id },
      data: { slotStart: slot.slotStart, slotDate: date, slotTime: time },
    });
  });
}
