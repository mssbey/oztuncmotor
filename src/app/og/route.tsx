import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// Varsayılan Open Graph görseli (sayfanın kendi görseli yoksa kullanılır).
export async function GET() {
  const dir = path.join(process.cwd(), "node_modules/@fontsource/barlow-condensed/files");
  const [latin, latinExt] = await Promise.all([
    readFile(path.join(dir, "barlow-condensed-latin-700-normal.woff")),
    readFile(path.join(dir, "barlow-condensed-latin-ext-700-normal.woff")),
  ]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#111315",
          color: "#fff",
          padding: "72px 80px",
          fontFamily: "Barlow",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 12, height: 48, background: "#D62828", transform: "skewX(-12deg)" }} />
          <div style={{ fontSize: 44, letterSpacing: 2 }}>ÖZTUNC MOTOR</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 128, lineHeight: 0.9 }}>
          <div style={{ display: "flex" }}>
            YOLUN BAŞI<span style={{ color: "#D62828" }}>.</span>
          </div>
          <div style={{ display: "flex" }}>
            ÖZTUNC MOTOR<span style={{ color: "#D62828" }}>.</span>
          </div>
        </div>
        <div style={{ fontSize: 36, color: "#A6ABB2", letterSpacing: 1 }}>DÜZCE MOTOSİKLET SATIŞ VE SERVİS</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Barlow", data: latin, weight: 700, style: "normal" },
        { name: "Barlow", data: latinExt, weight: 700, style: "normal" },
      ],
      headers: { "Cache-Control": "public, max-age=86400" },
    },
  );
}
