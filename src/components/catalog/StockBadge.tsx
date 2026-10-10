import { STOCK_LABELS } from "@/lib/catalog";

type Status = keyof typeof STOCK_LABELS;

const STYLES: Record<Status, { dot: string; text: string }> = {
  IN_STOCK: { dot: "bg-success", text: "text-success" },
  ON_ORDER: { dot: "bg-warning", text: "text-warning" },
  SOLD_OUT: { dot: "bg-muted", text: "text-muted" },
};

export function StockBadge({ status, className = "" }: { status: Status; className?: string }) {
  const s = STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[0.8125rem] font-bold ${s.text} ${className}`}>
      <span aria-hidden className={`h-2 w-2 rounded-full ${s.dot}`} />
      {STOCK_LABELS[status]}
    </span>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center rounded-[4px] bg-[#fff4cc] px-1.5 py-0.5 text-[0.6875rem] font-extrabold tracking-wider text-[#4a3800]">
      DEMO
    </span>
  );
}
