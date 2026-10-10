import { after } from "next/server";
import { appointmentSchema } from "@/lib/validation";
import { AppointmentError, createAppointment } from "@/server/appointments";
import { failure, parsePublicForm } from "@/server/forms";
import { deliverPendingNotifications } from "@/server/notifications";

export async function POST(req: Request) {
  const parsed = await parsePublicForm(req, appointmentSchema, { kind: "appointment", limit: 5, windowSeconds: 900 });
  if (!parsed.ok) return failure(parsed);

  try {
    const appointment = await createAppointment(parsed.data);
    after(() => deliverPendingNotifications({ limit: 5 }).catch((e) => console.error("[bildirim]", e)));
    return Response.json(
      {
        ok: true,
        reference: appointment.reference,
        date: appointment.slotDate,
        time: appointment.slotTime,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof AppointmentError) {
      return Response.json(
        { ok: false, code: err.code, errors: err.field ? { [err.field]: err.message } : {}, message: err.message },
        { status: err.code === "full" ? 409 : 422 },
      );
    }
    console.error("[randevu] kayıt hatası", err);
    return Response.json(
      { ok: false, errors: {}, message: "Randevu talebiniz kaydedilemedi. Lütfen tekrar deneyin veya bizi arayın." },
      { status: 500 },
    );
  }
}
