"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/enums";
import { isValidDateString, isValidTimeString, timeToMinutes } from "@/lib/time";
import { normalizePhone } from "@/lib/validation";
import { ActionError, bool, optDecimal, optInt, optStr, run, str, type ActionState } from "@/server/admin-action";
import { hashPassword } from "@/server/auth";
import { deliverPendingNotifications, requeueNotification } from "@/server/notifications";

// ─── Çalışma saatleri ve kapasite ────────────────────────────────────

export async function saveSchedule(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("schedule", async () => {
    const errors: Record<string, string> = {};
    const days = [];
    for (let w = 1; w <= 7; w++) {
      const isOpen = bool(fd, `open-${w}`);
      const openTime = str(fd, `from-${w}`) || "09:00";
      const closeTime = str(fd, `to-${w}`) || "18:00";
      const breakStart = optStr(fd, `bfrom-${w}`);
      const breakEnd = optStr(fd, `bto-${w}`);
      if (isOpen) {
        if (!isValidTimeString(openTime) || !isValidTimeString(closeTime) || timeToMinutes(openTime) >= timeToMinutes(closeTime)) {
          errors[`to-${w}`] = "Kapanış saati açılıştan sonra olmalı.";
        }
        if ((breakStart && !breakEnd) || (!breakStart && breakEnd)) errors[`bto-${w}`] = "Mola için başlangıç ve bitiş girin.";
        if (breakStart && breakEnd) {
          if (!isValidTimeString(breakStart) || !isValidTimeString(breakEnd) || timeToMinutes(breakStart) >= timeToMinutes(breakEnd)) {
            errors[`bto-${w}`] = "Mola bitişi başlangıçtan sonra olmalı.";
          } else if (timeToMinutes(breakStart) < timeToMinutes(openTime) || timeToMinutes(breakEnd) > timeToMinutes(closeTime)) {
            errors[`bto-${w}`] = "Mola çalışma saatleri içinde olmalı.";
          }
        }
      }
      days.push({ weekday: w, isOpen, openTime, closeTime, breakStart, breakEnd });
    }
    const slotMinutes = optInt(fd, "slotMinutes", "Slot süresi", 15, 480) ?? 60;
    const slotCapacity = optInt(fd, "slotCapacity", "Slot kapasitesi", 1, 50) ?? 1;
    const minLeadMinutes = (optInt(fd, "minLeadHours", "En erken randevu", 0, 336) ?? 2) * 60;
    const maxDaysAhead = optInt(fd, "maxDaysAhead", "Gün sayısı", 1, 120) ?? 30;
    if (Object.keys(errors).length) throw new ActionError("Lütfen işaretli saatleri kontrol edin.", errors);

    await db.$transaction([
      ...days.map((d) => db.workingDay.upsert({ where: { weekday: d.weekday }, update: d, create: d })),
      db.appointmentSettings.upsert({
        where: { id: 1 },
        update: {
          slotMinutes,
          slotCapacity,
          minLeadMinutes,
          maxDaysAhead,
          enabled: bool(fd, "enabled"),
          showHoursPublic: bool(fd, "showHoursPublic"),
        },
        create: { id: 1, slotMinutes, slotCapacity, minLeadMinutes, maxDaysAhead },
      }),
    ]);
    return "Çalışma saatleri ve randevu ayarları kaydedildi.";
  });
}

export async function addHoliday(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("schedule", async () => {
    const date = str(fd, "date");
    const name = str(fd, "name") || "Tatil";
    if (!isValidDateString(date)) throw new ActionError("Geçerli bir tarih seçin.", { date: "Tarih seçin." });
    await db.holiday.upsert({ where: { date }, update: { name }, create: { date, name: name.slice(0, 80) } });
    const affected = await db.appointment.count({ where: { slotDate: date, status: { in: ["PENDING", "CONFIRMED"] } } });
    return affected
      ? `Tatil eklendi. Bu tarihte ${affected} aktif randevu var; müşterilerle iletişime geçin.`
      : "Tatil eklendi.";
  });
}

