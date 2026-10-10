import { getAvailability } from "@/server/schedule";

// Randevu formundaki takvim için güncel boş slotlar (kapasite bilgisi dahil).
export async function GET() {
  const data = await getAvailability();
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}
