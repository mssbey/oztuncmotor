import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { AppointmentError, createAppointment, rescheduleAppointment, updateAppointmentStatus } from "@/server/appointments";
import { NOW, appointmentInput, resetDb, setupSchedule } from "./helpers";

let ids: { serviceId: string; brandId: string };

async function setup(capacity: number) {
  await resetDb();
  const { service, brand } = await setupSchedule({ capacity });
  ids = { serviceId: service.id, brandId: brand.id };
}

describe("randevu kapasitesi", () => {
  beforeEach(() => setup(2));

  it("ilk durum Onay Bekliyor ve referans üretilir", async () => {
    const a = await createAppointment(appointmentInput(ids), NOW);
    expect(a.status).toBe("PENDING");
    expect(a.reference).toMatch(/^OZ-[A-Z0-9]{6}$/);
    expect(a.slotStart.toISOString()).toBe("2026-10-08T07:00:00.000Z");
  });

  it("kapasite dolunca yeni talep reddedilir; bekleyen talepler kapasiteye dahildir", async () => {
    await createAppointment(appointmentInput(ids), NOW);
    await createAppointment(appointmentInput(ids), NOW);
    await expect(createAppointment(appointmentInput(ids), NOW)).rejects.toMatchObject({ code: "full" });
    expect(await db.appointment.count()).toBe(2);
  });

  it("iptal edilen randevu kapasiteyi serbest bırakır", async () => {
    const first = await createAppointment(appointmentInput(ids), NOW);
    await createAppointment(appointmentInput(ids), NOW);
    await updateAppointmentStatus(first.id, "CANCELLED");
    await expect(createAppointment(appointmentInput(ids), NOW)).resolves.toBeTruthy();
  });

  it("dolu slotta iptal edilmiş randevu yeniden açılamaz", async () => {
    const first = await createAppointment(appointmentInput(ids), NOW);
    await createAppointment(appointmentInput(ids), NOW);
    await updateAppointmentStatus(first.id, "CANCELLED");
    await createAppointment(appointmentInput(ids), NOW);
    await expect(updateAppointmentStatus(first.id, "PENDING")).rejects.toBeInstanceOf(AppointmentError);
    expect((await db.appointment.findUniqueOrThrow({ where: { id: first.id } })).status).toBe("CANCELLED");
  });

  it("dolu slota zaman değişikliği yapılamaz", async () => {
    await createAppointment(appointmentInput(ids, { time: "11:00" }), NOW);
    await createAppointment(appointmentInput(ids, { time: "11:00" }), NOW);
    const other = await createAppointment(appointmentInput(ids, { time: "10:00" }), NOW);
    await expect(rescheduleAppointment(other.id, "2026-10-08", "11:00", NOW)).rejects.toMatchObject({ code: "full" });
  });

  it("geçmiş saat, kapalı gün ve yayımlanmamış hizmet sunucuda reddedilir", async () => {
    await expect(createAppointment(appointmentInput(ids, { date: "2026-10-07", time: "09:00" }), NOW)).rejects.toMatchObject({ code: "slot" });
    await expect(createAppointment(appointmentInput(ids, { date: "2026-10-11" }), NOW)).rejects.toMatchObject({ code: "slot" });
    await db.serviceItem.update({ where: { id: ids.serviceId }, data: { published: false } });
    await expect(createAppointment(appointmentInput(ids), NOW)).rejects.toMatchObject({ code: "service" });
    expect(await db.appointment.count()).toBe(0);
  });

  it("“Diğer” markası serbest metinle kaydedilir", async () => {
    const a = await createAppointment(appointmentInput(ids, { brandId: "other", brandOther: "Nadir Marka" }), NOW);
    expect(a.brandId).toBeNull();
    expect(a.brandName).toBe("Nadir Marka");
  });
});

describe("eşzamanlı talepler", () => {
  it("aynı slota aynı anda gelen 12 talepten yalnızca kapasite kadarı kabul edilir", async () => {
    await setup(3);
    const results = await Promise.allSettled(
      Array.from({ length: 12 }, (_, i) => createAppointment(appointmentInput(ids, { fullName: `Eşzamanlı ${i}` }), NOW)),
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const full = results.filter((r) => r.status === "rejected" && (r.reason as AppointmentError).code === "full").length;
    expect(ok).toBe(3);
    expect(full).toBe(9);
    expect(await db.appointment.count({ where: { status: { not: "CANCELLED" } } })).toBe(3);
  });

  it("farklı slotlara gelen eşzamanlı talepler birbirini engellemez", async () => {
    await setup(1);
    const times = ["09:00", "10:00", "11:00", "13:00", "14:00"];
    const results = await Promise.allSettled(times.map((time) => createAppointment(appointmentInput(ids, { time }), NOW)));
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
  });

  it("kapasite 1 iken iptal + yeni talep yarışında kapasite aşılmaz", async () => {
    await setup(1);
    const a = await createAppointment(appointmentInput(ids), NOW);
    await updateAppointmentStatus(a.id, "CANCELLED");
    const results = await Promise.allSettled([
      updateAppointmentStatus(a.id, "PENDING"),
      createAppointment(appointmentInput(ids), NOW),
      createAppointment(appointmentInput(ids), NOW),
    ]);
    expect(results.filter((r) => r.status === "fulfilled").length).toBe(1);
    expect(await db.appointment.count({ where: { status: { not: "CANCELLED" } } })).toBe(1);
  });
});
