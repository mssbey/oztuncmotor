import Link from "next/link";
import type { ReactNode } from "react";

export function PageTitle({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-8">
      <div>
        <h1 className="font-display text-4xl font-bold uppercase leading-none">{title}</h1>
        {description && <div className="mt-2 max-w-2xl text-sm text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className = "", description }: { title?: string; children: ReactNode; className?: string; description?: ReactNode }) {
  return (
    <section className={`card p-5 sm:p-6 ${className}`}>
      {title && <h2 className="text-base font-extrabold">{title}</h2>}
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className={title || description ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

const TONES = {
  gray: "bg-[#ecece7] text-[#3d4148]",
  green: "bg-[#e3f2e9] text-success",
  amber: "bg-[#fdf1d6] text-warning",
  red: "bg-[#fdecea] text-[#8c1d18]",
  blue: "bg-[#e5eef7] text-[#1d4f7a]",
} as const;

export function Badge({ tone = "gray", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold ${TONES[tone]}`}>{children}</span>;
}

export const STATUS_TONES = { PENDING: "amber", CONFIRMED: "blue", COMPLETED: "green", CANCELLED: "gray" } as const;

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted">
        {children}
      </td>
    </tr>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_thead_th]:text-xs [&_thead_th]:font-bold [&_thead_th]:uppercase [&_thead_th]:tracking-wider [&_thead_th]:text-muted [&_tbody_tr]:border-t [&_tbody_tr]:border-line">
        {children}
      </table>
    </div>
  );
}

export function Notice({ tone = "amber", children }: { tone?: "amber" | "red" | "green"; children: ReactNode }) {
  const cls = tone === "red" ? "border-[#f3c4c0] bg-[#fdecea] text-[#8c1d18]" : tone === "green" ? "border-[#bfe0cc] bg-[#eef7f1] text-success" : "border-[#e8d38a] bg-[#fff8dc] text-[#4a3800]";
  return <div className={`rounded-lg border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-text">
      ← {children}
    </Link>
  );
}
