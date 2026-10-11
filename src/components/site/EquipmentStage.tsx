import Image from "next/image";

// Geçici atmosfer görselleri — Wikimedia Commons, CC BY-SA 4.0 (lisans gereği künye sahnenin altında).
// İşletmenin kendi ürün fotoğrafları olunca public/images/aksesuar altındaki dosyalar değiştirilmelidir.
const MAIN = { src: "/images/aksesuar/ekipman-seti.webp", width: 1400, height: 933 };
const HELMET = { src: "/images/aksesuar/kask.webp", width: 1400, height: 1340 };
const GLOVE = { src: "/images/aksesuar/eldiven.webp", width: 1000, height: 667 };

// Ana fotoğraftaki ürünlerin konumu (yüzde)
const HOTSPOTS = [
  { label: "Mont", x: 30, y: 38 },
  { label: "Eldiven", x: 42, y: 70 },
  { label: "Bot", x: 84, y: 62 },
];

const CREDITS = "Fotoğraflar: サフィル, Ashley Pomeroy, Thermos — Wikimedia Commons, CC BY-SA 4.0";

function Tag({ children }: { children: string }) {
  return (
    <span className="absolute -bottom-3 left-4 rounded-full bg-accent px-3 py-1 text-[0.6875rem] font-extrabold uppercase tracking-[0.14em] text-white shadow-lg">
      {children}
    </span>
  );
}

/** Aksesuar sayfasının giriş sahnesi: ekipman fotoğraf kolajı. */
export function EquipmentStage({ groupCount }: { groupCount: number }) {
  return (
    <figure className="relative mx-auto w-full max-w-[38rem] lg:max-w-none">
      <div className="relative aspect-square">
        <div aria-hidden className="accent-glow absolute inset-[12%] rounded-full" />

        {/* Ana görsel: tam takım ekipman */}
        <div className="absolute inset-x-[3%] top-[17%] aspect-[3/2] -rotate-2 overflow-hidden rounded-[18px] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)] ring-1 ring-white/15">
          <Image
            src={MAIN.src}
            alt="Motosiklet montu, kask, eldiven ve bot"
            fill
            preload
            sizes="(min-width: 1024px) 46vw, 92vw"
            className="object-cover"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
          {HOTSPOTS.map((h) => (
            <span key={h.label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${h.x}%`, top: `${h.y}%` }}>
              <span className="relative flex h-4 w-4">
                <span aria-hidden className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-accent" />
              </span>
              <span className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-ink/80 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
                {h.label}
              </span>
            </span>
          ))}
        </div>

        {/* Kask kartı */}
        <div className="float-y absolute right-[1%] top-[0%] w-[34%]">
          <div className="relative aspect-square rotate-6 overflow-hidden rounded-2xl bg-white shadow-[0_30px_60px_-25px_rgb(0_0_0/0.9)] ring-1 ring-white/20">
            <Image src={HELMET.src} alt="Kapalı (full-face) motosiklet kaskı" fill sizes="(min-width: 1024px) 16vw, 32vw" className="object-contain p-2" />
          </div>
          <Tag>Kask</Tag>
        </div>

        {/* Eldiven kartı */}
        <div className="float-y absolute bottom-[3%] left-[2%] w-[42%] [animation-delay:-3s]">
          <div className="relative aspect-[3/2] -rotate-6 overflow-hidden rounded-2xl shadow-[0_30px_60px_-25px_rgb(0_0_0/0.9)] ring-1 ring-white/20">
            <Image src={GLOVE.src} alt="Korumalı deri motosiklet eldiveni" fill sizes="(min-width: 1024px) 20vw, 40vw" className="object-cover" />
          </div>
          <Tag>Eldiven</Tag>
        </div>

        {/* Bilgi rozeti */}
        <div className="absolute bottom-[6%] right-[3%] hidden rounded-2xl border border-white/10 bg-ink/75 px-5 py-4 backdrop-blur-xl sm:block">
          <p className="font-display text-3xl font-bold uppercase leading-none">{groupCount} grup</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">Kasktan bagaja</p>
        </div>
      </div>
      <figcaption className="mt-3 text-right text-[0.6875rem] text-white/35">{CREDITS}</figcaption>
    </figure>
  );
}
