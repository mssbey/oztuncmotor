import { beforeEach, describe, expect, it, vi } from "vitest";

// Route handler'lar istek dışında çalıştırıldığı için after() burada yalnızca kaydedilir
vi.mock("next/server", async (orig) => ({ ...(await orig<typeof import("next/server")>()), after: vi.fn() }));

import { db } from "@/lib/db";
import { addDays, todayInTz } from "@/lib/time";
import { issueFormToken } from "@/server/security";
import { POST as postAppointment } from "@/app/api/appointments/route";
import { POST as postInquiry } from "@/app/api/inquiries/route";
import { resetDb, setupSchedule } from "./helpers";

let ids: { serviceId: string; brandId: string };
let ipCounter = 0;

function request(url: string, body: unknown, ip = `10.0.0.${++ipCounter}`) {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

// Gerçek saatle çalışır: yarından sonraki ilk hafta içi günü
function nextWeekday(): string {
  let d = addDays(todayInTz(), 2);
  while ([6, 7].includes(new Date(`${d}T12:00:00Z`).getUTCDay() || 7)) d = addDays(d, 1);
  return d;
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    brandId: ids.brandId,
    model: "Test 125",
    serviceItemId: ids.serviceId,
    date: nextWeekday(),
    time: "10:00",
    fullName: "Api Test",
    phone: "0555 111 22 33",
    kvkk: true,
    marketing: false,
    website: "",
    formToken: issueFormToken(Date.now() - 10_000),
    ...overrides,
  };
}

beforeEach(async () => {
  await resetDb();
  const { service, brand } = await setupSchedule({ capacity: 1 });
  ids = { serviceId: service.id, brandId: brand.id };
});

describe("POST /api/appointments", () => {
  it("geçerli talep 201 ve referans döner; kayıt veritabanında", async () => {
    const res = await postAppointment(request("/api/appointments", validBody()));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.reference).toMatch(/^OZ-/);
    const saved = await db.appointment.findUniqueOrThrow({ where: { reference: data.reference } });
    expect(saved.status).toBe("PENDING");
    expect(saved.phone).toBe("5551112233");
    expect(saved.marketingConsent).toBe(false);
  });

  it("alan hataları alan adlarıyla döner, kayıt yapılmaz", async () => {
    const res = await postAppointment(request("/api/appointments", validBody({ phone: "123", kvkk: false, model: "" })));
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(Object.keys(data.errors)).toEqual(expect.arrayContaining(["phone", "kvkk", "model"]));
    expect(await db.appointment.count()).toBe(0);
  });

  it("dolu slot 409 döner ve başarı mesajı gösterilmez", async () => {
    expect((await postAppointment(request("/api/appointments", validBody()))).status).toBe(201);
    const res = await postAppointment(request("/api/appointments", validBody()));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.reference).toBeUndefined();
  });

  it("veritabanı hatasında 500 döner, referans verilmez", async () => {
    const spy = vi.spyOn(db, "$transaction").mockRejectedValueOnce(new Error("bağlantı koptu"));
    const res = await postAppointment(request("/api/appointments", validBody()));
    spy.mockRestore();
    expect(res.status).toBe(500);
    expect((await res.json()).reference).toBeUndefined();
    expect(await db.appointment.count()).toBe(0);
  });

  it("spam koruması: bal küpü, çok hızlı gönderim ve sahte belirteç reddedilir", async () => {
    expect((await postAppointment(request("/api/appointments", validBody({ website: "http://spam" })))).status).toBe(400);
    expect((await postAppointment(request("/api/appointments", validBody({ formToken: issueFormToken() })))).status).toBe(400);
    expect((await postAppointment(request("/api/appointments", validBody({ formToken: `${Date.now() - 10000}.sahte-imza-123456` })))).status).toBe(400);
    expect(await db.appointment.count()).toBe(0);
  });

  it("aynı IP'den hız sınırı aşılınca 429 döner", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      const res = await postAppointment(request("/api/appointments", validBody({ phone: "12" }), "203.0.113.9"));
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 5).every((s) => s === 422)).toBe(true);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });
});

describe("POST /api/inquiries", () => {
  it("bilgi talebini ürün kimliğiyle kaydeder", async () => {
    const m = await db.motorcycle.create({
      data: { slug: "deneme", brandId: ids.brandId, model: "Deneme 700", published: true },
    });
    const res = await postInquiry(
      request("/api/inquiries", {
        motorcycleId: m.id,
        fullName: "Talep Sahibi",
        phone: "05551234567",
        message: "Fiyat?",
        kvkk: true,
        website: "",
        formToken: issueFormToken(Date.now() - 10_000),
      }),
    );
    expect(res.status).toBe(201);
    const saved = await db.inquiry.findFirstOrThrow();
    expect(saved.motorcycleId).toBe(m.id);
    expect(saved.motorcycleLabel).toBe("Test Marka Deneme 700");
    expect(await db.notification.count()).toBe(1);
  });

  it("yayımlanmamış ürün için talep kabul edilmez", async () => {
    const m = await db.motorcycle.create({ data: { slug: "taslak", brandId: ids.brandId, model: "Taslak", published: false } });
    const res = await postInquiry(
      request("/api/inquiries", {
        motorcycleId: m.id,
        fullName: "Talep Sahibi",
        phone: "05551234567",
        kvkk: true,
        formToken: issueFormToken(Date.now() - 10_000),
      }),
    );
    expect(res.status).toBe(500);
    expect(await db.inquiry.count()).toBe(0);
  });
});
