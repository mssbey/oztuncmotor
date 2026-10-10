import "dotenv/config";
import { execSync } from "node:child_process";

// Test veritabanına bekleyen migration'ları uygular (yıkıcı değildir). Testler veriyi
// yalnızca TEST_DATABASE_URL üzerinde TRUNCATE eder; DATABASE_URL asla kullanılmaz.
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL tanımlı değil (.env).");
  if (url === process.env.DATABASE_URL) throw new Error("TEST_DATABASE_URL, DATABASE_URL ile aynı olamaz.");
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