export async function removeHoliday(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("schedule", async () => {
    await db.holiday.delete({ where: { id: str(fd, "id") } });
    return "Tatil kaldırıldı.";
  });
}

// ─── Site ayarları ───────────────────────────────────────────────────

function optUrl(fd: FormData, key: string, label: string): string | null {
  const v = optStr(fd, key);
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") throw new Error();
    return u.toString();
  } catch {
    throw new ActionError(`${label} geçersiz.`, { [key]: "https:// ile başlayan tam adres girin." });
  }
}

function optPhone(fd: FormData, key: string, label: string): string | null {
  const v = optStr(fd, key);
  if (!v) return null;
  const n = normalizePhone(v);
  if (!n) throw new ActionError(`${label} geçersiz.`, { [key]: "Geçerli bir numara girin (ör. 0380 123 45 67)." });
  return n;
}

function optEmail(fd: FormData, key: string): string | null {
  const v = optStr(fd, key);
  if (!v) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new ActionError("E-posta geçersiz.", { [key]: "Geçerli bir e-posta adresi girin." });
  return v.toLowerCase();
}

export async function saveContactSettings(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("settings", async () => {
    const data = {
      addressLine: str(fd, "addressLine") || "Cedidiye Mahallesi, Mimar Sinan Caddesi No:75",
      postalCode: str(fd, "postalCode") || "81020",
      district: str(fd, "district"),
      city: str(fd, "city") || "Düzce",
      phone: optPhone(fd, "phone", "Telefon"),
      whatsapp: optPhone(fd, "whatsapp", "WhatsApp"),
      email: optEmail(fd, "email"),
      notifyEmail: optEmail(fd, "notifyEmail"),
      instagramUrl: optUrl(fd, "instagramUrl", "Instagram adresi"),
      facebookUrl: optUrl(fd, "facebookUrl", "Facebook adresi"),
      mapEmbedEnabled: bool(fd, "mapEmbedEnabled"),
      latitude: optDecimal(fd, "latitude", "Enlem", 90),
      longitude: optDecimal(fd, "longitude", "Boylam", 180),
    };
    await db.siteSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
    return "İletişim bilgileri kaydedildi.";
  });
}

export async function saveContentSettings(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("settings", async () => {
    const data = {
      heroTitle: str(fd, "heroTitle") || "Yolun başı.\nÖztunç Motor.",
      heroText: str(fd, "heroText").slice(0, 300),
      heroLocation: str(fd, "heroLocation").slice(0, 80),
      serviceTitle: str(fd, "serviceTitle") || "Motoruna iyi bak.\nYola güvenle devam et.",
      serviceText: str(fd, "serviceText").slice(0, 600),
      aboutTitle: str(fd, "aboutTitle").slice(0, 120),
      aboutText: str(fd, "aboutText").slice(0, 4000),
    };
    await db.siteSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
    return "Metinler kaydedildi.";
  });
}

export async function saveImageSettings(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("settings", async () => {
    const keys = ["logoId", "heroImageId", "serviceImageId", "aboutImage1Id", "aboutImage2Id"] as const;
    const data: Record<string, string | null> = {};
    for (const k of keys) {
      const id = optStr(fd, k);
      if (id && !(await db.media.findUnique({ where: { id } }))) throw new ActionError("Görsel bulunamadı; yeniden yükleyin.");
      data[k] = id;
    }
    await db.siteSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
    return "Görseller kaydedildi.";
  });
}

// ─── SEO ve sayfalar ─────────────────────────────────────────────────

export async function saveSeo(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("content", async () => {
    const key = str(fd, "key");
    if (!/^[a-z]+$/.test(key)) throw new ActionError("Geçersiz sayfa.");
    const title = optStr(fd, "title")?.slice(0, 70) ?? null;
    const description = optStr(fd, "description")?.slice(0, 170) ?? null;
    await db.seoEntry.upsert({ where: { key }, update: { title, description }, create: { key, title, description } });
    return "SEO bilgileri kaydedildi.";
  });
}

