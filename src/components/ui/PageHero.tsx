import Link from "next/link";
import type { ReactNode } from "react";

/** İç sayfaların başlık bandı. dark=true koyu zemin (servis), aksi halde açık. */
export function PageHero({
  title,
  lead,
  crumb,
  dark = false,
  children,
}: {
  title: ReactNode;
  lead?: ReactNode;
  crumb: string;
  dark?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className={dark ? "on-dark bg-ink text-white" : "border-b border-line bg-paper"}>
      <div className="container-x pb-10 pt-10 lg:pb-14 lg:pt-14">
        <nav aria-label="Sayfa yolu" className={`text-sm ${dark ? "text-muted-dark" : "text-muted"}`}>
          <ol className="flex gap-2">
            <li>
              <Link href="/" className={dark ? "hover:text-white" : "hover:text-text"}>
                Ana Sayfa
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className={`font-semibold ${dark ? "text-white" : "text-text"}`}>
              {crumb}
            </li>
          </ol>
        </nav>
        <h1 className="font-display mt-4 max-w-4xl text-5xl font-bold uppercase leading-[0.92] sm:text-6xl lg:text-7xl">
          {title}
        </h1>
        {lead && (
          <div className={`mt-5 max-w-2xl text-[1.0625rem] leading-relaxed sm:text-lg ${dark ? "text-white/75" : "text-muted"}`}>
            {lead}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
