"use server";

import { db } from "@/lib/db";
import type { AppointmentStatus, InquiryStatus } from "@/generated/prisma/enums";
import { ActionError, run, str, type ActionState } from "@/server/admin-action";
import {
  AppointmentError,
  STATUS_LABELS,
  rescheduleAppointment,
  updateAppointmentStatus,
} from "@/server/appointments";

const STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
const INQUIRY_STATUSES: InquiryStatus[] = ["NEW", "CONTACTED", "CLOSED"];

export async function setAppointmentStatus(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("customers", async () => {
    const status = str(fd, "status") as AppointmentStatus;
    if (!STATUSES.includes(status)) throw new ActionError("Geçersiz durum.");
    try {
      await updateAppointmentStatus(str(fd, "id"), status);
    } catch (err) {
      if (err instanceof AppointmentError) throw new ActionError(err.message);
      throw err;
    }
    return `Durum “${STATUS_LABELS[status]}” olarak güncellendi.`;
  });
}

export async function changeAppointmentTime(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("customers", async () => {
    try {
      await rescheduleAppointment(str(fd, "id"), str(fd, "date"), str(fd, "time"));
    } catch (err) {
      if (err instanceof AppointmentError) throw new ActionError(err.message, { time: err.message });
      throw err;
    }
    return "Randevu zamanı güncellendi.";
  });
}

export async function addAppointmentNote(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("customers", async (user) => {
    const body = str(fd, "body").slice(0, 2000);
    if (!body) throw new ActionError("Not boş olamaz.", { body: "Not yazın." });
    await db.appointmentNote.create({ data: { appointmentId: str(fd, "id"), authorId: user.id, body } });
    return "Not eklendi.";
  });
}

export async function updateInquiry(_p: ActionState, fd: FormData): Promise<ActionState> {
  return run("customers", async () => {
    const status = str(fd, "status") as InquiryStatus;
    if (!INQUIRY_STATUSES.includes(status)) throw new ActionError("Geçersiz durum.");
    await db.inquiry.update({
      where: { id: str(fd, "id") },
      data: { status, internalNote: str(fd, "internalNote").slice(0, 2000) },
    });
    return "Talep güncellendi.";
  });
}
