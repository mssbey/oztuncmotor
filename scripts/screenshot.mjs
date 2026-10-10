// Kullanım: node scripts/screenshot.mjs <url> <çıktı.png> [genişlik] [tam=1]
import { chromium } from "playwright-core";
const [url, out, width = "1440", full = "1"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
await page.goto(url, { waitUntil: "networkidle" });
await page.screenshot({ path: out, fullPage: full === "1" });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
console.log("yatay taşma:", overflow);
await browser.close();
