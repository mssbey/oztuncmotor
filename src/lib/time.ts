// Europe/Istanbul saat dilimi yardımcıları. Hem sunucuda hem istemcide çalışır.
// Takvim günleri "YYYY-MM-DD", saatler "HH:mm" biçiminde, yerel (İstanbul) olarak taşınır;
// veritabanına yazılan anlık zaman (slotStart) her zaman UTC'dir.

export const TIME_ZONE = "Europe/Istanbul";

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function zonedParts(date: Date) {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(date).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Verilen anlık zamanın İstanbul'daki takvim günü ve saati. */
export function toZoned(date: Date): { date: string; time: string } {
  const p = zonedParts(date);
  return {
    date: `${p.year}-${pad(p.month)}-${pad(p.day)}`,
    time: `${pad(p.hour)}:${pad(p.minute)}`,
  };
}

/** Saat diliminin verilen andaki UTC farkı (dakika). */
function offsetMinutes(date: Date): number {
  const p = zonedParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/** İstanbul yerel tarih + saatini UTC Date'e çevirir. */
export function zonedTimeToUtc(dateStr: string, timeStr: string): Date {
  const [y, m, d] = parseDate(dateStr);
  const [hh, mm] = timeStr.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let result = guess - offsetMinutes(new Date(guess)) * 60000;
  // Yaz saati geçişlerine karşı ikinci tur (İstanbul'da şu an DST yok, ama güvenli kalsın)
  result = guess - offsetMinutes(new Date(result)) * 60000;
  return new Date(result);
}

export function todayInTz(now: Date = new Date()): string {
  return toZoned(now).date;
}

export function parseDate(dateStr: string): [number, number, number] {
  const [y, m, d] = dateStr.split("-").map(Number);
  return [y, m, d];
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = parseDate(value);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isValidTimeString(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = parseDate(dateStr);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** ISO hafta günü: 1 = Pazartesi … 7 = Pazar */
export function isoWeekday(dateStr: string): number {
  const [y, m, d] = parseDate(dateStr);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return w === 0 ? 7 : w;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(total: number): string {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export const WEEKDAY_NAMES = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
] as const;

/** "7 Ekim 2026 Çarşamba" */
export function formatDateLong(dateStr: string): string {
  const [y, m, d] = parseDate(dateStr);
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatDateShort(dateStr: string): string {
  const [y, m, d] = parseDate(dateStr);
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Bir anlık zamanı İstanbul saatine göre "07.10.2026 14:30" biçiminde yazar. */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
