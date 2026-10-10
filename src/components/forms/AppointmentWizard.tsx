"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "@/components/icons";
import { addDays, formatDateLong, isoWeekday, parseDate } from "@/lib/time";
import {
  OTHER_BRAND,
  appointmentStep1,
  appointmentStep2,
  appointmentStep3,
  fieldErrors,
  formatPhone,
} from "@/lib/validation";
import { ConsentFields, FieldError, Honeypot, SelectField, TextAreaField, TextField } from "./fields";

type Day = { date: string; open: boolean; reason?: string; slots: { time: string; remaining: number }[] };

type Props = {
  formToken: string;
  brands: { id: string; name: string }[];
  services: { id: string; title: string; description: string }[];
  initialDays: Day[];
  initialServiceId?: string;
};

const STEPS = ["Motosiklet ve işlem", "Tarih ve saat", "İletişim ve özet"] as const;

const FIELD_STEP: Record<string, number> = {
  brandId: 0,
  brandOther: 0,
  model: 0,
  modelYear: 0,
  mileageKm: 0,
  plate: 0,
  serviceItemId: 0,
  description: 0,
  date: 1,
  time: 1,
  fullName: 2,
  phone: 2,
  email: 2,
  kvkk: 2,
};

const REASONS: Record<string, string> = {
  holiday: "Tatil",
  closed: "Kapalı",
  past: "Geçti",
  full: "Dolu",
  "too-far": "Kapalı",
};

