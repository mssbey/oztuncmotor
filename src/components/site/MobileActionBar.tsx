import Link from "next/link";
import { Bike, Calendar, Phone } from "@/components/icons";

/** Mobilde sabit alt eylem çubuğu. Ana içerik bu yükseklik kadar alt boşlukla yerleşir. */
export function MobileActionBar({ phoneHref }: { phoneHref: string | null }) {
  return (
    <nav
      aria-label="Hızlı erişim"
      className="on-dark fixed inset-x-0 bottom-0 z-30 border-t border-line-dark bg-ink/98 pb-[env(safe-area-inset-bottom)] text-white lg:hidden"
    >
      <ul className={`grid ${phoneHref ? "grid-cols-[1fr_1.4fr_1fr]" : "grid-cols-[1fr_1.6fr]"}`}>
        <li>
          <Link href="/motosikletler" className="flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold text-white/85">
            <Bike size={22} />
            Modeller
          </Link>
        </li>
        <li className="flex items-center px-1.5">
          <Link href="/servis-randevusu" className="btn btn-primary btn-sm h-12 w-full">
            <Calendar size={18} />
            Servis Randevusu
          </Link>
        </li>
        {phoneHref && (
          <li>
            <a href={phoneHref} className="flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold text-white/85">
              <Phone size={22} />
              Ara
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}
