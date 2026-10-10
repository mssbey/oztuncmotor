import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/site/Logo";
import { getCurrentUser } from "@/server/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Yönetim Girişi", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  return (
    <main className="on-dark flex min-h-dvh items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-[10px] bg-white p-6 text-text shadow-2xl sm:p-8">
          <h1 className="font-display text-3xl font-bold uppercase leading-none">Yönetim paneli</h1>
          <p className="mt-2 text-sm text-muted">Yalnızca yetkili personel içindir.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