export function AppointmentWizard({ formToken, brands, services, initialDays, initialServiceId }: Props) {
  const [step, setStep] = useState(0);
  const [v, setV] = useState({
    brandId: "",
    brandOther: "",
    model: "",
    modelYear: "",
    mileageKm: "",
    plate: "",
    serviceItemId: initialServiceId && services.some((s) => s.id === initialServiceId) ? initialServiceId : "",
    description: "",
    date: "",
    time: "",
    fullName: "",
    phone: "",
    email: "",
  });
  const [kvkk, setKvkk] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [days, setDays] = useState<Day[]>(initialDays);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ reference: string; date: string; time: string } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const set = (key: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((prev) => ({ ...prev, [key]: e.target.value }));

  // Adım değişince başlığa odaklan (ekran okuyucu ve klavye kullanıcıları için)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    headingRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [step, result]);

  async function refreshAvailability() {
    try {
      const res = await fetch("/api/availability", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { enabled: boolean; days: Day[] };
        setDays(data.days);
      }
    } catch {
      /* mevcut liste korunur */
    }
  }

  const selectedDay = days.find((d) => d.date === v.date);

  function validate(index: number): boolean {
    const payload = { ...v, kvkk, marketing };
    const schema = [appointmentStep1, appointmentStep2, appointmentStep3][index];
    const parsed = schema.safeParse(payload);
    const errs = parsed.success ? {} : fieldErrors(parsed.error);
    if (index === 1 && parsed.success) {
      const slot = selectedDay?.slots.find((s) => s.time === v.time);
      if (!slot || slot.remaining <= 0) errs.time = "Lütfen uygun bir saat seçin.";
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      requestAnimationFrame(() => document.getElementById(first === "time" || first === "date" ? `f-${first}-grup` : `f-${first}`)?.focus());
      return false;
    }
    return true;
  }

  function next() {
    setFormError("");
    if (validate(step)) {
      if (step === 0) void refreshAvailability();
      setStep((s) => s + 1);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 2) return next();
    if (!validate(2)) return;
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, kvkk, marketing, website, formToken }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setResult({ reference: data.reference, date: data.date, time: data.time });
        return;
      }
      const errs: Record<string, string> = data?.errors ?? {};
      setErrors(errs);
      setFormError(data?.message ?? "Randevu talebiniz kaydedilemedi. Lütfen tekrar deneyin.");
      const firstStep = Math.min(...Object.keys(errs).map((k) => FIELD_STEP[k] ?? 2), 2);
      if (res.status === 409 || firstStep === 1) {
        await refreshAvailability();
        setV((prev) => ({ ...prev, time: "" }));
      }
      if (firstStep < 2) setStep(firstStep);
    } catch {
      setFormError("Bağlantı hatası. Talebiniz kaydedilmedi; lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  const brandName = v.brandId === OTHER_BRAND ? v.brandOther : brands.find((b) => b.id === v.brandId)?.name ?? "";
  const service = services.find((s) => s.id === v.serviceItemId);

  if (result) {
    return (
      <div className="card p-6 sm:p-10" role="status">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-white">
          <Check size={26} strokeWidth={2.4} />
        </span>
        <h2 ref={headingRef} tabIndex={-1} className="font-display mt-5 text-4xl font-bold uppercase leading-none outline-none">
          Talebiniz alındı
        </h2>
        <p className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed">
          Randevu talebiniz alındı. Kesin tarih ve saat için ekibimiz sizinle iletişime geçecektir.
        </p>
        <dl className="mt-6 grid gap-4 border-y border-line py-5 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-semibold text-muted">Referans numarası</dt>
            <dd className="mt-1 font-mono text-xl font-bold tracking-wider">{result.reference}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-muted">Talep edilen zaman</dt>
            <dd className="mt-1 font-bold">
              {formatDateLong(result.date)}, {result.time}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-muted">Durum</dt>
            <dd className="mt-1 font-bold text-warning">Onay Bekliyor</dd>
          </div>
        </dl>
        <p className="mt-5 text-sm text-muted">Referans numaranızı not almanızı öneririz; bizimle iletişimde kolaylık sağlar.</p>
        <Link href="/" className="btn btn-dark mt-6">
          Ana sayfaya dön
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="relative">
      <Honeypot value={website} onChange={setWebsite} />

      <ol className="grid grid-cols-3 gap-2" aria-label="Adımlar">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined}>
            <div className={`h-1 rounded-full ${i <= step ? "bg-accent" : "bg-line"}`} />
            <p className={`mt-2 text-xs font-bold sm:text-sm ${i === step ? "text-text" : "text-muted"}`}>
              <span className="tabular-nums">{i + 1}.</span> <span className={i === step ? "" : "hidden sm:inline"}>{label}</span>
            </p>
          </li>
        ))}
      </ol>

      <div className="card mt-6 p-5 sm:p-8">
        <h2 ref={headingRef} tabIndex={-1} className="font-display scroll-mt-28 text-3xl font-bold uppercase leading-none outline-none sm:text-4xl">
          {STEPS[step]}
        </h2>

        {step === 0 && (
          <div className="mt-6 grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField name="brandId" label="Marka" value={v.brandId} onChange={set("brandId")} error={errors.brandId} required>
                <option value="">Seçin</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
                <option value={OTHER_BRAND}>Diğer (listede yok)</option>
              </SelectField>
              {v.brandId === OTHER_BRAND ? (
                <TextField name="brandOther" label="Marka adı" value={v.brandOther} onChange={set("brandOther")} error={errors.brandOther} required />
              ) : (
                <TextField name="model" label="Model" value={v.model} onChange={set("model")} error={errors.model} required />
              )}
            </div>
            {v.brandId === OTHER_BRAND && (
              <TextField name="model" label="Model" value={v.model} onChange={set("model")} error={errors.model} required />
            )}
            <div className="grid gap-5 sm:grid-cols-3">
              <TextField name="modelYear" label="Model yılı" inputMode="numeric" optional value={v.modelYear} onChange={set("modelYear")} error={errors.modelYear} />
              <TextField name="mileageKm" label="Kilometre" inputMode="numeric" optional value={v.mileageKm} onChange={set("mileageKm")} error={errors.mileageKm} />
              <TextField name="plate" label="Plaka" optional placeholder="81 ABC 123" autoCapitalize="characters" value={v.plate} onChange={set("plate")} error={errors.plate} />
            </div>
            <fieldset>
              <legend className="field-label">Servis işlemi</legend>
              <div id="f-serviceItemId" tabIndex={-1} className="grid gap-2 outline-none sm:grid-cols-2" aria-describedby={errors.serviceItemId ? "serviceItemId-hata" : undefined}>
                {services.map((s) => {
                  const checked = v.serviceItemId === s.id;
                  return (
                    <label
                      key={s.id}
                      className={`flex cursor-pointer gap-3 rounded-lg border-[1.5px] p-3.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                        checked ? "border-accent bg-[#fdf3f3]" : "border-[#cfd0ca] bg-white hover:border-[#a9aba4]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="serviceItemId"
                        value={s.id}
                        checked={checked}
                        onChange={set("serviceItemId")}
                        className="mt-1 h-4 w-4 accent-[#d62828]"
                      />
                      <span>
                        <span className="block font-bold">{s.title}</span>
                        {s.description && <span className="mt-0.5 block text-sm text-muted">{s.description}</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
              <FieldError name="serviceItemId" error={errors.serviceItemId} />
            </fieldset>
            <TextAreaField
              name="description"
              label="Sorun veya talep açıklaması"
              optional
              rows={4}
              placeholder="Örn. soğukta zor çalışıyor, ön frenden ses geliyor…"
              value={v.description}
              onChange={set("description")}
              error={errors.description}
            />
          </div>
        )}

        {step === 1 && (
          <div className="mt-6 grid gap-8">
            <DatePicker
              days={days}
              value={v.date}
              error={errors.date}
              onChange={(date) => {
                setV((p) => ({ ...p, date, time: p.date === date ? p.time : "" }));
                setErrors((e) => ({ ...e, date: "" }));
              }}
            />
            <div>
              <p className="field-label" id="saat-baslik">
                Saat {v.date && <span className="font-semibold text-muted">— {formatDateLong(v.date)}</span>}
              </p>
              {!selectedDay ? (
                <p className="text-sm text-muted">Önce bir gün seçin.</p>
              ) : (
                <div
                  id="f-time-grup"
                  tabIndex={-1}
                  role="radiogroup"
                  aria-labelledby="saat-baslik"
                  aria-describedby={errors.time ? "time-hata" : undefined}
                  className="grid grid-cols-3 gap-2 outline-none xs:grid-cols-4 sm:grid-cols-6"
                >
                  {selectedDay.slots.map((s) => {
                    const full = s.remaining <= 0;
                    const checked = v.time === s.time;
                    return (
                      <button
                        key={s.time}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        disabled={full}
                        onClick={() => {
                          setV((p) => ({ ...p, time: s.time }));
                          setErrors((e) => ({ ...e, time: "" }));
                        }}
                        className={`flex min-h-14 flex-col items-center justify-center rounded-lg border-[1.5px] text-[0.9375rem] font-bold tabular-nums transition-colors disabled:cursor-not-allowed disabled:border-line disabled:bg-[#f0f0ec] disabled:text-[#9a9d96] ${
                          checked ? "border-accent bg-accent text-white" : "border-[#cfd0ca] bg-white hover:border-text"
                        }`}
                      >
                        {s.time}
                        <span className={`text-[0.6875rem] font-semibold ${checked ? "text-white/85" : "text-muted"}`}>
                          {full ? "Dolu" : s.remaining === 1 ? "Son 1 yer" : "Uygun"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <FieldError name="time" error={errors.time} />
              <p className="field-hint mt-3">Seçtiğiniz saat bir taleptir; ekibimiz onayladığında kesinleşir.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="grid gap-5">
              <TextField name="fullName" label="Ad soyad" autoComplete="name" value={v.fullName} onChange={set("fullName")} error={errors.fullName} required />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  name="phone"
                  label="Telefon"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="05XX XXX XX XX"
                  value={v.phone}
                  onChange={set("phone")}
                  error={errors.phone}
                  required
                />
                <TextField name="email" label="E-posta" type="email" autoComplete="email" optional value={v.email} onChange={set("email")} error={errors.email} />
              </div>
              <ConsentFields kvkk={kvkk} marketing={marketing} onKvkk={setKvkk} onMarketing={setMarketing} error={errors.kvkk} />
            </div>
            <aside aria-label="Randevu özeti" className="h-fit rounded-[10px] bg-paper p-5">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.12em]">Özet</h3>
              <dl className="mt-3 divide-y divide-line text-sm">
                <SummaryRow label="Motosiklet" value={`${brandName} ${v.model}${v.modelYear ? ` (${v.modelYear})` : ""}`} onEdit={() => setStep(0)} />
                {v.plate && <SummaryRow label="Plaka" value={v.plate.toLocaleUpperCase("tr-TR")} />}
                {v.mileageKm && <SummaryRow label="Kilometre" value={`${v.mileageKm} km`} />}
                <SummaryRow label="İşlem" value={service?.title ?? ""} onEdit={() => setStep(0)} />
                <SummaryRow label="Tarih ve saat" value={v.date ? `${formatDateLong(v.date)}, ${v.time}` : ""} onEdit={() => setStep(1)} />
                {v.phone && <SummaryRow label="Telefon" value={formatPhone(v.phone)} />}
              </dl>
            </aside>
          </div>
        )}

        {formError && (
          <p role="alert" className="mt-6 rounded-lg bg-[#fdecea] px-4 py-3 text-sm font-semibold text-[#8c1d18]">
            {formError}
          </p>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 xs:flex-row xs:justify-between">
          {step > 0 ? (
            <button type="button" className="btn btn-outline" onClick={() => { setErrors({}); setFormError(""); setStep((s) => s - 1); }}>
              <ArrowLeft size={18} /> Geri
            </button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <button type="submit" className="btn btn-primary">
              Devam <ArrowRight size={18} />
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Gönderiliyor…" : "Randevu Talebini Gönder"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div>
        <dt className="text-muted">{label}</dt>
        <dd className="font-semibold">{value || "—"}</dd>
      </div>
      {onEdit && (
        <button type="button" onClick={onEdit} className="min-h-9 shrink-0 text-xs font-bold text-accent underline underline-offset-2">
          Düzenle<span className="sr-only">: {label}</span>
        </button>
      )}
    </div>
  );
}

const WEEK_HEAD = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function DatePicker({
  days,
  value,
  error,
  onChange,
}: {
  days: Day[];
  value: string;
  error?: string;
  onChange: (date: string) => void;
}) {
  // Günleri haftalara yerleştir (Pazartesi başlangıçlı)
  const weeks = useMemo(() => {
    if (!days.length) return [];
    const first = days[0].date;
    const start = addDays(first, -(isoWeekday(first) - 1));
    const map = new Map(days.map((d) => [d.date, d]));
    const last = days[days.length - 1].date;
    const out: (Day | { date: string; outside: true })[][] = [];
    let cursor = start;
    while (cursor <= last) {
      const week: (Day | { date: string; outside: true })[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(map.get(cursor) ?? { date: cursor, outside: true });
        cursor = addDays(cursor, 1);
      }
      out.push(week);
    }
    return out;
  }, [days]);

  if (!days.some((d) => d.open)) {
    return <p className="rounded-lg bg-paper p-4 text-sm">Önümüzdeki günlerde boş randevu saati bulunmuyor. Lütfen bizi arayın.</p>;
  }

  return (
    <fieldset>
      <legend className="field-label">Gün</legend>
      <div id="f-date-grup" tabIndex={-1} className="outline-none" aria-describedby={error ? "date-hata" : undefined}>
        <div className="grid grid-cols-7 gap-1 text-center text-[0.6875rem] font-bold uppercase tracking-wider text-muted sm:gap-2">
          {WEEK_HEAD.map((d) => (
            <span key={d} aria-hidden>
              {d}
            </span>
          ))}
        </div>
        <div className="mt-2 grid gap-1 sm:gap-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1 sm:gap-2">
              {week.map((d) => {
                if ("outside" in d) return <span key={d.date} aria-hidden />;
                const [, m, day] = parseDate(d.date);
                const selected = value === d.date;
                return (
                  <button
                    key={d.date}
                    type="button"
                    disabled={!d.open}
                    aria-pressed={selected}
                    aria-label={`${formatDateLong(d.date)}${d.open ? "" : ` — ${REASONS[d.reason ?? "closed"] ?? "Kapalı"}`}`}
                    onClick={() => onChange(d.date)}
                    className={`flex min-h-12 flex-col items-center justify-center rounded-lg border-[1.5px] text-sm font-bold tabular-nums transition-colors disabled:cursor-not-allowed disabled:border-transparent disabled:bg-transparent disabled:text-[#a3a69f] sm:min-h-14 ${
                      selected ? "border-accent bg-accent text-white" : "border-[#cfd0ca] bg-white hover:border-text"
                    }`}
                  >
                    {day}
                    <span className={`text-[0.625rem] font-semibold ${selected ? "text-white/85" : "text-muted"}`}>
                      {d.open ? MONTHS[m - 1] : REASONS[d.reason ?? "closed"] ?? ""}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <FieldError name="date" error={error} />
    </fieldset>
  );
}

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
