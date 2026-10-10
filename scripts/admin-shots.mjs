// Geliştirme: panele giriş yapıp sayfaların ekran görüntüsünü alır ve hataları raporlar.
import { chromium } from "playwright-core";
const [outDir, ...paths] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto("http://localhost:3000/admin/giris");
await page.fill("#email", "admin@oztunc.local");
await page.fill("#password", process.env.ADMIN_PASSWORD);
await Promise.all([page.waitForURL("**/admin"), page.click("button[type=submit]")]);
for (const p of paths) {
  const res = await page.goto(`http://localhost:3000${p}`, { waitUntil: "networkidle" });
  const name = p.replace(/[^a-z0-9]+/gi, "_") || "root";
  await page.screenshot({ path: `${outDir}/adm${name}.png`, fullPage: true });
  console.log(p, res.status());
}
console.log("hatalar:", errors.slice(0, 10));
await browser.close();
