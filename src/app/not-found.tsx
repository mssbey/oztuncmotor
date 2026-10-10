import Link from "next/link";
import { Logo } from "@/components/site/Logo";

export default function NotFound() {
  return (
    <main className="on-dark flex min-h-dvh flex-col bg-ink text-white">
      <div className="container-x py-6">
        <Link href="/" aria-label="Öztunç Motor ana sayfa" className="inline-block rounded">
          <Logo />
        </Link>
      </div>
      <div className="container-x flex flex-1 flex-col justify-center py-16">
        <p className="eyebrow">404</p>
        <h1 className="font-display mt-4 text-6xl font-bold uppercase leading-[0.9] sm:text-8xl">
          Yol burada bitiyor<span className="text-accent">.</span>
        </h1>
        <p className="mt-6 max-w-md text-lg text-white/75">
          Aradığınız sayfa bulunamadı ya da artık yayında değil.
        </p>
        <div className="mt-8 flex flex-col gap-3 xs:flex-row">
          <Link href="/motosikletler" className="btn btn-primary">
            Motosikletlere göz at
          </Link>
          <Link href="/" className="btn btn-outline-light">
            Ana sayfa
          </Link>
        </div>
      </div>
    </main>
  );
}
