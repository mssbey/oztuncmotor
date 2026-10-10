"use client";

import type { ReactNode } from "react";
import { useFieldError } from "./ActionForm";

type Base = {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
};

export function Field({
  name,
  label,
  hint,
  className = "",
  as = "input",
  children,
  ...rest
}: Base & {
  as?: "input" | "textarea" | "select";
  children?: ReactNode;
} & Record<string, unknown>) {
  const error = useFieldError(name);
  const id = `a-${name}`;
  const common = {
    id,
    name,
    className: "input",
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-err` : hint ? `${id}-hint` : undefined,
    ...rest,
  };
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {as === "textarea" ? (
        <textarea {...common} />
      ) : as === "select" ? (
        <select {...common}>{children}</select>
      ) : (
        <input {...common} />
      )}
      {error && (
        <p id={`${id}-err`} className="field-error">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Toggle({ name, label, defaultChecked, hint }: { name: string; label: ReactNode; defaultChecked?: boolean; hint?: ReactNode }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="checkbox" />
        <span className="text-sm font-semibold">{label}</span>
      </label>
      {hint && <p className="field-hint ml-8">{hint}</p>}
    </div>
  );
}
