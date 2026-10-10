import { beforeEach, describe, expect, it, vi } from "vitest";

// Sunucu işlemlerinin okuduğu çerezi test içinden kontrol ediyoruz
const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  }),
  headers: async () => new Headers({ "x-forwarded-for": "198.51.100.7" }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error(`REDIRECT ${url}`), { digest: `NEXT_REDIRECT;${url}` });
  },
}));
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T,>(fn: T) => fn }));

import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import {
  SESSION_COOKIE,
  createSession,
  getUserBySessionToken,
  hashPassword,
  requirePermission,
  verifyCredentials,
} from "@/server/auth";
import { setAppointmentStatus } from "@/app/admin/actions/customers";
import { saveBrand } from "@/app/admin/actions/catalog";
import { createUser } from "@/app/admin/actions/settings";
import { POST as upload } from "@/app/api/admin/upload/route";
import { NOW, appointmentInput, resetDb, setupSchedule } from "./helpers";
import { createAppointment } from "@/server/appointments";

async function userWithSession(role: "ADMIN" | "STAFF" | "EDITOR", active = true) {
  const user = await db.adminUser.create({
    data: { email: `${role.toLowerCase()}-${Math.random()}@test.local`, name: role, role, active, passwordHash: await hashPassword("dogru-parola-123") },
  });
  const { token } = await createSession(user.id);
  return { user, token };
}

function fd(data: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.set(k, v);
  return f;
}

beforeEach(async () => {
  cookieJar.clear();
  await resetDb();
});

describe("rol yetkileri", () => {
  it("yetki tablosu", () => {
    expect(hasPermission("ADMIN", "users")).toBe(true);
    expect(hasPermission("STAFF", "customers")).toBe(true);
    expect(hasPermission("STAFF", "users")).toBe(false);
    expect(hasPermission("EDITOR", "customers")).toBe(false);
    expect(hasPermission("EDITOR", "content")).toBe(true);
    expect(hasPermission(null, "content")).toBe(false);
  });
});

describe("parola ve oturum", () => {
  it("parola bcrypt ile hash'lenir ve doğrulanır", async () => {
    const { user } = await userWithSession("ADMIN");
    expect(user.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(await verifyCredentials(user.email, "dogru-parola-123")).not.toBeNull();
    expect(await verifyCredentials(user.email, "yanlis-parola")).toBeNull();
    expect(await verifyCredentials("yok@test.local", "dogru-parola-123")).toBeNull();
  });

  it("oturum belirteci veritabanında yalnızca özet olarak tutulur", async () => {
    const { token } = await userWithSession("STAFF");
    const sessions = await db.session.findMany();
    expect(sessions[0].id).not.toBe(token);
    expect(sessions[0].id).toHaveLength(64);
  });

  it("süresi dolmuş oturum ve pasif kullanıcı reddedilir", async () => {
    const { token, user } = await userWithSession("STAFF");
    expect(await getUserBySessionToken(token)).not.toBeNull();
    await db.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await getUserBySessionToken(token)).toBeNull();

    const second = await createSession(user.id);
    await db.adminUser.update({ where: { id: user.id }, data: { active: false } });
    expect(await getUserBySessionToken(second.token)).toBeNull();
    expect(await getUserBySessionToken("uydurma-belirtec")).toBeNull();
  });

  it("pasif kullanıcı giriş yapamaz", async () => {
    const { user } = await userWithSession("ADMIN", false);
    expect(await verifyCredentials(user.email, "dogru-parola-123")).toBeNull();
  });
});

describe("sunucu tarafı yetki denetimi", () => {
  it("oturum yoksa requirePermission hata fırlatır", async () => {
    await expect(requirePermission("content")).rejects.toMatchObject({ reason: "unauthenticated" });
  });

  it("içerik editörü müşteri verisine erişemez ve randevu durumunu değiştiremez", async () => {
    const { service, brand } = await setupSchedule();
    const a = await createAppointment(appointmentInput({ serviceId: service.id, brandId: brand.id }), NOW);
    const { token } = await userWithSession("EDITOR");
    cookieJar.set(SESSION_COOKIE, token);

    await expect(requirePermission("customers")).rejects.toMatchObject({ reason: "forbidden" });
    const result = await setAppointmentStatus({}, fd({ id: a.id, status: "CONFIRMED" }));
    expect(result.ok).toBe(false);
    expect((await db.appointment.findUniqueOrThrow({ where: { id: a.id } })).status).toBe("PENDING");
  });

  it("servis personeli randevu durumunu değiştirebilir ama kullanıcı oluşturamaz", async () => {
    const { service, brand } = await setupSchedule();
    const a = await createAppointment(appointmentInput({ serviceId: service.id, brandId: brand.id }), NOW);
    const { token } = await userWithSession("STAFF");
    cookieJar.set(SESSION_COOKIE, token);

    expect((await setAppointmentStatus({}, fd({ id: a.id, status: "CONFIRMED" }))).ok).toBe(true);
    expect((await db.appointment.findUniqueOrThrow({ where: { id: a.id } })).status).toBe("CONFIRMED");

    const r = await createUser({}, fd({ email: "yeni@test.local", name: "Yeni", role: "ADMIN", password: "uzun-parola-123" }));
    expect(r.ok).toBe(false);
    expect(await db.adminUser.count({ where: { email: "yeni@test.local" } })).toBe(0);
  });

  it("oturumsuz sunucu işlemi veri değiştirmez", async () => {
    const r = await saveBrand({}, fd({ name: "Sızma Denemesi" }));
    expect(r.ok).toBe(false);
    expect(await db.brand.count()).toBe(0);
  });

  it("yönetici kullanıcı oluşturabilir", async () => {
    const { token } = await userWithSession("ADMIN");
    cookieJar.set(SESSION_COOKIE, token);
    const r = await createUser({}, fd({ email: "personel@test.local", name: "Personel", role: "STAFF", password: "uzun-parola-123" }));
    expect(r.ok).toBe(true);
    const created = await db.adminUser.findUniqueOrThrow({ where: { email: "personel@test.local" } });
    expect(created.passwordHash).not.toContain("uzun-parola-123");
  });
});

describe("görsel yükleme ucu", () => {
  function uploadRequest(body: FormData) {
    return new Request("http://localhost/api/admin/upload", { method: "POST", body });
  }

  it("oturumsuz istek 401 döner", async () => {
    const res = await upload(uploadRequest(new FormData()));
    expect(res.status).toBe(401);
  });

  it("görsel olmayan dosya içerik kontrolüyle reddedilir", async () => {
    const { token } = await userWithSession("EDITOR");
    cookieJar.set(SESSION_COOKIE, token);
    const form = new FormData();
    // Uzantı ve tür bildirimi görsel gibi, içerik değil
    form.set("file", new File([Buffer.from("<?php echo 'x'; ?>")], "zararli.jpg", { type: "image/jpeg" }));
    const res = await upload(uploadRequest(form));
    expect(res.status).toBe(422);
    expect(await db.media.count()).toBe(0);
  });

  it("izin verilmeyen tür reddedilir", async () => {
    const { token } = await userWithSession("EDITOR");
    cookieJar.set(SESSION_COOKIE, token);
    const form = new FormData();
    form.set("file", new File([Buffer.from("<svg/>")], "a.svg", { type: "image/svg+xml" }));
    expect((await upload(uploadRequest(form))).status).toBe(422);
  });
});
