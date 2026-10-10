import { describe, expect, it } from "vitest";
import { checkSlot, dayStatus, slotTimesForDay, type ScheduleConfig } from "@/lib/slots";
import { toZoned, zonedTimeToUtc } from "@/lib/time";

const weekday = { isOpen: true, openTime: "09:00", closeTime: "18:00", breakStart: "12:00", breakEnd: "13:00" };

const config: ScheduleConfig = {
  enabled: true,
  slotMinutes: 60,
  slotCapacity: 2,
  minLeadMinutes: 120,
  maxDaysAhead: 30,
  workingDays: [
    ...[1, 2, 3, 4, 5].map((w) => ({ weekday: w, ...weekday })),
    { weekday: 6, isOpen: true, openTime: "09:00", closeTime: "13:00", breakStart: null, breakEnd: null },
    { weekday: 7, isOpen: false, openTime: "09:00", closeTime: "18:00", breakStart: null, breakEnd: null },
  ],
  holidays: ["2026-10-29"],
};

// 7 Ekim 2026 Çarşamba 09:00 İstanbul
const NOW = new Date("2026-10-07T06:00:00Z");

describe("saat dilimi (Europe/Istanbul)", () => {
  it("yerel saati UTC'ye ve geri doğru çevirir (UTC+3)", () => {
    const utc = zonedTimeToUtc("2026-10-08", "10:00");
    expect(utc.toISOString()).toBe("2026-10-08T07:00:00.000Z");
    expect(toZoned(utc)).toEqual({ date: "2026-10-08", time: "10:00" });
  });
  it("gece yarısına yakın saatlerde günü doğru belirler", () => {
    // 21:30 UTC = ertesi gün 00:30 İstanbul
    expect(toZoned(new Date("2026-10-07T21:30:00Z")).date).toBe("2026-10-08");
  });
});

describe("slot üretimi", () => {
  it("molayla çakışan slotları atlar ve kapanışı aşmaz", () => {
    expect(slotTimesForDay({ weekday: 1, ...weekday }, 60)).toEqual([
      "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    ]);
  });
  it("90 dakikalık slotta son slot kapanışa sığmalı", () => {
    const times = slotTimesForDay({ weekday: 1, isOpen: true, openTime: "09:00", closeTime: "18:00", breakStart: null, breakEnd: null }, 90);
    expect(times.at(-1)).toBe("16:30");
  });
  it("kapalı gün için slot yok", () => {
    expect(slotTimesForDay({ weekday: 7, isOpen: false, openTime: "09:00", closeTime: "18:00", breakStart: null, breakEnd: null }, 60)).toEqual([]);
  });
});

describe("gün ve slot doğrulaması", () => {
  it("bugünün geçmiş ve asgari süre içindeki saatlerini kapatır", () => {
    const status = dayStatus(config, "2026-10-07", NOW);
    expect(status.open).toBe(true);
    if (status.open) expect(status.times[0]).toBe("11:00"); // 09:00 + 120 dk
  });
  it("geçmiş tarih seçilemez", () => {
    expect(checkSlot(config, "2026-10-06", "10:00", NOW)).toEqual({ ok: false, code: "past" });
  });
  it("bugün geçmiş saat seçilemez", () => {
    expect(checkSlot(config, "2026-10-07", "09:00", NOW)).toEqual({ ok: false, code: "past" });
  });
  it("pazar (kapalı gün) seçilemez", () => {
    expect(checkSlot(config, "2026-10-11", "10:00", NOW)).toEqual({ ok: false, code: "closed" });
  });
  it("tatil seçilemez", () => {
    expect(checkSlot(config, "2026-10-29", "10:00", NOW)).toEqual({ ok: false, code: "holiday" });
  });
  it("izin verilen süreden ileri tarih seçilemez", () => {
    expect(checkSlot(config, "2026-12-01", "10:00", NOW)).toEqual({ ok: false, code: "too-far" });
  });
  it("ızgarada olmayan saat ve mola saati reddedilir", () => {
    expect(checkSlot(config, "2026-10-08", "10:30", NOW)).toEqual({ ok: false, code: "not-a-slot" });
    expect(checkSlot(config, "2026-10-08", "12:00", NOW)).toEqual({ ok: false, code: "not-a-slot" });
  });
  it("randevu kapalıyken hiçbir slot kabul edilmez", () => {
    expect(checkSlot({ ...config, enabled: false }, "2026-10-08", "10:00", NOW)).toEqual({ ok: false, code: "disabled" });
  });
  it("geçerli slot UTC başlangıcıyla döner", () => {
    const r = checkSlot(config, "2026-10-08", "10:00", NOW);
    expect(r.ok && r.slotStart.toISOString()).toBe("2026-10-08T07:00:00.000Z");
  });
});
