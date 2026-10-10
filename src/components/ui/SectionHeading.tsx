import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  text,
  action,
  id,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
  id?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <Tag
          id={id}
          className="font-display mt-3 text-[2.5rem] font-bold uppercase leading-[0.95] sm:text-5xl lg:text-[3.5rem]"
        >
          {title}
        </Tag>
        {text && <div className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-muted">{text}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
