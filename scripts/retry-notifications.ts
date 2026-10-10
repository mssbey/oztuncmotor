/** Bekleyen bildirimleri sunucu dışından yeniden dener: npm run notifications:retry */
import "dotenv/config";

const base = process.env.APP_URL || "http://localhost:3000";
const res = await fetch(`${base}/api/cron/notifications`, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` },
});
console.log(res.status, await res.text());
