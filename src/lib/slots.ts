// Randevu slotlarının saf (veritabanından bağımsız) hesaplanması.
// Hem sunucu doğrulamasında hem de testlerde kullanılır.

import {
  addDays,
  isoWeekday,
  isValidDateString,
  isValidTimeString,
  minutesToTime,
  timeToMinutes,
  todayInTz,
  zonedTimeToUtc,
} from "./time";

export type WorkingDayRule = {
  weekday: number; // 1-7
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStart: string | null;
  breakEnd: string | null;
};

export type ScheduleConfig = {
  enabled: boolean;
  slotMinutes: number;
  slotCapacity: number;
  minLeadMinutes: number;
  maxDaysAhead: number;
  workingDays: WorkingDayRule[];
  holidays: string[]; // YYYY-MM-DD
};

/** Bir çalışma günü için slot başlangıç saatleri (molayla çakışanlar hariç). */
export function slotTimesForDay(rule: WorkingDayRule | undefined, slotMinutes: number): string[] {
  if (!rule || !rule.isOpen || slotMinutes <= 0) return [];
  if (!isValidTimeString(rule.openTime) || !isValidTimeString(rule.closeTime)) return [];
  const open = timeToMinutes(rule.openTime);
  const close = timeToMinutes(rule.closeTime);
  const hasBreak =
    rule.breakStart &&
    rule.breakEnd &&
    isValidTimeString(rule.breakStart) &&
    isValidTimeString(rule.breakEnd);
  const bStart = hasBreak ? timeToMinutes(rule.breakStart!) : -1;
  const bEnd = hasBreak ? timeToMinutes(rule.breakEnd!) : -1;

  const times: string[] = [];
  for (let start = open; start + slotMinutes <= close; start += slotMinutes) {
    const end = start + slotMinutes;
    if (hasBreak && start < bEnd && end > bStart) continue;
    times.push(minutesToTime(start));
  }
  return times;
}

export type DayStatus =
  | { open: true; times: string[] }
  | { open: false; reason: "disabled" | "past" | "too-far" | "holiday" | "closed" };

/** Belirli bir gün randevuya açık mı, açıksa hangi saatler henüz geçmemiş? */
export function dayStatus(config: ScheduleConfig, dateStr: string, now: Date): DayStatus {
  if (!config.enabled) return { open: false, reason: "disabled" };
  const today = todayInTz(now);
  if (dateStr < today) return { open: false, reason: "past" };
  if (dateStr > addDays(today, config.maxDaysAhead)) return { open: false, reason: "too-far" };
  if (config.holidays.includes(dateStr)) return { open: false, reason: "holiday" };

  const rule = config.workingDays.find((d) => d.weekday === isoWeekday(dateStr));
  const earliest = now.getTime() + config.minLeadMinutes * 60000;
  const times = slotTimesForDay(rule, config.slotMinutes).filter(
    (t) => zonedTimeToUtc(dateStr, t).getTime() >= earliest,
  );
  if (!rule?.isOpen) return { open: false, reason: "closed" };
  if (times.length === 0) return { open: false, reason: "past" };
  return { open: true, times };
}

export type SlotCheck =
  | { ok: true; slotStart: Date }
  | { ok: false; code: "invalid" | "disabled" | "past" | "too-far" | "holiday" | "closed" | "not-a-slot" };

/** Seçilen tarih/saatin geçerli bir slot olup olmadığını doğrular (kapasite hariç). */
export function checkSlot(config: ScheduleConfig, dateStr: string, time: string, now: Date): SlotCheck {
  if (!isValidDateString(dateStr) || !isValidTimeString(time)) return { ok: false, code: "invalid" };
  const status = dayStatus(config, dateStr, now);
  if (!status.open) return { ok: false, code: status.reason };
  if (!status.times.includes(time)) {
    // Gün açık ama saat ya geçmiş ya da slot ızgarasında değil
    const rule = config.workingDays.find((d) => d.weekday === isoWeekday(dateStr));
    const inGrid = slotTimesForDay(rule, config.slotMinutes).includes(time);
    return { ok: false, code: inGrid ? "past" : "not-a-slot" };
  }
  return { ok: true, slotStart: zonedTimeToUtc(dateStr, time) };
}

export const SLOT_ERROR_MESSAGES: Record<Exclude<SlotCheck, { ok: true }>["code"] | "full", string> = {
  invalid: "Geçerli bir tarih ve saat seçin.",
  disabled: "Online randevu şu anda kapalı. Lütfen bizimle iletişime geçin.",
  past: "Seçilen saat geçmişte kaldı. Lütfen ileri bir saat seçin.",
  "too-far": "Bu tarih için henüz randevu alınamıyor.",
  holiday: "Seçilen gün tatil olduğu için servis kapalı.",
  closed: "Seçilen gün servis kapalı.",
  "not-a-slot": "Seçilen saat randevu saatleri arasında değil.",
  full: "Bu saat dolmuş. Lütfen başka bir saat seçin.",
};
