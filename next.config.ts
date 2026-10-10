import type { NextConfig } from "next";

// S3 uyumlu depolama kullanılıyorsa herkese açık adresi next/image için izinli kıl.
const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];
if (process.env.S3_PUBLIC_URL) {
  remotePatterns.push(new URL(`${process.env.S3_PUBLIC_URL.replace(/\/$/, "")}/**`));
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    remotePatterns,
    // Statik önizleme (scripts/static-preview.ts) için görseller sunucusuz, olduğu gibi sunulur.
    unoptimized: process.env.STATIC_PREVIEW === "1",
  },
  serverExternalPackages: ["sharp"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
