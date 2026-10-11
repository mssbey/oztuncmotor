import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Manrope } from "next/font/google";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const base = siteUrl();

export const metadata: Metadata = {
  ...(base ? { metadataBase: new URL(base) } : {}),
  title: {
    default: "Öztunc Motor | Düzce Motosiklet Satış ve Servis",
    template: "%s | Öztunc Motor",
  },
  description: "Düzce’de motosiklet satış ve servis hizmetlerini tek noktada keşfedin.",
  applicationName: "Öztunc Motor",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#111315",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${barlow.variable} ${manrope.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
