"use client";

import { useRef, useState } from "react";
import { Check } from "@/components/icons";
import { ConsentFields, Honeypot, TextAreaField, TextField } from "./fields";

type Props = {
  formToken: string;
  motorcycleId?: string;
  defaultMessage?: string;
  submitLabel?: string;
};

type Result = { ok: true; reference: string } | { ok: false; errors: Record<string, string>; message?: string };

export function InquiryForm({ formToken, motorcycleId, defaultMessage = "", submitLabel = "Bilgi Talebi Gönder" }: Props) {
  const [values, setValues] = useState({ fullName: "", phone: "", email: "", message: defaultMessage });
  const [kvkk, setKvkk] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, motorcycleId, kvkk, marketing, website, formToken }),
      });
      const data = (await res.json().catch(() => null)) as Result | null;
      if (res.ok && data?.ok) {
        setDone(data.reference);
        return;
      }
      const errs = data && !data.ok ? data.errors ?? {} : {};
      setErrors(errs);
      setFormError(
        (data && !data.ok && data.message) ||
          (Object.keys(errs).length ? "Lütfen işaretli alanları kontrol edin." : "Talebiniz gönderilemedi. Lütfen tekrar deneyin."),
      );
      const first = Object.keys(errs)[0];
      if (first) formRef.current?.querySelector<HTMLElement>(`#f-${first}`)?.focus();
    } catch {
      setFormError("Bağlantı hatası. Talebiniz kaydedilmedi; lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="rounded-[10px] border border-success/30 bg-[#eef7f1] p-6">
        <p className="flex items-center gap-2 font-bold text-success">
          <Check size={20} /> Talebiniz alındı
        </p>
        <p className="mt-2 text-[0.9375rem] leading-relaxed">
          Ekibimiz en kısa sürede sizinle iletişime geçecektir. Referans numaranız:{" "}
          <strong className="font-mono tracking-wider">{done}</strong>
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative grid gap-5">
      <Honeypot value={website} onChange={setWebsite} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="fullName" label="Ad soyad" autoComplete="name" value={values.fullName} onChange={set("fullName")} error={errors.fullName} required />
        <TextField
          name="phone"
          label="Telefon"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="05XX XXX XX XX"
          value={values.phone}
          onChange={set("phone")}
          error={errors.phone}
          required
        />
      </div>
      <TextField name="email" label="E-posta" type="email" autoComplete="email" optional value={values.email} onChange={set("email")} error={errors.email} />
      <TextAreaField name="message" label="Mesajınız" optional rows={4} value={values.message} onChange={set("message")} error={errors.message} />
      <ConsentFields kvkk={kvkk} marketing={marketing} onKvkk={setKvkk} onMarketing={setMarketing} error={errors.kvkk} />
      {formError && (
        <p role="alert" className="rounded-lg bg-[#fdecea] px-4 py-3 text-sm font-semibold text-[#8c1d18]">
          {formError}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full sm:w-auto sm:justify-self-start" disabled={submitting}>
        {submitting ? "Gönderiliyor…" : submitLabel}
      </button>
    </form>
  );
}
