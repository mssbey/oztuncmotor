// Geliştirme ortamında uçtan uca akış kontrolü (çalışan sunucu gerekir):
//   node scripts/e2e-flows.mjs [http://localhost:3000]
// Randevu sihirbazı, ürün bilgi talebi, katalog filtresi/URL, karşılaştırma ve yatay taşma kontrolleri.
import { chromium } from "playwright-core";

const base = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "✓" : "✗"} ${name} ${extra}`);
};

const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

// ── Randevu ─────────────────────────────────────────────
await page.goto(`${base}/servis-randevusu`, { waitUntil: "networkidle" });
await page.click("button:has-text('Devam')");
check("Randevu: boş adımda alan hataları gösteriliyor", (await page.locator("#brandId-hata").count()) === 1);
await page.selectOption("#f-brandId", { index: 1 });
await page.fill("#f-model", "Test Model");
await page.fill("#f-plate", "81abc123");
await page.locator("input[name=serviceItemId]").first().check();
await page.click("button:has-text('Devam')");
await page.waitForSelector("text=Gün");
const day = page.locator("#f-date-grup button:not([disabled])").first();
await day.click();
await page.locator("#f-time-grup button:not([disabled])").first().click();
await page.click("button:has-text('Devam')");
await page.fill("#f-fullName", "E2E Test Kullanıcı");
await page.fill("#f-phone", "0555 111 22 33");
// geri dönüp ileri gelince değerler korunmalı
await page.click("button:has-text('Geri')");
await page.click("button:has-text('Geri')");
check("Randevu: önceki adım değerleri korunuyor", (await page.inputValue("#f-model")) === "Test Model");
await page.click("button:has-text('Devam')");
await page.click("button:has-text('Devam')");
check("Randevu: iletişim değerleri korunuyor", (await page.inputValue("#f-fullName")) === "E2E Test Kullanıcı");
await page.click("button:has-text('Randevu Talebini Gönder')");
check("Randevu: KVKK onayı zorunlu", (await page.locator("#kvkk-hata").count()) === 1);
check("Randevu: pazarlama izni önceden seçili değil", !(await page.isChecked("#f-marketing")));
await page.check("#f-kvkk");
await page.waitForTimeout(3200); // form doldurma süresi koruması
await page.click("button:has-text('Randevu Talebini Gönder')");
await page.waitForSelector("text=Talebiniz alındı", { timeout: 15000 });
const body = await page.textContent("body");
check(
  "Randevu: başarı mesajı ve referans",
  body.includes("Randevu talebiniz alındı. Kesin tarih ve saat için ekibimiz sizinle iletişime geçecektir.") && /OZ-[A-Z0-9]{6}/.test(body),
);

// ── Bilgi talebi ────────────────────────────────────────
await page.goto(`${base}/motosikletler/demo-nordline-street-650`, { waitUntil: "networkidle" });
await page.fill("#f-fullName", "E2E Talep");
await page.fill("#f-phone", "05551112234");
await page.check("#f-kvkk");
await page.waitForTimeout(3200);
await page.click("button:has-text('Bilgi Talebi Gönder')");
await page.waitForSelector("text=Talebiniz alındı", { timeout: 15000 });
check("Bilgi talebi: kayıt ve referans", /BT-[A-Z0-9]{6}/.test(await page.textContent("body")));

// ── Katalog filtreleri URL'de ───────────────────────────
await page.goto(`${base}/motosikletler`, { waitUntil: "networkidle" });
await page.click("button:has-text('Filtrele')");
await page.locator("#filtre-paneli fieldset:has(legend:has-text('Güç aktarımı')) button:has-text('Elektrikli')").click();
await page.waitForURL(/tip=elektrikli/);
check("Katalog: filtre URL parametresine yazılıyor", page.url().includes("tip=elektrikli"));
await page.click("#filtre-paneli button:has-text('sonucu göster')");
const countText = await page.textContent("main");
check("Katalog: sonuç sayısı ve aktif filtre", /model listeleniyor/.test(countText) && countText.includes("Filtreleri Temizle"));
await page.goto(`${base}/motosikletler?q=olmayan-model-xyz`, { waitUntil: "networkidle" });
check("Katalog: boş durum", (await page.textContent("main")).includes("Bu filtrelerle model bulunamadı"));

// ── Karşılaştırma ───────────────────────────────────────
await page.goto(`${base}/motosikletler`, { waitUntil: "networkidle" });
const toggles = page.locator("button:has-text('Karşılaştır')[aria-pressed]");
for (let i = 0; i < 4; i++) await toggles.nth(i).click();
check("Karşılaştırma: en fazla 3 model", (await page.locator("button[aria-pressed=true]:has-text('Karşılaştır')").count()) === 3);
await page.click("a:has-text('Karşılaştır')");
await page.waitForURL(/karsilastir\?modeller=/);
check("Karşılaştırma: 3 model tablosu", (await page.locator("h2 a[href^='/motosikletler/']").count()) === 3);

// ── Yatay taşma ─────────────────────────────────────────
const paths = ["/", "/motosikletler", "/motosikletler/demo-volt-e-city", "/servis", "/servis-randevusu", "/hakkimizda", "/iletisim", "/kvkk", "/karsilastir?modeller=demo-nordline-street-650,demo-volt-e-city,demo-vela-urban-125"];
for (const width of [320, 375, 768, 1440]) {
  const p = await browser.newPage({ viewport: { width, height: 900 } });
  const bad = [];
  for (const path of paths) {
    await p.goto(`${base}${path}`, { waitUntil: "networkidle" });
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) bad.push(`${path} (+${overflow}px)`);
  }
  check(`Yatay taşma yok @${width}px`, bad.length === 0, bad.join(", "));
  await p.close();
}

check("Sayfa JavaScript hatası yok", errors.length === 0, errors.slice(0, 3).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} kontrol geçti`);
process.exit(failed ? 1 : 0);
