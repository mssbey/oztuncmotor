import { db } from "@/lib/db";
import type { AppointmentInput } from "@/lib/validation";

// Sabit "şimdi": 7 Ekim 2026 Çarşamba 09:00 (İstanbul) = 06:00 UTC
export const NOW = new Date("2026-10-07T06:00:00Z");
export const TOMORROW = "2026-10-08"; // Perşembe

export async function resetDb() {
  await db.$executeRawUnsafe(`
    TRUNCATE "AppointmentNote", "Appointment", "Inquiry", "Notification", "RateLimit", "Session", "AdminUser",
      "MotorcycleImage", "MotorcycleColor", "Motorcycle", "Category", "Brand", "Media", "ServiceItem",
      "Holiday", "WorkingDay", "AppointmentSettings", "SiteSettings", "Page", "SeoEntry" CASCADE`);
}

/** Hafta içi 09:00–18:00 (12:00–13:00 mola), cumartesi 09:00–13:00, pazar kapalı. */
export async function setupSchedule(opts: { capacity?: number; enabled?: boolean; slotMinutes?: number; minLeadMinutes?: number } = {}) {
  await db.appointmentSettings.create({
    data: {
      id: 1,
      enabled: opts.enabled ?? true,
      slotMinutes: opts.slotMinutes ?? 60,
      slotCapacity: opts.capacity ?? 2,
      minLeadMinutes: opts.minLeadMinutes ?? 120,
      maxDaysAhead: 30,
    },
  });
  for (let w = 1; w <= 7; w++) {
    await db.workingDay.create({
      data: {
        weekday: w,
        isOpen: w !== 7,
        openTime: "09:00",
        closeTime: w === 6 ? "13:00" : "18:00",
        breakStart: w <= 5 ? "12:00" : null,
        breakEnd: w <= 5 ? "13:00" : null,
      },
    });
  }
  await db.siteSettings.create({ data: { id: 1, notifyEmail: "servis@test.local" } });
  const service = await db.serviceItem.create({
    data: { slug: "periyodik-bakim", title: "Periyodik bakım", published: true, bookable: true },
  });
  const brand = await db.brand.create({ data: { name: "Test Marka", slug: "test-marka" } });
  return { service, brand };
}

export function appointmentInput(
  ids: { serviceId: string; brandId: string },
  overrides: Partial<AppointmentInput> = {},
): AppointmentInput {
  return {
    brandId: ids.brandId,
    brandOther: "",
    model: "Test 125",
    modelYear: undefined,
    mileageKm: undefined,
    plate: undefined,
    serviceItemId: ids.serviceId,
    description: "",
    date: TOMORROW,
    time: "10:00",
    fullName: "Test Müşteri",
    phone: "5551112233",
    email: undefined,
    kvkk: true,
    marketing: false,
    website: "",
    formToken: "x".repeat(20),
    ...overrides,
  } as AppointmentInput;
}
