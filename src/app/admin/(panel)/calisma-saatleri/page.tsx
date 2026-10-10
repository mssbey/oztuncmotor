import { ActionButton, ActionForm } from "@/components/admin/ActionForm";
import { Field, Toggle } from "@/components/admin/Field";
import { Notice, PageTitle, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { slotTimesForDay } from "@/lib/slots";
import { WEEKDAY_NAMES, formatDateLong, todayInTz } from "@/lib/time";
import { requirePage } from "@/server/auth";
import { getAppointmentSettings, getWorkingDays } from "@/server/schedule";
import { addHoliday, removeHoliday, saveSchedule } from "../../actions/settings";

export const metadata = { title: "Çalışma saatleri" };

export default async function SchedulePage() {
  await requirePage("schedule");
  const [settings, days, holidays] = await Promise.all([
    getAppointmentSettings(),
    getWorkingDays(),
    db.holiday.findMany({ where: { date: { gte: todayInTz() } }, orderBy: { date: "asc" } }),
  ]);

  return (
    <>
      <PageTitle
        title="Çalışma saatleri"
        description="Randevu slotları bu saatlerden üretilir. Bekleyen ve onaylanan randevular kapasiteye dahildir; iptal edilenler kapasiteyi serbest bırakır."
      />
      {!settings.enabled && (
        <div className="mb-6">
          <Notice>Online randevu kapalı. Saatleri doğruladıktan sonra “Online randevu açık” seçeneğini işaretleyin.</Notice>
        </div>
      )}
      <div className="grid gap-6">
        <Panel title="Haftalık program ve kapasite">
          <ActionForm action={saveSchedule} submitLabel="Kaydet">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted">
                    <th className="py-2 pr-3">Gün</th>
                    <th className="py-2 pr-3">Açık</th>
                    <th className="py-2 pr-3">Açılış</th>
                    <th className="py-2 pr-3">Kapanış</th>
                    <th className="py-2 pr-3">Mola başlangıç</th>
                    <th className="py-2 pr-3">Mola bitiş</th>
                    <th className="py-2">Slot sayısı</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((d) => (
                    <tr key={d.weekday} className="border-t border-line">
                      <th scope="row" className="py-2 pr-3 text-left font-bold">
                        {WEEKDAY_NAMES[d.weekday - 1]}
                      </th>
                      <td className="py-2 pr-3">
                        <input type="checkbox" name={`open-${d.weekday}`} defaultChecked={d.isOpen} className="checkbox" aria-label={`${WEEKDAY_NAMES[d.weekday - 1]} açık`} />
                      </td>
                      <td className="py-2 pr-3">
                        <Field type="time" name={`from-${d.weekday}`} label={<span className="sr-only">Açılış</span>} defaultValue={d.openTime} className="min-w-28" />
                      </td>
                      <td className="py-2 pr-3">
                        <Field type="time" name={`to-${d.weekday}`} label={<span className="sr-only">Kapanış</span>} defaultValue={d.closeTime} className="min-w-28" />
                      </td>
                      <td className="py-2 pr-3">
                        <Field type="time" name={`bfrom-${d.weekday}`} label={<span className="sr-only">Mola başlangıç</span>} defaultValue={d.breakStart ?? ""} className="min-w-28" />
                      </td>
                      <td className="py-2 pr-3">
                        <Field type="time" name={`bto-${d.weekday}`} label={<span className="sr-only">Mola bitiş</span>} defaultValue={d.breakEnd ?? ""} className="min-w-28" />
                      </td>
                      <td className="py-2 tabular-nums text-muted">{d.isOpen ? slotTimesForDay(d, settings.slotMinutes).length : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field name="slotMinutes" label="Slot süresi (dakika)" inputMode="numeric" defaultValue={settings.slotMinutes} />
              <Field name="slotCapacity" label="Slot kapasitesi" inputMode="numeric" defaultValue={settings.slotCapacity} hint="Aynı saate alınabilecek en fazla randevu." />
              <Field name="minLeadHours" label="En erken randevu (saat sonra)" inputMode="numeric" defaultValue={Math.round(settings.minLeadMinutes / 60)} />
              <Field name="maxDaysAhead" label="Kaç gün ilerisi açık" inputMode="numeric" defaultValue={settings.maxDaysAhead} />
            </div>
            <div className="mt-5 grid gap-3">
              <Toggle name="enabled" label="Online randevu açık" defaultChecked={settings.enabled} />
              <Toggle
                name="showHoursPublic"
                label="Çalışma saatlerini sitede göster"
                defaultChecked={settings.showHoursPublic}
                hint="Yalnızca saatler doğrulandıysa işaretleyin."
              />
            </div>
          </ActionForm>
        </Panel>

        <Panel title="Tatiller ve kapalı günler" description="Bu günlerde randevu alınamaz.">
          <ActionForm action={addHoliday} submitLabel="Tatil ekle" resetOnSuccess className="grid gap-4 sm:grid-cols-2">
            <Field type="date" name="date" label="Tarih" min={todayInTz()} />
            <Field name="name" label="Açıklama" placeholder="Ör. Cumhuriyet Bayramı" />
          </ActionForm>
          {holidays.length > 0 && (
            <ul className="mt-5 divide-y divide-line">
              {holidays.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span>
                    <span className="font-bold">{formatDateLong(h.date)}</span> — {h.name}
                  </span>
                  <ActionButton action={removeHoliday} fields={{ id: h.id }} label="Kaldır" />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
