// Demo görsel üreticisi: gerçek bir markayı veya modeli temsil etmeyen, stilize motosiklet çizimleri.
// Yalnızca geliştirme seed'inde kullanılır; her görselin köşesinde "DEMO GÖRSEL" yazar.

export type BikeKind = "naked" | "scooter" | "touring" | "electric" | "adventure";

type Opts = {
  kind: BikeKind;
  paint: string; // ana renk
  accent?: string;
  background?: "studio" | "transparent" | "dark";
  mirror?: boolean; // ters yönden görünüm
  label?: boolean;
};

const W = 1600;
const H = 1000;

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (n & 255) + amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function wheel(cx: number, cy: number, r: number, rim: string, spokes = 6) {
  const lines: string[] = [];
  for (let i = 0; i < spokes; i++) {
    const a = (Math.PI * 2 * i) / spokes + 0.3;
    const x1 = cx + Math.cos(a) * r * 0.26;
    const y1 = cy + Math.sin(a) * r * 0.26;
    const x2 = cx + Math.cos(a + 0.18) * r * 0.66;
    const y2 = cy + Math.sin(a + 0.18) * r * 0.66;
    lines.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${rim}" stroke-width="${(r * 0.07).toFixed(1)}" stroke-linecap="round"/>`);
  }
  return `
  <g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#16181b"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.93}" fill="none" stroke="#2a2d31" stroke-width="${r * 0.04}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.72}" fill="#202327"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.7}" fill="none" stroke="${rim}" stroke-width="${r * 0.06}"/>
    ${lines.join("\n    ")}
    <circle cx="${cx}" cy="${cy}" r="${r * 0.36}" fill="none" stroke="#9aa0a7" stroke-width="${r * 0.05}" stroke-dasharray="${r * 0.05} ${r * 0.05}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.14}" fill="${rim}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.05}" fill="#16181b"/>
  </g>`;
}

function engine(x: number, y: number, w: number, h: number) {
  const fins: string[] = [];
  for (let i = 1; i < 6; i++) {
    const yy = y + (h * i) / 6.5;
    fins.push(`<line x1="${x + 18}" y1="${yy}" x2="${x + w * 0.62}" y2="${yy}" stroke="#4a5058" stroke-width="7" stroke-linecap="round"/>`);
  }
  return `
  <g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="#2b2f35"/>
    <rect x="${x + w * 0.55}" y="${y + h * 0.45}" width="${w * 0.5}" height="${h * 0.55}" rx="30" fill="#353a41"/>
    <circle cx="${x + w * 0.8}" cy="${y + h * 0.74}" r="${h * 0.16}" fill="#4a5058"/>
    <circle cx="${x + w * 0.8}" cy="${y + h * 0.74}" r="${h * 0.08}" fill="#6b727b"/>
    ${fins.join("\n    ")}
  </g>`;
}

