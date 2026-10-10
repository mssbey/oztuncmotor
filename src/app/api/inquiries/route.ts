import { after } from "next/server";
import { inquirySchema } from "@/lib/validation";
import { failure, parsePublicForm } from "@/server/forms";
import { createInquiry } from "@/server/inquiries";
import { deliverPendingNotifications } from "@/server/notifications";

export async function POST(req: Request) {
  const parsed = await parsePublicForm(req, inquirySchema, { kind: "inquiry", limit: 5, windowSeconds: 600 });
  if (!parsed.ok) return failure(parsed);

  try {
    const inquiry = await createInquiry(parsed.data);
    // Kayıt tamamlandı; e-posta yanıt sonrasında denenir, başarısızsa kuyrukta kalır.
    after(() => deliverPendingNotifications({ limit: 5 }).catch((e) => console.error("[bildirim]", e)));
    return Response.json({ ok: true, reference: inquiry.reference }, { status: 201 });
  } catch (err) {
    console.error("[bilgi-talebi] kayıt hatası", err);
    return Response.json(
      { ok: false, errors: {}, message: "Talebiniz kaydedilemedi. Lütfen tekrar deneyin veya bizi arayın." },
      { status: 500 },
    );
  }
}
