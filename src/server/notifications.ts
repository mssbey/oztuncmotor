import "server-only";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

// Bildirimler önce veritabanına (outbox) yazılır; gönderim ayrı adımda yapılır.
// Böylece SMTP hatası randevu/talep kaydını asla geri almaz ve gönderim yeniden denenebilir.

export const MAX_ATTEMPTS = 6;

export type OutgoingMail = { to: string; subject: string; text: string };
export type Mailer = (mail: OutgoingMail) => Promise<void>;

let mailerOverride: Mailer | null = null;

/** Testler için gönderici değiştirme. */
export function setMailer(mailer: Mailer | null) {
  mailerOverride = mailer;
}

export function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

function defaultMailer(): Mailer | null {
  if (!smtpConfigured()) return null;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? "" }
      : undefined,
  });
  return async (mail) => {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
    });
  };
}

type Tx = Prisma.TransactionClient;

export async function enqueueEmail(
  tx: Tx,
  input: { kind: string; to: string | null | undefined; subject: string; body: string },
) {
  if (!input.to) return null;
  return tx.notification.create({
    data: { kind: input.kind, recipient: input.to, subject: input.subject, body: input.body },
  });
}

function backoffMs(attempts: number) {
  return Math.min(60, 2 ** attempts) * 60_000; // 2, 4, 8 … en fazla 60 dk
}

/** Zamanı gelmiş bekleyen bildirimleri gönderir. Dönüş: gönderilen/başarısız sayıları. */
export async function deliverPendingNotifications(opts: { ids?: string[]; limit?: number } = {}) {
  const mailer = mailerOverride ?? defaultMailer();
  const now = new Date();
  const result = { sent: 0, failed: 0, skipped: 0 };
  if (!mailer) {
    result.skipped = await db.notification.count({ where: { status: "PENDING" } });
    return result;
  }

  const due = await db.notification.findMany({
    where: {
      status: "PENDING",
      ...(opts.ids ? { id: { in: opts.ids } } : { nextAttemptAt: { lte: now } }),
    },
    orderBy: { createdAt: "asc" },
    take: opts.limit ?? 20,
  });

  for (const n of due) {
    // Aynı kaydı iki işçinin göndermesini önlemek için koşullu "sahiplenme"
    const claimed = await db.notification.updateMany({
      where: { id: n.id, status: "PENDING", attempts: n.attempts },
      data: { attempts: { increment: 1 }, nextAttemptAt: new Date(now.getTime() + 5 * 60_000) },
    });
    if (claimed.count !== 1) continue;
    const attempts = n.attempts + 1;
    try {
      await mailer({ to: n.recipient, subject: n.subject, text: n.body });
      await db.notification.update({
        where: { id: n.id },
        data: { status: "SENT", sentAt: new Date(), lastError: null },
      });
      result.sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db.notification.update({
        where: { id: n.id },
        data: {
          status: attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
          lastError: message.slice(0, 1000),
          nextAttemptAt: new Date(Date.now() + backoffMs(attempts)),
        },
      });
      console.error(`[bildirim] ${n.id} gönderilemedi (deneme ${attempts}): ${message}`);
      result.failed++;
    }
  }
  return result;
}

/** Panelden "yeniden dene": başarısız kaydı tekrar kuyruğa alır. */
export async function requeueNotification(id: string) {
  await db.notification.update({
    where: { id },
    data: { status: "PENDING", attempts: 0, nextAttemptAt: new Date() },
  });
}
