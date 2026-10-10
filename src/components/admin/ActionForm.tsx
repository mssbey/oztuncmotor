"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

export type ActionState = { ok?: boolean; message?: string; errors?: Record<string, string>; nonce?: number };
type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

const ErrorsContext = createContext<Record<string, string>>({});
export const useFieldError = (name: string) => useContext(ErrorsContext)[name];

/** Sunucu işlemi çalıştıran form; sonucu ve alan hatalarını gösterir, başarıda sayfayı tazeler. */
export function ActionForm({
  action,
  children,
  submitLabel = "Kaydet",
  className = "",
  resetOnSuccess = false,
  inlineSubmit = false,
  confirm,
}: {
  action: Action;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
  inlineSubmit?: boolean;
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state.nonce) return;
    if (state.ok) {
      if (resetOnSuccess) formRef.current?.reset();
      router.refresh();
    } else if (state.errors) {
      const first = Object.keys(state.errors)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    }
  }, [state.nonce, state.ok, state.errors, resetOnSuccess, router]);

  return (
    <ErrorsContext.Provider value={state.errors ?? {}}>
      <form
        ref={formRef}
        className={className}
        noValidate
        onSubmit={(e) => {
          // Elle gönderim: React'in otomatik form sıfırlaması hatada girilen veriyi silmesin
          e.preventDefault();
          if (confirm && !window.confirm(confirm)) return;
          const fd = new FormData(e.currentTarget);
          startTransition(() => formAction(fd));
        }}
      >
        {children}
        <div className={`flex flex-wrap items-center gap-3 ${inlineSubmit ? "" : "mt-6"}`}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
            {pending ? "Kaydediliyor…" : submitLabel}
          </button>
          {state.message && (
            <p
              role={state.ok ? "status" : "alert"}
              className={`text-sm font-semibold ${state.ok ? "text-success" : "text-[#b3261e]"}`}
            >
              {state.message}
            </p>
          )}
        </div>
      </form>
    </ErrorsContext.Provider>
  );
}

export function SubmitButton({ label, className = "btn btn-primary btn-sm" }: { label: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "Kaydediliyor…" : label}
    </button>
  );
}

/** Tek tıklık işlem (sil, yayımla vb.) — isteğe bağlı onay sorusuyla. */
export function ActionButton({
  action,
  label,
  confirm,
  className = "btn btn-outline btn-sm",
  fields = {},
}: {
  action: Action;
  label: ReactNode;
  confirm?: string;
  className?: string;
  fields?: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const router = useRouter();
  useEffect(() => {
    if (state.nonce && state.ok) router.refresh();
  }, [state.nonce, state.ok, router]);
  return (
    <form
      action={formAction}
      className="inline-flex items-center gap-2"
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" className={className} disabled={pending}>
        {label}
      </button>
      {state.message && !state.ok && (
        <span role="alert" className="text-xs font-semibold text-[#b3261e]">
          {state.message}
        </span>
      )}
    </form>
  );
}
