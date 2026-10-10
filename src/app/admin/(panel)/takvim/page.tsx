import Link from "next/link";
import { Badge, PageTitle, STATUS_TONES } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { slotTimesForDay } from "@/lib/slots";
import { WEEKDAY_NAMES, addDays, formatDateShort, isValidDateString, isoWeekday, todayInTz } from "@/lib/time";
import { STATUS_LABELS } from "@/server/appointments";
import { requirePage } from "@/server/auth";
import { loadScheduleConfig } from "@/server/schedule";

export const metadata = { title: "Takvim" };

export default async function CalendarPage({ searchParams }: PageProps<"/admin/takvim">) {
  await requirePage("customers");
  const sp = await searchParams;
  const today = todayInTz();
  const anchor = typeof sp.hafta === "string" && isValidDateString(sp.hafta) ? sp.hafta : today;
  const monday = addDays(anchor, -(isoWeekday(anchor) - 1));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const [config, appointments, holidays] = await Promise.all([
    loadScheduleConfig(),
    db.appointment.findMany({
      where: { slotDate: { gte: days[0], lte: days[6] } },
      orderBy: [{ slotStart: "asc" }, { createdAt: "asc" }],
    }),
    db.holiday.findMany({ where: { date: { gte: days[0], lte: days[6] } } }),
  ]);

  return (
    <>
      <PageTitle
        title="Takvim"
        description={`${formatDateShort(days[0])} – ${formatDateShort(days[6])} · Slot kapasitesi: ${config.slotCapacity} · İptal edilenler kapasiteye dahil değildir.`}
        actions={
          <>
            <Link href={`/admin/takvim?hafta=${addDays(monday, -7)}`} className="btn btn-outline btn-sm">
              ← Önceki hafta
            </Link>
            <Link href="/admin/takvim" className="btn btn-outline btn-sm">
              Bu hafta
            </Link>
            <Link href={`/admin/takvim?hafta=${addDays(monday, 7)}`} className="btn btn-outline btn-sm">
              Sonraki hafta →
            </Link>
          </>
        }
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {days.map((date) => {
          const weekday = isoWeekday(date);
          const rule = config.workingDays.find((d) => d.weekday === weekday);
          const holiday = holidays.find((h) => h.date === date);
          const dayAppointments = appointments.filter((a) => a.slotDate === date);
          const slots = holiday ? [] : slotTimesForDay(rule, config.slotMinutes);
          const extraTimes = [...new Set(dayAppointments.map((a) => a.slotTime))].filter((t) => !slots.includes(t));
          const times = [...slots, ...extraTimes].sort();
          return (
            <section
              key={date}
              aria-label={`${WEEKDAY_NAMES[weekday - 1]} ${date}`}
              className={`card min-w-0 p-3 ${date === today ? "ring-2 ring-accent" : ""}`}
            >
              <h2 className="flex items-baseline justify-between gap-2 border-b border-line pb-2">
                <span className="font-extrabold">{WEEKDAY_NAMES[weekday - 1]}</span>
                <span className="text-xs font-semibold text-muted tabular-nums">{formatDateShort(date)}</span>
              </h2>
              {holiday && <p className="mt-2 text-xs font-bold text-warning">Tatil: {holiday.name}</p>}
              {!holiday && !rule?.isOpen && <p className="mt-2 text-xs font-semibold text-muted">Kapalı</p>}
              <ul className="mt-2 grid gap-2">
                {times.map((time) => {
                  const list = dayAppointments.filter((a) => a.slotTime === time);
                  const used = list.filter((a) => a.status !== "CANCELLED").length;
                  if (!list.length && date < today) return null;
                  return (
                    <li key={time} className="rounded-md bg-paper p-2">
                      <p className="flex justify-between text-xs font-bold tabular-nums">
                        <span>{time}</span>
                        <span className={used >= config.slotCapacity ? "text-accent" : "text-muted"}>
                          {used}/{config.slotCapacity}
                        </span>
                      </p>
                      {list.map((a) => (
                        <Link
                          key={a.id}
                          href={`/admin/randevular/${a.id}`}
                          className={`mt-1.5 block rounded border border-line bg-white p-1.5 text-xs hover:border-text ${a.status === "CANCELLED" ? "opacity-55 line-through" : ""}`}
                        >
                          <span className="block truncate font-semibold">{a.fullName}</span>
                          <span className="block truncate text-muted">
                            {a.brandName} {a.model} · {a.serviceName}
                          </span>
                          <span className="mt-1 inline-block">
                            <Badge tone={STATUS_TONES[a.status]}>{STATUS_LABELS[a.status]}</Badge>
                          </span>
                        </Link>
                      ))}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