export async function savePage(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("content", async () => {
    const key = str(fd, "key");
    const title = str(fd, "title");
    const body = str(fd, "body");
    if (!title) throw new ActionError("Başlık gerekli.", { title: "Başlık girin." });
    if (body.length < 20) throw new ActionError("Metin çok kısa.", { body: "Metni girin." });
    await db.page.update({ where: { key }, data: { title: title.slice(0, 120), body: body.slice(0, 30000) } });
    return "Metin kaydedildi.";
  });
}

// ─── Bildirimler ─────────────────────────────────────────────────────

export async function retryNotification(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("settings", async () => {
    const id = str(fd, "id");
    await requeueNotification(id);
    const r = await deliverPendingNotifications({ ids: [id] });
    if (r.skipped) return "Kuyruğa alındı; SMTP yapılandırılmadığı için gönderilemedi.";
    return r.sent ? "Bildirim gönderildi." : "Gönderim yine başarısız oldu; hata kaydı güncellendi.";
  });
}

export async function runNotificationQueue(_p: ActionState, _fd: FormData): Promise<ActionState> {
  return run("settings", async () => {
    const r = await deliverPendingNotifications({ limit: 50 });
    if (r.skipped) return `SMTP yapılandırılmadı; ${r.skipped} bildirim kuyrukta bekliyor.`;
    return `${r.sent} gönderildi, ${r.failed} başarısız.`;
  });
}

// ─── Kullanıcılar ────────────────────────────────────────────────────

const ROLES: UserRole[] = ["ADMIN", "STAFF", "EDITOR"];

function validatePassword(pw: string, key = "password") {
  if (pw.length < 10) throw new ActionError("Parola en az 10 karakter olmalı.", { [key]: "En az 10 karakter girin." });
}

export async function createUser(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("users", async () => {
    const email = optEmail(fd, "email");
    const name = str(fd, "name");
    const role = str(fd, "role") as UserRole;
    const password = String(fd.get("password") ?? "");
    if (!email) throw new ActionError("E-posta gerekli.", { email: "E-posta girin." });
    if (!name) throw new ActionError("Ad gerekli.", { name: "Ad girin." });
    if (!ROLES.includes(role)) throw new ActionError("Rol seçin.", { role: "Rol seçin." });
    validatePassword(password);
    if (await db.adminUser.findUnique({ where: { email } })) throw new ActionError("Bu e-posta kayıtlı.", { email: "Bu e-posta zaten kayıtlı." });
    await db.adminUser.create({ data: { email, name, role, passwordHash: await hashPassword(password) } });
    return "Kullanıcı oluşturuldu.";
  });
}

export async function updateUser(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("users", async (me) => {
    const id = str(fd, "id");
    const role = str(fd, "role") as UserRole;
    const active = bool(fd, "active");
    if (!ROLES.includes(role)) throw new ActionError("Rol seçin.");
    if (id === me.id && (role !== "ADMIN" || !active)) {
      throw new ActionError("Kendi yönetici yetkinizi kaldıramaz veya hesabınızı pasifleştiremezsiniz.");
    }
    const password = String(fd.get("password") ?? "");
    const data: { role: UserRole; active: boolean; passwordHash?: string } = { role, active };
    if (password) {
      validatePassword(password);
      data.passwordHash = await hashPassword(password);
    }
    await db.adminUser.update({ where: { id }, data });
    if (!active || password) await db.session.deleteMany({ where: { userId: id } }); // oturumları kapat
    return "Kullanıcı güncellendi.";
  });
}

export async function changeOwnPassword(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("content", async (me) => {
    const current = String(fd.get("current") ?? "");
    const next = String(fd.get("password") ?? "");
    const user = await db.adminUser.findUniqueOrThrow({ where: { id: me.id } });
    if (!(await bcrypt.compare(current, user.passwordHash))) {
      throw new ActionError("Mevcut parola hatalı.", { current: "Mevcut parola hatalı." });
    }
    validatePassword(next);
    if (next !== String(fd.get("confirm") ?? "")) throw new ActionError("Parolalar eşleşmiyor.", { confirm: "Parolalar eşleşmiyor." });
    await db.adminUser.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(next) } });
    return "Parolanız değiştirildi.";
  });
}
