import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { createAppointment } from "@/server/appointments";
import { MAX_ATTEMPTS, deliverPendingNotifications, requeueNotification, setMailer } from "@/server/notifications";
import { NOW, appointmentInput, resetDb, setupSchedule } from "./helpers";

let ids: { serviceId: string; brandId: string };

beforeEach(async () => {
  await resetDb();
  const { service, brand } = await setupSchedule({ capacity: 2 });
  ids = { serviceId: service.id, brandId: brand.id };
});
afterEach(() => setMailer(null));

describe("bildirimler ve başarısız gönderim", () => {
  it("randevu ile bildirim kaydı aynı işlemde yazılır (müşteri e-postası varsa iki kayıt)", async () => {
    await createAppointment(appointmentInput(ids, { email: "musteri@test.local" }), NOW);
    const n = await db.notification.findMany({ orderBy: { createdAt: "asc" } });
    expect(n.map((x) => x.recipient).sort()).toEqual(["musteri@test.local", "servis@test.local"]);
    expect(n.every((x) => x.status === "PENDING")).toBe(true);
  });

  it("SMTP hatası randevuyu kaybettirmez; hata kaydedilir ve yeniden denenebilir", async () => {
    const appointment = await createAppointment(appointmentInput(ids), NOW);
    setMailer(async () => {
      throw new Error("SMTP bağlantısı reddedildi");
    });
    const r = await deliverPendingNotifications();
    expect(r.failed).toBe(1);

    expect(await db.appointment.findUnique({ where: { id: appointment.id } })).not.toBeNull();
    const n = await db.notification.findFirstOrThrow();
    expect(n.status).toBe("PENDING");
    expect(n.attempts).toBe(1);
    expect(n.lastError).toContain("SMTP bağlantısı reddedildi");
    expect(n.nextAttemptAt.getTime()).toBeGreaterThan(Date.now()); // geri çekilme süresi

    // Zamanı gelmeden tekrar denenmez
    expect((await deliverPendingNotifications()).failed).toBe(0);

    // Yeniden kuyruğa alınınca gönderim başarılı olur
    const sent = vi.fn(async () => {});
    setMailer(sent);
    await requeueNotification(n.id);
    expect((await deliverPendingNotifications()).sent).toBe(1);
    expect(sent).toHaveBeenCalledOnce();
    expect((await db.notification.findFirstOrThrow()).status).toBe("SENT");
  });

  it(`${MAX_ATTEMPTS} başarısız denemeden sonra FAILED olarak işaretlenir`, async () => {
    await createAppointment(appointmentInput(ids), NOW);
    setMailer(async () => {
      throw new Error("kapalı");
    });
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await db.notification.updateMany({ data: { nextAttemptAt: new Date(0) } });
      await deliverPendingNotifications();
    }
    const n = await db.notification.findFirstOrThrow();
    expect(n.status).toBe("FAILED");
    expect(n.attempts).toBe(MAX_ATTEMPTS);
    expect(await db.appointment.count()).toBe(1);
  });

  it("aynı bildirim eşzamanlı iki işçi tarafından iki kez gönderilmez", async () => {
    await createAppointment(appointmentInput(ids), NOW);
    const sent = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    setMailer(sent);
    await Promise.all([deliverPendingNotifications(), deliverPendingNotifications()]);
    expect(sent).toHaveBeenCalledTimes(1);
  });

  it("kayıt başarısız olursa (dolu slot) ne randevu ne bildirim oluşur", async () => {
    await createAppointment(appointmentInput(ids), NOW);
    await createAppointment(appointmentInput(ids), NOW);
    const before = await db.notification.count();
    await expect(createAppointment(appointmentInput(ids), NOW)).rejects.toMatchObject({ code: "full" });
    expect(await db.appointment.count()).toBe(2);
    expect(await db.notification.count()).toBe(before);
  });
});
