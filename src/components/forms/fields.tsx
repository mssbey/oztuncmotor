"use client";

import Link from "next/link";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Alert } from "@/components/icons";

type Common = { name: string; label: ReactNode; error?: string; hint?: ReactNode; optional?: boolean };

function describedBy(name: string, error?: string, hint?: ReactNode) {
  return [error ? `${name}-hata` : null, hint ? `${name}-ipucu` : null].filter(Boolean).join(" ") || undefined;
}

function Label({ name, label, optional }: Pick<Common, "name" | "label" | "optional">) {
  return (
    <label htmlFor={`f-${name}`} className="field-label">
      {label}
      {optional && <span className="ml-1.5 font-semibold text-muted">(isteğe bağlı)</span>}
    </label>
  );
}

export function FieldError({ name, error }: { name: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${name}-hata`} className="field-error">
      <Alert size={16} className="mt-px shrink-0" />
      {error}
    </p>
  );
}

function Hint({ name, hint }: { name: string; hint?: ReactNode }) {
  return hint ? (
    <p id={`${name}-ipucu`} className="field-hint">
      {hint}
    </p>
  ) : null;
}

export function TextField({ name, label, error, hint, optional, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label name={name} label={label} optional={optional} />
      <input
        id={`f-${name}`}
        name={name}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
        required={!optional && rest.required !== false ? rest.required : undefined}
        {...rest}
      />
      <FieldError name={name} error={error} />
      <Hint name={name} hint={hint} />
    </div>
  );
}

export function TextAreaField({ name, label, error, hint, optional, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <Label name={name} label={label} optional={optional} />
      <textarea
        id={`f-${name}`}
        name={name}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
        {...rest}
      />
      <FieldError name={name} error={error} />
      <Hint name={name} hint={hint} />
    </div>
  );
}

export function SelectField({
  name,
  label,
  error,
  hint,
  optional,
  children,
  ...rest
}: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <Label name={name} label={label} optional={optional} />
      <select
        id={`f-${name}`}
        name={name}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
        {...rest}
      >
        {children}
      </select>
      <FieldError name={name} error={error} />
      <Hint name={name} hint={hint} />
    </div>
  );
}

export function CheckboxField({
  name,
  children,
  error,
  checked,
  onChange,
}: {
  name: string;
  children: ReactNode;
  error?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={`f-${name}`}
          name={name}
          type="checkbox"
          className="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-hata` : undefined}
        />
        <label htmlFor={`f-${name}`} className="text-sm leading-relaxed text-[#2b2e33]">
          {children}
        </label>
      </div>
      <FieldError name={name} error={error} />
    </div>
  );
}

/** KVKK aydınlatma onayı ve ayrı, önceden seçilmemiş pazarlama izni. */
export function ConsentFields({
  kvkk,
  marketing,
  onKvkk,
  onMarketing,
  error,
}: {
  kvkk: boolean;
  marketing: boolean;
  onKvkk: (v: boolean) => void;
  onMarketing: (v: boolean) => void;
  error?: string;
}) {
  return (
    <div className="grid gap-4">
      <CheckboxField name="kvkk" checked={kvkk} onChange={onKvkk} error={error}>
        <Link href="/kvkk" target="_blank" className="font-bold underline underline-offset-2">
          KVKK Aydınlatma Metni
        </Link>
        ’ni okudum; talebimin yanıtlanması için bilgilerimin işlenmesini anlıyorum.
      </CheckboxField>
      <CheckboxField name="marketing" checked={marketing} onChange={onMarketing}>
        Kampanya ve yeniliklerden haberdar olmak için tarafıma ticari ileti gönderilmesine izin veriyorum.
        <span className="text-muted"> (İsteğe bağlı; talebinizi etkilemez.)</span>
      </CheckboxField>
    </div>
  );
}

/** Botların doldurduğu, insanlara görünmeyen tuzak alan. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="f-website">Web siteniz</label>
      <input id="f-website" name="website" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
