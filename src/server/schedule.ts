import "server-only";
import { db } from "@/lib/db";
import type { ScheduleConfig } from "@/lib/slots";
import { dayStatus } from "@/lib/slots";
import { addDays, todayInTz, zonedTimeToUtc } from "@/lib/time";

export async function getAppointmentSettings() {
  return (
    (await db.appointmentSettings.findUnique({ where: { id: 1 } })) ??
    (await db.appointmentSettings.create({ data: { id: 1 } }))
  );
}

export async function getWorkingDays() {
  const days = await db.workingDay.findMany({ orderBy: { weekday: "asc" } });
  if (days.length === 7) return days;
  // Eksik günleri kapalı olarak tamamla
  const existing = new Set(days.map((d) => d.weekday));
  for (let w = 1; w <= 7; w++) {
    if (!existing.has(w)) await db.workingDay.create({ data: { weekday: w, isOpen: false } });
  }
  return db.workingDay.findMany({ orderBy: { weekday: "asc" } });
}

export async function loadScheduleConfig(): Promise<ScheduleConfig> {
  const [settings, workingDays, holidays] = await Promise.all([
    getAppointmentSettings(),
    getWorkingDays(),
    db.holiday.findMany({ select: { date: true } }),
  ]);
  return {
    enabled: settings.enabled,
    slotMinutes: settings.slotMinutes,
    slotCapacity: settings.slotCapacity,
    minLeadMinutes: settings.minLeadMinutes,
    maxDaysAhead: settings.maxDaysAhead,
    workingDays,
    holidays: holidays.map((h) => h.date),
  };
}

/** Bir zaman aralığında, iptal edilmemiş randevuların slot başına sayısı. */
export async function occupiedCounts(from: Date, to: Date): Promise<Map<number, number>> {
  const rows = await db.appointment.groupBy({
    by: ["slotStart"],
    where: { slotStart: { gte: from, lt: to }, status: { not: "CANCELLED" } },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.slotStart.getTime(), r._count._all]));
}

export type DayAvailability = {
  date: string;
  open: boolean;
  reason?: string;
  slots: { time: string; remaining: number }[];
};

/** Ziyaretçi takvimi: önümüzdeki günler ve her slotun kalan kapasitesi. */
export async function getAvailability(now = new Date()): Promise<{
  enabled: boolean;
  days: DayAvailability[];
}> {
  const config = await loadScheduleConfig();
  if (!config.enabled) return { enabled: false, days: [] };

  const today = todayInTz(now);
  const last = addDays(today, config.maxDaysAhead);
  const counts = await occupiedCounts(
    zonedTimeToUtc(today, "00:00"),
    zonedTimeToUtc(addDays(last, 1), "00:00"),
  );

  const days: DayAvailability[] = [];
  for (let i = 0; i <= config.maxDaysAhead; i++) {
    const date = addDays(today, i);
    const status = dayStatus(config, date, now);
    if (!status.open) {
      days.push({ date, open: false, reason: status.reason, slots: [] });
      continue;
    }
    const slots = status.times.map((time) => {
      const used = counts.get(zonedTimeToUtc(date, time).getTime()) ?? 0;
      return { time, remaining: Math.max(0, config.slotCapacity - used) };
    });
    const anyLeft = slots.some((s) => s.remaining > 0);
    days.push({ date, open: anyLeft, reason: anyLeft ? undefined : "full", slots });
  }
  return { enabled: true, days };
}
