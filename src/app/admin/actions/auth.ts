"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, destroySession, setSessionCookie, verifyCredentials } from "@/server/auth";
import { clientIp, hashIp, rateLimit } from "@/server/security";

export type LoginState = { error?: string; email?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ipHash = hashIp(clientIp(await headers()));

  const allowed =
    (await rateLimit(`login-ip:${ipHash}`, 10, 900)) && (await rateLimit(`login-email:${email}`, 8, 900));
  if (!allowed) return { error: "Çok fazla deneme yapıldı. 15 dakika sonra tekrar deneyin.", email };
  if (!email || !password) return { error: "E-posta ve parolanızı girin.", email };

  const user = await verifyCredentials(email, password);
  if (!user) return { error: "E-posta veya parola hatalı.", email };

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/giris");
}