function body(kind: BikeKind, paint: string, accent: string): { wheels: [number, number, number]; svg: string } {
  const dark = shade(paint, -45);
  const light = shade(paint, 40);
  const chrome = "#c3c7cc";

  if (kind === "scooter") {
    const r = 128;
    const [rx, fx, cy] = [470, 1150, 860 - r];
    return {
      wheels: [rx, fx, r],
      svg: `
  <path d="M440 600 C 500 520 640 520 760 560 L 900 640 L 1010 640 C 1040 560 1050 470 1060 380 L 1120 380 C 1150 480 1170 560 1190 640 C 1180 700 1120 690 1100 700 L 600 700 C 520 700 450 680 440 600 Z" fill="url(#paint)"/>
  <path d="M760 560 L 900 640 L 1010 640 L 1000 670 L 880 670 L 760 600 Z" fill="${dark}"/>
  <path d="M480 520 C 520 470 700 460 790 500 L 790 540 C 690 520 560 525 490 560 Z" fill="#1b1d20"/>
  <path d="M520 600 C 560 640 640 650 720 640" stroke="${light}" stroke-width="10" fill="none" stroke-linecap="round" opacity=".7"/>
  <line x1="1110" y1="400" x2="${fx}" y2="${cy}" stroke="${chrome}" stroke-width="26" stroke-linecap="round"/>
  <path d="M1040 370 L 1130 330 L 1160 345 L 1080 390 Z" fill="#1b1d20"/>
  <line x1="1050" y1="330" x2="1170" y2="310" stroke="#1b1d20" stroke-width="16" stroke-linecap="round"/>
  <ellipse cx="1180" cy="430" rx="34" ry="26" fill="#eef0f2" stroke="#1b1d20" stroke-width="8"/>
  <path d="M1030 ${cy - r - 10} A ${r + 20} ${r + 20} 0 0 1 1270 ${cy - 20}" stroke="url(#paint)" stroke-width="26" fill="none" stroke-linecap="round"/>
  <rect x="420" y="560" width="40" height="22" rx="6" fill="${accent}"/>
  <path d="M600 760 L 720 740 L 760 770 L 640 790 Z" fill="#7d838b"/>`,
    };
  }

  if (kind === "touring") {
    const r = 160;
    const [rx, fx, cy] = [420, 1190, 860 - r];
    return {
      wheels: [rx, fx, r],
      svg: `
  <path d="M430 ${cy} L 720 610 L 760 650 L 460 ${cy + 25} Z" fill="#30343a"/>
  ${engine(680, 520, 270, 190)}
  <path d="M1000 330 L 760 560" stroke="#3a3f46" stroke-width="26" stroke-linecap="round"/>
  <line x1="1060" y1="330" x2="${fx}" y2="${cy}" stroke="${chrome}" stroke-width="30" stroke-linecap="round"/>
  <path d="M760 380 C 820 330 960 320 1040 340 L 1150 300 C 1180 380 1170 470 1100 520 L 980 540 L 780 520 Z" fill="url(#paint)"/>
  <path d="M1080 300 L 1140 170 L 1180 180 L 1160 320 Z" fill="#9fb3c4" opacity=".55"/>
  <path d="M1100 470 C 1130 440 1160 420 1180 430" stroke="${light}" stroke-width="10" fill="none" opacity=".7"/>
  <path d="M500 450 C 560 400 700 395 790 410 L 800 450 C 700 445 580 460 520 490 Z" fill="#1b1d20"/>
  <path d="M600 420 C 640 380 700 375 730 395 L 720 420 Z" fill="#1b1d20"/>
  <rect x="330" y="470" width="240" height="190" rx="28" fill="url(#paint)"/>
  <rect x="330" y="470" width="240" height="22" rx="10" fill="${dark}"/>
  <rect x="380" y="330" width="170" height="130" rx="26" fill="url(#paint)"/>
  <rect x="352" y="560" width="70" height="16" rx="6" fill="${accent}"/>
  <path d="M760 690 L 600 720 L 470 700" stroke="${chrome}" stroke-width="30" fill="none" stroke-linecap="round"/>
  <path d="M1060 ${cy - r - 5} A ${r + 22} ${r + 22} 0 0 1 1330 ${cy - 30}" stroke="url(#paint)" stroke-width="28" fill="none" stroke-linecap="round"/>
  <ellipse cx="1150" cy="400" rx="30" ry="24" fill="#eef0f2"/>`,
    };
  }

  if (kind === "adventure") {
    const r = 168;
    const [rx, fx, cy] = [420, 1200, 860 - r];
    return {
      wheels: [rx, fx, r],
      svg: `
  <path d="M430 ${cy} L 730 600 L 770 640 L 455 ${cy + 25} Z" fill="#30343a"/>
  ${engine(690, 500, 240, 200)}
  <path d="M1020 300 L 740 560" stroke="${accent}" stroke-width="22" stroke-linecap="round"/>
  <line x1="1070" y1="290" x2="${fx}" y2="${cy}" stroke="#d6a640" stroke-width="30" stroke-linecap="round"/>
  <path d="M760 360 C 840 300 980 290 1060 310 L 1100 400 L 1000 480 L 780 480 Z" fill="url(#paint)"/>
  <path d="M1060 310 L 1130 220 L 1160 230 L 1120 330 Z" fill="#9fb3c4" opacity=".55"/>
  <path d="M1080 400 L 1230 470 L 1200 500 L 1070 450 Z" fill="url(#paint)"/>
  <path d="M480 420 C 560 380 700 370 790 380 L 795 420 C 700 415 580 430 500 460 Z" fill="#1b1d20"/>
  <path d="M430 420 L 520 410 L 540 440 L 440 450 Z" fill="${dark}"/>
  <rect x="300" y="420" width="70" height="16" rx="6" fill="${accent}"/>
  <path d="M800 560 L 640 460 L 520 450" stroke="${chrome}" stroke-width="28" fill="none" stroke-linecap="round"/>
  <rect x="470" y="430" width="120" height="44" rx="14" fill="#7d838b"/>
  <ellipse cx="1110" cy="360" rx="26" ry="22" fill="#eef0f2"/>
  <line x1="1000" y1="270" x2="1110" y2="255" stroke="#1b1d20" stroke-width="16" stroke-linecap="round"/>`,
    };
  }

  // naked / electric
  const r = 158;
  const [rx, fx, cy] = [430, 1180, 860 - r];
  const isEv = kind === "electric";
  return {
    wheels: [rx, fx, r],
    svg: `
  <path d="M440 ${cy} L 740 600 L 775 640 L 462 ${cy + 25} Z" fill="#30343a"/>
  ${
    isEv
      ? `<rect x="680" y="500" width="300" height="200" rx="22" fill="#2b2f35"/>
  <rect x="700" y="520" width="260" height="20" rx="8" fill="${accent}"/>
  <rect x="700" y="555" width="260" height="10" rx="5" fill="#3d434b"/>
  <rect x="700" y="580" width="260" height="10" rx="5" fill="#3d434b"/>
  <circle cx="760" cy="650" r="34" fill="#3d434b"/><circle cx="760" cy="650" r="14" fill="#6b727b"/>`
      : engine(690, 510, 260, 190)
  }
  <path d="M1030 370 L 760 560" stroke="${isEv ? "#3a3f46" : accent}" stroke-width="22" stroke-linecap="round"/>
  <path d="M1030 370 L 1000 520" stroke="${isEv ? "#3a3f46" : accent}" stroke-width="18" stroke-linecap="round"/>
  <line x1="1050" y1="360" x2="${fx}" y2="${cy}" stroke="${chrome}" stroke-width="28" stroke-linecap="round"/>
  <line x1="1050" y1="360" x2="${fx}" y2="${cy}" stroke="#7d838b" stroke-width="10" stroke-linecap="round"/>
  <path d="M770 420 C 820 360 950 340 1030 360 C 1050 410 1030 470 990 500 L 790 500 C 770 480 760 450 770 420 Z" fill="url(#paint)"/>
  <path d="M820 400 C 870 375 960 370 1010 385" stroke="${light}" stroke-width="12" fill="none" stroke-linecap="round" opacity=".7"/>
  <path d="M560 440 C 620 410 720 405 790 420 L 790 460 C 710 455 620 465 570 480 Z" fill="#1b1d20"/>
  <path d="M440 410 C 500 400 560 410 600 430 L 590 460 C 540 450 480 445 450 440 Z" fill="url(#paint)"/>
  <rect x="420" y="415" width="30" height="16" rx="5" fill="${accent}"/>
  ${isEv ? "" : `<path d="M840 700 L 700 730 L 600 700 L 560 640" stroke="${chrome}" stroke-width="26" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="520" y="590" width="130" height="58" rx="24" fill="#8b9199" transform="rotate(-18 585 619)"/>`}
  <path d="M1060 ${cy - r - 4} A ${r + 18} ${r + 18} 0 0 1 1300 ${cy - 40}" stroke="url(#paint)" stroke-width="22" fill="none" stroke-linecap="round"/>
  <circle cx="1110" cy="410" r="44" fill="#1b1d20"/>
  <circle cx="1116" cy="410" r="32" fill="#eef0f2"/>
  <circle cx="1122" cy="410" r="14" fill="#ffffff"/>
  <line x1="990" y1="320" x2="1090" y2="305" stroke="#1b1d20" stroke-width="16" stroke-linecap="round"/>
  <line x1="1030" y1="310" x2="1010" y2="270" stroke="#1b1d20" stroke-width="6"/><ellipse cx="1008" cy="262" rx="18" ry="10" fill="#1b1d20"/>`,
  };
}

