import { timingSafeEqual } from "node:crypto";
import { deliverPendingNotifications } from "@/server/notifications";

// Zamanlanmış görev (cron) tarafından çağrılır: bekleyen e-posta bildirimlerini yeniden dener.
//   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://alanadi/api/cron/notifications
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret))) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }
  const result = await deliverPendingNotifications({ limit: 50 });
  return Response.json(result);
}
