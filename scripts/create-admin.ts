/**
 * İlk yöneticiyi (veya yeni bir yöneticiyi) oluşturur / parolasını sıfırlar.
 *
 *   npm run admin:create -- --email yonetici@ornek.com --name "Ad Soyad"
 *
 * Parola komut satırına yazılmaz: ADMIN_PASSWORD ortam değişkeninden okunur,
 * yoksa terminalde gizli olarak sorulur.
 */
import "dotenv/config";
import { createInterface } from "node:readline";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const write = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput;
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
      if (s.includes(question)) write.call(rl, s);
      else write.call(rl, "*");
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim() || "Yönetici";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Kullanım: npm run admin:create -- --email yonetici@ornek.com --name "Ad Soyad"');
    process.exit(1);
  }
  const password = process.env.ADMIN_PASSWORD || (await askHidden("Parola (en az 10 karakter): "));
  if (password.length < 10) {
    console.error("Parola en az 10 karakter olmalı.");
    process.exit(1);
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.adminUser.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", active: true },
    create: { email, name, passwordHash, role: "ADMIN" },
  });
  await db.session.deleteMany({ where: { userId: user.id } });
  console.log(`Yönetici hazır: ${user.email} (rol: ADMIN). Giriş: /admin/giris`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