export function bikeSvg(opts: Opts): string {
  const accent = opts.accent ?? "#d62828";
  const { wheels, svg } = body(opts.kind, opts.paint, accent);
  const [rx, fx, r] = wheels;
  const cy = 860 - r;
  const bg =
    opts.background === "transparent"
      ? ""
      : opts.background === "dark"
        ? `<rect width="${W}" height="${H}" fill="#1b1e22"/><ellipse cx="800" cy="870" rx="720" ry="70" fill="#111315"/>`
        : `<rect width="${W}" height="${H}" fill="url(#studio)"/>`;
  const label =
    opts.label === false
      ? ""
      : `<text x="${W - 40}" y="${H - 36}" text-anchor="end" font-family="Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="4" fill="${opts.background === "studio" || !opts.background ? "#9a9d96" : "#5b6168"}">DEMO GÖRSEL</text>`;
  const flip = opts.mirror ? `transform="translate(${W} 0) scale(-1 1)"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="studio" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f4f4f1"/><stop offset=".72" stop-color="#ececE8"/><stop offset="1" stop-color="#e2e2dd"/>
    </linearGradient>
    <linearGradient id="paint" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(opts.paint, 35)}"/><stop offset=".55" stop-color="${opts.paint}"/><stop offset="1" stop-color="${shade(opts.paint, -40)}"/>
    </linearGradient>
    <radialGradient id="shadow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".32"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  ${bg}
  <g ${flip}>
    <ellipse cx="${(rx + fx) / 2}" cy="${860}" rx="${(fx - rx) / 2 + r * 1.2}" ry="34" fill="url(#shadow)"/>
    ${wheel(rx, cy, r, "#8b9199")}
    ${svg}
    ${wheel(fx, cy, r, "#8b9199")}
  </g>
  ${label}
</svg>`;
}
